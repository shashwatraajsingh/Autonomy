'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { useAccount } from 'wagmi';

// Types
export interface Policy {
    id?: string;
    dailyLimit: number;
    perTxLimit: number;
    whitelist: string[];
    killSwitch: boolean;
}

export interface Agent {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'frozen';
    walletAddress: string;
    policy: Policy;
    spentToday: number;
    createdAt: string;
    _count?: { transactions: number };
}

export interface Transaction {
    id: string;
    agentId: string;
    service: string;
    amount: number;
    status: 'approved' | 'blocked' | 'pending';
    reason: string;
    txHash?: string;
    createdAt: string;
    agent?: { name: string; walletAddress: string };
}

export interface ValidationResult {
    approved: boolean;
    reason: string;
    policyChecks: {
        whitelistCheck: boolean;
        perTxLimitCheck: boolean;
        dailyLimitCheck: boolean;
        agentStatusCheck: boolean;
    };
}

interface Stats {
    totalApproved: number;
    totalBlocked: number;
    spentToday: number;
    totalSpent: number;
}

interface AutonomyState {
    agents: Agent[];
    transactions: Transaction[];
    isLoading: boolean;
    isBackendConnected: boolean;
    error: string | null;
    userAddress: string | null;
    isWalletConnected: boolean;
    stats: Stats | null;
    addAgent: (data: { name: string; policy: Omit<Policy, 'id'> }) => Promise<Agent | null>;
    updateAgent: (id: string, updates: Partial<{ name: string; status: string }>) => Promise<void>;
    removeAgent: (id: string) => Promise<void>;
    activateKillSwitch: (id: string) => Promise<void>;
    simulateTransaction: (agentId: string, service: string, amount: number) => Promise<ValidationResult | null>;
    executeTransaction: (agentId: string, task: { type: string; service: string; amount: number }) => Promise<unknown>;
    refreshAgents: () => Promise<void>;
    refreshTransactions: () => Promise<void>;
}

const AutonomyContext = createContext<AutonomyState | undefined>(undefined);

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Optimized fetch with timeout and abort controller
const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeout = 5000): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
};

// Cache for backend status
let backendStatusCache: { connected: boolean; timestamp: number } | null = null;
const CACHE_TTL = 30000; // 30 seconds

export function AutonomyProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();

    const [agents, setAgents] = useState<Agent[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const userId = address || 'demo-user';

    // Memoize storage keys
    const storageKeys = useMemo(() => ({
        agents: `autonomy_${userId}_agents`,
        transactions: `autonomy_${userId}_transactions`
    }), [userId]);

    // Check backend connection with caching
    const checkBackend = useCallback(async () => {
        // Use cached result if valid
        if (backendStatusCache && Date.now() - backendStatusCache.timestamp < CACHE_TTL) {
            setIsBackendConnected(backendStatusCache.connected);
            return backendStatusCache.connected;
        }

        try {
            const response = await fetchWithTimeout(`${API_BASE.replace('/api', '')}/health`, {}, 2000);
            const connected = response.ok;
            backendStatusCache = { connected, timestamp: Date.now() };
            setIsBackendConnected(connected);
            return connected;
        } catch {
            backendStatusCache = { connected: false, timestamp: Date.now() };
            setIsBackendConnected(false);
            return false;
        }
    }, []);

    // Calculate stats from transactions (memoized)
    const calculateStats = useCallback((txs: Transaction[]): Stats => {
        let totalApproved = 0;
        let totalBlocked = 0;
        let spentToday = 0;

        for (const tx of txs) {
            if (tx.status === 'approved') {
                totalApproved++;
                spentToday += tx.amount;
            } else if (tx.status === 'blocked') {
                totalBlocked++;
            }
        }

        return { totalApproved, totalBlocked, spentToday, totalSpent: spentToday };
    }, []);

    // Load from localStorage (optimized)
    const loadFromLocalStorage = useCallback(() => {
        try {
            const savedAgents = localStorage.getItem(storageKeys.agents);
            const savedTxs = localStorage.getItem(storageKeys.transactions);

            if (savedAgents) {
                setAgents(JSON.parse(savedAgents));
            } else {
                // Default demo agent
                setAgents([{
                    id: `agent-${Date.now()}-1`,
                    name: 'Research_Agent',
                    status: 'active',
                    walletAddress: '0x1234...5678',
                    policy: {
                        dailyLimit: 50,
                        perTxLimit: 10,
                        whitelist: ['api.openai.com', 'api.anthropic.com'],
                        killSwitch: true,
                    },
                    spentToday: 0,
                    createdAt: new Date().toISOString(),
                }]);
            }

            const txs = savedTxs ? JSON.parse(savedTxs) : [];
            setTransactions(txs);
            setStats(calculateStats(txs));
        } catch (e) {
            console.error('localStorage error:', e);
        }
    }, [storageKeys, calculateStats]);

    // Load from backend (optimized with parallel requests)
    const loadFromBackend = useCallback(async () => {
        try {
            const [agentsRes, txRes, statsRes] = await Promise.all([
                fetchWithTimeout(`${API_BASE}/agents?userId=${userId}`).then(r => r.json()),
                fetchWithTimeout(`${API_BASE}/transactions?userId=${userId}&limit=50`).then(r => r.json()),
                fetchWithTimeout(`${API_BASE}/transactions/stats?userId=${userId}`).then(r => r.json())
            ]);

            setAgents(agentsRes.agents || []);
            setTransactions(txRes.transactions || []);
            setStats(statsRes.stats || null);
        } catch {
            loadFromLocalStorage();
        }
    }, [userId, loadFromLocalStorage]);

    // Initialize
    useEffect(() => {
        let mounted = true;

        const init = async () => {
            if (!mounted) return;
            setIsLoading(true);

            const backendAvailable = await checkBackend();

            if (!mounted) return;

            if (backendAvailable) {
                await loadFromBackend();
            } else {
                loadFromLocalStorage();
            }

            if (mounted) {
                setIsLoading(false);
                setIsHydrated(true);
            }
        };

        init();

        return () => { mounted = false; };
    }, [checkBackend, loadFromBackend, loadFromLocalStorage, address]);

    // Save to localStorage (debounced)
    useEffect(() => {
        if (!isHydrated || isBackendConnected) return;

        const timeoutId = setTimeout(() => {
            try {
                localStorage.setItem(storageKeys.agents, JSON.stringify(agents));
                localStorage.setItem(storageKeys.transactions, JSON.stringify(transactions));
            } catch (e) {
                console.error('localStorage save error:', e);
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [agents, transactions, isHydrated, isBackendConnected, storageKeys]);

    // API methods (optimized)
    const refreshAgents = useCallback(async () => {
        if (!isBackendConnected) return;
        try {
            const res = await fetchWithTimeout(`${API_BASE}/agents?userId=${userId}`).then(r => r.json());
            setAgents(res.agents || []);
        } catch (e) {
            setError('Failed to refresh agents');
        }
    }, [isBackendConnected, userId]);

    const refreshTransactions = useCallback(async () => {
        if (!isBackendConnected) return;
        try {
            const [txRes, statsRes] = await Promise.all([
                fetchWithTimeout(`${API_BASE}/transactions?userId=${userId}&limit=50`).then(r => r.json()),
                fetchWithTimeout(`${API_BASE}/transactions/stats?userId=${userId}`).then(r => r.json())
            ]);
            setTransactions(txRes.transactions || []);
            setStats(statsRes.stats || null);
        } catch (e) {
            setError('Failed to refresh transactions');
        }
    }, [isBackendConnected, userId]);

    const addAgent = useCallback(async (data: { name: string; policy: Omit<Policy, 'id'> }): Promise<Agent | null> => {
        try {
            if (isBackendConnected) {
                const res = await fetchWithTimeout(`${API_BASE}/agents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: data.name, userId, policy: data.policy })
                }).then(r => r.json());

                // Optimistic update
                setAgents(prev => [res.agent, ...prev]);
                return res.agent;
            } else {
                const newAgent: Agent = {
                    id: `agent-${Date.now()}`,
                    name: data.name,
                    status: 'active',
                    walletAddress: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`,
                    policy: data.policy as Policy,
                    spentToday: 0,
                    createdAt: new Date().toISOString()
                };
                setAgents(prev => [newAgent, ...prev]);
                return newAgent;
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to add agent');
            return null;
        }
    }, [isBackendConnected, userId]);

    const updateAgent = useCallback(async (id: string, updates: Partial<{ name: string; status: string }>) => {
        // Optimistic update
        setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } as Agent : a));

        if (isBackendConnected) {
            try {
                await fetchWithTimeout(`${API_BASE}/agents/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to update agent');
                refreshAgents(); // Revert on error
            }
        }
    }, [isBackendConnected, refreshAgents]);

    const removeAgent = useCallback(async (id: string) => {
        // Optimistic update
        setAgents(prev => prev.filter(a => a.id !== id));

        if (isBackendConnected) {
            try {
                await fetchWithTimeout(`${API_BASE}/agents/${id}`, { method: 'DELETE' });
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to remove agent');
                refreshAgents(); // Revert on error
            }
        }
    }, [isBackendConnected, refreshAgents]);

    const activateKillSwitch = useCallback(async (id: string) => {
        // Optimistic update
        setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'frozen' as const } : a));

        if (isBackendConnected) {
            try {
                await fetchWithTimeout(`${API_BASE}/agents/${id}/kill-switch`, { method: 'POST' });
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to activate kill switch');
                refreshAgents();
            }
        }
    }, [isBackendConnected, refreshAgents]);

    const simulateTransaction = useCallback(async (agentId: string, service: string, amount: number): Promise<ValidationResult | null> => {
        if (isBackendConnected) {
            try {
                const res = await fetchWithTimeout(`${API_BASE}/transactions/simulate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId, service, amount, type: 'payment' })
                }).then(r => r.json());
                return res.validation;
            } catch {
                setError('Failed to simulate transaction');
                return null;
            }
        }

        // Fast local validation
        const agent = agents.find(a => a.id === agentId);
        if (!agent) {
            return {
                approved: false,
                reason: 'Agent not found',
                policyChecks: { whitelistCheck: false, perTxLimitCheck: false, dailyLimitCheck: false, agentStatusCheck: false }
            };
        }

        const checks = {
            agentStatusCheck: agent.status === 'active',
            whitelistCheck: agent.policy.whitelist.some(w => service.includes(w)),
            perTxLimitCheck: amount <= agent.policy.perTxLimit,
            dailyLimitCheck: (agent.spentToday + amount) <= agent.policy.dailyLimit
        };

        let approved = true;
        let reason = 'All policy checks passed';

        if (!checks.agentStatusCheck) {
            approved = false;
            reason = `Agent is ${agent.status}`;
        } else if (!checks.whitelistCheck) {
            approved = false;
            reason = `Service "${service}" not whitelisted`;
        } else if (!checks.perTxLimitCheck) {
            approved = false;
            reason = `Amount $${amount} exceeds per-tx limit ($${agent.policy.perTxLimit})`;
        } else if (!checks.dailyLimitCheck) {
            approved = false;
            reason = `Would exceed daily limit ($${agent.policy.dailyLimit})`;
        }

        // Record transaction
        const tx: Transaction = {
            id: `tx-${Date.now()}`,
            agentId,
            service,
            amount,
            status: approved ? 'approved' : 'blocked',
            reason,
            createdAt: new Date().toISOString()
        };

        setTransactions(prev => [tx, ...prev.slice(0, 99)]);

        if (approved) {
            setAgents(prev => prev.map(a => a.id === agentId ? { ...a, spentToday: a.spentToday + amount } : a));
        }

        return { approved, reason, policyChecks: checks };
    }, [agents, isBackendConnected]);

    const executeTransaction = useCallback(async (agentId: string, task: { type: string; service: string; amount: number }) => {
        if (isBackendConnected) {
            try {
                const result = await fetchWithTimeout(`${API_BASE}/agents/${agentId}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                }).then(r => r.json());
                refreshTransactions();
                return result;
            } catch {
                setError('Failed to execute transaction');
                return null;
            }
        }
        return simulateTransaction(agentId, task.service, task.amount);
    }, [isBackendConnected, refreshTransactions, simulateTransaction]);

    // Memoize context value
    const contextValue = useMemo<AutonomyState>(() => ({
        agents,
        transactions,
        isLoading,
        isBackendConnected,
        error,
        userAddress: address || null,
        isWalletConnected: isConnected,
        stats,
        addAgent,
        updateAgent,
        removeAgent,
        activateKillSwitch,
        simulateTransaction,
        executeTransaction,
        refreshAgents,
        refreshTransactions
    }), [
        agents, transactions, isLoading, isBackendConnected, error, address, isConnected, stats,
        addAgent, updateAgent, removeAgent, activateKillSwitch, simulateTransaction, executeTransaction,
        refreshAgents, refreshTransactions
    ]);

    return (
        <AutonomyContext.Provider value={contextValue}>
            {children}
        </AutonomyContext.Provider>
    );
}

export function useAutonomy() {
    const context = useContext(AutonomyContext);
    if (!context) {
        throw new Error('useAutonomy must be used within AutonomyProvider');
    }
    return context;
}

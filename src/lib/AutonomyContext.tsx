'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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

interface AutonomyState {
    agents: Agent[];
    transactions: Transaction[];
    isLoading: boolean;
    isBackendConnected: boolean;
    error: string | null;
    userAddress: string | null;
    isWalletConnected: boolean;
    stats: {
        totalApproved: number;
        totalBlocked: number;
        spentToday: number;
        totalSpent: number;
    } | null;

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

export function AutonomyProvider({ children }: { children: ReactNode }) {
    const { address, isConnected } = useAccount();

    const [agents, setAgents] = useState<Agent[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AutonomyState['stats']>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    const userId = address || 'demo-user';

    // Check backend connection
    const checkBackend = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE.replace('/api', '')}/health`);
            if (response.ok) {
                setIsBackendConnected(true);
                return true;
            }
            setIsBackendConnected(false);
            return false;
        } catch {
            setIsBackendConnected(false);
            return false;
        }
    }, []);

    // Load data from localStorage
    const loadFromLocalStorage = useCallback(() => {
        const key = `autonomy_${userId}`;
        const savedAgents = localStorage.getItem(`${key}_agents`);
        const savedTxs = localStorage.getItem(`${key}_transactions`);

        if (savedAgents) {
            setAgents(JSON.parse(savedAgents));
        } else {
            // Default demo agents
            setAgents([
                {
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
                }
            ]);
        }

        if (savedTxs) {
            setTransactions(JSON.parse(savedTxs));
        }

        // Calculate stats
        const txs = savedTxs ? JSON.parse(savedTxs) : [];
        setStats({
            totalApproved: txs.filter((t: Transaction) => t.status === 'approved').length,
            totalBlocked: txs.filter((t: Transaction) => t.status === 'blocked').length,
            spentToday: txs.filter((t: Transaction) => t.status === 'approved').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            totalSpent: txs.filter((t: Transaction) => t.status === 'approved').reduce((sum: number, t: Transaction) => sum + t.amount, 0)
        });
    }, [userId]);

    // Load from backend
    const loadFromBackend = useCallback(async () => {
        try {
            const [agentsRes, txRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/agents?userId=${userId}`).then(r => r.json()),
                fetch(`${API_BASE}/transactions?userId=${userId}&limit=100`).then(r => r.json()),
                fetch(`${API_BASE}/transactions/stats?userId=${userId}`).then(r => r.json())
            ]);

            setAgents(agentsRes.agents || []);
            setTransactions(txRes.transactions || []);
            setStats(statsRes.stats || null);
        } catch (err) {
            console.error('Backend error:', err);
            loadFromLocalStorage();
        }
    }, [userId, loadFromLocalStorage]);

    // Initialize
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);

            const backendAvailable = await checkBackend();

            if (backendAvailable) {
                await loadFromBackend();
            } else {
                loadFromLocalStorage();
            }

            setIsLoading(false);
            setIsHydrated(true);
        };

        init();
    }, [checkBackend, loadFromBackend, loadFromLocalStorage, address]);

    // Save to localStorage
    useEffect(() => {
        if (isHydrated && !isBackendConnected) {
            const key = `autonomy_${userId}`;
            localStorage.setItem(`${key}_agents`, JSON.stringify(agents));
            localStorage.setItem(`${key}_transactions`, JSON.stringify(transactions));
        }
    }, [agents, transactions, isHydrated, isBackendConnected, userId]);

    const refreshAgents = async () => {
        if (isBackendConnected) {
            const res = await fetch(`${API_BASE}/agents?userId=${userId}`).then(r => r.json());
            setAgents(res.agents || []);
        }
    };

    const refreshTransactions = async () => {
        if (isBackendConnected) {
            const [txRes, statsRes] = await Promise.all([
                fetch(`${API_BASE}/transactions?userId=${userId}&limit=100`).then(r => r.json()),
                fetch(`${API_BASE}/transactions/stats?userId=${userId}`).then(r => r.json())
            ]);
            setTransactions(txRes.transactions || []);
            setStats(statsRes.stats || null);
        }
    };

    const addAgent = async (data: { name: string; policy: Omit<Policy, 'id'> }): Promise<Agent | null> => {
        try {
            if (isBackendConnected) {
                const res = await fetch(`${API_BASE}/agents`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: data.name,
                        userId,
                        policy: data.policy
                    })
                }).then(r => r.json());
                await refreshAgents();
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
                setAgents(prev => [...prev, newAgent]);
                return newAgent;
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        }
    };

    const updateAgent = async (id: string, updates: Partial<{ name: string; status: string }>) => {
        try {
            if (isBackendConnected) {
                await fetch(`${API_BASE}/agents/${id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updates)
                });
                await refreshAgents();
            } else {
                setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } as Agent : a));
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const removeAgent = async (id: string) => {
        try {
            if (isBackendConnected) {
                await fetch(`${API_BASE}/agents/${id}`, { method: 'DELETE' });
                await refreshAgents();
            } else {
                setAgents(prev => prev.filter(a => a.id !== id));
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const activateKillSwitch = async (id: string) => {
        try {
            if (isBackendConnected) {
                await fetch(`${API_BASE}/agents/${id}/kill-switch`, { method: 'POST' });
                await refreshAgents();
            } else {
                setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'frozen' as const } : a));
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        }
    };

    const simulateTransaction = async (agentId: string, service: string, amount: number): Promise<ValidationResult | null> => {
        try {
            if (isBackendConnected) {
                const res = await fetch(`${API_BASE}/transactions/simulate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ agentId, service, amount, type: 'payment' })
                }).then(r => r.json());
                return res.validation;
            } else {
                // Local policy check
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
                setTransactions(prev => [tx, ...prev].slice(0, 100));

                // Update spending if approved
                if (approved) {
                    setAgents(prev => prev.map(a =>
                        a.id === agentId ? { ...a, spentToday: a.spentToday + amount } : a
                    ));
                }

                return { approved, reason, policyChecks: checks };
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        }
    };

    const executeTransaction = async (agentId: string, task: { type: string; service: string; amount: number }) => {
        try {
            if (isBackendConnected) {
                const result = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(task)
                }).then(r => r.json());
                await refreshTransactions();
                return result;
            } else {
                return await simulateTransaction(agentId, task.service, task.amount);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            return null;
        }
    };

    return (
        <AutonomyContext.Provider value={{
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
        }}>
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

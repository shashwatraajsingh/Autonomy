'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, Agent, Transaction, Policy, ValidationResult } from './api';

interface AutonomyState {
    // State
    agents: Agent[];
    transactions: Transaction[];
    isLoading: boolean;
    isBackendConnected: boolean;
    error: string | null;

    // Agent operations
    addAgent: (data: { name: string; policy: Omit<Policy, 'id'> }) => Promise<Agent | null>;
    updateAgent: (id: string, updates: Partial<{ name: string; status: string }>) => Promise<void>;
    removeAgent: (id: string) => Promise<void>;
    activateKillSwitch: (id: string) => Promise<void>;

    // Transaction operations
    simulateTransaction: (agentId: string, service: string, amount: number) => Promise<ValidationResult | null>;
    executeTransaction: (agentId: string, task: { type: string; service: string; amount: number }) => Promise<any>;

    // Data fetching
    refreshAgents: () => Promise<void>;
    refreshTransactions: () => Promise<void>;

    // Stats
    stats: {
        totalApproved: number;
        totalBlocked: number;
        spentToday: number;
        totalSpent: number;
    } | null;
}

const AutonomyContext = createContext<AutonomyState | undefined>(undefined);

// Demo data for when backend is not available
const DEMO_AGENTS: Agent[] = [
    {
        id: 'demo-agent-001',
        name: 'Research_Agent',
        status: 'active',
        walletAddress: '0x1234...5678',
        policy: {
            dailyLimit: 50,
            perTxLimit: 10,
            whitelist: ['api.openai.com', 'api.anthropic.com'],
            killSwitch: true,
        },
        spentToday: 12.50,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo-agent-002',
        name: 'Trading_Bot',
        status: 'active',
        walletAddress: '0x8765...4321',
        policy: {
            dailyLimit: 100,
            perTxLimit: 25,
            whitelist: ['api.binance.com', 'api.coingecko.com'],
            killSwitch: true,
        },
        spentToday: 45.00,
        createdAt: new Date().toISOString(),
    },
];

export function AutonomyProvider({ children }: { children: ReactNode }) {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isBackendConnected, setIsBackendConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<AutonomyState['stats']>(null);
    const [isHydrated, setIsHydrated] = useState(false);

    // Demo user ID (in production, this would come from wallet connection)
    const userId = 'demo-user-wallet';

    // Check backend connection
    const checkBackend = useCallback(async () => {
        try {
            await api.healthCheck();
            setIsBackendConnected(true);
            return true;
        } catch {
            setIsBackendConnected(false);
            return false;
        }
    }, []);

    // Load data
    useEffect(() => {
        const init = async () => {
            setIsLoading(true);

            const backendAvailable = await checkBackend();

            if (backendAvailable) {
                // Load from backend
                try {
                    const [agentsRes, txRes, statsRes] = await Promise.all([
                        api.getAgents(userId),
                        api.getTransactions({ userId, limit: 100 }),
                        api.getTransactionStats(userId)
                    ]);

                    setAgents(agentsRes.agents);
                    setTransactions(txRes.transactions);
                    setStats(statsRes.stats);
                } catch (err: any) {
                    console.error('Backend error:', err);
                    setError(err.message);
                    // Fall back to localStorage
                    loadFromLocalStorage();
                }
            } else {
                // Load from localStorage (demo mode)
                loadFromLocalStorage();
            }

            setIsLoading(false);
            setIsHydrated(true);
        };

        init();
    }, [checkBackend]);

    const loadFromLocalStorage = () => {
        const savedAgents = localStorage.getItem('autonomy_agents');
        const savedTxs = localStorage.getItem('autonomy_transactions');

        if (savedAgents) {
            setAgents(JSON.parse(savedAgents));
        } else {
            setAgents(DEMO_AGENTS);
        }

        if (savedTxs) {
            setTransactions(JSON.parse(savedTxs));
        }

        // Calculate stats from local data
        const txs = savedTxs ? JSON.parse(savedTxs) : [];
        setStats({
            totalApproved: txs.filter((t: Transaction) => t.status === 'approved').length,
            totalBlocked: txs.filter((t: Transaction) => t.status === 'blocked').length,
            spentToday: txs.filter((t: Transaction) => t.status === 'approved').reduce((sum: number, t: Transaction) => sum + t.amount, 0),
            totalSpent: txs.filter((t: Transaction) => t.status === 'approved').reduce((sum: number, t: Transaction) => sum + t.amount, 0)
        });
    };

    // Save to localStorage when data changes (demo mode)
    useEffect(() => {
        if (isHydrated && !isBackendConnected) {
            localStorage.setItem('autonomy_agents', JSON.stringify(agents));
            localStorage.setItem('autonomy_transactions', JSON.stringify(transactions));
        }
    }, [agents, transactions, isHydrated, isBackendConnected]);

    const refreshAgents = async () => {
        if (isBackendConnected) {
            const res = await api.getAgents(userId);
            setAgents(res.agents);
        }
    };

    const refreshTransactions = async () => {
        if (isBackendConnected) {
            const [txRes, statsRes] = await Promise.all([
                api.getTransactions({ userId, limit: 100 }),
                api.getTransactionStats(userId)
            ]);
            setTransactions(txRes.transactions);
            setStats(statsRes.stats);
        }
    };

    const addAgent = async (data: { name: string; policy: Omit<Policy, 'id'> }): Promise<Agent | null> => {
        try {
            if (isBackendConnected) {
                const res = await api.createAgent({
                    name: data.name,
                    userId,
                    policy: data.policy as Policy
                });
                await refreshAgents();
                return res.agent;
            } else {
                // Demo mode
                const newAgent: Agent = {
                    id: `demo-${Date.now()}`,
                    name: data.name,
                    status: 'active',
                    walletAddress: `0x${Math.random().toString(16).slice(2, 10)}...`,
                    policy: data.policy as Policy,
                    spentToday: 0,
                    createdAt: new Date().toISOString()
                };
                setAgents(prev => [...prev, newAgent]);
                return newAgent;
            }
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const updateAgent = async (id: string, updates: Partial<{ name: string; status: string }>) => {
        try {
            if (isBackendConnected) {
                await api.updateAgent(id, updates);
                await refreshAgents();
            } else {
                // Demo mode
                setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } as Agent : a));
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const removeAgent = async (id: string) => {
        try {
            if (isBackendConnected) {
                await api.deleteAgent(id);
                await refreshAgents();
            } else {
                // Demo mode
                setAgents(prev => prev.filter(a => a.id !== id));
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const activateKillSwitch = async (id: string) => {
        try {
            if (isBackendConnected) {
                await api.activateKillSwitch(id);
                await refreshAgents();
            } else {
                // Demo mode
                setAgents(prev => prev.map(a => a.id === id ? { ...a, status: 'frozen' as const } : a));
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const simulateTransaction = async (agentId: string, service: string, amount: number): Promise<ValidationResult | null> => {
        try {
            if (isBackendConnected) {
                const res = await api.simulateTransaction({ agentId, service, amount, type: 'payment' });
                return res.validation;
            } else {
                // Demo mode - local policy check
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

                // Record transaction locally
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
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const executeTransaction = async (agentId: string, task: { type: string; service: string; amount: number }) => {
        try {
            if (isBackendConnected) {
                const result = await api.executeAgentTask(agentId, task);
                await refreshTransactions();
                return result;
            } else {
                // Demo mode - just simulate
                return await simulateTransaction(agentId, task.service, task.amount);
            }
        } catch (err: any) {
            setError(err.message);
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

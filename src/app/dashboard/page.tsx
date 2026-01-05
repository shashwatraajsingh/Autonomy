'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Play,
    Pause,
    AlertTriangle,
    ShieldCheck,
    Activity,
    Wallet,
    ChevronRight,
    RefreshCw,
    Server,
    Cloud,
    X,
    Zap,
    Lock
} from 'lucide-react';
import { useAutonomy } from '@/lib/AutonomyContext';
import { WalletConnect } from '@/components/WalletConnect';

export default function DashboardPage() {
    const { isConnected, address } = useAccount();
    const {
        agents,
        transactions,
        stats,
        addAgent,
        updateAgent,
        removeAgent,
        isBackendConnected,
        isLoading,
        refreshAgents,
        refreshTransactions
    } = useAutonomy();

    const [mounted, setMounted] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // New agent form
    const [newAgentName, setNewAgentName] = useState('');
    const [dailyLimit, setDailyLimit] = useState(50);
    const [perTxLimit, setPerTxLimit] = useState(10);
    const [whitelistInput, setWhitelistInput] = useState('api.openai.com');
    const [killSwitch, setKillSwitch] = useState(true);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([refreshAgents(), refreshTransactions()]);
        setIsRefreshing(false);
    };

    const handleAddAgent = async () => {
        if (!newAgentName.trim()) return;

        await addAgent({
            name: newAgentName.trim(),
            policy: {
                dailyLimit,
                perTxLimit,
                whitelist: whitelistInput.split(',').map(s => s.trim()).filter(Boolean),
                killSwitch
            }
        });

        // Reset form
        setNewAgentName('');
        setDailyLimit(50);
        setPerTxLimit(10);
        setWhitelistInput('api.openai.com');
        setKillSwitch(true);
        setShowAddModal(false);
    };

    const toggleAgentStatus = async (agentId: string, currentStatus: string) => {
        if (currentStatus === 'frozen') return;
        await updateAgent(agentId, { status: currentStatus === 'active' ? 'paused' : 'active' });
    };

    const handleRemoveAgent = async (agentId: string) => {
        if (confirm('Are you sure you want to delete this agent?')) {
            await removeAgent(agentId);
        }
    };

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen bg-[#11111b] pt-24 pb-12 flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#a5a5ba]">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading Dashboard...</span>
                </div>
            </div>
        );
    }

    // Wallet not connected
    if (!isConnected) {
        return (
            <div className="min-h-screen bg-[#11111b] pt-24 pb-12 flex items-center justify-center">
                <div className="max-w-md text-center px-6">
                    <div className="w-20 h-20 bg-[#212134] rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-[#4945ff]" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h1>
                    <p className="text-[#a5a5ba] mb-8">
                        Connect your wallet to manage your AI agents, set spending policies, and monitor transactions.
                    </p>
                    <WalletConnect />
                </div>
            </div>
        );
    }

    const totalSpent = agents.reduce((sum, a) => sum + a.spentToday, 0);
    const totalLimit = agents.reduce((sum, a) => sum + a.policy.dailyLimit, 0) || 1;

    return (
        <div className="min-h-screen bg-[#11111b] pt-24 pb-12">
            <div className="max-w-[1400px] mx-auto px-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg border border-[#2e2e48] hover:bg-[#212134] transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#a5a5ba]" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                Agent Dashboard
                                {isBackendConnected ? (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                        <Server className="w-3 h-3" /> Live
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                                        <Cloud className="w-3 h-3" /> Local
                                    </span>
                                )}
                            </h1>
                            <p className="text-sm text-[#a5a5ba]">
                                Connected: <span className="font-mono text-[#4945ff]">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="text-sm font-medium text-[#a5a5ba] hover:text-white px-4 py-2 rounded-lg border border-[#2e2e48] hover:bg-[#212134] transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                        </button>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="text-sm font-bold text-white bg-[#4945ff] hover:bg-[#5d59ff] px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Plus className="w-4 h-4" /> New Agent
                        </button>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#a5a5ba]">Active Agents</span>
                            <ShieldCheck className="w-4 h-4 text-[#4945ff]" />
                        </div>
                        <div className="text-3xl font-bold text-white font-mono">
                            {agents.filter(a => a.status === 'active').length}
                            <span className="text-lg text-[#666687]">/{agents.length}</span>
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#a5a5ba]">Daily Spending</span>
                            <Wallet className="w-4 h-4 text-[#4945ff]" />
                        </div>
                        <div className="text-3xl font-bold text-white font-mono">
                            ${totalSpent.toFixed(2)}
                        </div>
                        <div className="mt-2 w-full h-1.5 bg-[#1a1a2e] rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all ${(totalSpent / totalLimit) > 0.8 ? 'bg-red-500' : 'bg-[#4945ff]'}`}
                                style={{ width: `${Math.min((totalSpent / totalLimit) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#a5a5ba]">Approved</span>
                            <Activity className="w-4 h-4 text-green-400" />
                        </div>
                        <div className="text-3xl font-bold text-green-400 font-mono">
                            {stats?.totalApproved || 0}
                        </div>
                    </div>
                    <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-[#a5a5ba]">Blocked</span>
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                        </div>
                        <div className="text-3xl font-bold text-red-400 font-mono">
                            {stats?.totalBlocked || 0}
                        </div>
                    </div>
                </div>

                {/* Agents Grid */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Managed Agents</h2>
                        <Link href="/demo" className="text-sm text-[#4945ff] hover:text-[#5d59ff] flex items-center gap-1">
                            <Zap className="w-4 h-4" /> Open Simulator
                        </Link>
                    </div>

                    {agents.length === 0 ? (
                        <div className="p-12 rounded-xl border border-[#2e2e48] bg-[#212134] text-center">
                            <ShieldCheck className="w-16 h-16 text-[#4945ff] mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl font-bold text-white mb-2">No Agents Yet</h3>
                            <p className="text-[#a5a5ba] mb-6 max-w-md mx-auto">
                                Create your first AI agent to start managing spending limits and policies.
                            </p>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="text-sm font-bold text-white bg-[#4945ff] hover:bg-[#5d59ff] px-6 py-3 rounded-lg transition-colors"
                            >
                                Create Your First Agent
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {agents.map((agent) => (
                                    <motion.div
                                        key={agent.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134] hover:border-[#4945ff]/30 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-3 h-3 rounded-full ${agent.status === 'active' ? 'bg-green-500 animate-pulse' :
                                                        agent.status === 'paused' ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`} />
                                                <div>
                                                    <h3 className="font-bold text-white">{agent.name}</h3>
                                                    <p className="text-xs text-[#666687] font-mono">{agent.walletAddress}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => toggleAgentStatus(agent.id, agent.status)}
                                                    disabled={agent.status === 'frozen'}
                                                    className="p-2 rounded-lg border border-[#2e2e48] hover:bg-[#1a1a2e] transition-colors disabled:opacity-30"
                                                    title={agent.status === 'active' ? 'Pause' : 'Resume'}
                                                >
                                                    {agent.status === 'active' ? (
                                                        <Pause className="w-4 h-4 text-[#a5a5ba]" />
                                                    ) : (
                                                        <Play className="w-4 h-4 text-[#a5a5ba]" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => handleRemoveAgent(agent.id)}
                                                    className="p-2 rounded-lg border border-[#2e2e48] hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-3 text-sm mb-4">
                                            <div className="flex justify-between">
                                                <span className="text-[#a5a5ba]">Status</span>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${agent.status === 'active' ? 'bg-green-400/10 text-green-400' :
                                                        agent.status === 'paused' ? 'bg-yellow-400/10 text-yellow-400' :
                                                            'bg-red-400/10 text-red-400'
                                                    }`}>
                                                    {agent.status.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#a5a5ba]">Spent Today</span>
                                                <span className="text-white font-mono">${agent.spentToday.toFixed(2)} / ${agent.policy.dailyLimit}</span>
                                            </div>
                                            <div className="w-full h-2 bg-[#1a1a2e] rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${(agent.spentToday / agent.policy.dailyLimit) > 0.8 ? 'bg-red-500' : 'bg-[#4945ff]'
                                                        }`}
                                                    style={{ width: `${Math.min((agent.spentToday / agent.policy.dailyLimit) * 100, 100)}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#a5a5ba]">Per-Tx Limit</span>
                                                <span className="text-white font-mono">${agent.policy.perTxLimit}</span>
                                            </div>
                                        </div>

                                        <div className="pt-4 border-t border-[#2e2e48]">
                                            <p className="text-xs text-[#666687] mb-2 flex items-center gap-1">
                                                <ShieldCheck className="w-3 h-3" /> Whitelisted
                                            </p>
                                            <div className="flex flex-wrap gap-1">
                                                {agent.policy.whitelist.slice(0, 2).map((service) => (
                                                    <span key={service} className="text-xs px-2 py-1 rounded bg-[#1a1a2e] text-[#a5a5ba]">
                                                        {service}
                                                    </span>
                                                ))}
                                                {agent.policy.whitelist.length > 2 && (
                                                    <span className="text-xs px-2 py-1 rounded bg-[#1a1a2e] text-[#666687]">
                                                        +{agent.policy.whitelist.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                {/* Recent Transactions */}
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white">Recent Activity</h2>
                        <Link href="/demo" className="text-sm text-[#4945ff] hover:text-[#5d59ff] flex items-center gap-1">
                            Full Audit Log <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                    <div className="rounded-xl border border-[#2e2e48] bg-[#212134] overflow-hidden">
                        {transactions.length === 0 ? (
                            <div className="p-12 text-center text-[#a5a5ba]">
                                <Activity className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                <p>No transactions yet.</p>
                                <Link href="/demo" className="text-[#4945ff] text-sm mt-2 inline-block">Try the simulator →</Link>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#1a1a2e] text-[#666687] uppercase text-xs font-medium">
                                        <tr>
                                            <th className="px-6 py-4">Agent</th>
                                            <th className="px-6 py-4">Service</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#2e2e48]">
                                        {transactions.slice(0, 10).map((tx) => {
                                            const agent = agents.find(a => a.id === tx.agentId);
                                            return (
                                                <tr key={tx.id} className="hover:bg-[#1a1a2e] transition-colors">
                                                    <td className="px-6 py-4 text-white">{agent?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 text-[#a5a5ba] font-mono text-xs">{tx.service}</td>
                                                    <td className="px-6 py-4 font-mono text-white">${tx.amount.toFixed(2)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${tx.status === 'approved'
                                                                ? 'bg-green-500/10 text-green-400'
                                                                : 'bg-red-500/10 text-red-400'
                                                            }`}>
                                                            {tx.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-[#666687] text-xs">
                                                        {new Date(tx.createdAt).toLocaleTimeString()}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add Agent Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowAddModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-[#212134] border border-[#2e2e48] rounded-2xl p-8 w-full max-w-lg"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold text-white">Create New Agent</h2>
                                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-lg hover:bg-[#1a1a2e]">
                                    <X className="w-5 h-5 text-[#a5a5ba]" />
                                </button>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[#a5a5ba] mb-2">Agent Name</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4945ff] placeholder-[#666687]"
                                        value={newAgentName}
                                        onChange={(e) => setNewAgentName(e.target.value)}
                                        placeholder="e.g., Research_Agent"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-[#a5a5ba] mb-2">Daily Limit ($)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4945ff]"
                                            value={dailyLimit}
                                            onChange={(e) => setDailyLimit(Number(e.target.value))}
                                            min={1}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-[#a5a5ba] mb-2">Per-Tx Limit ($)</label>
                                        <input
                                            type="number"
                                            className="w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4945ff]"
                                            value={perTxLimit}
                                            onChange={(e) => setPerTxLimit(Number(e.target.value))}
                                            min={1}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#a5a5ba] mb-2">Whitelisted Services</label>
                                    <input
                                        type="text"
                                        className="w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#4945ff] placeholder-[#666687]"
                                        value={whitelistInput}
                                        onChange={(e) => setWhitelistInput(e.target.value)}
                                        placeholder="api.openai.com, api.anthropic.com"
                                    />
                                    <p className="text-xs text-[#666687] mt-1">Comma-separated list of allowed services</p>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-lg bg-[#1a1a2e]">
                                    <input
                                        type="checkbox"
                                        id="killSwitch"
                                        checked={killSwitch}
                                        onChange={(e) => setKillSwitch(e.target.checked)}
                                        className="w-5 h-5 rounded bg-[#1a1a2e] border-[#2e2e48] text-[#4945ff]"
                                    />
                                    <label htmlFor="killSwitch" className="text-sm text-[#a5a5ba] flex-1">
                                        <span className="text-white font-medium">Enable Kill Switch</span>
                                        <br />
                                        <span className="text-xs">Allows emergency freeze of all agent activity</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 rounded-lg border border-[#2e2e48] text-[#a5a5ba] hover:bg-[#1a1a2e] transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddAgent}
                                    disabled={!newAgentName.trim()}
                                    className="flex-1 py-3 rounded-lg bg-[#4945ff] hover:bg-[#5d59ff] text-white font-bold transition-colors disabled:opacity-50"
                                >
                                    Create Agent
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
    ArrowLeft,
    Play,
    Activity,
    Shield,
    Wallet,
    CheckCircle2,
    XCircle,
    Terminal,
    RefreshCw,
    Settings,
    Zap,
    AlertTriangle,
    Server,
    Cloud
} from 'lucide-react';
import { useAutonomy } from '@/lib/AutonomyContext';

const SAMPLE_SERVICES = [
    { name: 'api.openai.com', label: 'OpenAI API', type: 'AI' },
    { name: 'api.anthropic.com', label: 'Anthropic API', type: 'AI' },
    { name: 'api.google.com', label: 'Google API', type: 'AI' },
    { name: 'api.binance.com', label: 'Binance Exchange', type: 'Trading' },
    { name: 'api.coingecko.com', label: 'CoinGecko', type: 'Data' },
    { name: 'malicious-api.xyz', label: 'Unknown Service', type: 'Unknown' },
];

export default function DemoPage() {
    const { agents, transactions, simulateTransaction, updateAgent, activateKillSwitch, isBackendConnected, isLoading } = useAutonomy();
    const [selectedAgentId, setSelectedAgentId] = useState<string>('');
    const [selectedService, setSelectedService] = useState(SAMPLE_SERVICES[0].name);
    const [amount, setAmount] = useState(5);
    const [isProcessing, setIsProcessing] = useState(false);
    const [lastResult, setLastResult] = useState<{ approved: boolean; reason: string } | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (agents.length > 0 && !selectedAgentId) {
            setSelectedAgentId(agents[0].id);
        }
    }, [agents, selectedAgentId]);

    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    const runSimulation = async () => {
        if (!selectedAgentId) return;

        setIsProcessing(true);
        setLastResult(null);

        await new Promise(r => setTimeout(r, 800)); // Dramatic pause

        const result = await simulateTransaction(selectedAgentId, selectedService, amount);
        if (result) {
            setLastResult({ approved: result.approved, reason: result.reason });
        }

        setIsProcessing(false);
    };

    const toggleAgentStatus = async () => {
        if (!selectedAgent) return;
        const newStatus = selectedAgent.status === 'active' ? 'paused' : 'active';
        await updateAgent(selectedAgentId, { status: newStatus });
    };

    const handleKillSwitch = async () => {
        if (!selectedAgent) return;
        await activateKillSwitch(selectedAgentId);
    };

    if (!mounted || isLoading) {
        return (
            <div className="min-h-screen bg-[#11111b] pt-24 pb-12 flex items-center justify-center">
                <div className="flex items-center gap-3 text-[#a5a5ba]">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading Autonomy...</span>
                </div>
            </div>
        );
    }

    const approvedCount = transactions.filter(t => t.status === 'approved').length;
    const blockedCount = transactions.filter(t => t.status === 'blocked').length;

    return (
        <div className="min-h-screen bg-[#11111b] pt-24 pb-12">
            <div className="max-w-[1400px] mx-auto px-6">
                {/* Header */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/" className="p-2 rounded-lg border border-[#2e2e48] hover:bg-[#212134] transition-colors">
                            <ArrowLeft className="w-5 h-5 text-[#a5a5ba]" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                                Policy Simulator
                                {isBackendConnected ? (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
                                        <Server className="w-3 h-3" /> Backend Connected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1.5 text-xs font-medium text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">
                                        <Cloud className="w-3 h-3" /> Demo Mode
                                    </span>
                                )}
                            </h1>
                            <p className="text-sm text-[#a5a5ba]">Test agent governance rules with real policy enforcement.</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Configuration Panel */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Agent Selection */}
                        <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-[#4945ff]" /> Select Agent
                            </h2>

                            {agents.length === 0 ? (
                                <div className="text-center py-8">
                                    <Shield className="w-12 h-12 text-[#4945ff] mx-auto mb-4 opacity-50" />
                                    <p className="text-[#a5a5ba] text-sm mb-4">No agents yet</p>
                                    <Link href="/dashboard" className="text-sm text-[#4945ff] hover:underline">
                                        Create an agent →
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <select
                                        className="w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-lg px-3 py-3 text-sm text-white focus:outline-none focus:border-[#4945ff] mb-4"
                                        value={selectedAgentId}
                                        onChange={(e) => setSelectedAgentId(e.target.value)}
                                    >
                                        {agents.map(agent => (
                                            <option key={agent.id} value={agent.id}>
                                                {agent.name} ({agent.status})
                                            </option>
                                        ))}
                                    </select>

                                    {selectedAgent && (
                                        <div className="space-y-4">
                                            <div className="p-4 rounded-lg bg-[#1a1a2e] border border-[#2e2e48]">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs text-[#666687] uppercase">Status</span>
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${selectedAgent.status === 'active' ? 'bg-green-400/10 text-green-400' :
                                                            selectedAgent.status === 'paused' ? 'bg-yellow-400/10 text-yellow-400' :
                                                                'bg-red-400/10 text-red-400'
                                                        }`}>
                                                        {selectedAgent.status.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-[#a5a5ba]">Daily Limit</span>
                                                        <span className="text-white font-mono">${selectedAgent.policy.dailyLimit}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[#a5a5ba]">Per-Tx Limit</span>
                                                        <span className="text-white font-mono">${selectedAgent.policy.perTxLimit}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-[#a5a5ba]">Spent Today</span>
                                                        <span className="text-white font-mono">${selectedAgent.spentToday.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-t border-[#2e2e48]">
                                                    <div className="flex justify-between text-xs text-[#666687] mb-1">
                                                        <span>Budget Used</span>
                                                        <span>{((selectedAgent.spentToday / selectedAgent.policy.dailyLimit) * 100).toFixed(0)}%</span>
                                                    </div>
                                                    <div className="w-full h-2 bg-[#212134] rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all ${(selectedAgent.spentToday / selectedAgent.policy.dailyLimit) > 0.8
                                                                    ? 'bg-red-500'
                                                                    : 'bg-[#4945ff]'
                                                                }`}
                                                            style={{ width: `${Math.min((selectedAgent.spentToday / selectedAgent.policy.dailyLimit) * 100, 100)}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="text-xs text-[#666687]">
                                                <span className="uppercase font-medium">Whitelisted Services:</span>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {selectedAgent.policy.whitelist.map(s => (
                                                        <span key={s} className="px-2 py-1 rounded bg-[#1a1a2e] text-[#a5a5ba]">{s}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Transaction Config */}
                        <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#4945ff]" /> Simulate Transaction
                            </h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#a5a5ba] mb-2">Target Service</label>
                                    <div className="space-y-2">
                                        {SAMPLE_SERVICES.map(s => (
                                            <button
                                                key={s.name}
                                                onClick={() => setSelectedService(s.name)}
                                                className={`w-full text-left p-3 rounded-lg border transition-all ${selectedService === s.name
                                                        ? 'border-[#4945ff] bg-[#4945ff]/10'
                                                        : 'border-[#2e2e48] bg-[#1a1a2e] hover:border-[#4945ff]/50'
                                                    }`}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm text-white">{s.label}</span>
                                                    <span className={`text-xs px-2 py-0.5 rounded ${s.type === 'Unknown' ? 'bg-red-400/10 text-red-400' : 'bg-[#4945ff]/10 text-[#4945ff]'
                                                        }`}>{s.type}</span>
                                                </div>
                                                <span className="text-xs text-[#666687] font-mono">{s.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-[#a5a5ba] mb-2">Amount (USDC)</label>
                                    <div className="flex gap-2">
                                        {[1, 5, 10, 25, 50].map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setAmount(v)}
                                                className={`flex-1 py-2 rounded text-sm font-medium border transition-all ${amount === v
                                                        ? 'border-[#4945ff] bg-[#4945ff] text-white'
                                                        : 'border-[#2e2e48] text-[#a5a5ba] hover:border-[#4945ff]/50'
                                                    }`}
                                            >
                                                ${v}
                                            </button>
                                        ))}
                                    </div>
                                    <input
                                        type="number"
                                        className="mt-2 w-full bg-[#1a1a2e] border border-[#2e2e48] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#4945ff]"
                                        value={amount}
                                        onChange={(e) => setAmount(Number(e.target.value))}
                                        min={0}
                                        step={0.5}
                                        placeholder="Custom amount"
                                    />
                                </div>

                                <button
                                    onClick={runSimulation}
                                    disabled={isProcessing || !selectedAgentId}
                                    className="w-full bg-[#4945ff] hover:bg-[#5d59ff] text-white font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                                >
                                    {isProcessing ? (
                                        <>
                                            <RefreshCw className="w-5 h-5 animate-spin" />
                                            Validating Policy...
                                        </>
                                    ) : (
                                        <>
                                            <Zap className="w-5 h-5" />
                                            Execute Transaction
                                        </>
                                    )}
                                </button>

                                {/* Result Display */}
                                <AnimatePresence>
                                    {lastResult && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            className={`p-4 rounded-lg border ${lastResult.approved
                                                    ? 'border-green-500/30 bg-green-500/10'
                                                    : 'border-red-500/30 bg-red-500/10'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-2">
                                                {lastResult.approved ? (
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                ) : (
                                                    <XCircle className="w-5 h-5 text-red-400" />
                                                )}
                                                <span className={`font-bold ${lastResult.approved ? 'text-green-400' : 'text-red-400'}`}>
                                                    {lastResult.approved ? 'APPROVED' : 'BLOCKED'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#a5a5ba]">{lastResult.reason}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Agent Controls */}
                        <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-[#4945ff]" /> Agent Controls
                            </h2>

                            <div className="space-y-3">
                                <button
                                    onClick={toggleAgentStatus}
                                    disabled={!selectedAgent || selectedAgent.status === 'frozen'}
                                    className="w-full bg-[#1a1a2e] hover:bg-[#2e2e48] text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-[#2e2e48] disabled:opacity-50"
                                >
                                    {selectedAgent?.status === 'active' ? 'Pause Agent' : 'Resume Agent'}
                                </button>
                                <button
                                    onClick={handleKillSwitch}
                                    disabled={!selectedAgent || selectedAgent.status === 'frozen'}
                                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors border border-red-500/20 disabled:opacity-50"
                                >
                                    <AlertTriangle className="w-5 h-5" /> Activate Kill Switch
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Panel */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#a5a5ba]">Agents</span>
                                    <Shield className="w-4 h-4 text-[#4945ff]" />
                                </div>
                                <div className="text-3xl font-bold text-white font-mono">
                                    {agents.filter(a => a.status === 'active').length}
                                    <span className="text-lg text-[#666687]">/{agents.length}</span>
                                </div>
                            </div>
                            <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#a5a5ba]">Approved</span>
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="text-3xl font-bold text-green-400 font-mono">
                                    {approvedCount}
                                </div>
                            </div>
                            <div className="p-6 rounded-xl border border-[#2e2e48] bg-[#212134]">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm text-[#a5a5ba]">Blocked</span>
                                    <XCircle className="w-4 h-4 text-red-400" />
                                </div>
                                <div className="text-3xl font-bold text-red-400 font-mono">
                                    {blockedCount}
                                </div>
                            </div>
                        </div>

                        {/* Audit Log */}
                        <div className="flex-1 rounded-xl border border-[#2e2e48] bg-[#0d0d12] overflow-hidden flex flex-col min-h-[600px]">
                            <div className="px-4 py-3 border-b border-[#2e2e48] bg-[#212134] flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-[#a5a5ba]" />
                                    <span className="text-xs font-mono text-[#a5a5ba]">audit_log.json</span>
                                </div>
                                <span className="text-xs text-[#666687]">{transactions.length} entries</span>
                            </div>
                            <div className="p-4 font-mono text-sm space-y-3 overflow-y-auto flex-1">
                                {transactions.length === 0 ? (
                                    <div className="text-[#666687] text-center py-12">
                                        <Terminal className="w-12 h-12 mx-auto mb-4 opacity-30" />
                                        <p>No transactions yet.</p>
                                        <p className="text-xs mt-2">Execute a transaction to see the audit log.</p>
                                    </div>
                                ) : (
                                    <AnimatePresence>
                                        {transactions.slice(0, 20).map((tx, i) => (
                                            <motion.div
                                                key={tx.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: i * 0.05 }}
                                                className={`p-4 rounded-lg border ${tx.status === 'approved'
                                                        ? 'border-green-500/20 bg-green-500/5'
                                                        : 'border-red-500/20 bg-red-500/5'
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        {tx.status === 'approved' ? (
                                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-400" />
                                                        )}
                                                        <span className={`font-bold ${tx.status === 'approved' ? 'text-green-400' : 'text-red-400'}`}>
                                                            {tx.status.toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <span className="text-[#666687] text-xs">
                                                        {new Date(tx.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#a5a5ba]">
                                                    <div><span className="text-[#666687]">Service:</span> {tx.service}</div>
                                                    <div><span className="text-[#666687]">Amount:</span> ${tx.amount.toFixed(2)}</div>
                                                    <div className="col-span-2"><span className="text-[#666687]">Reason:</span> {tx.reason}</div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

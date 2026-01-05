'use client';

import { useState } from 'react';
import { useAccount, useConnect, useDisconnect, useBalance, useChainId, useSwitchChain } from 'wagmi';
import { formatEther } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, Copy, Check, ExternalLink } from 'lucide-react';
import { supportedChains } from '@/lib/wagmi';

export function WalletConnect() {
    const { address, isConnected, connector } = useAccount();
    const { connect, connectors, isPending } = useConnect();
    const { disconnect } = useDisconnect();
    const chainId = useChainId();
    const { switchChain } = useSwitchChain();
    const { data: balance } = useBalance({ address });

    const [showDropdown, setShowDropdown] = useState(false);
    const [showChainDropdown, setShowChainDropdown] = useState(false);
    const [copied, setCopied] = useState(false);

    const currentChain = supportedChains.find(c => c.id === chainId);

    const copyAddress = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const formatAddress = (addr: string) => {
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    if (!isConnected) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    disabled={isPending}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#4945ff] hover:bg-[#5d59ff] text-white font-bold rounded-lg transition-all"
                >
                    <Wallet className="w-4 h-4" />
                    {isPending ? 'Connecting...' : 'Connect Wallet'}
                </button>

                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-64 p-2 bg-[#212134] border border-[#2e2e48] rounded-xl shadow-xl z-50"
                        >
                            <p className="px-3 py-2 text-xs text-[#666687] uppercase font-medium">Connect Wallet</p>
                            {connectors.map((connector) => (
                                <button
                                    key={connector.uid}
                                    onClick={() => {
                                        connect({ connector });
                                        setShowDropdown(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-[#2e2e48] transition-colors text-left"
                                >
                                    <div className="w-8 h-8 bg-[#4945ff]/20 rounded-lg flex items-center justify-center">
                                        <Wallet className="w-4 h-4 text-[#4945ff]" />
                                    </div>
                                    <span className="text-white font-medium">{connector.name}</span>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2">
            {/* Chain Selector */}
            <div className="relative">
                <button
                    onClick={() => setShowChainDropdown(!showChainDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#212134] border border-[#2e2e48] rounded-lg hover:border-[#4945ff]/50 transition-colors"
                >
                    <span className="text-lg">{currentChain?.icon || '🔗'}</span>
                    <span className="text-sm text-white hidden sm:block">{currentChain?.name || 'Unknown'}</span>
                    <ChevronDown className="w-4 h-4 text-[#666687]" />
                </button>

                <AnimatePresence>
                    {showChainDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-48 p-2 bg-[#212134] border border-[#2e2e48] rounded-xl shadow-xl z-50"
                        >
                            <p className="px-3 py-2 text-xs text-[#666687] uppercase font-medium">Switch Network</p>
                            {supportedChains.map((chain) => (
                                <button
                                    key={chain.id}
                                    onClick={() => {
                                        switchChain({ chainId: chain.id });
                                        setShowChainDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#2e2e48] transition-colors text-left ${chain.id === chainId ? 'bg-[#4945ff]/10' : ''
                                        }`}
                                >
                                    <span className="text-lg">{chain.icon}</span>
                                    <div>
                                        <span className="text-white text-sm">{chain.name}</span>
                                        {chain.testnet && (
                                            <span className="ml-2 text-xs text-yellow-400">Testnet</span>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Wallet Dropdown */}
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#212134] border border-[#2e2e48] rounded-lg hover:border-[#4945ff]/50 transition-colors"
                >
                    <div className="w-6 h-6 bg-gradient-to-br from-[#4945ff] to-[#7c3aed] rounded-full" />
                    <span className="text-sm text-white font-mono">{formatAddress(address!)}</span>
                    <ChevronDown className="w-4 h-4 text-[#666687]" />
                </button>

                <AnimatePresence>
                    {showDropdown && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-72 p-4 bg-[#212134] border border-[#2e2e48] rounded-xl shadow-xl z-50"
                        >
                            {/* Balance */}
                            <div className="mb-4 p-3 bg-[#1a1a2e] rounded-lg">
                                <p className="text-xs text-[#666687] uppercase mb-1">Balance</p>
                                <p className="text-xl font-bold text-white font-mono">
                                    {balance ? `${parseFloat(formatEther(balance.value)).toFixed(4)} ${balance.symbol}` : '0.0000'}
                                </p>
                            </div>

                            {/* Address */}
                            <div className="mb-4">
                                <p className="text-xs text-[#666687] uppercase mb-2">Address</p>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-white font-mono flex-1 truncate">{address}</span>
                                    <button
                                        onClick={copyAddress}
                                        className="p-1.5 rounded hover:bg-[#2e2e48] transition-colors"
                                    >
                                        {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-[#a5a5ba]" />}
                                    </button>
                                    <a
                                        href={`https://polygonscan.com/address/${address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1.5 rounded hover:bg-[#2e2e48] transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4 text-[#a5a5ba]" />
                                    </a>
                                </div>
                            </div>

                            {/* Connected Wallet */}
                            <div className="mb-4 pb-4 border-b border-[#2e2e48]">
                                <p className="text-xs text-[#666687]">Connected with {connector?.name}</p>
                            </div>

                            {/* Disconnect */}
                            <button
                                onClick={() => {
                                    disconnect();
                                    setShowDropdown(false);
                                }}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

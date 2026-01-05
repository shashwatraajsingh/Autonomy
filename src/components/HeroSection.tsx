'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Copy, Check, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function HeroSection() {
    const [copied, setCopied] = useState(false);
    const command = 'npm install autonomy-ai-sdk';

    const handleCopy = () => {
        navigator.clipboard.writeText(command);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">

            <div className="relative max-w-[1200px] mx-auto px-6 w-full flex flex-col items-center text-center z-10">

                {/* Top Badge */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-10"
                >
                    <Link href="#" className="badge-new group hover:bg-[#4945ff]/20 transition-colors">
                        <span className="badge-tag">NEW</span>
                        <span className="text-sm text-[#d9d8ff] font-medium">Introducing x402 Payment Protocol Support <span className="text-[#4945ff] group-hover:translate-x-1 transition-transform inline-block ml-1">→</span></span>
                    </Link>
                </motion.div>

                {/* Headline */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-white max-w-5xl"
                >
                    The Financial OS for <br />
                    <span className="text-[#a5a5ba]">Autonomous AI Agents</span>
                </motion.h1>

                {/* Subheadline */}
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="text-xl text-[#a5a5ba] max-w-3xl mb-12 leading-relaxed font-normal"
                >
                    Set spending limits, whitelist services, and enable secure on-chain payments for your AI agents. Non-custodial governance with programmable policies and human-in-the-loop controls.
                </motion.p>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col items-center gap-6 w-full max-w-md"
                >
                    {/* NPX Command Box */}
                    <div className="flex items-center justify-between w-full bg-[#212134] border border-[#2e2e48] rounded-none p-1 pl-4 pr-1">
                        <code className="text-[#a5a5ba] font-mono-tech text-sm">{command}</code>
                        <button
                            onClick={handleCopy}
                            className="p-2 hover:bg-[#2e2e48] rounded-none transition-colors text-[#a5a5ba] hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
                        >
                            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied' : 'Copy'}
                        </button>
                    </div>

                    <div className="flex items-center gap-4 w-full">
                        <div className="h-[1px] flex-1 bg-[#2e2e48]"></div>
                        <span className="text-xs font-bold text-[#666687] uppercase tracking-widest">OR</span>
                        <div className="h-[1px] flex-1 bg-[#2e2e48]"></div>
                    </div>

                    <Link
                        href="/demo"
                        className="w-full h-12 rounded-none bg-[#4945ff] hover:bg-[#5d59ff] text-white font-bold text-base flex items-center justify-center transition-all shadow-[0_4px_14px_0_rgba(73,69,255,0.39)] hover:shadow-[0_6px_20px_rgba(73,69,255,0.23)] hover:-translate-y-[1px]"
                    >
                        Try the Simulator
                    </Link>
                </motion.div>

                {/* Product Preview Interface */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="mt-20 w-full max-w-5xl relative z-10"
                >
                    <div className="rounded-none border border-[#2e2e48] bg-[#1a1a2e]/80 backdrop-blur-xl overflow-hidden shadow-2xl">
                        {/* Window Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[#2e2e48] bg-[#212134]/50">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                                </div>
                            </div>
                            <div className="flex items-center gap-6 text-xs font-bold text-[#a5a5ba]">
                                <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#2e2e48]/50 text-white">
                                    <span className="w-2 h-2 rounded-full bg-[#4945ff]" />
                                    Agent Wallets
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                    <span className="w-2 h-2 rounded-full bg-[#a5a5ba]" />
                                    Policy Rules
                                </div>
                                <div className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                    <span className="w-2 h-2 rounded-full bg-[#a5a5ba]" />
                                    Audit Log
                                </div>
                            </div>
                            <div className="w-12" />
                        </div>

                        {/* Window Content */}
                        <div className="grid grid-cols-1 md:grid-cols-2">
                            {/* Left: Dashboard Mock */}
                            <div className="p-6 border-r border-[#2e2e48] bg-[#11111b]/50">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-sm font-bold text-white">Managed Agents</h3>
                                    <span className="text-xs text-[#4945ff] bg-[#4945ff]/10 px-2 py-1 rounded">Polygon</span>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { name: 'Research_Agent', status: 'active', spent: '12.50 USDC' },
                                        { name: 'Trading_Bot_v2', status: 'active', spent: '45.00 USDC' },
                                        { name: 'Data_Scraper', status: 'paused', spent: '0.00 USDC' },
                                    ].map((agent, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-none bg-[#212134] border border-[#2e2e48]">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                                                <div>
                                                    <div className="text-xs font-bold text-white">{agent.name}</div>
                                                    <div className="text-[10px] text-[#a5a5ba]">Daily limit: 50 USDC</div>
                                                </div>
                                            </div>
                                            <div className="text-xs font-mono-tech text-[#a5a5ba]">
                                                {agent.spent}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 pt-4 border-t border-[#2e2e48]">
                                    <div className="flex justify-between text-xs text-[#a5a5ba] mb-1">
                                        <span>Daily Spend</span>
                                        <span>57.50 / 150 USDC</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#212134] rounded-full overflow-hidden">
                                        <div className="w-[38%] h-full bg-[#4945ff]" />
                                    </div>
                                </div>
                            </div>

                            {/* Right: Code Snippet */}
                            <div className="p-6 bg-[#0d0d12]">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-mono-tech text-[#a5a5ba]">autonomy.policy.ts</span>
                                    <Copy className="w-3 h-3 text-[#666687]" />
                                </div>
                                <pre className="font-mono-tech text-[10px] leading-relaxed text-[#a5a5ba]">
                                    <code>
                                        <span className="text-[#c099ff]">import</span> {'{'} AutonomySDK {'}'} <span className="text-[#c099ff]">from</span> <span className="text-[#a9dc76]">'autonomy-ai-sdk'</span>;
                                        {'\n'}
                                        {'\n'}<span className="text-[#ff7eb6]">const</span> agent = <span className="text-[#ff7eb6]">await</span> Autonomy.create({'{'}
                                        {'\n'}  <span className="text-[#78dce8]">identity</span>: <span className="text-[#a9dc76]">'ERC-8004'</span>,
                                        {'\n'}  <span className="text-[#78dce8]">wallet</span>: <span className="text-[#a9dc76]">'ERC-4337'</span>,
                                        {'\n'}  <span className="text-[#78dce8]">network</span>: <span className="text-[#a9dc76]">'polygon'</span>,
                                        {'\n'}{'}'});
                                        {'\n'}
                                        {'\n'}agent.<span className="text-[#78dce8]">setPolicy</span>({'{'}
                                        {'\n'}  <span className="text-[#78dce8]">dailyLimit</span>: <span className="text-[#a9dc76]">'50 USDC'</span>,
                                        {'\n'}  <span className="text-[#78dce8]">whitelist</span>: [<span className="text-[#a9dc76]">'api.openai.com'</span>],
                                        {'\n'}  <span className="text-[#78dce8]">killSwitch</span>: <span className="text-[#ff9f43]">true</span>,
                                        {'\n'}{'}'});
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* Background Geometric Shapes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-0 left-0 opacity-20">
                    <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="0" cy="100" r="100" fill="#4945ff" fillOpacity="0.2" />
                        <path d="M0 200 H200 V400 H0 V200 Z" fill="#212134" />
                        <path d="M0 400 H100 V500 H0 V400 Z" fill="#4945ff" fillOpacity="0.1" />
                        <circle cx="100" cy="300" r="50" fill="#1a1a2e" />
                    </svg>
                </div>

                <div className="absolute top-0 right-0 opacity-20">
                    <svg width="400" height="600" viewBox="0 0 400 600" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M200 0 H400 V200 H200 V0 Z" fill="#212134" />
                        <circle cx="300" cy="300" r="100" fill="#4945ff" fillOpacity="0.1" />
                        <path d="M300 400 H400 V500 H300 V400 Z" fill="#212134" />
                    </svg>
                </div>
            </div>

            {/* Floating AI Button */}
            <div className="fixed bottom-8 right-8 z-50">
                <Link href="/demo" className="w-14 h-14 rounded-none bg-[#212134] border border-[#2e2e48] flex flex-col items-center justify-center gap-1 shadow-2xl hover:border-[#4945ff] transition-colors group">
                    <Shield className="w-5 h-5 text-[#4945ff]" />
                    <span className="text-[10px] font-bold text-[#a5a5ba]">Demo</span>
                </Link>
            </div>

        </section>
    );
}

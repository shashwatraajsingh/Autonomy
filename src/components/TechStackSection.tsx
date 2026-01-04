'use client';

import { motion } from 'framer-motion';
import {
    Layers,
    Box,
    Cpu,
    Database,
    Code
} from 'lucide-react';

const stack = [
    {
        category: 'Blockchain Networks',
        items: ['Polygon zkEVM', 'Ethereum Mainnet', 'Arbitrum One', 'Base'],
        icon: Box
    },
    {
        category: 'Identity & Wallet Standards',
        items: ['ERC-4337 (Account Abstraction)', 'ERC-8004 (Agent Identity)', 'x402 (HTTP Payments)'],
        icon: Layers
    },
    {
        category: 'Infrastructure',
        items: ['Lit Protocol (MPC Signing)', 'The Graph (Indexing)', 'IPFS (Policy Storage)'],
        icon: Database
    },
    {
        category: 'Developer SDKs',
        items: ['TypeScript / Node.js', 'Python', 'Rust (Coming Soon)'],
        icon: Code
    }
];

export function TechStackSection() {
    return (
        <section id="tech-stack" className="section-padding bg-[#11111b] border-t border-[#2e2e48]">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-3xl font-bold mb-4 text-white">
                        Built on Open Standards
                    </h2>
                    <p className="text-[#a5a5ba] font-medium max-w-2xl mx-auto">
                        Autonomy integrates with the modern Web3 and AI agent ecosystem.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {stack.map((group, index) => (
                        <motion.div
                            key={group.category}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="p-8 rounded-none border border-[#2e2e48] bg-[#212134] hover:border-[#4945ff]/50 transition-colors group"
                        >
                            <div className="w-12 h-12 rounded-none bg-[#1a1a2e] border border-[#2e2e48] flex items-center justify-center mb-6 group-hover:border-[#4945ff]/50 transition-colors">
                                <group.icon className="w-6 h-6 text-[#4945ff]" />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-4">
                                {group.category}
                            </h3>
                            <ul className="space-y-3">
                                {group.items.map((item) => (
                                    <li key={item} className="text-sm text-[#a5a5ba] flex items-center gap-2 font-medium">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#3a3a52] group-hover:bg-[#4945ff] transition-colors" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

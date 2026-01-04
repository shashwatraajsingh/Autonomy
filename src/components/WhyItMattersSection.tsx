'use client';

import { motion } from 'framer-motion';
import {
    ShieldCheck,
    AlertOctagon,
    Lock,
    Zap,
    Check,
    X
} from 'lucide-react';

const features = [
    {
        title: 'Spending Velocity Limits',
        description: 'Prevent wallet draining by setting strict daily, hourly, or per-transaction spending caps for each agent.',
        icon: Zap
    },
    {
        title: 'Service Whitelisting',
        description: 'Restrict agent interactions to pre-approved APIs and smart contracts only. Block unknown endpoints.',
        icon: ShieldCheck
    },
    {
        title: 'Emergency Kill Switch',
        description: 'Instantly freeze all agent activity and revoke signing permissions if suspicious behavior is detected.',
        icon: AlertOctagon
    },
    {
        title: 'Non-Custodial by Design',
        description: 'You own your keys. Autonomy provides the governance layer—it never has access to your funds.',
        icon: Lock
    }
];

const comparison = [
    { feature: 'Programmable Spending Limits', standard: false, autonomy: true },
    { feature: 'API/Service Allowlisting', standard: false, autonomy: true },
    { feature: 'Human-in-the-Loop Approval', standard: false, autonomy: true },
    { feature: 'On-Chain Audit Trail', standard: true, autonomy: true },
    { feature: 'Emergency Freeze (Kill Switch)', standard: false, autonomy: true },
];

export function WhyItMattersSection() {
    return (
        <section className="section-padding bg-[#11111b] border-t border-[#2e2e48]">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">

                    {/* Features Grid */}
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                            Enterprise-Grade Controls
                        </h2>
                        <p className="text-[#a5a5ba] mb-12 font-medium">
                            Give your AI agents financial autonomy without sacrificing security.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {features.map((feature) => (
                                <div key={feature.title} className="group p-6 rounded-none border border-[#2e2e48] bg-[#212134] hover:border-[#4945ff]/50 transition-colors">
                                    <div className="w-12 h-12 rounded-none bg-[#1a1a2e] border border-[#2e2e48] flex items-center justify-center mb-6 group-hover:border-[#4945ff]/50 transition-colors">
                                        <feature.icon className="w-6 h-6 text-[#4945ff]" />
                                    </div>
                                    <h3 className="text-lg font-bold text-white mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-[#a5a5ba] text-sm leading-relaxed font-medium">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Comparison Table */}
                    <div className="bg-[#212134] rounded-none border border-[#2e2e48] overflow-hidden">
                        <div className="p-8 border-b border-[#2e2e48]">
                            <h3 className="text-xl font-bold text-white">
                                Why Standard Wallets Aren't Enough
                            </h3>
                            <p className="text-[#a5a5ba] mt-2 font-medium">
                                ERC-4337 wallets lack the governance layer AI agents need.
                            </p>
                        </div>
                        <div className="p-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-[#1a1a2e] border-b border-[#2e2e48]">
                                        <th className="text-left py-4 px-6 text-xs font-bold text-[#666687] uppercase tracking-wider">Capability</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-[#666687] uppercase tracking-wider">Standard Wallet</th>
                                        <th className="text-center py-4 px-6 text-xs font-bold text-[#4945ff] uppercase tracking-wider bg-[#4945ff]/5">Autonomy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparison.map((row, i) => (
                                        <tr key={row.feature} className="border-b border-[#2e2e48] last:border-0 hover:bg-[#1a1a2e] transition-colors">
                                            <td className="py-4 px-6 text-sm font-medium text-white">{row.feature}</td>
                                            <td className="py-4 px-6 text-center">
                                                {row.standard ? (
                                                    <Check className="w-5 h-5 text-[#a5a5ba] mx-auto" />
                                                ) : (
                                                    <X className="w-5 h-5 text-[#3a3a52] mx-auto" />
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-center bg-[#4945ff]/5 border-l border-[#4945ff]/10">
                                                {row.autonomy ? (
                                                    <div className="w-6 h-6 rounded-full bg-[#4945ff] flex items-center justify-center mx-auto">
                                                        <Check className="w-3 h-3 text-white" />
                                                    </div>
                                                ) : (
                                                    <X className="w-5 h-5 text-[#3a3a52] mx-auto" />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </div>
        </section>
    );
}

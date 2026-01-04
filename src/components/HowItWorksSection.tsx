'use client';

import { motion } from 'framer-motion';
import {
    Shield,
    Wallet,
    Cpu,
    Code2
} from 'lucide-react';

const steps = [
    {
        id: '01',
        title: 'Create Agent Identity',
        description: 'Assign your AI agent an ERC-8004 identity and a non-custodial ERC-4337 smart wallet. You own the keys—Autonomy never touches them.',
        icon: Wallet,
        code: `const agent = await Autonomy.createAgent({
  type: 'ERC-8004',
  network: 'polygon',
  owner: '0xYourAddress...'
});`
    },
    {
        id: '02',
        title: 'Define Spending Policies',
        description: 'Set granular constraints: daily spending caps, per-transaction limits, API whitelists, and human approval triggers.',
        icon: Shield,
        code: `await agent.setPolicy({
  dailyLimit: '50 USDC',
  whitelist: ['api.openai.com'],
  requireApproval: amount > 20,
  killSwitch: true
});`
    },
    {
        id: '03',
        title: 'Agent Transacts Autonomously',
        description: 'When your agent needs to pay (via HTTP 402), Autonomy validates the request against your policies before signing.',
        icon: Cpu,
        code: `// Agent hits a paywall (HTTP 402)
if (policy.validate(transaction)) {
  await wallet.pay(transaction);
  return apiResponse;
} else {
  throw new PolicyViolation('Limit exceeded');
}`
    }
];

export function HowItWorksSection() {
    return (
        <section id="how-it-works" className="section-padding bg-[#11111b] border-t border-[#2e2e48]">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="mb-24">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
                        How Autonomy Works
                    </h2>
                    <p className="text-xl text-[#a5a5ba] max-w-2xl font-medium">
                        A programmable governance layer that sits between your AI agent and its wallet.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="group p-8 rounded-none border border-[#2e2e48] bg-[#212134] hover:border-[#4945ff]/50 transition-colors"
                        >
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 rounded-none bg-[#1a1a2e] border border-[#2e2e48] flex items-center justify-center text-white font-mono-tech text-sm">
                                    {step.id}
                                </div>
                                <div className="h-[1px] flex-1 bg-[#2e2e48] group-hover:bg-[#4945ff]/30 transition-colors" />
                            </div>

                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-3">
                                <step.icon className="w-6 h-6 text-[#4945ff]" />
                                {step.title}
                            </h3>

                            <p className="text-[#a5a5ba] mb-8 leading-relaxed h-24 font-medium">
                                {step.description}
                            </p>

                            <div className="rounded-none border border-[#2e2e48] bg-[#0d0d12] overflow-hidden">
                                <div className="px-4 py-3 border-b border-[#2e2e48] bg-[#1a1a2e] flex items-center gap-2">
                                    <Code2 className="w-3 h-3 text-[#666687]" />
                                    <span className="text-xs text-[#666687] font-mono-tech">agent.ts</span>
                                </div>
                                <div className="p-4 overflow-x-auto">
                                    <pre className="text-xs font-mono-tech text-[#a5a5ba]">
                                        <code>{step.code}</code>
                                    </pre>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}

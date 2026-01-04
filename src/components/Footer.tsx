'use client';

import Link from 'next/link';
import { Shield, Github, Twitter, Disc } from 'lucide-react';

const links = [
    {
        title: 'Product',
        items: [
            { name: 'How It Works', href: '#how-it-works' },
            { name: 'Security', href: '#' },
            { name: 'Integrations', href: '#tech-stack' },
            { name: 'Pricing', href: '#' },
        ]
    },
    {
        title: 'Developers',
        items: [
            { name: 'Documentation', href: '#' },
            { name: 'API Reference', href: '#' },
            { name: 'SDK (TypeScript)', href: '#' },
            { name: 'SDK (Python)', href: '#' },
        ]
    },
    {
        title: 'Company',
        items: [
            { name: 'About', href: '#' },
            { name: 'Blog', href: '#' },
            { name: 'Careers', href: '#' },
            { name: 'Contact', href: '#' },
        ]
    },
    {
        title: 'Legal',
        items: [
            { name: 'Privacy Policy', href: '#' },
            { name: 'Terms of Service', href: '#' },
            { name: 'License', href: '#' },
        ]
    }
];

export function Footer() {
    return (
        <footer className="bg-[#0d0d12] border-t border-[#2e2e48] pt-24 pb-12">
            <div className="max-w-[1400px] mx-auto px-6">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-12 mb-24">
                    <div className="col-span-2 pr-8">
                        <Link href="/" className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded bg-[#4945ff] flex items-center justify-center">
                                <Shield className="w-5 h-5 text-white fill-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-white">
                                Autonomy
                            </span>
                        </Link>
                        <p className="text-[#a5a5ba] text-sm leading-relaxed font-medium mb-8">
                            The financial operating system for autonomous AI agents. Set spending limits, whitelist services, and maintain full control of your keys.
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-none bg-[#1a1a2e] border border-[#2e2e48] flex items-center justify-center text-[#a5a5ba] hover:text-white hover:border-[#4945ff] transition-all">
                                <Github className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-none bg-[#1a1a2e] border border-[#2e2e48] flex items-center justify-center text-[#a5a5ba] hover:text-white hover:border-[#4945ff] transition-all">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-none bg-[#1a1a2e] border border-[#2e2e48] flex items-center justify-center text-[#a5a5ba] hover:text-white hover:border-[#4945ff] transition-all">
                                <Disc className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {links.map((group) => (
                        <div key={group.title}>
                            <h4 className="font-bold text-white mb-6">{group.title}</h4>
                            <ul className="space-y-4">
                                {group.items.map((link) => (
                                    <li key={link.name}>
                                        <Link href={link.href} className="text-sm text-[#a5a5ba] hover:text-[#4945ff] transition-colors font-medium">
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-[#2e2e48] flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[#666687] font-medium">
                        © 2024 Autonomy Labs. All rights reserved.
                    </p>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a1a2e] border border-[#2e2e48]">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs text-[#a5a5ba] font-medium">All Systems Operational</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

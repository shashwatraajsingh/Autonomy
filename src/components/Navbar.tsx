'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, Menu, X, Github } from 'lucide-react';

const navLinks = [
    { name: 'How It Works', href: '#how-it-works' },
    { name: 'Features', href: '#features' },
    { name: 'Integrations', href: '#tech-stack' },
    { name: 'Docs', href: '#' },
    { name: 'Pricing', href: '#' },
];

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
                ? 'bg-[#11111b]/90 backdrop-blur-md border-b border-[#2e2e48]'
                : 'bg-transparent border-b border-transparent'
                }`}
        >
            <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-12">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded bg-[#4945ff] flex items-center justify-center">
                            <Shield className="w-5 h-5 text-white fill-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-white">
                            autonomy
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-[14px] font-medium text-[#a5a5ba] hover:text-[#4945ff] transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#a5a5ba] hover:text-white transition-colors"
                    >
                        <Github className="w-5 h-5" />
                    </a>
                    <Link
                        href="/dashboard"
                        className="text-sm font-medium text-[#a5a5ba] hover:text-white transition-colors px-4 py-2"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/demo"
                        className="text-sm font-bold text-white bg-[#4945ff] hover:bg-[#5d59ff] transition-colors px-5 py-2.5 rounded-none"
                    >
                        Launch App
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    className="lg:hidden text-white"
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-[#11111b] border-b border-[#2e2e48] p-6 lg:hidden">
                    <div className="flex flex-col gap-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="text-lg font-medium text-white"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <hr className="border-[#2e2e48]" />
                        <Link href="/demo" className="text-center font-bold text-white bg-[#4945ff] py-3 rounded-none">
                            Get Started
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}

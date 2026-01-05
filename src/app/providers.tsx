'use client';

import { ReactNode } from 'react';
import { Web3Provider } from '@/lib/Web3Provider';
import { AutonomyProvider } from '@/lib/AutonomyContext';

export function Providers({ children }: { children: ReactNode }) {
    return (
        <Web3Provider>
            <AutonomyProvider>
                {children}
            </AutonomyProvider>
        </Web3Provider>
    );
}

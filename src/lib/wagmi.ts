'use client';

import { createConfig, http } from 'wagmi';
import { mainnet, polygon, polygonAmoy, sepolia } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// WalletConnect Project ID - Get from https://cloud.walletconnect.com
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo';

export const config = createConfig({
    chains: [polygon, polygonAmoy, mainnet, sepolia],
    connectors: [
        injected(),
        walletConnect({ projectId }),
    ],
    transports: {
        [mainnet.id]: http(),
        [polygon.id]: http(),
        [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology'),
        [sepolia.id]: http(),
    },
});

// Supported chains for display
export const supportedChains = [
    { id: polygon.id, name: 'Polygon', icon: '🟣', testnet: false },
    { id: polygonAmoy.id, name: 'Polygon Amoy', icon: '🟣', testnet: true },
    { id: mainnet.id, name: 'Ethereum', icon: '🔷', testnet: false },
    { id: sepolia.id, name: 'Sepolia', icon: '🔷', testnet: true },
];

declare module 'wagmi' {
    interface Register {
        config: typeof config;
    }
}

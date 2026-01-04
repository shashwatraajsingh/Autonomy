import { ethers } from 'ethers';
import crypto from 'crypto';

export class WalletManager {
    private provider: ethers.JsonRpcProvider;

    constructor() {
        const rpcUrl = process.env.POLYGON_RPC_URL || 'https://polygon-mumbai.g.alchemy.com/v2/demo';
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    /**
     * Create a new wallet for an agent
     */
    async createAgentWallet(): Promise<{ address: string; encryptedPrivateKey: string }> {
        const wallet = ethers.Wallet.createRandom();
        const encryptedPrivateKey = this.encryptPrivateKey(wallet.privateKey);

        return {
            address: wallet.address,
            encryptedPrivateKey
        };
    }

    /**
     * Send payment from agent wallet
     */
    async sendPayment(
        fromAddress: string,
        toAddressOrService: string,
        amount: number
    ): Promise<string> {
        // In demo mode, return a mock transaction hash
        if (process.env.NODE_ENV !== 'production' || !process.env.POLYGON_RPC_URL) {
            const mockTxHash = `0x${crypto.randomBytes(32).toString('hex')}`;
            console.log(`[DEMO] Mock payment: ${amount} USDC from ${fromAddress} to ${toAddressOrService}`);
            return mockTxHash;
        }

        // In production, execute real transaction
        // This would involve:
        // 1. Decrypting the agent's private key
        // 2. Creating and signing the transaction
        // 3. Broadcasting to the network

        throw new Error('Production payments not implemented - use testnet mode');
    }

    /**
     * Get wallet balance
     */
    async getBalance(address: string): Promise<{ native: string; usdc: string }> {
        try {
            const nativeBalance = await this.provider.getBalance(address);

            // For demo, return mock USDC balance
            const mockUsdcBalance = Math.random() * 1000;

            return {
                native: ethers.formatEther(nativeBalance),
                usdc: mockUsdcBalance.toFixed(2)
            };
        } catch (error) {
            // Return mock data if RPC fails
            return {
                native: '0.1',
                usdc: '100.00'
            };
        }
    }

    /**
     * Encrypt private key for secure storage
     */
    private encryptPrivateKey(privateKey: string): string {
        const key = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!';
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), iv);

        let encrypted = cipher.update(privateKey, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        return iv.toString('hex') + ':' + encrypted;
    }

    /**
     * Decrypt private key for signing
     */
    private decryptPrivateKey(encryptedKey: string): string {
        const key = process.env.ENCRYPTION_KEY || 'default-32-char-encryption-key!';
        const [ivHex, encrypted] = encryptedKey.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key.slice(0, 32)), iv);

        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Sign a message with agent wallet
     */
    async signMessage(encryptedPrivateKey: string, message: string): Promise<string> {
        const privateKey = this.decryptPrivateKey(encryptedPrivateKey);
        const wallet = new ethers.Wallet(privateKey);
        return wallet.signMessage(message);
    }
}

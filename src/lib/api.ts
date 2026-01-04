const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Types
export interface Policy {
    id?: string;
    dailyLimit: number;
    perTxLimit: number;
    whitelist: string[];
    killSwitch: boolean;
}

export interface Agent {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'frozen';
    walletAddress: string;
    policy: Policy;
    spentToday: number;
    createdAt: string;
    _count?: { transactions: number };
}

export interface Transaction {
    id: string;
    agentId: string;
    service: string;
    amount: number;
    status: 'approved' | 'blocked' | 'pending';
    reason: string;
    txHash?: string;
    createdAt: string;
    agent?: { name: string; walletAddress: string };
}

export interface ValidationResult {
    approved: boolean;
    reason: string;
    policyChecks: {
        whitelistCheck: boolean;
        perTxLimitCheck: boolean;
        dailyLimitCheck: boolean;
        agentStatusCheck: boolean;
    };
}

// API Client
class AutonomyAPI {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE;
    }

    private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers
            }
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(error.error || error.message || 'API request failed');
        }

        return response.json();
    }

    // Agents
    async getAgents(userId?: string): Promise<{ agents: Agent[] }> {
        const params = userId ? `?userId=${userId}` : '';
        return this.request(`/agents${params}`);
    }

    async getAgent(id: string): Promise<{ agent: Agent }> {
        return this.request(`/agents/${id}`);
    }

    async createAgent(data: { name: string; userId: string; policy: Policy }): Promise<{ agent: Agent }> {
        return this.request('/agents', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updateAgent(id: string, data: Partial<{ name: string; status: string }>): Promise<{ agent: Agent }> {
        return this.request(`/agents/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async deleteAgent(id: string): Promise<{ success: boolean }> {
        return this.request(`/agents/${id}`, {
            method: 'DELETE'
        });
    }

    async executeAgentTask(
        agentId: string,
        task: { type: string; service: string; amount?: number; data?: any }
    ): Promise<{ success: boolean; result?: any; error?: string }> {
        return this.request(`/agents/${agentId}/execute`, {
            method: 'POST',
            body: JSON.stringify(task)
        });
    }

    async activateKillSwitch(agentId: string): Promise<{ agent: Agent; message: string }> {
        return this.request(`/agents/${agentId}/kill-switch`, {
            method: 'POST'
        });
    }

    // Transactions
    async getTransactions(filters?: {
        agentId?: string;
        userId?: string;
        status?: string;
        limit?: number;
    }): Promise<{ transactions: Transaction[] }> {
        const params = new URLSearchParams();
        if (filters?.agentId) params.set('agentId', filters.agentId);
        if (filters?.userId) params.set('userId', filters.userId);
        if (filters?.status) params.set('status', filters.status);
        if (filters?.limit) params.set('limit', String(filters.limit));

        const query = params.toString();
        return this.request(`/transactions${query ? '?' + query : ''}`);
    }

    async getTransactionStats(userId?: string): Promise<{
        stats: {
            totalApproved: number;
            totalBlocked: number;
            spentToday: number;
            totalSpent: number;
        };
    }> {
        const params = userId ? `?userId=${userId}` : '';
        return this.request(`/transactions/stats${params}`);
    }

    async simulateTransaction(data: {
        agentId: string;
        service: string;
        amount: number;
        type: string;
    }): Promise<{ validation: ValidationResult }> {
        return this.request('/transactions/simulate', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    // Policies
    async getPolicy(agentId: string): Promise<{ policy: Policy }> {
        return this.request(`/policies/${agentId}`);
    }

    async updatePolicy(agentId: string, data: Partial<Policy>): Promise<{ policy: Policy }> {
        return this.request(`/policies/${agentId}`, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    }

    async addToWhitelist(agentId: string, service: string): Promise<{ policy: Policy }> {
        return this.request(`/policies/${agentId}/whitelist`, {
            method: 'POST',
            body: JSON.stringify({ service })
        });
    }

    async removeFromWhitelist(agentId: string, service: string): Promise<{ policy: Policy }> {
        return this.request(`/policies/${agentId}/whitelist/${encodeURIComponent(service)}`, {
            method: 'DELETE'
        });
    }

    // Wallet
    async createWallet(): Promise<{ address: string; message: string }> {
        return this.request('/wallet/create', { method: 'POST' });
    }

    async getWalletBalance(address: string): Promise<{ balance: { native: string; usdc: string } }> {
        return this.request(`/wallet/balance/${address}`);
    }

    // Health check
    async healthCheck(): Promise<{ status: string; timestamp: string }> {
        return fetch(`${this.baseUrl.replace('/api', '')}/health`).then(r => r.json());
    }
}

export const api = new AutonomyAPI();

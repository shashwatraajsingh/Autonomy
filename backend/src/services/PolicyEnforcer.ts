import { PrismaClient } from '@prisma/client';

export interface TransactionRequest {
    agentId: string;
    service: string;
    amount: number;
    type: string;
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

// Cache for daily spending to avoid repeated DB queries
interface SpendingCache {
    amount: number;
    timestamp: number;
}

const spendingCache = new Map<string, SpendingCache>();
const SPENDING_CACHE_TTL = 5000; // 5 seconds

export class PolicyEnforcer {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    async validateTransaction(request: TransactionRequest): Promise<ValidationResult> {
        // Single optimized query with select for only needed fields
        const agent = await this.prisma.agent.findUnique({
            where: { id: request.agentId },
            select: {
                id: true,
                status: true,
                policy: {
                    select: {
                        dailyLimit: true,
                        perTxLimit: true,
                        whitelist: true
                    }
                }
            }
        });

        if (!agent) {
            return this.createFailedResult('Agent not found');
        }

        if (!agent.policy) {
            return this.createFailedResult('No policy configured for agent');
        }

        const { policy } = agent;

        // Fast checks first (no DB calls)
        // 1. Agent status check
        if (agent.status !== 'active') {
            return {
                approved: false,
                reason: `Agent is ${agent.status}`,
                policyChecks: {
                    agentStatusCheck: false,
                    whitelistCheck: false,
                    perTxLimitCheck: false,
                    dailyLimitCheck: false
                }
            };
        }

        // 2. Whitelist check (fast string matching)
        const whitelistCheck = this.checkWhitelist(request.service, policy.whitelist);
        if (!whitelistCheck) {
            return {
                approved: false,
                reason: `Service "${request.service}" is not whitelisted`,
                policyChecks: {
                    agentStatusCheck: true,
                    whitelistCheck: false,
                    perTxLimitCheck: false,
                    dailyLimitCheck: false
                }
            };
        }

        // 3. Per-transaction limit check (simple comparison)
        const perTxLimitCheck = request.amount <= policy.perTxLimit;
        if (!perTxLimitCheck) {
            return {
                approved: false,
                reason: `Amount $${request.amount} exceeds per-transaction limit of $${policy.perTxLimit}`,
                policyChecks: {
                    agentStatusCheck: true,
                    whitelistCheck: true,
                    perTxLimitCheck: false,
                    dailyLimitCheck: false
                }
            };
        }

        // 4. Daily limit check (with caching)
        const dailyLimitCheck = await this.checkDailyLimitCached(request.agentId, request.amount, policy.dailyLimit);
        if (!dailyLimitCheck) {
            return {
                approved: false,
                reason: `Transaction would exceed daily limit of $${policy.dailyLimit}`,
                policyChecks: {
                    agentStatusCheck: true,
                    whitelistCheck: true,
                    perTxLimitCheck: true,
                    dailyLimitCheck: false
                }
            };
        }

        return {
            approved: true,
            reason: 'All policy checks passed',
            policyChecks: {
                agentStatusCheck: true,
                whitelistCheck: true,
                perTxLimitCheck: true,
                dailyLimitCheck: true
            }
        };
    }

    private createFailedResult(reason: string): ValidationResult {
        return {
            approved: false,
            reason,
            policyChecks: {
                whitelistCheck: false,
                perTxLimitCheck: false,
                dailyLimitCheck: false,
                agentStatusCheck: false
            }
        };
    }

    private checkWhitelist(service: string, whitelist: string[]): boolean {
        if (whitelist.length === 0) return true;

        // Optimized: use for loop instead of some() for better performance
        const serviceLower = service.toLowerCase();
        for (const allowed of whitelist) {
            const allowedLower = allowed.toLowerCase();
            if (serviceLower === allowedLower ||
                serviceLower.includes(allowedLower) ||
                allowedLower.includes(serviceLower)) {
                return true;
            }
        }
        return false;
    }

    private async checkDailyLimitCached(agentId: string, amount: number, dailyLimit: number): Promise<boolean> {
        const cacheKey = agentId;
        const cached = spendingCache.get(cacheKey);

        // Use cache if valid
        if (cached && Date.now() - cached.timestamp < SPENDING_CACHE_TTL) {
            return (cached.amount + amount) <= dailyLimit;
        }

        // Query DB
        const spentToday = await this.getDailySpending(agentId);

        // Update cache
        spendingCache.set(cacheKey, { amount: spentToday, timestamp: Date.now() });

        return (spentToday + amount) <= dailyLimit;
    }

    async getDailySpending(agentId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await this.prisma.transaction.aggregate({
            where: {
                agentId,
                status: 'approved',
                createdAt: { gte: today }
            },
            _sum: { amount: true }
        });

        return result._sum.amount || 0;
    }

    // Invalidate cache when a transaction is approved
    invalidateSpendingCache(agentId: string): void {
        spendingCache.delete(agentId);
    }

    // Clear all cache
    clearCache(): void {
        spendingCache.clear();
    }
}

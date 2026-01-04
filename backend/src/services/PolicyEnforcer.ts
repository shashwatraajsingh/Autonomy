import { PrismaClient, Policy } from '@prisma/client';

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

export class PolicyEnforcer {
    constructor(private prisma: PrismaClient) { }

    async validateTransaction(request: TransactionRequest): Promise<ValidationResult> {
        const agent = await this.prisma.agent.findUnique({
            where: { id: request.agentId },
            include: { policy: true }
        });

        if (!agent) {
            return {
                approved: false,
                reason: 'Agent not found',
                policyChecks: {
                    whitelistCheck: false,
                    perTxLimitCheck: false,
                    dailyLimitCheck: false,
                    agentStatusCheck: false
                }
            };
        }

        if (!agent.policy) {
            return {
                approved: false,
                reason: 'No policy configured for agent',
                policyChecks: {
                    whitelistCheck: false,
                    perTxLimitCheck: false,
                    dailyLimitCheck: false,
                    agentStatusCheck: false
                }
            };
        }

        const policy = agent.policy;
        const policyChecks = {
            agentStatusCheck: agent.status === 'active',
            whitelistCheck: this.checkWhitelist(request.service, policy.whitelist),
            perTxLimitCheck: request.amount <= policy.perTxLimit,
            dailyLimitCheck: await this.checkDailyLimit(request.agentId, request.amount, policy.dailyLimit)
        };

        // Check agent status
        if (!policyChecks.agentStatusCheck) {
            return {
                approved: false,
                reason: `Agent is ${agent.status}`,
                policyChecks
            };
        }

        // Check whitelist
        if (!policyChecks.whitelistCheck) {
            return {
                approved: false,
                reason: `Service "${request.service}" is not whitelisted`,
                policyChecks
            };
        }

        // Check per-transaction limit
        if (!policyChecks.perTxLimitCheck) {
            return {
                approved: false,
                reason: `Amount $${request.amount} exceeds per-transaction limit of $${policy.perTxLimit}`,
                policyChecks
            };
        }

        // Check daily limit
        if (!policyChecks.dailyLimitCheck) {
            return {
                approved: false,
                reason: `Transaction would exceed daily limit of $${policy.dailyLimit}`,
                policyChecks
            };
        }

        return {
            approved: true,
            reason: 'All policy checks passed',
            policyChecks
        };
    }

    private checkWhitelist(service: string, whitelist: string[]): boolean {
        if (whitelist.length === 0) return true; // No whitelist = allow all

        return whitelist.some(allowed => {
            // Support both exact match and domain matching
            return service === allowed ||
                service.includes(allowed) ||
                allowed.includes(service);
        });
    }

    private async checkDailyLimit(agentId: string, amount: number, dailyLimit: number): Promise<boolean> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await this.prisma.transaction.aggregate({
            where: {
                agentId,
                status: 'approved',
                createdAt: {
                    gte: today
                }
            },
            _sum: {
                amount: true
            }
        });

        const spentToday = result._sum.amount || 0;
        return (spentToday + amount) <= dailyLimit;
    }

    async getDailySpending(agentId: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await this.prisma.transaction.aggregate({
            where: {
                agentId,
                status: 'approved',
                createdAt: {
                    gte: today
                }
            },
            _sum: {
                amount: true
            }
        });

        return result._sum.amount || 0;
    }
}

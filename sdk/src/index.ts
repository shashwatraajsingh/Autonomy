/**
 * Autonomy SDK for AI Agents
 * 
 * This SDK allows AI agents to:
 * 1. Register with Autonomy
 * 2. Request payment authorization before spending
 * 3. Handle policy rejections gracefully
 */

export interface AutonomyConfig {
    apiUrl: string;
    agentId: string;
    agentSecret?: string;
}

export interface PaymentRequest {
    service: string;
    amount: number;
    description?: string;
}

export interface PaymentResult {
    approved: boolean;
    reason: string;
    transactionId?: string;
    txHash?: string;
}

export interface PolicyInfo {
    dailyLimit: number;
    perTxLimit: number;
    spentToday: number;
    remainingDaily: number;
    whitelist: string[];
}

export class AutonomySDK {
    private config: AutonomyConfig;

    constructor(config: AutonomyConfig) {
        this.config = config;
    }

    /**
     * Check if a payment would be approved WITHOUT executing it
     */
    async checkPayment(request: PaymentRequest): Promise<PaymentResult> {
        const response = await fetch(`${this.config.apiUrl}/transactions/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                agentId: this.config.agentId,
                service: request.service,
                amount: request.amount,
                type: 'payment'
            })
        });

        const data = await response.json() as { validation: { approved: boolean; reason: string } };
        return {
            approved: data.validation.approved,
            reason: data.validation.reason
        };
    }

    /**
     * Request and execute a payment through Autonomy
     */
    async requestPayment(request: PaymentRequest): Promise<PaymentResult> {
        const response = await fetch(`${this.config.apiUrl}/agents/${this.config.agentId}/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'payment',
                service: request.service,
                amount: request.amount,
                data: { description: request.description }
            })
        });

        const data = await response.json() as {
            success: boolean;
            error?: string;
            result?: { transactionId?: string; txHash?: string }
        };

        if (data.success) {
            return {
                approved: true,
                reason: 'Payment executed successfully',
                transactionId: data.result?.transactionId,
                txHash: data.result?.txHash
            };
        } else {
            return {
                approved: false,
                reason: data.error || 'Payment rejected'
            };
        }
    }

    /**
     * Get current policy and spending status
     */
    async getPolicy(): Promise<PolicyInfo> {
        const response = await fetch(`${this.config.apiUrl}/agents/${this.config.agentId}`);
        const data = await response.json() as {
            agent: {
                spentToday: number;
                policy: {
                    dailyLimit: number;
                    perTxLimit: number;
                    whitelist: string[];
                };
            };
        };

        const agent = data.agent;
        return {
            dailyLimit: agent.policy.dailyLimit,
            perTxLimit: agent.policy.perTxLimit,
            spentToday: agent.spentToday,
            remainingDaily: agent.policy.dailyLimit - agent.spentToday,
            whitelist: agent.policy.whitelist
        };
    }

    /**
     * Check if a service is whitelisted
     */
    async isServiceAllowed(service: string): Promise<boolean> {
        const policy = await this.getPolicy();
        return policy.whitelist.some(w => service.includes(w));
    }
}

/**
 * Middleware for handling HTTP 402 (Payment Required) responses
 */
export class X402Middleware {
    private autonomy: AutonomySDK;

    constructor(autonomy: AutonomySDK) {
        this.autonomy = autonomy;
    }

    /**
     * Wrap a fetch call with x402 payment handling
     */
    async fetch(url: string, options?: RequestInit): Promise<Response> {
        let response = await fetch(url, options);

        if (response.status === 402) {
            const paymentInfo = await this.parsePaymentRequired(response);

            const payment = await this.autonomy.requestPayment({
                service: new URL(url).hostname,
                amount: paymentInfo.amount,
                description: `Payment for ${url}`
            });

            if (payment.approved) {
                const retryOptions = {
                    ...options,
                    headers: {
                        ...options?.headers,
                        'X-Payment-Proof': payment.txHash!,
                        'X-Payment-Transaction': payment.transactionId!
                    }
                };

                response = await fetch(url, retryOptions);
            } else {
                throw new Error(`Payment rejected: ${payment.reason}`);
            }
        }

        return response;
    }

    private async parsePaymentRequired(response: Response): Promise<{ amount: number; recipient: string }> {
        const paymentHeader = response.headers.get('X-Payment-Required');

        if (paymentHeader) {
            const [amount, recipient] = paymentHeader.split(';');
            return { amount: parseFloat(amount), recipient };
        }

        const body = await response.json() as { payment?: { amount?: number; recipient?: string } };
        return {
            amount: body.payment?.amount || 0.01,
            recipient: body.payment?.recipient || 'unknown'
        };
    }
}

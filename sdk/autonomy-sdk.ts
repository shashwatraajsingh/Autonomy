/**
 * Autonomy SDK for AI Agents
 * 
 * This SDK allows AI agents to:
 * 1. Register with Autonomy
 * 2. Request payment authorization before spending
 * 3. Handle policy rejections gracefully
 */

interface AutonomyConfig {
    apiUrl: string;
    agentId: string;
    agentSecret?: string;
}

interface PaymentRequest {
    service: string;      // e.g., "api.openai.com"
    amount: number;       // Amount in USDC
    description?: string; // What the payment is for
}

interface PaymentResult {
    approved: boolean;
    reason: string;
    transactionId?: string;
    txHash?: string;
}

interface PolicyInfo {
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

        const data = await response.json();
        return {
            approved: data.validation.approved,
            reason: data.validation.reason
        };
    }

    /**
     * Request and execute a payment through Autonomy
     * This validates against policies AND executes the transaction
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

        const data = await response.json();

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
        const data = await response.json();

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

// ============================================
// EXAMPLE: How an AI Agent would use Autonomy
// ============================================

async function exampleAIAgent() {
    // 1. Initialize the SDK with your agent credentials
    const autonomy = new AutonomySDK({
        apiUrl: 'http://localhost:4000/api',
        agentId: 'agent-001'  // Your agent ID from the dashboard
    });

    // 2. Before making any API call that costs money, check with Autonomy
    const openAICost = 0.05; // $0.05 for this API call

    // Option A: Just check if it WOULD be approved
    const check = await autonomy.checkPayment({
        service: 'api.openai.com',
        amount: openAICost
    });

    console.log(`Would payment be approved? ${check.approved}`);
    console.log(`Reason: ${check.reason}`);

    if (!check.approved) {
        console.log('Cannot proceed - policy would block this payment');
        return;
    }

    // Option B: Request actual payment (validates AND executes)
    const payment = await autonomy.requestPayment({
        service: 'api.openai.com',
        amount: openAICost,
        description: 'GPT-4 API call for research task'
    });

    if (payment.approved) {
        console.log('✅ Payment approved! Transaction:', payment.txHash);

        // NOW make the actual API call
        // const response = await openai.chat.completions.create({...});

    } else {
        console.log('❌ Payment blocked:', payment.reason);
        // Handle rejection - maybe queue for human approval
    }
}

// ============================================
// x402 HTTP Payment Protocol Integration
// ============================================

/**
 * Middleware for handling HTTP 402 (Payment Required) responses
 * 
 * When an API returns 402, this intercepts and handles payment through Autonomy
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
        // Make the initial request
        let response = await fetch(url, options);

        // If we get a 402, handle payment
        if (response.status === 402) {
            const paymentInfo = await this.parsePaymentRequired(response);

            console.log(`💰 Service requires payment: $${paymentInfo.amount}`);

            // Request payment through Autonomy
            const payment = await this.autonomy.requestPayment({
                service: new URL(url).hostname,
                amount: paymentInfo.amount,
                description: `Payment for ${url}`
            });

            if (payment.approved) {
                // Retry the request with payment proof
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
        // Parse the 402 response to get payment details
        // This follows the x402 protocol specification
        const paymentHeader = response.headers.get('X-Payment-Required');

        if (paymentHeader) {
            const [amount, recipient] = paymentHeader.split(';');
            return { amount: parseFloat(amount), recipient };
        }

        // Fallback: try to parse from response body
        const body = await response.json();
        return {
            amount: body.payment?.amount || 0.01,
            recipient: body.payment?.recipient || 'unknown'
        };
    }
}

// ============================================
// Example: AI Agent with x402 support
// ============================================

async function aiAgentWithX402() {
    const autonomy = new AutonomySDK({
        apiUrl: 'http://localhost:4000/api',
        agentId: 'agent-001'
    });

    const x402 = new X402Middleware(autonomy);

    // Now your agent can make API calls that might require payment
    // The x402 middleware handles it automatically through Autonomy

    try {
        // This might return 402 if it's a paid API
        const response = await x402.fetch('https://api.some-paid-service.com/data', {
            method: 'GET'
        });

        const data = await response.json();
        console.log('Got data:', data);

    } catch (error) {
        console.error('Request failed:', error);
    }
}

export { exampleAIAgent, aiAgentWithX402 };

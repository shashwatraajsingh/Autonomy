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
    service: string;
    amount: number;
    description?: string;
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
declare class AutonomySDK {
    private config;
    constructor(config: AutonomyConfig);
    /**
     * Check if a payment would be approved WITHOUT executing it
     */
    checkPayment(request: PaymentRequest): Promise<PaymentResult>;
    /**
     * Request and execute a payment through Autonomy
     */
    requestPayment(request: PaymentRequest): Promise<PaymentResult>;
    /**
     * Get current policy and spending status
     */
    getPolicy(): Promise<PolicyInfo>;
    /**
     * Check if a service is whitelisted
     */
    isServiceAllowed(service: string): Promise<boolean>;
}
/**
 * Middleware for handling HTTP 402 (Payment Required) responses
 */
declare class X402Middleware {
    private autonomy;
    constructor(autonomy: AutonomySDK);
    /**
     * Wrap a fetch call with x402 payment handling
     */
    fetch(url: string, options?: RequestInit): Promise<Response>;
    private parsePaymentRequired;
}

export { type AutonomyConfig, AutonomySDK, type PaymentRequest, type PaymentResult, type PolicyInfo, X402Middleware };

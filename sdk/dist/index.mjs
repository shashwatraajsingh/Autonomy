// src/index.ts
var AutonomySDK = class {
  constructor(config) {
    this.config = config;
  }
  /**
   * Check if a payment would be approved WITHOUT executing it
   */
  async checkPayment(request) {
    const response = await fetch(`${this.config.apiUrl}/transactions/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentId: this.config.agentId,
        service: request.service,
        amount: request.amount,
        type: "payment"
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
   */
  async requestPayment(request) {
    const response = await fetch(`${this.config.apiUrl}/agents/${this.config.agentId}/execute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "payment",
        service: request.service,
        amount: request.amount,
        data: { description: request.description }
      })
    });
    const data = await response.json();
    if (data.success) {
      return {
        approved: true,
        reason: "Payment executed successfully",
        transactionId: data.result?.transactionId,
        txHash: data.result?.txHash
      };
    } else {
      return {
        approved: false,
        reason: data.error || "Payment rejected"
      };
    }
  }
  /**
   * Get current policy and spending status
   */
  async getPolicy() {
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
  async isServiceAllowed(service) {
    const policy = await this.getPolicy();
    return policy.whitelist.some((w) => service.includes(w));
  }
};
var X402Middleware = class {
  constructor(autonomy) {
    this.autonomy = autonomy;
  }
  /**
   * Wrap a fetch call with x402 payment handling
   */
  async fetch(url, options) {
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
            "X-Payment-Proof": payment.txHash,
            "X-Payment-Transaction": payment.transactionId
          }
        };
        response = await fetch(url, retryOptions);
      } else {
        throw new Error(`Payment rejected: ${payment.reason}`);
      }
    }
    return response;
  }
  async parsePaymentRequired(response) {
    const paymentHeader = response.headers.get("X-Payment-Required");
    if (paymentHeader) {
      const [amount, recipient] = paymentHeader.split(";");
      return { amount: parseFloat(amount), recipient };
    }
    const body = await response.json();
    return {
      amount: body.payment?.amount || 0.01,
      recipient: body.payment?.recipient || "unknown"
    };
  }
};
export {
  AutonomySDK,
  X402Middleware
};

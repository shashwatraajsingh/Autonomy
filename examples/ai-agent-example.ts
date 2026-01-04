/**
 * Example: Complete AI Agent Integration with Autonomy
 * 
 * This demonstrates how a real AI agent would use Autonomy
 * for governed financial operations.
 */

import OpenAI from 'openai';

// ===========================================
// STEP 1: Setup
// ===========================================

// In production, these come from environment or configuration
const AUTONOMY_API = 'http://localhost:4000/api';
const AGENT_ID = 'agent-001'; // Get this from the Autonomy dashboard

// Simple SDK implementation
class AutonomyClient {
    constructor(private apiUrl: string, private agentId: string) { }

    async requestPayment(service: string, amount: number): Promise<{
        approved: boolean;
        reason: string;
        txHash?: string;
    }> {
        try {
            const response = await fetch(`${this.apiUrl}/agents/${this.agentId}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'payment',
                    service,
                    amount,
                    data: { timestamp: Date.now() }
                })
            });

            const data = await response.json();
            return {
                approved: data.success,
                reason: data.error || 'Approved',
                txHash: data.result?.txHash
            };
        } catch (error) {
            return {
                approved: false,
                reason: `Network error: ${error}`
            };
        }
    }

    async getSpendingStatus(): Promise<{
        spentToday: number;
        dailyLimit: number;
        remaining: number;
    }> {
        const response = await fetch(`${this.apiUrl}/agents/${this.agentId}`);
        const data = await response.json();

        return {
            spentToday: data.agent.spentToday,
            dailyLimit: data.agent.policy.dailyLimit,
            remaining: data.agent.policy.dailyLimit - data.agent.spentToday
        };
    }
}

// ===========================================
// STEP 2: AI Agent Class
// ===========================================

class ResearchAgent {
    private autonomy: AutonomyClient;
    private openai: OpenAI;

    constructor() {
        this.autonomy = new AutonomyClient(AUTONOMY_API, AGENT_ID);
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }

    /**
     * Research a topic using GPT-4
     * Each API call costs money, so we validate through Autonomy first
     */
    async research(topic: string): Promise<string> {
        console.log(`🔍 Researching: ${topic}`);

        // Estimate cost (roughly $0.03 per 1K tokens for GPT-4)
        const estimatedCost = 0.05;

        // CRITICAL: Request payment approval from Autonomy BEFORE calling OpenAI
        console.log(`💰 Requesting payment approval for $${estimatedCost}...`);

        const payment = await this.autonomy.requestPayment(
            'api.openai.com',
            estimatedCost
        );

        if (!payment.approved) {
            console.log(`❌ Payment blocked: ${payment.reason}`);
            throw new Error(`Cannot complete research: ${payment.reason}`);
        }

        console.log(`✅ Payment approved! TxHash: ${payment.txHash}`);

        // Now safe to make the actual API call
        const completion = await this.openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                { role: 'system', content: 'You are a research assistant.' },
                { role: 'user', content: `Research and summarize: ${topic}` }
            ],
            max_tokens: 500
        });

        return completion.choices[0].message.content || 'No response';
    }

    /**
     * Check if we have budget remaining before starting a task
     */
    async canAfford(estimatedCost: number): Promise<boolean> {
        const status = await this.autonomy.getSpendingStatus();

        console.log(`📊 Budget Status:`);
        console.log(`   Spent today: $${status.spentToday}`);
        console.log(`   Daily limit: $${status.dailyLimit}`);
        console.log(`   Remaining:   $${status.remaining}`);

        return status.remaining >= estimatedCost;
    }
}

// ===========================================
// STEP 3: Execution Flow
// ===========================================

async function main() {
    console.log('='.repeat(50));
    console.log('🤖 AI Agent Starting with Autonomy Governance');
    console.log('='.repeat(50));

    const agent = new ResearchAgent();

    // Check budget before starting
    const estimatedCost = 0.05;
    const canProceed = await agent.canAfford(estimatedCost);

    if (!canProceed) {
        console.log('⚠️ Insufficient budget. Waiting for human approval...');
        return;
    }

    // Execute the research task
    try {
        const result = await agent.research('Latest developments in AI agents');
        console.log('\n📄 Research Result:');
        console.log(result);
    } catch (error) {
        console.error('Task failed:', error);
    }
}

// ===========================================
// THE FLOW EXPLAINED
// ===========================================

/*
┌─────────────────────────────────────────────────────────────┐
│                    EXECUTION FLOW                            │
└─────────────────────────────────────────────────────────────┘

1. AI Agent wants to make an API call that costs money
   └─→ e.g., Call OpenAI API ($0.05)

2. BEFORE making the call, agent requests payment from Autonomy
   └─→ POST /api/agents/{id}/execute
   └─→ { type: 'payment', service: 'api.openai.com', amount: 0.05 }

3. Autonomy's Policy Enforcer validates the request:
   ├─→ Is agent active? (not paused/frozen)
   ├─→ Is 'api.openai.com' in whitelist?
   ├─→ Is $0.05 within per-transaction limit?
   └─→ Would this exceed daily spending limit?

4. If ALL checks pass:
   ├─→ ✅ Return { approved: true }
   ├─→ Record transaction in audit log
   ├─→ Update daily spending counter
   └─→ (In prod) Execute on-chain payment

5. If ANY check fails:
   ├─→ ❌ Return { approved: false, reason: 'Exceeds daily limit' }
   ├─→ Record blocked transaction in audit log
   └─→ Agent must handle rejection (queue, escalate, skip)

6. If approved, agent proceeds with the actual API call
   └─→ const result = await openai.chat.completions.create(...)

7. Owner can monitor everything in real-time:
   └─→ Dashboard shows all transactions, spending, policy violations

┌─────────────────────────────────────────────────────────────┐
│                    POLICY EXAMPLES                           │
└─────────────────────────────────────────────────────────────┘

Example 1: Daily Limit
├─ Policy: dailyLimit = $50
├─ Spent today: $48
├─ Request: $5 payment
└─ Result: ❌ BLOCKED (would exceed $50)

Example 2: Service Whitelist
├─ Policy: whitelist = ['api.openai.com', 'api.anthropic.com']
├─ Request: Payment to 'api.malicious.xyz'
└─ Result: ❌ BLOCKED (not in whitelist)

Example 3: Per-Transaction Limit
├─ Policy: perTxLimit = $10
├─ Request: $25 payment
└─ Result: ❌ BLOCKED (exceeds per-tx limit)

Example 4: All Checks Pass
├─ Policy: dailyLimit=$50, perTxLimit=$10, whitelist=['api.openai.com']
├─ Spent today: $20
├─ Request: $5 to api.openai.com
└─ Result: ✅ APPROVED

┌─────────────────────────────────────────────────────────────┐
│                 HUMAN-IN-THE-LOOP                            │
└─────────────────────────────────────────────────────────────┘

When a transaction is blocked, the owner can:

1. View in Dashboard → See all blocked transactions
2. Adjust Policy → Increase limits or add to whitelist
3. Manual Approval → (Future) Approve one-time exception
4. Kill Switch → Immediately freeze all agent activity

This creates a GOVERNANCE LAYER between AI agents and money.
*/

main().catch(console.error);

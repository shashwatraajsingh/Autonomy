# Autonomy

**The Financial Operating System for Autonomous AI Agents**

A comprehensive governance and oversight platform for AI agents. It provides tools for users and organizations to deploy agents with programmable spending limits, permissions, and audit trails. By integrating the x402 payment protocol with agent identity standards like ERC-8004, it creates a "financial operating system" for the agentic economy.

---

## The Problem

AI agents are becoming increasingly autonomous—but their financial capabilities remain dangerously uncontrolled:

-  **No spending limits** — Agents can drain wallets without restriction
-  **No service restrictions** — Agents can call any API, including malicious ones
-  **No audit trails** — No visibility into what agents spend money on
-  **No kill switch** — No way to stop a misbehaving agent instantly

## The Solution

Autonomy provides a **governance layer** between AI agents and their wallets:

| Feature | Description |
|---------|-------------|
| **Programmable Policies** | Set daily limits, per-transaction caps, and service whitelists |
| **Real-time Enforcement** | Every transaction validated against policies before execution |
| **Kill Switch** | Instantly freeze agent activity if something goes wrong |
| **Complete Audit Trail** | Every transaction logged with reasons for approval/rejection |
| **Non-Custodial** | You own your keys—Autonomy never touches your funds |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      AI AGENT                                │
│            (Your agent wants to spend money)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    AUTONOMY SDK                              │
│         autonomy.requestPayment('api.openai.com', $5)        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  POLICY ENFORCER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Whitelist   │  │ Daily Limit │  │ Per-Tx Limit│          │
│  │ ✓ or ✗      │  │ ✓ or ✗      │  │ ✓ or ✗      │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
      ┌─────────────┐                 ┌─────────────┐
      │  APPROVED   │                 │   BLOCKED   │
      │ Execute tx  │                 │ Log reason  │
      └─────────────┘                 └─────────────┘
```

---

## How It Works

### 1. Create Agent Identity
Assign your AI agent an ERC-8004 identity and a non-custodial ERC-4337 smart wallet.

```typescript
const agent = await autonomy.createAgent({
  name: 'Research_Agent',
  wallet: { type: 'ERC-4337' }
});
```

### 2. Define Spending Policies
Set guardrails: daily limits, per-transaction caps, and whitelisted services.

```typescript
await autonomy.setPolicy(agent.id, {
  dailyLimit: 50,          // Max $50/day
  perTxLimit: 10,          // Max $10 per transaction
  whitelist: [             // Only these services allowed
    'api.openai.com',
    'api.anthropic.com'
  ],
  killSwitch: true         // Enable emergency freeze
});
```

### 3. Agent Transacts Autonomously
When your agent needs to spend money, it requests approval from Autonomy.

```typescript
// Before every paid API call:
const payment = await autonomy.requestPayment({
  service: 'api.openai.com',
  amount: 0.05
});

if (payment.approved) {
  // Safe to proceed
  await openai.chat.completions.create({...});
} else {
  // Handle rejection
  console.log('Blocked:', payment.reason);
}
```

---

## Policy Examples

| Scenario | Policy | Request | Result |
|----------|--------|---------|--------|
| Daily limit exceeded | `dailyLimit: $50` | $48 spent + $5 request | ❌ BLOCKED |
| Service not whitelisted | `whitelist: ['api.openai.com']` | Payment to `malicious.xyz` | ❌ BLOCKED |
| Per-tx limit exceeded | `perTxLimit: $10` | $25 payment | ❌ BLOCKED |
| All checks pass | `$50 daily, $10 per-tx, openai whitelisted` | $5 to openai | ✅ APPROVED |

---

## x402 Payment Protocol

Autonomy integrates with the **x402 HTTP payment protocol** for seamless agent payments:

```typescript
// Wrap your HTTP client with x402 middleware
const response = await x402.fetch('https://paid-api.example.com/data');

// If 402 Payment Required is returned:
// 1. Autonomy validates the payment against policies
// 2. If approved, payment is executed automatically
// 3. Request is retried with payment proof
// 4. If blocked, error is thrown with reason
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Identity** | ERC-8004 (Agent Identity Standard) |
| **Wallet** | ERC-4337 (Account Abstraction) |
| **Payments** | x402 (HTTP Payment Protocol) |
| **Blockchain** | Polygon zkEVM, Ethereum, Base |
| **Infrastructure** | Lit Protocol, The Graph, IPFS |

---

## Dashboard Features

- **Agent Management**: Create, pause, freeze, delete agents
- **Real-time Monitoring**: Watch transactions as they happen
- **Policy Editor**: Adjust limits and whitelists
- **Audit Log**: Complete history of all transactions
- **Kill Switch**: One-click emergency freeze

---

## SDK Installation

```bash
npm install autonomy-ai-sdk
```

```typescript
import { AutonomySDK } from 'autonomy-ai-sdk';

const autonomy = new AutonomySDK({
  apiUrl: 'https://api.autonomy.finance',
  agentId: 'your-agent-id'
});
```

---

## Why Autonomy?

| Without Autonomy | With Autonomy |
|------------------|---------------|
| Agents have unlimited access to funds | Programmable spending limits |
| No visibility into agent spending | Complete audit trail |
| Can't stop a misbehaving agent | Instant kill switch |
| Trust the agent completely | Verify every transaction |
| Single point of failure | Non-custodial security |

---

## Use Cases

- **AI Research Assistants**: Cap API spending for research tasks
- **Trading Bots**: Limit trade sizes and approved exchanges
- **Customer Service Agents**: Whitelist only CRM and support APIs
- **Content Generation**: Budget limits for image/video generation APIs
- **Enterprise AI**: Organization-wide spending controls and audit compliance

---

## License

MIT License

---

**Built for the agentic economy. Control your AI agents before they control your wallet.**

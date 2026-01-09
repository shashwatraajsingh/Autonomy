# Autonomy

**A Kill Switch Between AI and Your Money**

AI agents can already trade, pay APIs, and move crypto.  
One hallucination is enough to drain a wallet.  
We built the firewall that stops that.

---

## The Problem

Today, AI agents have full wallet access.  
No limits. No approvals. No emergency stop.

**What can go wrong:**

- A trading bot misreads an API → empties a treasury
- An agent hits a malicious endpoint → funds gone
- No logs. No accountability. No undo.

We don't let interns spend company money freely.  
**Why are we letting AI do it?**

---

## The Solution

Autonomy is an **expense policy + kill switch** for AI agents.

It sits between the agent and the wallet and enforces:

| Control | What It Does |
|---------|--------------|
| **Spending Limits** | Daily caps, per-transaction limits |
| **Service Whitelist** | Only approved APIs get paid |
| **Kill Switch** | Freeze everything. Instantly. |
| **Audit Trail** | Every transaction. Every reason. |

AI can act fast — but never outside your rules.

---

## How It Works

```
   AI AGENT
      │
      ▼
┌─────────────────────────┐
│    AUTONOMY SDK         │
│ autonomy.pay($5, api)   │
└─────────────────────────┘
      │
      ▼
┌─────────────────────────┐
│   POLICY ENFORCER       │
│ ┌───────┐ ┌───────────┐ │
│ │Limit? │ │Whitelisted│ │
│ └───────┘ └───────────┘ │
└─────────────────────────┘
      │
      ├── ✅ APPROVED → Execute
      │
      └── ❌ BLOCKED → Log & Stop
```

---

## Quick Start

### 1. Create an Agent

```typescript
// POST /api/agents
const response = await fetch('http://localhost:3001/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Trading_Bot',
    userId: '0xYourWalletAddress',
    policy: {
      dailyLimit: 50,           // $50/day max
      perTxLimit: 10,           // $10 per transaction
      whitelist: ['api.openai.com', 'api.anthropic.com'],
      killSwitch: true
    }
  })
});

const { agent } = await response.json();
```

### 2. Use the SDK

```typescript
import { AutonomySDK } from 'autonomy-ai-sdk';

const autonomy = new AutonomySDK({
  apiUrl: 'http://localhost:3001/api',
  agentId: agent.id
});

// Request payment authorization
const payment = await autonomy.requestPayment({
  service: 'api.openai.com',
  amount: 0.05
});

if (payment.approved) {
  // Proceed safely
} else {
  console.log('Blocked:', payment.reason);
}
```

### 3. Handle x402 Payments

```typescript
import { AutonomySDK, X402Middleware } from 'autonomy-ai-sdk';

const autonomy = new AutonomySDK({
  apiUrl: 'http://localhost:3001/api',
  agentId: 'your-agent-id'
});

const x402 = new X402Middleware(autonomy);

// Automatically handles 402 Payment Required responses
const response = await x402.fetch('https://paid-api.example.com/data');
```

---

## What Gets Blocked

| Scenario | Policy | Request | Result |
|----------|--------|---------|--------|
| Over daily limit | `$50/day` | $48 spent + $5 req | ❌ Blocked |
| Unknown service | `whitelist: [openai]` | `malicious.xyz` | ❌ Blocked |
| Per-tx too high | `$10/tx max` | $25 request | ❌ Blocked |
| All rules pass | `$50/day, $10/tx, openai` | $5 to openai | ✅ Approved |

Bad transactions never hit the chain.

---

## What Makes This Different

- **External enforcement** — policies live outside the agent, so bugs, prompts, or model updates cannot bypass them
- **Non-custodial** — we never touch your funds
- **Real-time enforcement** — policy checks in milliseconds
- **AI-native** — built for autonomous agents, not humans
- **x402-ready** — designed for HTTP payments at scale

---

## Under the Hood (Optional)

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, React, Wagmi, Framer Motion |
| **Backend** | Express, TypeScript, Prisma, PostgreSQL |
| **SDK** | TypeScript with x402 middleware |
| **Roadmap** | ERC-4337 wallets, On-chain agent identity |

---

## SDK Installation

```bash
# From the SDK directory
cd sdk
npm install
npm run build

# Link locally for development
npm link
```

```typescript
import { AutonomySDK, X402Middleware } from 'autonomy-ai-sdk';

const autonomy = new AutonomySDK({
  apiUrl: 'http://localhost:3001/api',
  agentId: 'your-agent-id'
});
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| POST | `/api/agents` | Create new agent |
| GET | `/api/agents/:id` | Get agent details |
| PATCH | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent |
| POST | `/api/agents/:id/execute` | Execute task |
| POST | `/api/agents/:id/kill-switch` | Activate kill switch |
| GET | `/api/transactions` | List transactions |
| POST | `/api/transactions/simulate` | Simulate transaction |

---

## Local Development

```bash
# Terminal 1: Backend
cd backend
cp env.example .env
npm install
docker run -d -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres
npx prisma migrate dev
npm run dev

# Terminal 2: Frontend
npm install
npm run dev
```

---

## Dashboard

- **Create agents** with one click
- **Set policies** visually
- **Monitor transactions** in real-time
- **Hit the kill switch** when needed
- **Export audit logs** for compliance

---

## Who Needs This

If your AI can spend real money, you need this before it fails.

---

## License

MIT

---

**Autonomy gives AI freedom — without giving it your wallet.**

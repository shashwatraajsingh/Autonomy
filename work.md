# How Autonomy Works

This document explains the technical architecture and execution flow of the Autonomy platform.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER / OWNER                                   │
│                    (Connects wallet, manages agents)                     │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AUTONOMY DASHBOARD                               │
│           Next.js • React • Wagmi • Wallet Connection                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │  Create Agent  │  │  Set Policies  │  │  View Audit    │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          AUTONOMY API                                    │
│                Express • TypeScript • PostgreSQL                         │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐             │
│  │ Agent Routes   │  │ Policy Routes  │  │ Transaction    │             │
│  │ /api/agents    │  │ /api/policies  │  │ /api/txns      │             │
│  └────────────────┘  └────────────────┘  └────────────────┘             │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CORE SERVICES                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ AgentOrchestrator│  │ PolicyEnforcer   │  │ WalletManager    │       │
│  │ - Start/Stop     │  │ - Validate txns  │  │ - Create wallets │       │
│  │ - Pause/Resume   │  │ - Check limits   │  │ - Sign txns      │       │
│  │ - Kill switch    │  │ - Whitelist      │  │ - Encrypt keys   │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         AI AGENT RUNTIME                                 │
│  ┌──────────────────────────────────────────────────────────────┐       │
│  │  AIAgent Class                                               │       │
│  │  - Executes tasks (research, trading, payments)              │       │
│  │  - Requests payment authorization from PolicyEnforcer        │       │
│  │  - Integrates with OpenAI for decision making                │       │
│  └──────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          BLOCKCHAIN                                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │ ERC-4337 Wallet  │  │ ERC-8004 Identity│  │ x402 Payments    │       │
│  │ (Account Abstr.) │  │ (Agent Registry) │  │ (HTTP Protocol)  │       │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘       │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Execution Flow

### 1. User Creates an Agent

```
User → Dashboard → "Create Agent" → Backend API → Database
                                         │
                                         ▼
                                   WalletManager
                                   - Generate new wallet
                                   - Encrypt private key
                                   - Store securely
```

**What happens:**
1. User connects wallet (MetaMask/WalletConnect)
2. User fills out agent details (name, policies)
3. Backend generates a new ERC-4337 wallet for the agent
4. Private key is encrypted and stored
5. Agent record created in database with policies

---

### 2. Agent Requests Payment

```
AI Agent → Autonomy SDK → Policy Enforcer → Decision
              │                   │
              │                   ├─→ Check: Is agent active?
              │                   ├─→ Check: Is service whitelisted?
              │                   ├─→ Check: Within per-tx limit?
              │                   └─→ Check: Within daily limit?
              │                              │
              │                   ┌──────────┴──────────┐
              │                   ▼                     ▼
              │              APPROVED              BLOCKED
              │                   │                     │
              │                   ▼                     ▼
              │           Execute payment        Log rejection
              │                   │                     │
              └───────────────────┴─────────────────────┘
                                   │
                                   ▼
                              Update audit log
```

**Code Example:**
```typescript
// In your AI agent code
import { AutonomySDK } from '@autonomy-ai/sdk';

const autonomy = new AutonomySDK({
  apiUrl: 'https://api.autonomy.finance',
  agentId: 'agent-123'
});

// Before spending money, ask Autonomy
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

### 3. Policy Validation Logic

```typescript
// PolicyEnforcer.validateTransaction()

function validateTransaction(request) {
  const agent = getAgent(request.agentId);
  const policy = agent.policy;

  // Check 1: Agent status
  if (agent.status !== 'active') {
    return { approved: false, reason: `Agent is ${agent.status}` };
  }

  // Check 2: Service whitelist
  if (!policy.whitelist.includes(request.service)) {
    return { approved: false, reason: 'Service not whitelisted' };
  }

  // Check 3: Per-transaction limit
  if (request.amount > policy.perTxLimit) {
    return { approved: false, reason: 'Exceeds per-tx limit' };
  }

  // Check 4: Daily limit
  const spentToday = getTodaySpending(agent.id);
  if (spentToday + request.amount > policy.dailyLimit) {
    return { approved: false, reason: 'Exceeds daily limit' };
  }

  // All checks passed
  return { approved: true, reason: 'All policy checks passed' };
}
```

---

### 4. x402 Payment Protocol Flow

```
AI Agent                    Paid API                    Autonomy
    │                          │                           │
    │  1. Initial Request      │                           │
    │─────────────────────────▶│                           │
    │                          │                           │
    │  2. 402 Payment Required │                           │
    │◀─────────────────────────│                           │
    │  (Amount: $0.05)         │                           │
    │                          │                           │
    │  3. Request payment auth │                           │
    │─────────────────────────────────────────────────────▶│
    │                          │                           │
    │  4. Validate policy      │                           │
    │◀─────────────────────────────────────────────────────│
    │  { approved: true }      │                           │
    │                          │                           │
    │  5. Retry with payment   │                           │
    │─────────────────────────▶│                           │
    │  (X-Payment-Proof: 0x...)│                           │
    │                          │                           │
    │  6. 200 OK + Data        │                           │
    │◀─────────────────────────│                           │
```

---

### 5. Kill Switch Activation

```
Owner                      Dashboard                     Backend
  │                           │                             │
  │  Click "Kill Switch"      │                             │
  │──────────────────────────▶│                             │
  │                           │  POST /agents/123/kill-switch
  │                           │────────────────────────────▶│
  │                           │                             │
  │                           │                 ┌───────────┴───────────┐
  │                           │                 │ AgentOrchestrator     │
  │                           │                 │ - Stop agent          │
  │                           │                 │ - Set status: frozen  │
  │                           │                 │ - Block all txns      │
  │                           │                 └───────────┬───────────┘
  │                           │                             │
  │                           │  { agent: { status: frozen }}
  │                           │◀────────────────────────────│
  │                           │                             │
  │  "Agent frozen"           │                             │
  │◀──────────────────────────│                             │
```

---

## Data Models

### Agent
```typescript
{
  id: "agent-123",
  name: "Research_Agent",
  status: "active" | "paused" | "frozen",
  walletAddress: "0x1234...",
  privateKeyEnc: "encrypted...",
  userId: "user-wallet-address",
  policy: Policy,
  spentToday: 12.50,
  createdAt: "2024-01-01T00:00:00Z"
}
```

### Policy
```typescript
{
  dailyLimit: 50,        // Max $50 per day
  perTxLimit: 10,        // Max $10 per transaction
  whitelist: [           // Allowed services
    "api.openai.com",
    "api.anthropic.com"
  ],
  killSwitch: true       // Emergency freeze enabled
}
```

### Transaction
```typescript
{
  id: "tx-456",
  agentId: "agent-123",
  service: "api.openai.com",
  amount: 0.05,
  status: "approved" | "blocked",
  reason: "All policy checks passed",
  txHash: "0xabc...",
  createdAt: "2024-01-01T12:00:00Z"
}
```

---

## Security Model

| Layer | Protection |
|-------|------------|
| **Wallet** | Private keys encrypted at rest with AES-256 |
| **Authentication** | Sign-in with Ethereum (SIWE) |
| **Authorization** | Only wallet owner can manage their agents |
| **Network** | HTTPS only, CORS restrictions |
| **Non-Custodial** | Users can export keys, Autonomy never moves funds without approval |

---

## Local Development

### Frontend Only (Demo Mode)
```bash
npm install
npm run dev
# Data stored in localStorage per wallet
```

### Full Stack (Production Mode)
```bash
# Terminal 1: Backend
cd backend
npm install
docker run -d -e POSTGRES_PASSWORD=pass -p 5432:5432 postgres
npm run db:migrate
npm run dev

# Terminal 2: Frontend
npm run dev
```

---

## Summary

1. **Owner** creates agents via Dashboard
2. **Agents** are assigned wallets and policies
3. **AI Agents** use SDK to request payments
4. **PolicyEnforcer** validates every request
5. **Transactions** are logged for audit
6. **Kill Switch** instantly freezes any agent

**The result: AI agents with financial guardrails.**

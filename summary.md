# Autonomy

**A Kill Switch Between AI and Your Money**

---

## The Reality

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

- **Spending limits** — daily caps, per-transaction limits
- **Allowed services** — whitelist of approved APIs
- **Emergency shutdown** — one-click kill switch
- **Full audit trail** — every transaction logged

AI can act fast — but never outside your rules.

---

## What's Built

- **Dashboard** — Create agents, set policies, monitor transactions, hit kill switch
- **Policy Engine** — Real-time validation of every transaction
- **SDK** — Drop-in TypeScript SDK with x402 middleware for AI agents
- **Backend API** — Full REST API for agent management
- **Audit Logging** — Every transaction recorded with approval/rejection reason

---

## What Makes This Different

- **External enforcement** — policies live outside the agent, so bugs, prompts, or model updates cannot bypass them
- **Non-custodial** — we never touch your funds
- **Real-time enforcement** — bad transactions never hit the chain
- **AI-native** — built for autonomous agents, not humans
- **x402-ready** — designed for HTTP payments at scale

---

## Who Needs This

If your AI can spend real money, you need this before it fails.

---

## Under the Hood (Optional)

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js, React, Wagmi |
| **Backend** | Express, TypeScript, Prisma, PostgreSQL |
| **SDK** | TypeScript, x402 middleware |
| **Roadmap** | ERC-4337 (Account Abstraction), On-chain identity |

---

## Status

✅ Policy enforcement engine  
✅ Dashboard with kill switch  
✅ SDK for agent integration  
✅ Full REST API  
⏳ Smart contract deployment  
⏳ Mainnet launch  

---

**Autonomy gives AI freedom — without giving it your wallet.**

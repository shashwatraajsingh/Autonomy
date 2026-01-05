# Autonomy - Product Summary

## One-Liner
**Autonomy is the financial operating system for autonomous AI agents — enabling governance, spending limits, and audit trails before AI touches real money.**

---

## What is Autonomy?

Autonomy is a governance platform that sits between AI agents and their crypto wallets. As AI agents become increasingly autonomous — capable of making API calls, executing trades, and spending money — there's a critical need for guardrails. Autonomy provides those guardrails.

Think of it as a **permission layer for AI spending**. Just like a corporate expense policy, but for AI.

---

## The Problem

AI agents are becoming autonomous economic actors, but they lack financial controls:

| Problem | Risk |
|---------|------|
| **No spending limits** | An agent could drain a wallet in minutes |
| **No service restrictions** | Agents can interact with any API, including malicious ones |
| **No audit trail** | No visibility into what agents spend money on |
| **No kill switch** | No way to instantly stop a misbehaving agent |

---

## The Solution

Autonomy provides **programmable governance** for AI agents:

### Core Features

1. **Agent Identity (ERC-8004)**
   - Each agent gets a unique on-chain identity
   - Linked to a non-custodial smart wallet (ERC-4337)

2. **Policy Engine**
   - Daily spending limits
   - Per-transaction caps
   - Service whitelisting
   - Kill switch for emergencies

3. **Real-Time Enforcement**
   - Every transaction validated against policies
   - Blocked transactions logged with reasons
   - Zero-latency policy checks

4. **Complete Audit Trail**
   - Every transaction recorded
   - Approval/rejection reasons
   - Full history for compliance

---

## Target Users

| User Type | Use Case |
|-----------|----------|
| **AI Developers** | Add governance to their autonomous agents |
| **Enterprises** | Manage fleets of AI agents with spending controls |
| **DeFi Projects** | Secure AI trading bots and automated systems |
| **DAOs** | Delegate AI agent permissions to the DAO |

---

## Key Differentiators

1. **Non-Custodial** — Users own their keys, Autonomy never touches funds
2. **Chain-Agnostic** — Works on Polygon, Ethereum, Base, and more
3. **x402 Native** — Built for the HTTP payment protocol era
4. **SDK-First** — Simple API for any AI agent to integrate

---

## Technology Stack

- **Frontend**: Next.js, React, Wagmi, Viem
- **Backend**: Express, TypeScript, Prisma, PostgreSQL
- **Blockchain**: ERC-4337 (Account Abstraction), ERC-8004 (Agent Identity)
- **Payments**: x402 HTTP Payment Protocol

---

## Status

✅ Frontend with wallet connection  
✅ Policy simulation engine  
✅ Backend API  
✅ SDK for agent integration  
⏳ Smart contract deployment  
⏳ Mainnet launch  

---

**Autonomy: Control your AI agents before they control your wallet.**

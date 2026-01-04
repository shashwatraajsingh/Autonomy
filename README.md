# Autonomy

**The Financial Operating System for Autonomous AI Agents**

A comprehensive governance and oversight platform for AI agents. It provides tools for users and organizations to deploy agents with programmable spending limits, permissions, and audit trails. By integrating the x402 payment protocol with agent identity standards like ERC-8004, it creates a "financial operating system" for the agentic economy.

![Autonomy Dashboard](./public/screenshot.png)

## 🎯 Problem

AI agents are increasingly autonomous—but their financial capabilities are dangerously uncontrolled:
- No spending limits
- No service restrictions
- No audit trails
- No kill switch

## 💡 Solution

Autonomy provides a **governance layer** between AI agents and their wallets:

- **Programmable Policies**: Set daily limits, per-transaction caps, and service whitelists
- **Real-time Enforcement**: Every transaction validated against policies before execution
- **Kill Switch**: Instantly freeze agent activity if something goes wrong
- **Complete Audit Trail**: Every transaction logged with reasons for approval/rejection
- **Non-Custodial**: You own your keys—Autonomy never touches your funds

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│    Next.js + React + Tailwind + Framer Motion              │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                              │
│    Express + TypeScript + Prisma + PostgreSQL              │
├─────────────────────────────────────────────────────────────┤
│                    CORE SERVICES                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Agent       │  │ Policy      │  │ Wallet      │         │
│  │ Orchestrator│  │ Enforcer    │  │ Manager     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    BLOCKCHAIN                               │
│    ERC-4337 Account Abstraction + x402 Payment Protocol    │
└─────────────────────────────────────────────────────────────┘
```

## ✨ Features

### Agent Management
- Create agents with unique ERC-8004 identities
- Assign ERC-4337 smart contract wallets
- Pause, resume, or freeze agents instantly

### Policy Engine
- **Daily Spending Limits**: Cap total daily spending
- **Per-Transaction Limits**: Block large individual transactions
- **Service Whitelisting**: Only allow approved APIs/contracts
- **Kill Switch**: Emergency freeze capability

### Audit & Monitoring
- Real-time transaction feed
- Approval/rejection statistics
- Complete audit history
- Policy violation alerts

## 🚀 Quick Start

### Frontend (Demo Mode)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

### Backend (Full Mode)

```bash
# Navigate to backend
cd backend

# Install dependencies
npm install

# Setup database (requires PostgreSQL)
npm run db:migrate

# Start server
npm run dev
```

### Environment Variables

Create `.env` in the root:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Create `.env` in `/backend`:

```env
PORT=4000
DATABASE_URL="postgresql://user:pass@localhost:5432/autonomy"
POLYGON_RPC_URL="https://polygon-mumbai.g.alchemy.com/v2/YOUR_KEY"
OPENAI_API_KEY="sk-..."
ENCRYPTION_KEY="your-32-character-encryption-key"
```

## 📂 Project Structure

```
autonomy/
├── src/                    # Frontend (Next.js)
│   ├── app/               # Pages
│   │   ├── page.tsx       # Landing page
│   │   ├── demo/          # Policy simulator
│   │   └── dashboard/     # Agent management
│   ├── components/        # UI components
│   └── lib/               # Utilities & API client
├── backend/               # Backend (Express)
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── services/      # Business logic
│   └── prisma/            # Database schema
└── public/                # Static assets
```

## 🔧 Tech Stack

### Frontend
- **Next.js 16** - React framework
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **Lucide Icons** - Icons

### Backend
- **Express.js** - API server
- **Prisma** - ORM
- **PostgreSQL** - Database
- **ethers.js** - Blockchain
- **OpenAI** - AI capabilities

### Standards
- **ERC-4337** - Account Abstraction
- **ERC-8004** - Agent Identity
- **x402** - HTTP Payment Protocol

## 🎮 Demo

The platform works in two modes:

**Demo Mode** (No backend required):
- All features work with local state
- Data persists in localStorage
- Perfect for testing and presentations

**Live Mode** (With backend):
- Real PostgreSQL database
- Agent orchestrator running
- AI-powered task execution
- Blockchain integration (testnet)

## 📝 API Reference

See [Backend README](./backend/README.md) for full API documentation.

### Quick Examples

```typescript
// Create an agent
const agent = await api.createAgent({
  name: 'Research_Agent',
  userId: walletAddress,
  policy: {
    dailyLimit: 50,
    perTxLimit: 10,
    whitelist: ['api.openai.com'],
    killSwitch: true
  }
});

// Simulate a transaction
const result = await api.simulateTransaction({
  agentId: agent.id,
  service: 'api.openai.com',
  amount: 5,
  type: 'payment'
});
// { approved: true, reason: 'All policy checks passed' }
```

## 🛣️ Roadmap

- [ ] Wallet integration (MetaMask/WalletConnect)
- [ ] Smart contract deployment
- [ ] Multi-chain support
- [ ] Team/organization features
- [ ] Advanced analytics dashboard
- [ ] Webhook notifications
- [ ] Mobile app

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.

---

**Built for the agentic economy. Control your AI agents before they control your wallet.**

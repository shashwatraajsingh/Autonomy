# Autonomy Backend

Production-grade backend for the Autonomy AI Agent Governance Platform.

## Features

- **Agent Management**: Create, update, pause, freeze agents
- **Policy Enforcement**: Real-time validation of transactions against policies
- **Wallet Management**: Secure encrypted key storage, transaction signing
- **AI Integration**: OpenAI-powered agent task execution
- **Audit Logging**: Complete transaction history and agent activity logs

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Setup

1. **Install dependencies**

```bash
cd backend
npm install
```

2. **Configure environment**

```bash
cp env.example .env
# Edit .env with your values
```

3. **Setup database**

```bash
# Start PostgreSQL (example with Docker)
docker run -d --name autonomy-db \
  -e POSTGRES_USER=autonomy \
  -e POSTGRES_PASSWORD=autonomy123 \
  -e POSTGRES_DB=autonomy \
  -p 5432:5432 \
  postgres:14

# Run migrations
npm run db:migrate
```

4. **Start the server**

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## API Endpoints

### Agents

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/agents` | List all agents |
| GET | `/api/agents/:id` | Get agent details |
| POST | `/api/agents` | Create new agent |
| PATCH | `/api/agents/:id` | Update agent |
| DELETE | `/api/agents/:id` | Delete agent |
| POST | `/api/agents/:id/execute` | Execute agent task |
| POST | `/api/agents/:id/kill-switch` | Activate kill switch |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| GET | `/api/transactions/stats` | Get statistics |
| POST | `/api/transactions/simulate` | Simulate transaction |

### Policies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/policies/:agentId` | Get agent policy |
| PATCH | `/api/policies/:agentId` | Update policy |
| POST | `/api/policies/:agentId/whitelist` | Add to whitelist |
| DELETE | `/api/policies/:agentId/whitelist/:service` | Remove from whitelist |

### Wallet

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/wallet/create` | Create new wallet |
| GET | `/api/wallet/balance/:address` | Get wallet balance |

## Architecture

```
backend/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── middleware/
│   │   └── errorHandler.ts   # Global error handling
│   ├── routes/
│   │   ├── agent.routes.ts   # Agent endpoints
│   │   ├── transaction.routes.ts
│   │   ├── policy.routes.ts
│   │   └── wallet.routes.ts
│   └── services/
│       ├── AgentOrchestrator.ts  # Agent lifecycle management
│       ├── AIAgent.ts            # AI agent runtime
│       ├── PolicyEnforcer.ts     # Policy validation
│       └── WalletManager.ts      # Wallet operations
└── prisma/
    └── schema.prisma         # Database schema
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 4000) |
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `POLYGON_RPC_URL` | Polygon RPC endpoint | No |
| `OPENAI_API_KEY` | OpenAI API key for AI tasks | No |
| `ENCRYPTION_KEY` | 32-char key for wallet encryption | Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | No |

## Demo Mode

If `OPENAI_API_KEY` or `POLYGON_RPC_URL` are not set, the backend runs in demo mode:

- AI tasks return mock responses
- Transactions generate mock transaction hashes
- Perfect for development and demonstrations

## Production Deployment

1. Set all environment variables
2. Run `npm run build`
3. Deploy with PM2 or similar process manager
4. Configure reverse proxy (nginx)
5. Enable HTTPS

## License

MIT

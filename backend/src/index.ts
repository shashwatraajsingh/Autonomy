import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import agentRoutes from './routes/agent.routes';
import transactionRoutes from './routes/transaction.routes';
import policyRoutes from './routes/policy.routes';
import walletRoutes from './routes/wallet.routes';
import { errorHandler } from './middleware/errorHandler';
import { AgentOrchestrator } from './services/AgentOrchestrator';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/agents', agentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/wallet', walletRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Initialize Agent Orchestrator
const orchestrator = new AgentOrchestrator(prisma);

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await orchestrator.shutdown();
    await prisma.$disconnect();
    process.exit(0);
});

app.listen(PORT, () => {
    console.log(`🚀 Autonomy Backend running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);

    // Initialize agents on startup
    orchestrator.initialize().catch(console.error);
});

export { prisma, orchestrator };

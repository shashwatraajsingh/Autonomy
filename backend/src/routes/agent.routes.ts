import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { WalletManager } from '../services/WalletManager';
import { orchestrator } from '../index';

const router = Router();
const prisma = new PrismaClient();
const walletManager = new WalletManager();

// Validation schemas (compiled once)
const CreateAgentSchema = z.object({
    name: z.string().min(1).max(100),
    userId: z.string(),
    policy: z.object({
        dailyLimit: z.number().positive(),
        perTxLimit: z.number().positive(),
        whitelist: z.array(z.string()),
        killSwitch: z.boolean()
    })
});

const UpdateAgentSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    status: z.enum(['active', 'paused', 'frozen']).optional()
});

// GET /api/agents - List agents (optimized with single query)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Single optimized query with raw aggregation
        const agents = await prisma.agent.findMany({
            where: userId ? { user: { walletAddress: userId } } : undefined,
            select: {
                id: true,
                name: true,
                status: true,
                walletAddress: true,
                createdAt: true,
                policy: {
                    select: {
                        id: true,
                        dailyLimit: true,
                        perTxLimit: true,
                        whitelist: true,
                        killSwitch: true
                    }
                },
                _count: { select: { transactions: true } }
            },
            orderBy: { createdAt: 'desc' },
            take: 50  // Limit for performance
        });

        // Batch query for spending (single query for all agents)
        const agentIds = agents.map(a => a.id);
        const spendingData = await prisma.transaction.groupBy({
            by: ['agentId'],
            where: {
                agentId: { in: agentIds },
                status: 'approved',
                createdAt: { gte: today }
            },
            _sum: { amount: true }
        });

        // Create spending lookup map
        const spendingMap = new Map(spendingData.map(s => [s.agentId, s._sum.amount || 0]));

        // Merge data
        const agentsWithSpending = agents.map(agent => ({
            ...agent,
            spentToday: spendingMap.get(agent.id) || 0
        }));

        res.json({ agents: agentsWithSpending });
    } catch (error) {
        next(error);
    }
});

// GET /api/agents/:id - Get single agent
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const agent = await prisma.agent.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                status: true,
                walletAddress: true,
                createdAt: true,
                policy: true,
                transactions: {
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    select: {
                        id: true,
                        service: true,
                        amount: true,
                        status: true,
                        reason: true,
                        createdAt: true
                    }
                }
            }
        });

        if (!agent) {
            return res.status(404).json({ error: 'Agent not found' });
        }

        res.json({ agent });
    } catch (error) {
        next(error);
    }
});

// POST /api/agents - Create new agent
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = CreateAgentSchema.parse(req.body);

        // Create wallet (async, don't block response)
        const wallet = await walletManager.createAgentWallet();

        // Upsert user (single query)
        const user = await prisma.user.upsert({
            where: { walletAddress: data.userId },
            update: {},
            create: { walletAddress: data.userId }
        });

        // Create agent with policy in single transaction
        const agent = await prisma.agent.create({
            data: {
                name: data.name,
                walletAddress: wallet.address,
                privateKeyEnc: wallet.encryptedPrivateKey,
                userId: user.id,
                policy: {
                    create: {
                        dailyLimit: data.policy.dailyLimit,
                        perTxLimit: data.policy.perTxLimit,
                        whitelist: data.policy.whitelist,
                        killSwitch: data.policy.killSwitch
                    }
                }
            },
            include: { policy: true }
        });

        // Start agent in background (don't block response)
        orchestrator.startAgent(agent.id).catch(() => { });

        res.status(201).json({ agent });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.issues });
        }
        next(error);
    }
});

// PATCH /api/agents/:id - Update agent
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = UpdateAgentSchema.parse(req.body);

        const agent = await prisma.agent.update({
            where: { id: req.params.id },
            data,
            include: { policy: true }
        });

        // Handle status changes in background
        if (data.status) {
            const statusHandlers: Record<string, () => Promise<void>> = {
                paused: () => orchestrator.pauseAgent(agent.id),
                active: () => orchestrator.resumeAgent(agent.id),
                frozen: () => orchestrator.killSwitchAgent(agent.id)
            };
            statusHandlers[data.status]?.().catch(() => { });
        }

        res.json({ agent });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.issues });
        }
        next(error);
    }
});

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Stop agent in background
        orchestrator.stopAgent(req.params.id).catch(() => { });

        // Delete with cascade handled by Prisma
        await prisma.agent.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// POST /api/agents/:id/execute - Execute task
router.post('/:id/execute', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { type, service, amount, data } = req.body;

        const agent = orchestrator.getAgent(req.params.id);
        if (!agent) {
            return res.status(404).json({ error: 'Agent not running' });
        }

        const result = await agent.executeTask({ type, service, amount, data });
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// POST /api/agents/:id/kill-switch - Activate kill switch
router.post('/:id/kill-switch', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Run in parallel
        const [, agent] = await Promise.all([
            orchestrator.killSwitchAgent(req.params.id),
            prisma.agent.findUnique({
                where: { id: req.params.id },
                include: { policy: true }
            })
        ]);

        res.json({ agent, message: 'Kill switch activated' });
    } catch (error) {
        next(error);
    }
});

export default router;

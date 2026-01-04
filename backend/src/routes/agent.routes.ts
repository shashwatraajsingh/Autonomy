import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { WalletManager } from '../services/WalletManager';
import { orchestrator } from '../index';

const router = Router();
const prisma = new PrismaClient();
const walletManager = new WalletManager();

// Validation schemas
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

// GET /api/agents - List all agents for a user
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.query.userId as string;

        const agents = await prisma.agent.findMany({
            where: userId ? { userId } : undefined,
            include: {
                policy: true,
                _count: {
                    select: { transactions: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Add spending info
        const agentsWithSpending = await Promise.all(agents.map(async (agent) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const spending = await prisma.transaction.aggregate({
                where: {
                    agentId: agent.id,
                    status: 'approved',
                    createdAt: { gte: today }
                },
                _sum: { amount: true }
            });

            return {
                ...agent,
                spentToday: spending._sum.amount || 0
            };
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
            include: {
                policy: true,
                transactions: {
                    take: 10,
                    orderBy: { createdAt: 'desc' }
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

        // Create wallet for agent
        const wallet = await walletManager.createAgentWallet();

        // Ensure user exists
        let user = await prisma.user.findUnique({
            where: { walletAddress: data.userId }
        });

        if (!user) {
            user = await prisma.user.create({
                data: { walletAddress: data.userId }
            });
        }

        // Create agent with policy
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

        // Start the agent if active
        try {
            await orchestrator.startAgent(agent.id);
        } catch (e) {
            console.log('Agent started in background');
        }

        res.status(201).json({ agent });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
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

        // Handle status changes
        if (data.status === 'paused') {
            await orchestrator.pauseAgent(agent.id).catch(() => { });
        } else if (data.status === 'active') {
            await orchestrator.resumeAgent(agent.id).catch(() => { });
        } else if (data.status === 'frozen') {
            await orchestrator.killSwitchAgent(agent.id).catch(() => { });
        }

        res.json({ agent });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        next(error);
    }
});

// DELETE /api/agents/:id - Delete agent
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Stop agent first
        await orchestrator.stopAgent(req.params.id).catch(() => { });

        await prisma.agent.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

// POST /api/agents/:id/execute - Execute a task on agent
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
        await orchestrator.killSwitchAgent(req.params.id);

        const agent = await prisma.agent.findUnique({
            where: { id: req.params.id },
            include: { policy: true }
        });

        res.json({ agent, message: 'Kill switch activated' });
    } catch (error) {
        next(error);
    }
});

export default router;

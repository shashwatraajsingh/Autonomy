import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { PolicyEnforcer } from '../services/PolicyEnforcer';

const router = Router();
const prisma = new PrismaClient();
const policyEnforcer = new PolicyEnforcer(prisma);

// GET /api/transactions - List transactions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { agentId, userId, status, limit = '50' } = req.query;

        const transactions = await prisma.transaction.findMany({
            where: {
                ...(agentId && { agentId: agentId as string }),
                ...(userId && { userId: userId as string }),
                ...(status && { status: status as string })
            },
            include: {
                agent: {
                    select: { name: true, walletAddress: true }
                }
            },
            take: parseInt(limit as string),
            orderBy: { createdAt: 'desc' }
        });

        res.json({ transactions });
    } catch (error) {
        next(error);
    }
});

// GET /api/transactions/stats - Get transaction statistics
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { userId } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalApproved, totalBlocked, spentToday, allTime] = await Promise.all([
            prisma.transaction.count({
                where: {
                    ...(userId && { userId: userId as string }),
                    status: 'approved'
                }
            }),
            prisma.transaction.count({
                where: {
                    ...(userId && { userId: userId as string }),
                    status: 'blocked'
                }
            }),
            prisma.transaction.aggregate({
                where: {
                    ...(userId && { userId: userId as string }),
                    status: 'approved',
                    createdAt: { gte: today }
                },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: {
                    ...(userId && { userId: userId as string }),
                    status: 'approved'
                },
                _sum: { amount: true }
            })
        ]);

        res.json({
            stats: {
                totalApproved,
                totalBlocked,
                spentToday: spentToday._sum.amount || 0,
                totalSpent: allTime._sum.amount || 0
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/transactions/simulate - Simulate a transaction without executing
router.post('/simulate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { agentId, service, amount, type } = req.body;

        const result = await policyEnforcer.validateTransaction({
            agentId,
            service,
            amount,
            type
        });

        res.json({ validation: result });
    } catch (error) {
        next(error);
    }
});

export default router;

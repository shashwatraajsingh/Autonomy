import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PolicyEnforcer } from '../services/PolicyEnforcer';

const router = Router();
const prisma = new PrismaClient();
const policyEnforcer = new PolicyEnforcer(prisma);

// Cache for stats
interface StatsCache {
    stats: {
        totalApproved: number;
        totalBlocked: number;
        spentToday: number;
        totalSpent: number;
    };
    timestamp: number;
}

const statsCache = new Map<string, StatsCache>();
const STATS_CACHE_TTL = 10000; // 10 seconds

// GET /api/transactions - List transactions (optimized)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { agentId, userId, status, limit = '50' } = req.query;
        const limitNum = Math.min(parseInt(limit as string) || 50, 100);

        const transactions = await prisma.transaction.findMany({
            where: {
                ...(agentId && { agentId: agentId as string }),
                ...(userId && { agent: { user: { walletAddress: userId as string } } }),
                ...(status && { status: status as string })
            },
            select: {
                id: true,
                agentId: true,
                service: true,
                amount: true,
                status: true,
                reason: true,
                txHash: true,
                createdAt: true,
                agent: {
                    select: { name: true, walletAddress: true }
                }
            },
            take: limitNum,
            orderBy: { createdAt: 'desc' }
        });

        res.json({ transactions });
    } catch (error) {
        next(error);
    }
});

// GET /api/transactions/stats - Get statistics (with caching)
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req.query.userId as string) || 'all';
        const cacheKey = userId;

        // Check cache
        const cached = statsCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < STATS_CACHE_TTL) {
            return res.json({ stats: cached.stats });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const whereBase = userId !== 'all'
            ? { agent: { user: { walletAddress: userId } } }
            : {};

        // Single aggregation query for counts and sums
        const [approvedCount, blockedCount, todaySum, totalSum] = await Promise.all([
            prisma.transaction.count({
                where: { ...whereBase, status: 'approved' }
            }),
            prisma.transaction.count({
                where: { ...whereBase, status: 'blocked' }
            }),
            prisma.transaction.aggregate({
                where: { ...whereBase, status: 'approved', createdAt: { gte: today } },
                _sum: { amount: true }
            }),
            prisma.transaction.aggregate({
                where: { ...whereBase, status: 'approved' },
                _sum: { amount: true }
            })
        ]);

        const stats = {
            totalApproved: approvedCount,
            totalBlocked: blockedCount,
            spentToday: todaySum._sum.amount || 0,
            totalSpent: totalSum._sum.amount || 0
        };

        // Update cache
        statsCache.set(cacheKey, { stats, timestamp: Date.now() });

        res.json({ stats });
    } catch (error) {
        next(error);
    }
});

// POST /api/transactions/simulate - Fast validation
router.post('/simulate', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { agentId, service, amount, type } = req.body;

        // Validate input early
        if (!agentId || !service || typeof amount !== 'number') {
            return res.status(400).json({
                error: 'Missing required fields: agentId, service, amount'
            });
        }

        const result = await policyEnforcer.validateTransaction({
            agentId,
            service,
            amount,
            type: type || 'payment'
        });

        res.json({ validation: result });
    } catch (error) {
        next(error);
    }
});

// Invalidate stats cache (called after transaction)
export function invalidateStatsCache(userId?: string): void {
    if (userId) {
        statsCache.delete(userId);
    }
    statsCache.delete('all');
}

export default router;

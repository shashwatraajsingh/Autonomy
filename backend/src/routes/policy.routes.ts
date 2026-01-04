import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = Router();
const prisma = new PrismaClient();

const UpdatePolicySchema = z.object({
    dailyLimit: z.number().positive().optional(),
    perTxLimit: z.number().positive().optional(),
    whitelist: z.array(z.string()).optional(),
    killSwitch: z.boolean().optional()
});

// GET /api/policies/:agentId - Get policy for agent
router.get('/:agentId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const policy = await prisma.policy.findUnique({
            where: { agentId: req.params.agentId }
        });

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        res.json({ policy });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/policies/:agentId - Update policy
router.patch('/:agentId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = UpdatePolicySchema.parse(req.body);

        const policy = await prisma.policy.update({
            where: { agentId: req.params.agentId },
            data
        });

        res.json({ policy });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation error', details: error.errors });
        }
        next(error);
    }
});

// POST /api/policies/:agentId/whitelist - Add to whitelist
router.post('/:agentId/whitelist', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { service } = req.body;

        const policy = await prisma.policy.findUnique({
            where: { agentId: req.params.agentId }
        });

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        const updatedPolicy = await prisma.policy.update({
            where: { agentId: req.params.agentId },
            data: {
                whitelist: [...new Set([...policy.whitelist, service])]
            }
        });

        res.json({ policy: updatedPolicy });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/policies/:agentId/whitelist/:service - Remove from whitelist
router.delete('/:agentId/whitelist/:service', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const policy = await prisma.policy.findUnique({
            where: { agentId: req.params.agentId }
        });

        if (!policy) {
            return res.status(404).json({ error: 'Policy not found' });
        }

        const updatedPolicy = await prisma.policy.update({
            where: { agentId: req.params.agentId },
            data: {
                whitelist: policy.whitelist.filter(s => s !== req.params.service)
            }
        });

        res.json({ policy: updatedPolicy });
    } catch (error) {
        next(error);
    }
});

export default router;

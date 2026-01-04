import { Router, Request, Response, NextFunction } from 'express';
import { WalletManager } from '../services/WalletManager';

const router = Router();
const walletManager = new WalletManager();

// POST /api/wallet/create - Create a new wallet
router.post('/create', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const wallet = await walletManager.createAgentWallet();
        res.json({
            address: wallet.address,
            message: 'Wallet created successfully. Private key encrypted and stored securely.'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/wallet/balance/:address - Get wallet balance
router.get('/balance/:address', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const balance = await walletManager.getBalance(req.params.address);
        res.json({ balance });
    } catch (error) {
        next(error);
    }
});

export default router;

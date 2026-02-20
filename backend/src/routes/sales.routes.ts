import { Router } from 'express';
import { createSale, getSales, getSaleById } from '../controllers/sales.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getSales);
router.get('/:id', getSaleById);
router.post('/', createSale);

export default router;

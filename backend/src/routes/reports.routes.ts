import { Router } from 'express';
import { getDailyReport, getRangeReport, getInventoryReport } from '../controllers/reports.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/daily', getDailyReport);
router.get('/range', getRangeReport);
router.get('/inventory', getInventoryReport);

export default router;

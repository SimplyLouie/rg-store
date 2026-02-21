import { Router } from 'express';
import {
  getProducts,
  getProductById,
  getProductByBarcode,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getCategories,
  checkSkuAvailability,
} from '../controllers/products.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/barcode/:barcode', getProductByBarcode);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);
router.post('/:id/adjust-stock', adjustStock);
router.get('/check-sku/:sku', checkSkuAvailability);

export default router;

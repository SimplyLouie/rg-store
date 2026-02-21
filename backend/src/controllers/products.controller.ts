import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const { search, category, lowStock } = req.query;

  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: String(search), mode: 'insensitive' } },
      { sku: { contains: String(search), mode: 'insensitive' } },
      { barcode: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  if (lowStock === 'true') {
    // Note: Cross-field comparison (stock <= lowStockThreshold) is done post-query 
    // to maintain database portability and avoid complex raw queries for small datasets.
  }

  // Set caching headers for product list
  res.setHeader('Cache-Control', 'public, s-maxage=10, stale-while-revalidate=59');

  const allProducts = await prisma.product.findMany({
    where,
    orderBy: { name: 'asc' },
  });

  const productsWithFlags = allProducts
    .filter((p) => (lowStock === 'true' ? p.stock <= p.lowStockThreshold : true))
    .map((p) => ({
      ...p,
      isLowStock: p.stock <= p.lowStockThreshold,
      price: Number(p.price),
      cost: Number(p.cost),
    }));

  res.json(productsWithFlags);
};

export const getProductById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  res.json({ ...product, price: Number(product.price), cost: Number(product.cost) });
};

export const getProductByBarcode = async (req: Request, res: Response): Promise<void> => {
  const { barcode } = req.params;

  const product = await prisma.product.findUnique({ where: { barcode } });

  if (!product) {
    res.status(404).json({ message: 'Product not found for this barcode' });
    return;
  }

  res.json({ ...product, price: Number(product.price), cost: Number(product.cost) });
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, sku, barcode, category, price, cost, stock, lowStockThreshold, imageUrl } = req.body;

    if (!name || !sku || !category || price === undefined || cost === undefined) {
      res.status(400).json({ message: 'Name, SKU, category, price, and cost are required' });
      return;
    }

    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) {
      res.status(409).json({ message: 'SKU already exists' });
      return;
    }

    if (barcode) {
      const barcodeExists = await prisma.product.findUnique({ where: { barcode } });
      if (barcodeExists) {
        res.status(409).json({ message: 'Barcode already exists' });
        return;
      }
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        barcode: barcode || null,
        category,
        price,
        cost,
        stock: stock || 0,
        lowStockThreshold: lowStockThreshold || 10,
        imageUrl: imageUrl || null,
      },
    });

    if (stock && stock > 0) {
      await prisma.stockMovement.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: stock,
          reason: 'Initial stock',
        },
      });
    }

    res.status(201).json({ ...product, price: Number(product.price), cost: Number(product.cost) });
  } catch (error: any) {
    console.error('Error creating product:', error);
    res.status(500).json({
      message: 'Failed to create product',
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, sku, barcode, category, price, cost, stock, lowStockThreshold, imageUrl, isActive } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    if (sku && sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({ where: { sku } });
      if (skuExists) {
        res.status(409).json({ message: 'SKU already exists' });
        return;
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sku && { sku }),
        ...(barcode !== undefined && { barcode: barcode || null }),
        ...(category && { category }),
        ...(price !== undefined && { price }),
        ...(cost !== undefined && { cost }),
        ...(lowStockThreshold !== undefined && { lowStockThreshold }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json({ ...product, price: Number(product.price), cost: Number(product.cost) });
  } catch (error: any) {
    console.error('Error updating product:', error);
    res.status(500).json({
      message: 'Failed to update product',
      error: error.message || 'Internal server error'
    });
  }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    res.status(404).json({ message: 'Product not found' });
    return;
  }

  // Soft delete
  await prisma.product.update({ where: { id }, data: { isActive: false } });

  res.json({ message: 'Product deleted successfully' });
};

export const adjustStock = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { quantity, type, reason } = req.body;

    if (!quantity || !type || !['IN', 'OUT'].includes(type)) {
      res.status(400).json({ message: 'quantity and type (IN/OUT) are required' });
      return;
    }

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      res.status(404).json({ message: 'Product not found' });
      return;
    }

    const newStock = type === 'IN' ? product.stock + quantity : product.stock - quantity;

    if (newStock < 0) {
      res.status(400).json({ message: 'Insufficient stock' });
      return;
    }

    const [updatedProduct] = await prisma.$transaction([
      prisma.product.update({ where: { id }, data: { stock: newStock } }),
      prisma.stockMovement.create({
        data: { productId: id, type, quantity, reason: reason || null },
      }),
    ]);

    res.json({ ...updatedProduct, price: Number(updatedProduct.price), cost: Number(updatedProduct.cost) });
  } catch (error: any) {
    console.error('Error adjusting stock:', error);
    res.status(500).json({
      message: 'Failed to adjust stock',
      error: error.message || 'Internal server error'
    });
  }
};

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const categories = await prisma.product.findMany({
    where: { isActive: true },
    select: { category: true },
    distinct: ['category'],
    orderBy: { category: 'asc' },
  });

  res.json(categories.map((c) => c.category));
};

export const checkSkuAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sku } = req.params;
    const { excludeId } = req.query;

    const existing = await prisma.product.findUnique({
      where: { sku },
    });

    const isAvailable = !existing || (excludeId && existing.id === excludeId);
    res.json({ available: !!isAvailable });
  } catch (error: any) {
    console.error('Error checking SKU availability:', error);
    res.status(500).json({ message: 'Error checking SKU availability' });
  }
};

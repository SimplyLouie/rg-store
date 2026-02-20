import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

interface SaleItemInput {
  productId: string;
  quantity: number;
  unitPrice: number;
}

export const createSale = async (req: Request, res: Response): Promise<void> => {
  const { items, paymentMethod, amountTendered } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    res.status(400).json({ message: 'Sale items are required' });
    return;
  }

  // Validate all products exist and have sufficient stock
  for (const item of items as SaleItemInput[]) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });

    if (!product) {
      res.status(404).json({ message: `Product ${item.productId} not found` });
      return;
    }

    if (product.stock < item.quantity) {
      res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      return;
    }
  }

  const totalAmount = (items as SaleItemInput[]).reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  const change = amountTendered ? amountTendered - totalAmount : null;

  const sale = await prisma.$transaction(async (tx) => {
    const createdSale = await tx.sale.create({
      data: {
        totalAmount,
        paymentMethod: paymentMethod || 'cash',
        amountTendered: amountTendered || null,
        change: change,
        saleItems: {
          create: (items as SaleItemInput[]).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.unitPrice * item.quantity,
          })),
        },
      },
      include: {
        saleItems: {
          include: { product: true },
        },
      },
    });

    // Deduct stock for each item
    for (const item of items as SaleItemInput[]) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: 'OUT',
          quantity: item.quantity,
          reason: `Sale #${createdSale.id}`,
        },
      });
    }

    return createdSale;
  });

  res.status(201).json({
    ...sale,
    totalAmount: Number(sale.totalAmount),
    amountTendered: sale.amountTendered ? Number(sale.amountTendered) : null,
    change: sale.change ? Number(sale.change) : null,
    saleItems: sale.saleItems.map((si) => ({
      ...si,
      unitPrice: Number(si.unitPrice),
      subtotal: Number(si.subtotal),
      product: {
        ...si.product,
        price: Number(si.product.price),
        cost: Number(si.product.cost),
      },
    })),
  });
};

export const getSales = async (req: Request, res: Response): Promise<void> => {
  const { date, startDate, endDate, limit } = req.query;

  const where: any = {};

  if (date) {
    const start = new Date(String(date));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    where.createdAt = { gte: start, lte: end };
  } else if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(String(startDate)),
      lte: new Date(String(endDate)),
    };
  }

  const sales = await prisma.sale.findMany({
    where,
    include: {
      saleItems: { include: { product: { select: { name: true, sku: true } } } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(String(limit)) : 50,
  });

  res.json(
    sales.map((s) => ({
      ...s,
      totalAmount: Number(s.totalAmount),
      amountTendered: s.amountTendered ? Number(s.amountTendered) : null,
      change: s.change ? Number(s.change) : null,
      saleItems: s.saleItems.map((si) => ({
        ...si,
        unitPrice: Number(si.unitPrice),
        subtotal: Number(si.subtotal),
      })),
    }))
  );
};

export const getSaleById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      saleItems: { include: { product: true } },
    },
  });

  if (!sale) {
    res.status(404).json({ message: 'Sale not found' });
    return;
  }

  res.json({
    ...sale,
    totalAmount: Number(sale.totalAmount),
    amountTendered: sale.amountTendered ? Number(sale.amountTendered) : null,
    change: sale.change ? Number(sale.change) : null,
    saleItems: sale.saleItems.map((si) => ({
      ...si,
      unitPrice: Number(si.unitPrice),
      subtotal: Number(si.subtotal),
      product: {
        ...si.product,
        price: Number(si.product.price),
        cost: Number(si.product.cost),
      },
    })),
  });
};

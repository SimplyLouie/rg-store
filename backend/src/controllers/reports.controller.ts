import { Request, Response } from 'express';
import { prisma } from '../prisma/client';

export const getDailyReport = async (req: Request, res: Response): Promise<void> => {
  const { date } = req.query;

  const targetDate = date ? new Date(String(date)) : new Date();
  const start = new Date(targetDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(targetDate);
  end.setHours(23, 59, 59, 999);

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end } },
    include: {
      saleItems: {
        include: {
          product: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });

  const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
  const totalTransactions = sales.length;
  const avgTransactionValue = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Top selling products
  const productSalesMap = new Map<string, { name: string; category: string; qty: number; revenue: number }>();

  for (const sale of sales) {
    for (const item of sale.saleItems) {
      const key = item.productId;
      const existing = productSalesMap.get(key) || {
        name: item.product.name,
        category: item.product.category,
        qty: 0,
        revenue: 0,
      };
      productSalesMap.set(key, {
        ...existing,
        qty: existing.qty + item.quantity,
        revenue: existing.revenue + Number(item.subtotal),
      });
    }
  }

  const topProducts = Array.from(productSalesMap.entries())
    .map(([productId, data]) => ({ productId, ...data }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Hourly breakdown
  const hourlyMap = new Map<number, { transactions: number; revenue: number }>();
  for (let h = 0; h < 24; h++) hourlyMap.set(h, { transactions: 0, revenue: 0 });

  for (const sale of sales) {
    const hour = new Date(sale.createdAt).getHours();
    const existing = hourlyMap.get(hour)!;
    hourlyMap.set(hour, {
      transactions: existing.transactions + 1,
      revenue: existing.revenue + Number(sale.totalAmount),
    });
  }

  const hourlyBreakdown = Array.from(hourlyMap.entries()).map(([hour, data]) => ({
    hour,
    label: `${hour.toString().padStart(2, '0')}:00`,
    ...data,
  }));

  res.json({
    date: start.toISOString().split('T')[0],
    summary: {
      totalRevenue,
      totalTransactions,
      avgTransactionValue,
    },
    topProducts,
    hourlyBreakdown,
  });
};

export const getRangeReport = async (req: Request, res: Response): Promise<void> => {
  const { days } = req.query;
  const numDays = parseInt(String(days || '7'));

  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const start = new Date();
  start.setDate(start.getDate() - numDays + 1);
  start.setHours(0, 0, 0, 0);

  const sales = await prisma.sale.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { totalAmount: true, createdAt: true },
  });

  // Group by date
  const dateMap = new Map<string, { revenue: number; transactions: number }>();

  // Fill in all dates
  for (let i = 0; i < numDays; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().split('T')[0];
    dateMap.set(key, { revenue: 0, transactions: 0 });
  }

  for (const sale of sales) {
    const key = new Date(sale.createdAt).toISOString().split('T')[0];
    const existing = dateMap.get(key) || { revenue: 0, transactions: 0 };
    dateMap.set(key, {
      revenue: existing.revenue + Number(sale.totalAmount),
      transactions: existing.transactions + 1,
    });
  }

  const data = Array.from(dateMap.entries()).map(([date, values]) => ({
    date,
    ...values,
  }));

  res.json({ data, days: numDays });
};

export const getInventoryReport = async (_req: Request, res: Response): Promise<void> => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { stock: 'asc' },
  });

  const totalProducts = products.length;
  const lowStockProducts = products.filter((p) => p.stock <= p.lowStockThreshold);
  const outOfStockProducts = products.filter((p) => p.stock === 0);
  const totalInventoryValue = products.reduce((sum, p) => sum + Number(p.cost) * p.stock, 0);
  const totalRetailValue = products.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);

  const byCategory = products.reduce(
    (acc, p) => {
      const cat = p.category;
      if (!acc[cat]) acc[cat] = { count: 0, stock: 0, value: 0 };
      acc[cat].count += 1;
      acc[cat].stock += p.stock;
      acc[cat].value += Number(p.cost) * p.stock;
      return acc;
    },
    {} as Record<string, { count: number; stock: number; value: number }>
  );

  res.json({
    summary: {
      totalProducts,
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts.length,
      totalInventoryValue,
      totalRetailValue,
    },
    lowStockProducts: lowStockProducts.map((p) => ({
      ...p,
      price: Number(p.price),
      cost: Number(p.cost),
    })),
    byCategory,
  });
};

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const products = [
    { name: 'Coca Cola 1.5L', sku: 'BEV-001', barcode: '4902102072939', category: 'Beverages', price: 85, cost: 60, stock: 50, lowStockThreshold: 10 },
    { name: 'Pepsi 1.5L', sku: 'BEV-002', barcode: '4902102072946', category: 'Beverages', price: 80, cost: 55, stock: 45, lowStockThreshold: 10 },
    { name: 'Lays Classic 60g', sku: 'SNK-001', barcode: '028400090032', category: 'Snacks', price: 45, cost: 30, stock: 100, lowStockThreshold: 20 },
    { name: 'Lucky Me Pancit Canton', sku: 'NOO-001', barcode: '4807088820019', category: 'Noodles', price: 15, cost: 10, stock: 200, lowStockThreshold: 50 },
    { name: 'Tide Detergent 66g', sku: 'CLN-001', barcode: '4902430543873', category: 'Cleaning', price: 12, cost: 8, stock: 150, lowStockThreshold: 30 },
    { name: 'Kopiko 3-in-1 Coffee', sku: 'COF-001', barcode: '8852013017043', category: 'Beverages', price: 10, cost: 6, stock: 300, lowStockThreshold: 50 },
    { name: 'Sky Flakes Crackers', sku: 'SNK-002', barcode: '4804888104003', category: 'Snacks', price: 20, cost: 14, stock: 80, lowStockThreshold: 20 },
    { name: 'Bear Brand 33g', sku: 'MLK-001', barcode: '4800361101018', category: 'Dairy', price: 18, cost: 12, stock: 120, lowStockThreshold: 30 },
    { name: 'Marlboro Red', sku: 'CIG-001', barcode: '5000159461732', category: 'Tobacco', price: 150, cost: 120, stock: 30, lowStockThreshold: 10 },
    { name: 'Safeguard Soap 90g', sku: 'SOA-001', barcode: '6912345678901', category: 'Personal Care', price: 35, cost: 25, stock: 5, lowStockThreshold: 10 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
  }

  console.log('Seed completed. Create your admin user in Supabase Dashboard > Authentication > Users.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

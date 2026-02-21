export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string | null;
  isActive: boolean;
  isLowStock?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  lowStockThreshold: number;
  imageUrl?: string;
}

export interface StockAdjustment {
  quantity: number;
  type: 'IN' | 'OUT';
  reason?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface SaleItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { name: string; sku: string };
}

export interface Sale {
  id: string;
  totalAmount: number;
  amountTendered?: number | null;
  change?: number | null;
  paymentMethod: string;
  createdAt: string;
  saleItems: SaleItem[];
}

export interface CreateSaleData {
  items: { productId: string; quantity: number; unitPrice: number }[];
  paymentMethod: string;
  amountTendered?: number;
}

export interface DailyReport {
  date: string;
  summary: {
    totalRevenue: number;
    totalTransactions: number;
    avgTransactionValue: number;
  };
  topProducts: {
    productId: string;
    name: string;
    category: string;
    qty: number;
    revenue: number;
  }[];
  hourlyBreakdown: {
    hour: number;
    label: string;
    transactions: number;
    revenue: number;
  }[];
}

export interface RangeReport {
  data: { date: string; revenue: number; transactions: number }[];
  days: number;
}

export interface InventoryReport {
  summary: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalInventoryValue: number;
    totalRetailValue: number;
  };
  lowStockProducts: Product[];
  byCategory: Record<string, { count: number; stock: number; value: number }>;
}

export interface User {
  id: string;
  email: string;
}

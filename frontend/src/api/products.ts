import { api } from './client';
import { Product, ProductFormData, StockAdjustment } from '../types';

export const productsApi = {
  getAll: (params?: { search?: string; category?: string; lowStock?: boolean }) =>
    api.get<Product[]>('/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Product>(`/products/${id}`).then((r) => r.data),

  getByBarcode: (barcode: string) =>
    api.get<Product>(`/products/barcode/${barcode}`).then((r) => r.data),

  getCategories: () =>
    api.get<string[]>('/products/categories').then((r) => r.data),

  create: (data: ProductFormData) =>
    api.post<Product>('/products', data).then((r) => r.data),

  update: (id: string, data: Partial<ProductFormData>) =>
    api.put<Product>(`/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/products/${id}`).then((r) => r.data),

  adjustStock: (id: string, data: StockAdjustment) =>
    api.post<Product>(`/products/${id}/adjust-stock`, data).then((r) => r.data),

  checkSku: (sku: string, excludeId?: string) =>
    api.get<{ available: boolean }>(`/products/check-sku/${sku}`, { params: { excludeId } }).then((r) => r.data),
};

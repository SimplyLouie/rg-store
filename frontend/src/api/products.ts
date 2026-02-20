import { api } from './client';
import { Product, ProductFormData, StockAdjustment } from '../types';

export const productsApi = {
  getAll: (params?: { search?: string; category?: string; lowStock?: boolean }) =>
    api.get<Product[]>('/api/products', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Product>(`/api/products/${id}`).then((r) => r.data),

  getByBarcode: (barcode: string) =>
    api.get<Product>(`/api/products/barcode/${barcode}`).then((r) => r.data),

  getCategories: () =>
    api.get<string[]>('/api/products/categories').then((r) => r.data),

  create: (data: ProductFormData) =>
    api.post<Product>('/api/products', data).then((r) => r.data),

  update: (id: string, data: Partial<ProductFormData>) =>
    api.put<Product>(`/api/products/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/products/${id}`).then((r) => r.data),

  adjustStock: (id: string, data: StockAdjustment) =>
    api.post<Product>(`/api/products/${id}/adjust-stock`, data).then((r) => r.data),
};

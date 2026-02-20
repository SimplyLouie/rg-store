import { api } from './client';
import { Sale, CreateSaleData } from '../types';

export const salesApi = {
  getAll: (params?: { date?: string; limit?: number }) =>
    api.get<Sale[]>('/api/sales', { params }).then((r) => r.data),

  getById: (id: string) =>
    api.get<Sale>(`/api/sales/${id}`).then((r) => r.data),

  create: (data: CreateSaleData) =>
    api.post<Sale>('/api/sales', data).then((r) => r.data),
};

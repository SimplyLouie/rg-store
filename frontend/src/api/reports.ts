import { api } from './client';
import { DailyReport, RangeReport, InventoryReport } from '../types';

export const reportsApi = {
  getDaily: (date?: string) =>
    api.get<DailyReport>('/api/reports/daily', { params: { date } }).then((r) => r.data),

  getRange: (days?: number) =>
    api.get<RangeReport>('/api/reports/range', { params: { days } }).then((r) => r.data),

  getInventory: () =>
    api.get<InventoryReport>('/api/reports/inventory').then((r) => r.data),
};

import { api } from './client';
import { DailyReport, RangeReport, InventoryReport } from '../types';

export const reportsApi = {
  getDaily: (date?: string) =>
    api.get<DailyReport>('/reports/daily', { params: { date } }).then((r) => r.data),

  getRange: (days?: number) =>
    api.get<RangeReport>('/reports/range', { params: { days } }).then((r) => r.data),

  getInventory: () =>
    api.get<InventoryReport>('/reports/inventory').then((r) => r.data),
};

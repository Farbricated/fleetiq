import { api } from './client';
import type { DashboardSummary, FleetAnalyticsSummary } from '../types';

export const dashboardApi = {
  getSummary: () => api.get<DashboardSummary>('/dashboard/summary'),
  getFleetAnalytics: () => api.get<FleetAnalyticsSummary>('/analytics/fleet'),
  triggerOverdueCheck: () => api.post<{ status: string; alerts_created: number }>('/system/check_overdue'),
  triggerUnderutilizationCheck: () => api.post<{ status: string; alerts_created: number }>('/system/check_underutilization'),
};

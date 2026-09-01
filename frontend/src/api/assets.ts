import { api } from './client';
import type {
  Asset, UsageDaily, Telemetry, Event,
  AnalyticsResult, RiskResult,
  Operator, Site,
} from '../types';

export const assetsApi = {
  getAll: () => api.get<Asset[]>('/assets'),
  getById: (id: string) => api.get<Asset>(`/assets/${id}`),
  getUsage: (id: string) => api.get<UsageDaily[]>(`/assets/${id}/usage`),
  getTelemetry: (id: string) => api.get<Telemetry[]>(`/assets/${id}/telemetry`),
  getEvents: (id: string) => api.get<Event[]>(`/assets/${id}/events`),
  getAnalytics: (id: string) => api.get<AnalyticsResult>(`/assets/${id}/analytics`),
  getRisk: (id: string) => api.get<RiskResult>(`/assets/${id}/risk`),
  assignOperator: (assetId: string, operatorId: string) =>
    api.post(`/assets/${assetId}/operator`, { operator_id: operatorId }),
  unassignOperator: (assetId: string) =>
    api.post(`/assets/${assetId}/operator/unassign`),
};

export const operatorsApi = {
  getAll: () => api.get<Operator[]>('/operators'),
  getById: (id: string) => api.get<Operator>(`/operators/${id}`),
};

export const sitesApi = {
  getAll: () => api.get<Site[]>('/sites'),
  getById: (id: string) => api.get<Site>(`/sites/${id}`),
};

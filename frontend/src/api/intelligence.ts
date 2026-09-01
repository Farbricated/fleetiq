import { api } from './client';
import type { Forecast, Recommendation, ImpactRecord, AllocationCandidate } from '../types';

export const forecastsApi = {
  getAll: () => api.get<Forecast[]>('/forecasts'),
  getBySite: (siteId: string) => api.get<Forecast[]>(`/sites/${siteId}/forecasts`),
  generate: () => api.post<{ status: string; forecasts_generated: number }>('/forecasts/generate'),
  getCandidates: (forecastId: string) => api.get<AllocationCandidate[]>(`/forecasts/${forecastId}/candidates`),
  triggerCandidates: (forecastId: string) => api.post<AllocationCandidate[]>(`/forecasts/${forecastId}/candidates`),
};

export const recommendationsApi = {
  getAll: () => api.get<Recommendation[]>('/recommendations'),
  getById: (id: string) => api.get<Recommendation>(`/recommendations/${id}`),
  create: (candidateId: string) => api.post<Recommendation>(`/candidates/${candidateId}/recommend`),
  approve: (id: string, notes?: string) => api.post<Recommendation>(`/recommendations/${id}/approve`, { notes }),
  reject: (id: string, notes?: string) => api.post<Recommendation>(`/recommendations/${id}/reject`, { notes }),
  execute: (id: string, notes?: string) => api.post<Recommendation>(`/recommendations/${id}/execute`, { notes }),
  getImpact: (id: string) => api.get<ImpactRecord[]>(`/recommendations/${id}/impact`),
};

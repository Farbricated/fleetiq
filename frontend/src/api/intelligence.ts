import { api } from './client';
import type { Forecast, Recommendation } from '../types';
import type { MockForecast, AllocationCandidate } from '../types';

// ─── Real backend endpoints ───
export const forecastsApi = {
  getAll: () => api.get<Forecast[]>('/forecasts'),
  getBySite: (siteId: string) => api.get<Forecast[]>(`/sites/${siteId}/forecasts`),
};

export const recommendationsApi = {
  getAll: () => api.get<Recommendation[]>('/recommendations'),
  getById: (id: string) => api.get<Recommendation>(`/recommendations/${id}`),
};

// ─── MOCK DATA ─── Phase 7–9 endpoints not yet implemented by backend.
// These typed mocks replicate the expected schema. Replace by wiring
// forecastsApi / candidatesApi to real endpoints when backend delivers.

/**
 * @provenance SIMULATED
 * Mock demand forecasts — Phase 7 pending.
 * Replace this function body with `forecastsApi.getAll()` when real endpoint is available.
 */
export function getMockForecasts(): MockForecast[] {
  return [
    {
      id: 'fc-001',
      site_id: 'S003',
      site_name: 'Site S003 — Northern Quarry',
      equipment_type: 'Excavator',
      forecast_date: '2025-04-22',
      predicted_quantity: 1,
      confidence: 0.82,
      provenance: 'SIMULATED',
    },
    {
      id: 'fc-002',
      site_id: 'S001',
      site_name: 'Site S001 — River Basin',
      equipment_type: 'Bulldozer',
      forecast_date: '2025-04-25',
      predicted_quantity: 1,
      confidence: 0.71,
      provenance: 'SIMULATED',
    },
    {
      id: 'fc-003',
      site_id: 'S005',
      site_name: 'Site S005 — Highway Extension',
      equipment_type: 'Motor Grader',
      forecast_date: '2025-05-01',
      predicted_quantity: 2,
      confidence: 0.65,
      provenance: 'SIMULATED',
    },
  ];
}

/**
 * @provenance DERIVED
 * Mock allocation candidates — Phase 8 pending.
 * Replace with real `/allocation_candidates` API call when backend delivers.
 */
export function getMockCandidates(forecastId: string): AllocationCandidate[] {
  if (forecastId === 'fc-001') {
    return [
      {
        id: 'cand-001',
        forecast_id: 'fc-001',
        asset_id: 'EQX1007',
        score: 91,
        rank: 1,
        reasoning: {
          underutilization_penalty: 70,
          distance_factor: 'SAME_REGION',
          idle_hours: 12,
          engine_hours: 0,
          operator_gap: 'UNASSIGNED',
        },
        provenance: 'DERIVED',
      },
      {
        id: 'cand-002',
        forecast_id: 'fc-001',
        asset_id: 'EQX1004',
        score: 45,
        rank: 2,
        reasoning: {
          underutilization_penalty: 30,
          distance_factor: 'NEAR',
          idle_hours: 4,
          engine_hours: 6,
          operator_gap: 'ASSIGNED',
        },
        provenance: 'DERIVED',
      },
    ];
  }
  return [];
}

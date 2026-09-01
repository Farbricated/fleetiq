import { api } from './client';
import type { Alert } from '../types';

export const alertsApi = {
  getAll: () => api.get<Alert[]>('/alerts'),
  getById: (id: string) => api.get<Alert>(`/alerts/${id}`),
};

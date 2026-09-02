import { api } from './client';
import type { RentalOrder, RentalCheckoutRequest, RentalCheckinRequest } from '../types';

export const rentalsApi = {
  getAll: () => api.get<RentalOrder[]>('/rentals'),
  getById: (id: string) => api.get<RentalOrder>(`/rentals/${id}`),
  create: (data?: { site_id?: string; customer_id?: string }) => api.post<RentalOrder>('/rentals', data),
  checkout: (rentalId: string, req: RentalCheckoutRequest) =>
    api.post<{ status: string; rental_item_id: string }>(`/rentals/${rentalId}/checkout`, req),
  checkin: (rentalId: string, req: RentalCheckinRequest) =>
    api.post<{ status: string }>(`/rentals/${rentalId}/checkin`, req),
};

import { api } from './client';

export interface ChatRequest {
  message: string;
  asset_id?: string;
  current_page?: string;
}

export interface ChatResponse {
  answer: string;
  sources: string[];
  model: string;
  grounded: boolean;
}

export const chatApi = {
  sendMessage: (payload: ChatRequest) => api.post<ChatResponse>('/chat', payload),
  getAssetExplanation: (assetId: string) => api.get<ChatResponse>(`/chat/asset/${assetId}/explanation`),
};

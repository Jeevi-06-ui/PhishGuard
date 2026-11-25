import { apiConfig, apiRequest } from './apiClient';
import type { SystemHealthResponse } from '@/types/api';

export function createOfflineHealthSnapshot(reason?: string): SystemHealthResponse {
  const message =
    reason ??
    (apiConfig.isConfigured
      ? 'Unable to reach FastAPI endpoint'
      : 'Awaiting Phase 3 FastAPI connection');

  return {
    backend: {
      status: 'offline',
      message,
      detail: apiConfig.isConfigured ? apiConfig.baseUrl : apiConfig.plannedEndpoint,
    },
    mlModel: {
      status: 'offline',
      message: 'Trained Scikit-learn model loads inside backend service',
    },
    blockchain: {
      status: 'offline',
      message: 'Awaiting Hardhat / Ethereum RPC via Web3.py',
    },
    checkedAt: new Date().toISOString(),
  };
}

export const healthService = {
  getHealth: (): Promise<SystemHealthResponse> => apiRequest<SystemHealthResponse>('/health'),
};

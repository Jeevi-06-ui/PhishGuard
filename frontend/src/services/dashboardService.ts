import { apiRequest } from './apiClient';
import type { DashboardSummaryResponse } from '@/types/api';

export function createEmptyDashboardSummary(): DashboardSummaryResponse {
  return {
    totalScans: null,
    phishingDetected: null,
    legitimatePredictions: null,
    blockchainRecordsVerified: null,
    modelAccuracy: null,
    threatDistribution: [],
    scanningActivity: [],
    recentScans: [],
    recentTransactions: [],
  };
}

export const dashboardService = {
  getSummary: (): Promise<DashboardSummaryResponse> =>
    apiRequest<DashboardSummaryResponse>('/dashboard/summary'),
};

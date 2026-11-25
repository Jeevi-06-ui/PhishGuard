import { apiRequest } from './apiClient';
import type { MlAnalyticsResponse } from '@/types/api';

export function createEmptyMlAnalytics(): MlAnalyticsResponse {
  return {
    dataset: null,
    activeModel: null,
    models: [],
    confusionMatrix: null,
    featureImportance: [],
    supportsFeatureImportance: false,
  };
}

export const analyticsService = {
  getAnalytics: (): Promise<MlAnalyticsResponse> =>
    apiRequest<MlAnalyticsResponse>('/ml/analytics'),
};

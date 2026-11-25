import { apiRequest } from './apiClient';
import type {
  ScanAnalyzeRequest,
  ScanHistoryParams,
  ScanHistoryResponse,
  ScanResult,
} from '@/types/api';

export const scannerService = {
  analyzeUrl: (payload: ScanAnalyzeRequest): Promise<ScanResult> =>
    apiRequest<ScanResult>('/scans/analyze', {
      method: 'POST',
      body: payload,
    }),

  getHistory: (query: ScanHistoryParams): Promise<ScanHistoryResponse> =>
    apiRequest<ScanHistoryResponse>('/scans', {
      query: {
        page: query.page,
        pageSize: query.pageSize,
        search: query.search,
        prediction: query.prediction === 'all' ? undefined : query.prediction,
        blockchainStatus: query.blockchainStatus === 'all' ? undefined : query.blockchainStatus,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      },
    }),

  getScanById: (scanId: string): Promise<ScanResult> =>
    apiRequest<ScanResult>(`/scans/${encodeURIComponent(scanId)}`),
};

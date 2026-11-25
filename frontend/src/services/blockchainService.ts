import { apiRequest } from './apiClient';
import type {
  BlockchainAnchorRequest,
  BlockchainNetworkStatus,
  BlockchainRecord,
  BlockchainRecordsResponse,
  BlockchainVerificationResult,
  BlockchainVerifyRequest,
} from '@/types/api';

export function createDisconnectedBlockchainStatus(): BlockchainNetworkStatus {
  return {
    connected: false,
    networkName: null,
    chainId: null,
    contractAddress: null,
    totalRecordedScans: null,
    latestBlock: null,
  };
}

export const blockchainService = {
  getStatus: (): Promise<BlockchainNetworkStatus> =>
    apiRequest<BlockchainNetworkStatus>('/blockchain/status'),

  getRecords: (page = 1, pageSize = 20): Promise<BlockchainRecordsResponse> =>
    apiRequest<BlockchainRecordsResponse>('/blockchain/records', {
      query: { page, pageSize },
    }),

  recordScan: (payload: BlockchainAnchorRequest): Promise<BlockchainRecord> =>
    apiRequest<BlockchainRecord>('/blockchain/record', {
      method: 'POST',
      body: payload,
    }),

  verifyRecord: (payload: BlockchainVerifyRequest): Promise<BlockchainVerificationResult> =>
    apiRequest<BlockchainVerificationResult>('/blockchain/verify', {
      method: 'POST',
      body: payload,
    }),
};

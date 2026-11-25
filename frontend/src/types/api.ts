export type ServiceConnectionState = 'online' | 'offline' | 'degraded' | 'checking';

export type PredictionLabel = 'Phishing' | 'Legitimate' | 'Suspicious';

export type BlockchainTxStatus = 'verified' | 'pending' | 'not_recorded' | 'failed';

export interface SubsystemHealth {
  status: ServiceConnectionState;
  message: string;
  version?: string;
  latencyMs?: number;
  detail?: string;
}

export interface SystemHealthResponse {
  backend: SubsystemHealth;
  mlModel: SubsystemHealth & {
    activeModel?: string;
    trainedAt?: string;
  };
  blockchain: SubsystemHealth & {
    networkName?: string;
    chainId?: number;
    contractAddress?: string;
    latestBlock?: number;
  };
  checkedAt: string;
}

export interface UrlFeatureItem {
  key: string;
  label: string;
  value: string | number | boolean;
  riskSignal: 'low' | 'medium' | 'high' | 'neutral';
  description: string;
}

export interface ScanResult {
  scanId: string;
  url: string;
  normalizedUrl: string;
  hostname: string;
  redactedUrl: string;
  urlSha256: string;
  prediction: PredictionLabel;
  phishingProbability: number; // 0 to 1
  riskScore: number; // 0 to 100
  confidence: number; // 0 to 1
  modelName: string;
  modelVersion: string;
  analyzedAt: string;
  features: UrlFeatureItem[];
  recommendations: string[];
  blockchainStatus: BlockchainTxStatus;
  blockchainTxHash?: string | null;
  blockNumber?: number | null;
}

export interface ScanAnalyzeRequest {
  url: string;
}

export interface ScanHistoryParams {
  page: number;
  pageSize: number;
  search?: string;
  prediction?: PredictionLabel | 'all';
  blockchainStatus?: BlockchainTxStatus | 'all';
  sortBy?: 'analyzedAt' | 'riskScore';
  sortOrder?: 'asc' | 'desc';
}

export interface ScanHistoryResponse {
  items: ScanResult[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ThreatDistributionSlice {
  name: string;
  value: number;
  color: string;
}

export interface ActivitySeriesPoint {
  date: string;
  total: number;
  phishing: number;
  legitimate: number;
}

export interface BlockchainRecord {
  recordId: string;
  scanId: string;
  txHash: string;
  blockNumber: number;
  timestamp: string;
  urlHash: string;
  hostname: string;
  prediction: PredictionLabel;
  riskScore: number;
  modelVersion: string;
  contractAddress: string;
  gasUsed?: number;
  verified: boolean;
}

export interface DashboardSummaryResponse {
  totalScans: number | null;
  phishingDetected: number | null;
  legitimatePredictions: number | null;
  blockchainRecordsVerified: number | null;
  modelAccuracy: number | null;
  threatDistribution: ThreatDistributionSlice[];
  scanningActivity: ActivitySeriesPoint[];
  recentScans: ScanResult[];
  recentTransactions: BlockchainRecord[];
}

export interface BlockchainNetworkStatus {
  connected: boolean;
  networkName: string | null;
  chainId: number | null;
  contractAddress: string | null;
  totalRecordedScans: number | null;
  latestBlock: number | null;
}

export interface BlockchainRecordsResponse {
  items: BlockchainRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface BlockchainAnchorRequest {
  scanId: string;
}

export interface BlockchainVerifyRequest {
  txHash?: string;
  urlHash?: string;
  url?: string;
}

export interface BlockchainVerificationResult {
  verified: boolean;
  existsOnChain: boolean;
  txHash?: string;
  blockNumber?: number;
  timestamp?: string;
  storedUrlHash?: string;
  prediction?: PredictionLabel;
  riskScore?: number;
  message: string;
}

export interface ModelComparisonMetric {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc?: number;
  isProduction: boolean;
}

export interface ConfusionMatrixData {
  truePositive: number;
  falsePositive: number;
  trueNegative: number;
  falseNegative: number;
}

export interface FeatureImportanceItem {
  feature: string;
  label: string;
  importance: number;
}

export interface MlAnalyticsResponse {
  dataset: {
    name: string;
    source: string;
    totalSamples: number;
    trainingSamples: number;
    testingSamples: number;
    featureCount: number;
    phishingRatio: number;
  } | null;
  activeModel: {
    name: string;
    version: string;
    trainedAt: string;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
  } | null;
  models: ModelComparisonMetric[];
  confusionMatrix: ConfusionMatrixData | null;
  featureImportance: FeatureImportanceItem[];
  supportsFeatureImportance: boolean;
}

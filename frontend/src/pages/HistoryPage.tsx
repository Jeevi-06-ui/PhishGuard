import { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  History,
  RefreshCw,
  Search,
  ServerOff,
} from 'lucide-react';
import {
  BlockchainStatusBadge,
  EmptyState,
  GlassCard,
  PredictionBadge,
  ServiceOfflineNotice,
  SlideDrawer,
  TableSkeleton,
} from '@/components';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useToast } from '@/context/ToastContext';
import { ApiError, scannerService } from '@/services';
import type {
  BlockchainTxStatus,
  PredictionLabel,
  ScanHistoryResponse,
  ScanResult,
} from '@/types/api';
import { exportScansToCsv, formatPercent, formatTimestamp, truncateMiddle } from '@/utils/formatters';

const EMPTY_PAGE: ScanHistoryResponse = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
  totalPages: 1,
};

export function HistoryPage() {
  const { isApiConfigured } = useSystemStatus();
  const { showToast } = useToast();

  const [search, setSearch] = useState('');
  const [predictionFilter, setPredictionFilter] = useState<PredictionLabel | 'all'>('all');
  const [blockchainFilter, setBlockchainFilter] = useState<BlockchainTxStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'analyzedAt' | 'riskScore'>('analyzedAt');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState<ScanHistoryResponse>(EMPTY_PAGE);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedScan, setSelectedScan] = useState<ScanResult | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!isApiConfigured) {
      setData(EMPTY_PAGE);
      setErrorMsg(
        'Scan history database is disconnected until FastAPI + SQLite is configured in Phase 3.',
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await scannerService.getHistory({
        page,
        pageSize,
        search: search.trim() || undefined,
        prediction: predictionFilter,
        blockchainStatus: blockchainFilter,
        sortBy,
        sortOrder: 'desc',
      });
      setData(response);
    } catch (err) {
      setData(EMPTY_PAGE);
      setErrorMsg(err instanceof ApiError ? err.message : 'Unable to retrieve scan history.');
    } finally {
      setLoading(false);
    }
  }, [isApiConfigured, page, pageSize, search, predictionFilter, blockchainFilter, sortBy]);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const handleExportCsv = () => {
    if (data.items.length === 0) {
      showToast({
        variant: 'info',
        title: 'Nothing to export',
        description: 'No scan records are currently loaded.',
      });
      return;
    }
    exportScansToCsv(data.items);
    showToast({
      variant: 'success',
      title: 'CSV exported',
      description: `Downloaded ${data.items.length} scan record(s).`,
    });
  };

  const hasActiveFilters =
    search.trim().length > 0 || predictionFilter !== 'all' || blockchainFilter !== 'all';

  return (
    <div className="space-y-6">
      {errorMsg && (
        <ServiceOfflineNotice
          title="Scan History Archive Unavailable"
          description={errorMsg}
          onRetry={() => void fetchHistory()}
          isRetrying={loading}
        />
      )}

      {/* Search & Filters Bar */}
      <GlassCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by Scan ID or hostname..."
              aria-label="Search scan history"
              className="w-full rounded-xl border border-border-subtle bg-bg-elevated py-2.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              aria-label="Filter by prediction"
              value={predictionFilter}
              onChange={(e) => {
                setPredictionFilter(e.target.value as PredictionLabel | 'all');
                setPage(1);
              }}
              className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-medium text-text-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="all">All Predictions</option>
              <option value="Legitimate">Legitimate</option>
              <option value="Suspicious">Suspicious</option>
              <option value="Phishing">Phishing</option>
            </select>

            <select
              aria-label="Filter by blockchain status"
              value={blockchainFilter}
              onChange={(e) => {
                setBlockchainFilter(e.target.value as BlockchainTxStatus | 'all');
                setPage(1);
              }}
              className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-medium text-text-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="all">All Blockchain States</option>
              <option value="verified">Verified On-Chain</option>
              <option value="pending">Pending</option>
              <option value="not_recorded">Not Recorded</option>
              <option value="failed">Failed</option>
            </select>

            <select
              aria-label="Sort scans by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'analyzedAt' | 'riskScore')}
              className="rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-medium text-text-primary focus:border-accent-primary focus:outline-none"
            >
              <option value="analyzedAt">Sort: Latest First</option>
              <option value="riskScore">Sort: Highest Risk</option>
            </select>

            <button
              type="button"
              onClick={() => void fetchHistory()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-secondary transition-colors hover:border-accent-primary/40 hover:text-text-primary"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleExportCsv}
              disabled={data.items.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-accent-primary/40 bg-accent-primary/10 px-3.5 py-2 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/20 disabled:opacity-45"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </GlassCard>

      {/* History Table */}
      <GlassCard padding="none" className="overflow-hidden">
        {loading ? (
          <div className="p-6">
            <TableSkeleton rows={6} columns={7} />
          </div>
        ) : data.items.length === 0 ? (
          <EmptyState
            icon={errorMsg ? ServerOff : History}
            title={
              errorMsg
                ? 'Backend Database Offline'
                : hasActiveFilters
                  ? 'No Scans Match Your Filters'
                  : 'No Scan Records Stored Yet'
            }
            description={
              errorMsg
                ? 'Historical scan entries load from SQLite via the FastAPI /scans endpoint once the backend is started.'
                : hasActiveFilters
                  ? 'Adjust your search query or clear filters to inspect recorded scans.'
                  : 'Analyze a URL in the URL Scanner to create the first persisted record.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : 'Go to URL Scanner'}
            actionTo={hasActiveFilters ? undefined : '/scanner'}
            onAction={
              hasActiveFilters
                ? () => {
                    setSearch('');
                    setPredictionFilter('all');
                    setBlockchainFilter('all');
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border-subtle bg-bg-secondary/60 font-mono text-[11px] uppercase tracking-wider text-text-muted">
                <tr>
                  <th className="px-5 py-3.5">Scan ID</th>
                  <th className="px-5 py-3.5">Hostname / Redacted URL</th>
                  <th className="px-5 py-3.5">Prediction</th>
                  <th className="px-5 py-3.5">Risk Score</th>
                  <th className="px-5 py-3.5">Timestamp</th>
                  <th className="px-5 py-3.5">Blockchain Status</th>
                  <th className="px-5 py-3.5 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.items.map((scan) => (
                  <tr key={scan.scanId} className="transition-colors hover:bg-bg-secondary/40">
                    <td className="px-5 py-3.5 font-mono text-xs text-text-secondary">
                      {truncateMiddle(scan.scanId, 8, 4)}
                    </td>
                    <td className="max-w-xs px-5 py-3.5">
                      <p className="truncate font-mono text-xs font-semibold text-text-primary">
                        {scan.hostname}
                      </p>
                      <p className="truncate font-mono text-[11px] text-text-muted">
                        {scan.redactedUrl}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <PredictionBadge prediction={scan.prediction} />
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-bg-secondary">
                          <div
                            className={`h-full ${
                              scan.riskScore >= 70
                                ? 'bg-status-danger'
                                : scan.riskScore >= 40
                                  ? 'bg-status-warning'
                                  : 'bg-status-success'
                            }`}
                            style={{ width: `${scan.riskScore}%` }}
                          />
                        </div>
                        <span className="font-mono text-xs font-semibold text-text-primary">
                          {scan.riskScore}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-text-muted">
                      {formatTimestamp(scan.analyzedAt)}
                    </td>
                    <td className="px-5 py-3.5">
                      <BlockchainStatusBadge status={scan.blockchainStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedScan(scan)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 text-xs font-medium text-text-primary transition-colors hover:border-accent-primary/40 hover:text-accent-primary"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-border-subtle bg-bg-secondary/30 px-5 py-3.5 text-xs text-text-muted sm:flex-row">
          <div className="flex items-center gap-3">
            <span>
              Showing <strong className="text-text-primary">{data.items.length}</strong> of{' '}
              <strong className="text-text-primary">{data.total}</strong> record(s)
            </span>
            <select
              aria-label="Rows per page"
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-border-subtle bg-bg-elevated px-2 py-1 text-xs text-text-primary"
            >
              <option value={10}>10 / page</option>
              <option value={25}>25 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 font-medium text-text-primary disabled:opacity-45"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Prev</span>
            </button>
            <span className="font-mono">
              Page {data.page} / {Math.max(1, data.totalPages)}
            </span>
            <button
              type="button"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-elevated px-2.5 py-1.5 font-medium text-text-primary disabled:opacity-45"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </GlassCard>

      {/* Scan Details Drawer */}
      <SlideDrawer
        open={Boolean(selectedScan)}
        onClose={() => setSelectedScan(null)}
        title="Scan Inspection Details"
        subtitle={selectedScan ? `Scan ID: ${selectedScan.scanId}` : undefined}
      >
        {selectedScan && (
          <div className="space-y-5 text-sm">
            <div className="flex items-center justify-between">
              <PredictionBadge prediction={selectedScan.prediction} />
              <BlockchainStatusBadge status={selectedScan.blockchainStatus} />
            </div>

            <div className="space-y-2 rounded-xl border border-border-subtle bg-bg-secondary/50 p-4">
              <p className="text-xs text-text-muted">Redacted URL (Non-clickable)</p>
              <p className="break-all font-mono text-xs font-medium text-text-primary">
                {selectedScan.redactedUrl}
              </p>
              <p className="pt-1 text-xs text-text-muted">SHA-256 Digest</p>
              <p className="break-all font-mono text-[11px] text-text-secondary">
                {selectedScan.urlSha256}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-[11px] text-text-muted">Risk Score</p>
                <p className="mt-1 font-mono text-lg font-bold text-text-primary">
                  {selectedScan.riskScore}/100
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-[11px] text-text-muted">Phishing Prob.</p>
                <p className="mt-1 font-mono text-lg font-bold text-text-primary">
                  {formatPercent(selectedScan.phishingProbability)}
                </p>
              </div>
              <div className="rounded-xl border border-border-subtle p-3">
                <p className="text-[11px] text-text-muted">Confidence</p>
                <p className="mt-1 font-mono text-lg font-bold text-text-primary">
                  {formatPercent(selectedScan.confidence)}
                </p>
              </div>
            </div>

            {selectedScan.blockchainTxHash && (
              <div className="rounded-xl border border-status-success/30 bg-status-success/5 p-3.5 text-xs">
                <p className="font-semibold text-status-success">Ethereum Proof Anchored</p>
                <p className="mt-1 break-all font-mono text-text-primary">
                  Tx: {selectedScan.blockchainTxHash}
                </p>
                <p className="mt-0.5 font-mono text-text-muted">
                  Block #{selectedScan.blockNumber}
                </p>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Extracted Feature Signals
              </h4>
              <div className="mt-2.5 space-y-2">
                {selectedScan.features.map((feat) => (
                  <div
                    key={feat.key}
                    className="flex items-center justify-between rounded-lg border border-border-subtle px-3 py-2 text-xs"
                  >
                    <span className="text-text-secondary">{feat.label}</span>
                    <span className="font-mono font-semibold text-text-primary">
                      {String(feat.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SlideDrawer>
    </div>
  );
}

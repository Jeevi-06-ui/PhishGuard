import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Blocks,
  BrainCircuit,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  ScanSearch,
  Server,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BlockchainStatusBadge,
  EmptyState,
  GlassCard,
  HealthStatusBadge,
  KpiSkeletonGrid,
  PredictionBadge,
  ServiceOfflineNotice,
  Skeleton,
} from '@/components';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useToast } from '@/context/ToastContext';
import { ApiError, createEmptyDashboardSummary, dashboardService } from '@/services';
import type { DashboardSummaryResponse } from '@/types/api';
import { formatNumber, formatPercent, formatTimestamp, truncateMiddle } from '@/utils/formatters';

export function DashboardPage() {
  const { health, isApiConfigured, refreshHealth } = useSystemStatus();
  const { showToast } = useToast();
  const [summary, setSummary] = useState<DashboardSummaryResponse>(() =>
    createEmptyDashboardSummary(),
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!isApiConfigured) {
      setSummary(createEmptyDashboardSummary());
      setOfflineError(
        'Backend endpoint is not configured. Live statistics, charts, and blockchain transactions will populate automatically once FastAPI is connected.',
      );
      return;
    }

    setLoading(true);
    setOfflineError(null);
    try {
      const data = await dashboardService.getSummary();
      setSummary(data);
    } catch (err) {
      setSummary(createEmptyDashboardSummary());
      setOfflineError(
        err instanceof ApiError
          ? err.message
          : 'Unable to fetch dashboard summary from backend.',
      );
    } finally {
      setLoading(false);
    }
  }, [isApiConfigured]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const handleRefresh = async () => {
    const status = await refreshHealth();
    await loadDashboard();
    if (status.backend.status === 'online') {
      showToast({
        variant: 'success',
        title: 'Dashboard refreshed',
        description: 'Latest telemetry loaded from FastAPI backend.',
      });
    } else {
      showToast({
        variant: 'info',
        title: 'Backend unavailable',
        description: status.backend.message,
      });
    }
  };

  const isBackendOnline = health.backend.status === 'online' && !offlineError;

  const kpis = [
    {
      label: 'Total URLs Scanned',
      value: isBackendOnline ? formatNumber(summary.totalScans) : '—',
      icon: ScanSearch,
      tone: 'text-accent-primary',
      helper: 'Cumulative analyzed links',
    },
    {
      label: 'Phishing Detected',
      value: isBackendOnline ? formatNumber(summary.phishingDetected) : '—',
      icon: ShieldAlert,
      tone: 'text-status-danger',
      helper: 'Flagged high-risk URLs',
    },
    {
      label: 'Legitimate Predictions',
      value: isBackendOnline ? formatNumber(summary.legitimatePredictions) : '—',
      icon: ShieldCheck,
      tone: 'text-status-success',
      helper: 'Classified safe targets',
    },
    {
      label: 'Blockchain Verified',
      value: isBackendOnline ? formatNumber(summary.blockchainRecordsVerified) : '—',
      icon: Blocks,
      tone: 'text-accent-secondary',
      helper: 'Anchored SHA-256 digests',
    },
    {
      label: 'Model Evaluation Accuracy',
      value: formatPercent(summary.modelAccuracy),
      icon: BrainCircuit,
      tone: 'text-accent-primary',
      helper: 'Reported from ML artifact',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Service Status Bar */}
      <div className="grid gap-4 md:grid-cols-3">
        <GlassCard padding="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-secondary text-accent-primary">
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">Backend Service</p>
              <p className="text-sm font-semibold text-text-primary">FastAPI Gateway</p>
            </div>
          </div>
          <HealthStatusBadge state={health.backend.status} />
        </GlassCard>

        <GlassCard padding="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-secondary text-accent-secondary">
              <Blocks className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">Blockchain Connection</p>
              <p className="text-sm font-semibold text-text-primary">
                {health.blockchain.networkName || 'Ethereum RPC'}
              </p>
            </div>
          </div>
          <HealthStatusBadge state={health.blockchain.status} />
        </GlassCard>

        <GlassCard padding="sm" className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-secondary text-accent-primary">
              <BrainCircuit className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs font-medium text-text-muted">ML Model Status</p>
              <p className="text-sm font-semibold text-text-primary">
                {health.mlModel.activeModel || 'Scikit-learn Pipeline'}
              </p>
            </div>
          </div>
          <HealthStatusBadge
            state={health.mlModel.status}
            label={health.mlModel.status === 'online' ? 'Loaded' : 'Unavailable'}
          />
        </GlassCard>
      </div>

      {!isBackendOnline && (
        <ServiceOfflineNotice
          title="Awaiting Backend Telemetry"
          description={
            offlineError ||
            'Dashboard metrics remain in an honest empty state until the FastAPI backend, SQLite database, and Hardhat node are active.'
          }
          onRetry={() => void handleRefresh()}
          isRetrying={loading}
        />
      )}

      {/* KPI Metrics Row */}
      {loading ? (
        <KpiSkeletonGrid count={5} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <GlassCard key={kpi.label} hover padding="sm">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-medium text-text-muted">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpi.tone}`} />
                </div>
                <p className="mt-3 font-mono text-2xl font-bold tracking-tight text-text-primary">
                  {kpi.value}
                </p>
                <p className="mt-1 text-[11px] text-text-muted">{kpi.helper}</p>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Threat Distribution Doughnut Chart */}
        <GlassCard className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Threat Distribution</h2>
              <p className="text-xs text-text-muted">Breakdown of analyzed URL verdicts</p>
            </div>
            <button
              type="button"
              onClick={() => void handleRefresh()}
              aria-label="Refresh dashboard charts"
              className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : summary.threatDistribution.length === 0 ? (
              <EmptyState
                compact
                icon={Activity}
                title="No Distribution Data Available"
                description="Threat category proportions will render here once scans are processed by the ML backend."
                actionLabel="Open URL Scanner"
                actionTo="/scanner"
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary.threatDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={62}
                    outerRadius={92}
                    paddingAngle={4}
                  >
                    {summary.threatDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Scanning Activity Line Chart */}
        <GlassCard className="lg:col-span-7">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Scanning Activity Trend</h2>
            <p className="text-xs text-text-muted">
              Daily phishing vs. legitimate detections over time
            </p>
          </div>

          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : summary.scanningActivity.length === 0 ? (
              <EmptyState
                compact
                icon={ScanSearch}
                title="No Scanning Activity Recorded"
                description="Time-series volume appears once URL scans are logged in the SQLite telemetry store."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.scanningActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border-subtle)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                    axisLine={{ stroke: 'var(--border-subtle)' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      borderRadius: '12px',
                      color: 'var(--text-primary)',
                      fontSize: '12px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="phishing"
                    name="Phishing"
                    stroke="#EF4444"
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="legitimate"
                    name="Legitimate"
                    stroke="#22C55E"
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Tables: Recent Scans & Recent Blockchain Transactions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Recent Scanning Activity</h2>
              <p className="text-xs text-text-muted">Latest URL evaluations from the ML service</p>
            </div>
            <Link
              to="/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-primary hover:underline"
            >
              <span>All History</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : summary.recentScans.length === 0 ? (
              <EmptyState
                compact
                icon={CheckCircle2}
                title="No Recent URL Scans"
                description="Analyzed URLs will appear here with prediction confidence and risk scores."
                actionLabel="Scan a URL"
                actionTo="/scanner"
              />
            ) : (
              <div className="divide-y divide-border-subtle">
                {summary.recentScans.map((scan) => (
                  <div
                    key={scan.scanId}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-text-primary">
                        {scan.hostname}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        {formatTimestamp(scan.analyzedAt)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-text-secondary">
                        {scan.riskScore}/100
                      </span>
                      <PredictionBadge prediction={scan.prediction} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Recent Blockchain Transactions
              </h2>
              <p className="text-xs text-text-muted">
                Latest scan digests anchored on Ethereum
              </p>
            </div>
            <Link
              to="/explorer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-accent-secondary hover:underline"
            >
              <span>Explorer</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : summary.recentTransactions.length === 0 ? (
              <EmptyState
                compact
                icon={Blocks}
                title="No On-Chain Transactions Yet"
                description="Verified Ethereum transaction receipts appear here once scans are anchored via Web3.py."
                actionLabel="Open Blockchain Explorer"
                actionTo="/explorer"
              />
            ) : (
              <div className="divide-y divide-border-subtle">
                {summary.recentTransactions.map((tx) => (
                  <div
                    key={tx.recordId}
                    className="flex items-center justify-between gap-3 py-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-mono text-xs font-medium text-text-primary">
                        {truncateMiddle(tx.txHash, 12, 10)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-text-muted">
                        Block #{tx.blockNumber} • {formatTimestamp(tx.timestamp)}
                      </p>
                    </div>
                    <BlockchainStatusBadge status={tx.verified ? 'verified' : 'pending'} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

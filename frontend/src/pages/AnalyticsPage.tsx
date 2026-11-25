import { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  BrainCircuit,
  Calendar,
  Database,
  Grid2x2,
  Layers,
  RefreshCw,
  ServerOff,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  EmptyState,
  GlassCard,
  ServiceOfflineNotice,
  Skeleton,
  StatusBadge,
} from '@/components';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { ApiError, analyticsService, createEmptyMlAnalytics } from '@/services';
import type { MlAnalyticsResponse } from '@/types/api';
import { formatNumber, formatPercent, formatTimestamp } from '@/utils/formatters';

export function AnalyticsPage() {
  const { isApiConfigured } = useSystemStatus();
  const [analytics, setAnalytics] = useState<MlAnalyticsResponse>(() => createEmptyMlAnalytics());
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadAnalytics = useCallback(async () => {
    if (!isApiConfigured) {
      setAnalytics(createEmptyMlAnalytics());
      setErrorMsg(
        'Model evaluation metrics are loaded directly from trained Scikit-learn reports via the FastAPI /ml/analytics endpoint once Phase 2 & 3 are connected.',
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await analyticsService.getAnalytics();
      setAnalytics(response);
    } catch (err) {
      setAnalytics(createEmptyMlAnalytics());
      setErrorMsg(
        err instanceof ApiError ? err.message : 'Unable to fetch ML evaluation report.',
      );
    } finally {
      setLoading(false);
    }
  }, [isApiConfigured]);

  useEffect(() => {
    void loadAnalytics();
  }, [loadAnalytics]);

  const activeModel = analytics.activeModel;
  const cm = analytics.confusionMatrix;

  const chartModels = analytics.models.map((m) => ({
    modelName: m.modelName,
    Accuracy: m.accuracy <= 1 ? Number((m.accuracy * 100).toFixed(2)) : m.accuracy,
    Precision: m.precision <= 1 ? Number((m.precision * 100).toFixed(2)) : m.precision,
    Recall: m.recall <= 1 ? Number((m.recall * 100).toFixed(2)) : m.recall,
    'F1-Score': m.f1Score <= 1 ? Number((m.f1Score * 100).toFixed(2)) : m.f1Score,
  }));

  return (
    <div className="space-y-6">
      {errorMsg && (
        <ServiceOfflineNotice
          title="Trained Model Evaluation Data Not Loaded"
          description={errorMsg}
          onRetry={() => void loadAnalytics()}
          isRetrying={loading}
        />
      )}

      {/* Dataset & Artifact Metadata Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Dataset Name</span>
            <Database className="h-4 w-4 text-accent-primary" />
          </div>
          <p className="mt-2.5 text-sm font-bold text-text-primary">
            {analytics.dataset?.name || 'Not Loaded'}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">
            Features: {formatNumber(analytics.dataset?.featureCount)}
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Training / Testing Split</span>
            <Layers className="h-4 w-4 text-accent-secondary" />
          </div>
          <p className="mt-2.5 font-mono text-sm font-bold text-text-primary">
            {formatNumber(analytics.dataset?.trainingSamples)} /{' '}
            {formatNumber(analytics.dataset?.testingSamples)}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Train samples / Test samples</p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Active Model &amp; Version</span>
            <BrainCircuit className="h-4 w-4 text-accent-primary" />
          </div>
          <p className="mt-2.5 text-sm font-bold text-text-primary">
            {activeModel?.name || 'Awaiting Artifact'}
          </p>
          <p className="mt-1 font-mono text-[11px] text-text-muted">
            {activeModel?.version ? `v${activeModel.version}` : 'Version: —'}
          </p>
        </GlassCard>

        <GlassCard padding="sm">
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Training Date</span>
            <Calendar className="h-4 w-4 text-accent-secondary" />
          </div>
          <p className="mt-2.5 text-sm font-bold text-text-primary">
            {activeModel?.trainedAt ? formatTimestamp(activeModel.trainedAt) : '—'}
          </p>
          <p className="mt-1 text-[11px] text-text-muted">Serialized Joblib checkpoint</p>
        </GlassCard>
      </div>

      {/* Active Classifier Core Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Accuracy', value: formatPercent(activeModel?.accuracy) },
          { label: 'Precision', value: formatPercent(activeModel?.precision) },
          { label: 'Recall', value: formatPercent(activeModel?.recall) },
          { label: 'F1-Score', value: formatPercent(activeModel?.f1Score) },
        ].map((metric) => (
          <GlassCard key={metric.label} hover padding="sm">
            <p className="text-xs font-medium text-text-muted">{metric.label}</p>
            {loading ? (
              <Skeleton className="mt-2 h-8 w-20" />
            ) : (
              <p className="mt-2 font-mono text-2xl font-bold text-text-primary">
                {metric.value}
              </p>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Model Comparison Chart & Confusion Matrix */}
      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-7">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">
                Classifier Benchmark Comparison
              </h2>
              <p className="text-xs text-text-muted">
                Side-by-side Accuracy, Precision, Recall, and F1-score from actual evaluation runs
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadAnalytics()}
              aria-label="Reload ML analytics"
              className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : chartModels.length === 0 ? (
              <EmptyState
                compact
                icon={BarChart3}
                title="No Model Comparison Data"
                description="Metrics will render automatically once Phase 2 evaluation JSON is served by FastAPI."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartModels}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="modelName"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
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
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar dataKey="Accuracy" fill="#00E5FF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Precision" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Recall" fill="#22C55E" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="F1-Score" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Confusion Matrix */}
        <GlassCard className="lg:col-span-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Confusion Matrix</h2>
              <p className="text-xs text-text-muted">Holdout test-set classification breakdown</p>
            </div>
            <Grid2x2 className="h-4 w-4 text-accent-primary" />
          </div>

          <div className="mt-5">
            {loading ? (
              <Skeleton className="h-60 w-full" />
            ) : !cm ? (
              <EmptyState
                compact
                icon={ServerOff}
                title="Confusion Matrix Unavailable"
                description="True Positive / False Positive counts populate after model evaluation runs."
              />
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium text-text-muted">
                  <div />
                  <div>Pred: Legitimate</div>
                  <div>Pred: Phishing</div>
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="text-xs font-medium text-text-muted">Actual: Legit</div>
                  <div className="rounded-xl border border-status-success/30 bg-status-success/10 p-4 text-center">
                    <p className="font-mono text-xl font-bold text-status-success">
                      {formatNumber(cm.trueNegative)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase text-text-muted">True Negative</p>
                  </div>
                  <div className="rounded-xl border border-status-warning/30 bg-status-warning/10 p-4 text-center">
                    <p className="font-mono text-xl font-bold text-status-warning">
                      {formatNumber(cm.falsePositive)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase text-text-muted">False Positive</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className="text-xs font-medium text-text-muted">Actual: Phish</div>
                  <div className="rounded-xl border border-status-danger/30 bg-status-danger/10 p-4 text-center">
                    <p className="font-mono text-xl font-bold text-status-danger">
                      {formatNumber(cm.falseNegative)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase text-text-muted">False Negative</p>
                  </div>
                  <div className="rounded-xl border border-status-success/30 bg-status-success/10 p-4 text-center">
                    <p className="font-mono text-xl font-bold text-status-success">
                      {formatNumber(cm.truePositive)}
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase text-text-muted">True Positive</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Model Table & Feature Importance */}
      <div className="grid gap-6 lg:grid-cols-12">
        <GlassCard className="lg:col-span-6">
          <h2 className="text-base font-semibold text-text-primary">Evaluated Models Registry</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Detailed evaluation scores per trained algorithm
          </p>

          <div className="mt-4">
            {analytics.models.length === 0 ? (
              <EmptyState
                compact
                icon={BrainCircuit}
                title="No Model Artifacts Reported"
                description="Trained classifiers (e.g., Random Forest, Gradient Boosting, Logistic Regression) will appear here once exported from ml/."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border-subtle font-mono uppercase text-text-muted">
                    <tr>
                      <th className="py-2.5 pr-3">Model</th>
                      <th className="px-2 py-2.5">Acc</th>
                      <th className="px-2 py-2.5">Prec</th>
                      <th className="px-2 py-2.5">Rec</th>
                      <th className="px-2 py-2.5">F1</th>
                      <th className="py-2.5 pl-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {analytics.models.map((model) => (
                      <tr key={model.modelName}>
                        <td className="py-3 pr-3 font-semibold text-text-primary">
                          {model.modelName}
                        </td>
                        <td className="px-2 py-3 font-mono">{formatPercent(model.accuracy)}</td>
                        <td className="px-2 py-3 font-mono">{formatPercent(model.precision)}</td>
                        <td className="px-2 py-3 font-mono">{formatPercent(model.recall)}</td>
                        <td className="px-2 py-3 font-mono">{formatPercent(model.f1Score)}</td>
                        <td className="py-3 pl-2 text-right">
                          <StatusBadge
                            variant={model.isProduction ? 'online' : 'neutral'}
                            label={model.isProduction ? 'Active' : 'Benchmarked'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="lg:col-span-6">
          <h2 className="text-base font-semibold text-text-primary">Feature Importance</h2>
          <p className="mt-0.5 text-xs text-text-muted">
            Top URL attributes driving model classification decisions
          </p>

          <div className="mt-4 h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : !analytics.supportsFeatureImportance || analytics.featureImportance.length === 0 ? (
              <EmptyState
                compact
                icon={Layers}
                title="Feature Weights Unavailable"
                description="Feature importance rankings render automatically when supported by the active trained estimator."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.featureImportance} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
                  <XAxis
                    type="number"
                    tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={130}
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
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
                  <Bar dataKey="importance" fill="#00E5FF" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

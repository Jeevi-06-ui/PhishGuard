import { RefreshCw, ServerOff } from 'lucide-react';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useToast } from '@/context/ToastContext';

interface ServiceOfflineNoticeProps {
  title?: string;
  description?: string;
  message?: string;
  detailBadge?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export function ServiceOfflineNotice({
  title = 'Backend Service Disconnected',
  description,
  message,
  detailBadge,
  onRetry,
  isRetrying = false,
}: ServiceOfflineNoticeProps) {
  const { health, isApiConfigured, refreshHealth, isChecking } = useSystemStatus();
  const { showToast } = useToast();

  const handleRetry = async () => {
    if (onRetry) {
      onRetry();
      return;
    }
    const status = await refreshHealth();
    if (status.backend.status === 'online') {
      showToast({
        variant: 'success',
        title: 'Backend connected',
        description: 'FastAPI telemetry is now online.',
      });
    } else {
      showToast({
        variant: 'warning',
        title: 'Backend still unavailable',
        description: status.backend.message,
      });
    }
  };

  const loading = isRetrying || isChecking;
  const resolvedDescription =
    message ??
    description ??
    (isApiConfigured
      ? health.backend.message
      : 'Frontend is operating in Phase 1 standalone UI mode. Configure VITE_API_BASE_URL in frontend/.env and start the FastAPI + ML + Hardhat services to stream live telemetry.');

  return (
    <div
      role="status"
      className="flex flex-col justify-between gap-4 rounded-2xl border border-status-warning/30 bg-status-warning/5 p-4 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-status-warning/30 bg-status-warning/10 text-status-warning">
          <ServerOff className="h-4 w-4" />
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
            {detailBadge && (
              <span className="rounded-md border border-border-subtle bg-bg-elevated px-2 py-0.5 font-mono text-[10px] text-text-muted">
                {detailBadge}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
            {resolvedDescription}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => void handleRetry()}
        disabled={loading}
        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3.5 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-accent-primary/40 hover:text-accent-primary disabled:opacity-60"
      >
        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Checking...' : 'Check Connection'}</span>
      </button>
    </div>
  );
}

export const ServiceUnavailableBanner = ServiceOfflineNotice;

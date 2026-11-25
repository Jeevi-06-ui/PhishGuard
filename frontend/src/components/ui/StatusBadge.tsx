import type {
  BlockchainTxStatus,
  PredictionLabel,
  ServiceConnectionState,
} from '@/types/api';

export type BadgeTone =
  | 'online'
  | 'offline'
  | 'degraded'
  | 'checking'
  | 'phishing'
  | 'legitimate'
  | 'suspicious'
  | 'verified'
  | 'pending'
  | 'not_recorded'
  | 'failed'
  | 'neutral'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

interface StatusBadgeProps {
  variant?: BadgeTone;
  tone?: BadgeTone;
  label: string;
  pulse?: boolean;
  size?: 'sm' | 'md';
}

const VARIANT_CLASSES: Record<BadgeTone, { container: string; dot: string }> = {
  online: {
    container: 'border-status-success/30 bg-status-success/10 text-status-success',
    dot: 'bg-status-success',
  },
  success: {
    container: 'border-status-success/30 bg-status-success/10 text-status-success',
    dot: 'bg-status-success',
  },
  legitimate: {
    container: 'border-status-success/30 bg-status-success/10 text-status-success',
    dot: 'bg-status-success',
  },
  verified: {
    container: 'border-status-success/30 bg-status-success/10 text-status-success',
    dot: 'bg-status-success',
  },
  offline: {
    container: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
    dot: 'bg-status-danger',
  },
  danger: {
    container: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
    dot: 'bg-status-danger',
  },
  phishing: {
    container: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
    dot: 'bg-status-danger',
  },
  failed: {
    container: 'border-status-danger/30 bg-status-danger/10 text-status-danger',
    dot: 'bg-status-danger',
  },
  degraded: {
    container: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
    dot: 'bg-status-warning',
  },
  warning: {
    container: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
    dot: 'bg-status-warning',
  },
  suspicious: {
    container: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
    dot: 'bg-status-warning',
  },
  pending: {
    container: 'border-status-warning/30 bg-status-warning/10 text-status-warning',
    dot: 'bg-status-warning',
  },
  checking: {
    container: 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary',
    dot: 'bg-accent-primary',
  },
  info: {
    container: 'border-accent-primary/30 bg-accent-primary/10 text-accent-primary',
    dot: 'bg-accent-primary',
  },
  not_recorded: {
    container: 'border-border-subtle bg-bg-secondary/70 text-text-muted',
    dot: 'bg-text-muted',
  },
  neutral: {
    container: 'border-border-subtle bg-bg-secondary/70 text-text-secondary',
    dot: 'bg-text-muted',
  },
};

export function StatusBadge({
  variant,
  tone,
  label,
  pulse = false,
  size = 'sm',
}: StatusBadgeProps) {
  const resolvedTone = tone ?? variant ?? 'neutral';
  const styles = VARIANT_CLASSES[resolvedTone];
  const sizing = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${sizing} ${styles.container}`}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${styles.dot}`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${styles.dot}`} />
      </span>
      <span>{label}</span>
    </span>
  );
}

export function HealthStatusBadge({
  state,
  label,
}: {
  state: ServiceConnectionState;
  label?: string;
}) {
  const fallbackLabel: Record<ServiceConnectionState, string> = {
    online: 'Online',
    offline: 'Disconnected',
    degraded: 'Degraded',
    checking: 'Checking',
  };
  return (
    <StatusBadge
      variant={state}
      label={label ?? fallbackLabel[state]}
      pulse={state === 'online' || state === 'checking'}
    />
  );
}

export function PredictionBadge({ prediction }: { prediction: PredictionLabel }) {
  const variantMap: Record<PredictionLabel, BadgeTone> = {
    Phishing: 'phishing',
    Suspicious: 'suspicious',
    Legitimate: 'legitimate',
  };
  return <StatusBadge variant={variantMap[prediction]} label={prediction} />;
}

export function BlockchainStatusBadge({ status }: { status: BlockchainTxStatus }) {
  const labelMap: Record<BlockchainTxStatus, string> = {
    verified: 'Verified On-Chain',
    pending: 'Confirmation Pending',
    not_recorded: 'Not Recorded',
    failed: 'Anchor Failed',
  };
  return <StatusBadge variant={status} label={labelMap[status]} />;
}

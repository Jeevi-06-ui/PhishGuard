import React from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  action,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'py-8 px-4' : 'py-12 px-6'
      }`}
    >
      <div className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-2xl border border-border-subtle bg-bg-secondary/80 text-accent-primary">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-text-primary sm:text-base">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-text-muted sm:text-sm">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
      {!action && actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent-primary/40 bg-accent-primary/10 px-4 py-2 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/20"
        >
          {actionLabel}
        </Link>
      )}
      {!action && actionLabel && onAction && !actionTo && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-accent-primary/40 bg-accent-primary/10 px-4 py-2 text-xs font-semibold text-accent-primary transition-colors hover:bg-accent-primary/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

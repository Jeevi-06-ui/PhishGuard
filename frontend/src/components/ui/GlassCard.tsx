import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  hoverable?: boolean;
  accent?: 'none' | 'cyan' | 'violet' | 'danger' | 'success';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const ACCENT_BORDER: Record<NonNullable<GlassCardProps['accent']>, string> = {
  none: '',
  cyan: 'border-accent-primary/25',
  violet: 'border-accent-secondary/25',
  danger: 'border-status-danger/30',
  success: 'border-status-success/30',
};

const PADDING_MAP: Record<NonNullable<GlassCardProps['padding']>, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

export function GlassCard({
  children,
  className = '',
  hover = false,
  hoverable = false,
  accent = 'none',
  padding = 'md',
}: GlassCardProps) {
  const hasHover = hover || hoverable;
  return (
    <div
      className={`glass-panel rounded-2xl ${hasHover ? 'glass-panel-hover' : ''} ${ACCENT_BORDER[accent]} ${PADDING_MAP[padding]} ${className}`}
    >
      {children}
    </div>
  );
}

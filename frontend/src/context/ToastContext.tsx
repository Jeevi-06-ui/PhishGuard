import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_STYLES: Record<
  ToastVariant,
  { icon: React.ComponentType<{ className?: string }>; border: string; iconColor: string }
> = {
  success: {
    icon: CheckCircle2,
    border: 'border-status-success/40',
    iconColor: 'text-status-success',
  },
  error: {
    icon: AlertCircle,
    border: 'border-status-danger/40',
    iconColor: 'text-status-danger',
  },
  warning: {
    icon: TriangleAlert,
    border: 'border-status-warning/40',
    iconColor: 'text-status-warning',
  },
  info: {
    icon: Info,
    border: 'border-accent-primary/40',
    iconColor: 'text-accent-primary',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      window.setTimeout(() => {
        dismissToast(id);
      }, 4500);
    },
    [dismissToast],
  );

  const value = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2.5 px-4 sm:px-0"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = VARIANT_STYLES[toast.variant];
            const Icon = style.icon;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ duration: 0.18 }}
                className={`glass-panel pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-lg ${style.border}`}
              >
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${style.iconColor}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-text-primary">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-text-muted">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  aria-label="Dismiss notification"
                  className="rounded-lg p-1 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

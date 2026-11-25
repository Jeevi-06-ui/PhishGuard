import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

interface SlideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export function SlideDrawer({ open, onClose, title, subtitle, children }: SlideDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="relative z-10 flex h-full w-full max-w-lg flex-col border-l border-border-subtle bg-bg-elevated shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border-subtle px-6 py-4">
              <div>
                <h2 className="text-base font-semibold text-text-primary">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-text-muted">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close drawer"
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-secondary hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}

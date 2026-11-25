import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Blocks,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronRight,
  History,
  Home,
  Info,
  LayoutDashboard,
  Menu,
  RefreshCw,
  ScanSearch,
  X,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { NetworkBackground } from '@/components/ui/NetworkBackground';
import { HealthStatusBadge } from '@/components/ui/StatusBadge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useSystemStatus } from '@/context/SystemStatusContext';
import { useToast } from '@/context/ToastContext';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  subtitle: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Landing Home',
    to: '/',
    icon: Home,
    subtitle: 'System overview and architecture entry point',
  },
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
    subtitle: 'Live threat telemetry, KPIs, and infrastructure health',
  },
  {
    label: 'URL Scanner',
    to: '/scanner',
    icon: ScanSearch,
    subtitle: 'Analyze URLs via ML inference and anchor proof on-chain',
  },
  {
    label: 'Scan History',
    to: '/history',
    icon: History,
    subtitle: 'Searchable inspection archive with CSV export',
  },
  {
    label: 'Blockchain Explorer',
    to: '/explorer',
    icon: Blocks,
    subtitle: 'Smart contract audit records and hash verification',
  },
  {
    label: 'ML Analytics',
    to: '/analytics',
    icon: BrainCircuit,
    subtitle: 'Model evaluation metrics, confusion matrix, and features',
  },
  {
    label: 'Cyber Awareness',
    to: '/awareness',
    icon: BookOpen,
    subtitle: 'Phishing education, safe browsing, and interactive quiz',
  },
  {
    label: 'About Project',
    to: '/about',
    icon: Info,
    subtitle: 'Academic architecture, methodology, and team profile',
  },
];

export function AppLayout() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { health, isChecking, refreshHealth } = useSystemStatus();
  const { showToast } = useToast();

  const currentMeta =
    NAV_ITEMS.find((item) => item.to === location.pathname) ?? NAV_ITEMS[1];

  const handleHealthProbe = async () => {
    const status = await refreshHealth();
    if (status.backend.status === 'online') {
      showToast({
        title: 'Services Connected',
        description: 'FastAPI backend health check succeeded.',
        variant: 'success',
      });
    } else {
      showToast({
        title: 'Backend Offline',
        description: status.backend.message,
        variant: 'info',
      });
    }
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4" aria-label="Sidebar Navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={() => {
              if (isMobile) setMobileOpen(false);
            }}
            title={collapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border border-accent-primary/35 bg-accent-primary/10 text-accent-primary shadow-glow'
                  : 'border border-transparent text-text-secondary hover:border-border-subtle hover:bg-bg-secondary/60 hover:text-text-primary'
              }`
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {(!collapsed || isMobile) && <span className="truncate">{item.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <div className="relative flex min-h-screen bg-bg-main text-text-primary">
      <NetworkBackground />

      {/* Desktop Collapsible Sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border-subtle bg-bg-elevated/85 backdrop-blur-xl transition-all duration-200 lg:flex ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border-subtle px-4">
          <BrandLogo compact={collapsed} to="/" />
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-bg-secondary/70 text-text-muted transition-colors hover:text-accent-primary"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {renderNavLinks(false)}

        {!collapsed && (
          <div className="border-t border-border-subtle p-4">
            <div className="rounded-xl border border-border-subtle bg-bg-secondary/50 p-3 text-xs">
              <p className="font-semibold text-text-primary">System Status</p>
              <div className="mt-2 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Backend API</span>
                  <HealthStatusBadge state={health.backend.status} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">ML Engine</span>
                  <HealthStatusBadge
                    state={health.mlModel.status}
                    label={health.mlModel.status === 'online' ? 'Loaded' : 'Unavailable'}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Ethereum RPC</span>
                  <HealthStatusBadge state={health.blockchain.status} />
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative z-10 flex h-full w-72 flex-col border-r border-border-subtle bg-bg-elevated"
            >
              <div className="flex h-16 items-center justify-between border-b border-border-subtle px-4">
                <BrandLogo to="/" />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                  className="rounded-lg p-1.5 text-text-muted hover:bg-bg-secondary hover:text-text-primary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {renderNavLinks(true)}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Shell */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border-subtle bg-bg-main/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-bg-elevated text-text-primary lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-text-primary sm:text-lg">
                {currentMeta.label}
              </h1>
              <p className="hidden truncate text-xs text-text-muted sm:block">
                {currentMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => void handleHealthProbe()}
              disabled={isChecking}
              title="Refresh backend, ML, and blockchain status"
              className="hidden items-center gap-1.5 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-medium text-text-secondary transition-colors hover:border-accent-primary/40 hover:text-accent-primary sm:inline-flex"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{health.backend.status === 'online' ? 'Connected' : 'API Offline'}</span>
            </button>

            <ThemeToggle />

            <Link
              to="/scanner"
              className="inline-flex items-center gap-1.5 rounded-xl bg-accent-primary px-3.5 py-2 text-xs font-bold text-white shadow-glow transition-opacity hover:opacity-90 dark:text-slate-950"
            >
              <ScanSearch className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Scan URL</span>
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

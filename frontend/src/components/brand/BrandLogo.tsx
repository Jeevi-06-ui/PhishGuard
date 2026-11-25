import { Link } from 'react-router-dom';

interface BrandLogoProps {
  compact?: boolean;
  to?: string;
  showTagline?: boolean;
}

export function BrandLogo({ compact = false, to = '/', showTagline = false }: BrandLogoProps) {
  return (
    <Link
      to={to}
      className="group inline-flex items-center gap-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60 rounded-lg"
    >
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent-primary/35 bg-gradient-to-br from-accent-primary/15 via-bg-secondary to-accent-secondary/20 shadow-glow transition-transform duration-200 group-hover:scale-105">
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          aria-hidden="true"
        >
          {/* Outer cyber shield */}
          <path
            d="M18 3L6 8.2V16.8C6 24.4 11.1 30.9 18 33C24.9 30.9 30 24.4 30 16.8V8.2L18 3Z"
            className="stroke-accent-primary"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          {/* Blockchain hexagonal node links inside shield */}
          <path
            d="M18 10L23.5 13.2V19.6L18 22.8L12.5 19.6V13.2L18 10Z"
            className="stroke-accent-secondary"
            strokeWidth="1.75"
            strokeLinejoin="round"
          />
          <circle cx="18" cy="10" r="1.6" className="fill-accent-primary" />
          <circle cx="23.5" cy="19.6" r="1.6" className="fill-accent-primary" />
          <circle cx="12.5" cy="19.6" r="1.6" className="fill-accent-primary" />
          <circle cx="18" cy="16.4" r="2" className="fill-accent-secondary" />
        </svg>
      </div>

      {!compact && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center gap-1.5">
            <span className="text-lg font-bold tracking-tight text-text-primary">
              Phish<span className="text-accent-primary">Guard</span>
            </span>
          </div>
          {showTagline ? (
            <span className="mt-1 text-[11px] font-medium tracking-wide text-text-muted">
              ML &amp; Blockchain Security
            </span>
          ) : (
            <span className="mt-0.5 font-mono text-[10px] uppercase tracking-widest text-text-muted">
              URL Threat Intel
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

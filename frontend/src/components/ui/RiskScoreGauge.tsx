import { motion } from 'framer-motion';

interface RiskScoreGaugeProps {
  score: number | null;
  label?: string;
}

export function RiskScoreGauge({ score, label = 'Risk Score' }: RiskScoreGaugeProps) {
  const clamped = score === null ? 0 : Math.max(0, Math.min(100, score));
  const radius = 74;
  const circumference = Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    score === null
      ? 'var(--text-muted)'
      : clamped >= 70
        ? '#EF4444'
        : clamped >= 40
          ? '#F59E0B'
          : '#22C55E';

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-32 w-48">
        <svg viewBox="0 0 180 105" className="h-full w-full overflow-visible" aria-hidden="true">
          {/* Background arc */}
          <path
            d="M 16 90 A 74 74 0 0 1 164 90"
            fill="none"
            stroke="currentColor"
            className="text-text-muted/20"
            strokeWidth="12"
            strokeLinecap="round"
          />
          {/* Value arc */}
          {score !== null && (
            <motion.path
              d="M 16 90 A 74 74 0 0 1 164 90"
              fill="none"
              stroke={strokeColor}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          )}
        </svg>

        <div className="absolute inset-x-0 bottom-1 flex flex-col items-center text-center">
          <span className="font-mono text-3xl font-bold tracking-tight text-text-primary">
            {score === null ? '—' : clamped}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-text-muted">
            {label} / 100
          </span>
        </div>
      </div>
    </div>
  );
}

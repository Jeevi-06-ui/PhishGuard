interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-text-muted/15 ${className}`}
      aria-hidden="true"
    />
  );
}

export function KpiSkeletonGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="glass-panel rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3" aria-label="Loading table rows">
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, colIdx) => (
            <Skeleton key={colIdx} className="h-8 w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

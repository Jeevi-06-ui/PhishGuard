export function NetworkBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Subtle orthogonal cyber grid */}
      <div className="cyber-grid-bg absolute inset-0 opacity-75" />

      {/* Radial spotlight wash */}
      <div
        className="absolute -top-40 left-1/2 h-[540px] w-[900px] -translate-x-1/2 rounded-full opacity-25 blur-[120px] dark:opacity-20"
        style={{
          background:
            'radial-gradient(circle, var(--accent-primary) 0%, var(--accent-secondary) 48%, transparent 72%)',
        }}
      />

      {/* Subtle bottom-right ambient wash */}
      <div
        className="absolute -bottom-48 -right-24 h-[420px] w-[420px] rounded-full opacity-15 blur-[110px]"
        style={{
          background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 70%)',
        }}
      />
    </div>
  );
}

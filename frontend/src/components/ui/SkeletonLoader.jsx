export function SkeletonLine({ width = '100%', height = 16 }) {
  return <div className="skeleton" style={{ width, height }} />
}

export function SkeletonCard() {
  return (
    <div className="glass-card p-6 space-y-3">
      <SkeletonLine width="60%" height={20} />
      <SkeletonLine height={14} />
      <SkeletonLine width="80%" height={14} />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center p-4 rounded-xl" style={{ background: 'var(--bg-surface)' }}>
          <SkeletonLine width={40} height={40} />
          <div className="flex-1 space-y-2">
            <SkeletonLine width="40%" height={14} />
            <SkeletonLine width="70%" height={12} />
          </div>
          <SkeletonLine width={80} height={28} />
        </div>
      ))}
    </div>
  )
}

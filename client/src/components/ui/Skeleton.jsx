export function Skeleton({ className = '', width, height = 4, count = 1 }) {
  const items = Array.from({ length: count });
  return items.map((_, i) => (
    <div
      key={i}
      className={`bg-white/5 rounded-lg animate-pulse ${className}`}
      style={{ width, height: typeof height === 'number' ? `${height * 0.25}rem` : height }}
    />
  ));
}

export function CardSkeleton() {
  return (
    <div className="card-premium p-5 space-y-4">
      <div className="flex items-start gap-4">
        <Skeleton width="48px" height={12} className="!rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton height={5} width="70%" />
          <Skeleton height={4} width="45%" />
        </div>
      </div>
      <Skeleton height={3} width="55%" />
      <div className="flex gap-2">
        <Skeleton height={6} width={60} className="!rounded-full" />
        <Skeleton height={6} width={60} className="!rounded-full" />
        <Skeleton height={6} width={80} className="!rounded-full" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card-premium p-5 space-y-3">
      <Skeleton height={3} width="40%" />
      <Skeleton height={8} width="60%" />
      <Skeleton height={3} width="30%" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="card-premium p-5">
      <Skeleton height={4} width="35%" className="mb-4" />
      <Skeleton height={48} className="!rounded-xl" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton height={4} width="30%" />
          <Skeleton height={4} width="20%" />
          <Skeleton height={4} width="15%" className="ml-auto" />
        </div>
      ))}
    </div>
  );
}

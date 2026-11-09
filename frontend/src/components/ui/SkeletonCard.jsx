export default function SkeletonCard({ className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="skeleton w-14 h-6 rounded-full" />
      </div>
      <div className="skeleton w-24 h-7 rounded mb-2" />
      <div className="skeleton w-32 h-4 rounded" />
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4 border-b border-white/05">
      <div className="skeleton w-8 h-8 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton w-48 h-4 rounded" />
        <div className="skeleton w-32 h-3 rounded" />
      </div>
      <div className="skeleton w-20 h-6 rounded-full" />
      <div className="skeleton w-12 h-4 rounded" />
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="chart-container">
      <div className="skeleton w-32 h-5 rounded mb-1" />
      <div className="skeleton w-48 h-4 rounded mb-6" />
      <div className="skeleton w-full h-48 rounded-xl" />
    </div>
  );
}

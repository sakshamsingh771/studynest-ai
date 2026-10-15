export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse bg-ink/8 rounded-md ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-[#151E30] border border-ink/10 rounded-card p-5 space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
    </div>
  );
}

export default function SpaceCardSkeleton() {
  return (
    <div
      className="bg-white border border-border-base rounded-2xl shadow-[0_2px_12px_rgba(99,102,241,0.06)] overflow-hidden flex flex-col"
      aria-hidden="true"
    >
      <div className="aspect-[16/10] bg-surface-elevated animate-pulse" />
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="h-5 bg-surface-elevated rounded w-3/4 animate-pulse" />
          <div className="h-5 bg-surface-elevated rounded w-12 animate-pulse" />
        </div>
        <div className="h-3 bg-surface-elevated rounded w-1/2 animate-pulse" />
        <div className="space-y-2">
          <div className="h-3 bg-surface-elevated rounded w-full animate-pulse" />
          <div className="h-3 bg-surface-elevated rounded w-5/6 animate-pulse" />
        </div>
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="h-4 bg-surface-elevated rounded w-20 animate-pulse" />
          <div className="h-6 bg-surface-elevated rounded-full w-24 animate-pulse" />
        </div>
        <div className="flex items-center justify-between border-t border-border-base pt-4">
          <div className="h-7 bg-surface-elevated rounded w-24 animate-pulse" />
          <div className="h-9 bg-surface-elevated rounded-lg w-32 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

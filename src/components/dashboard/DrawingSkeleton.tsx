export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-cream-dark" />
      <div className="px-3 py-3 space-y-2">
        <div className="h-3.5 bg-cream-dark rounded-full w-3/4" />
        <div className="h-2.5 bg-cream-dark rounded-full w-1/3" />
      </div>
    </div>
  );
}

export default function DrawingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => <CardSkeleton key={i} />)}
    </div>
  );
}

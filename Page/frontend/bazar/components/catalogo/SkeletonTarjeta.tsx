"use client";
// ============================================================
// components/catalogo/SkeletonTarjeta.tsx
// Placeholder animado mientras carga el catálogo
// ============================================================
export function SkeletonTarjeta() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E5E5] overflow-hidden">
      <div className="skeleton aspect-[4/3]" />
      <div className="p-4 flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-md" />
          <div className="skeleton h-5 w-16 rounded-md ml-auto" />
        </div>
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="flex gap-2">
          <div className="skeleton h-5 w-20 rounded-md" />
          <div className="skeleton h-5 w-16 rounded-md" />
        </div>
        <div className="skeleton h-8 w-28 rounded mt-1" />
        <div className="flex gap-2 mt-2">
          <div className="skeleton h-9 w-28 rounded-xl" />
          <div className="skeleton h-9 flex-1 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/** Renderiza N tarjetas skeleton */
export function SkeletonGrid({ count = 9 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonTarjeta key={i} />
      ))}
    </div>
  );
}

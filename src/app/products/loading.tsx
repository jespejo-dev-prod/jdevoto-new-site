import React from 'react';

export default function CatalogLoading() {
  return (
    <div className="flex flex-col lg:flex-row gap-8 max-w-[1500px] mx-auto p-6 lg:px-12 pt-8 w-full animate-pulse">
      {/* Sidebar Skeleton */}
      <aside className="hidden lg:block w-72 shrink-0 space-y-6">
        <div className="bg-zinc-50 rounded-2xl border border-zinc-100 p-6 h-[500px]">
          <div className="h-4 bg-zinc-200 rounded w-1/2 mb-8" />
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-zinc-100 rounded-xl w-full" />
            ))}
          </div>
        </div>
        <div className="bg-zinc-950/5 rounded-2xl p-6 h-32" />
      </aside>

      {/* Content Skeleton */}
      <div className="flex-1 space-y-6">
        {/* Filter Bar Skeleton */}
        <div className="h-16 bg-zinc-50 rounded-2xl border border-zinc-100 w-full" />
        
        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-zinc-100 overflow-hidden h-[400px]">
              <div className="aspect-[4/3] bg-zinc-50" />
              <div className="p-5 space-y-4">
                <div className="h-3 bg-zinc-100 rounded w-1/4" />
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-10 bg-zinc-50 rounded-full w-full mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

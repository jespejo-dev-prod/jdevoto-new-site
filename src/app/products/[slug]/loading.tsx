import React from 'react';

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-white flex flex-col animate-pulse">
      {/* Header Placeholder */}
      <div className="h-20 border-b border-zinc-100 w-full" />

      <main className="max-w-[1500px] mx-auto p-6 lg:px-12 pt-8 w-full">
        {/* Breadcrumbs Placeholder */}
        <div className="h-4 bg-zinc-100 rounded w-48 mb-10" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Gallery Placeholder */}
          <div className="lg:col-span-4 space-y-6">
            <div className="aspect-square bg-zinc-50 rounded-[48px] border border-zinc-100" />
            <div className="flex gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-20 h-20 bg-zinc-50 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Info Placeholder */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div className="h-10 bg-zinc-100 rounded-xl w-3/4" />
              <div className="h-4 bg-zinc-50 rounded w-1/4" />
              <div className="h-6 bg-zinc-50 rounded w-1/3" />
            </div>
            
            <div className="space-y-4 pt-8 border-t">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-zinc-50 rounded w-full" />
              ))}
            </div>
          </div>

          {/* BuyBox Placeholder */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-[48px] border border-zinc-100 h-[500px] shadow-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

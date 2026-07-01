'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { useCart } from '@/context/CartContext';

export function PromoCountdownBanner() {
  const { items, syncPrices } = useCart();
  const [now, setNow] = useState<number>(Date.now());

  // Tick every second — only for display purposes
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Select the most urgently-expiring promotion in the cart.
  // This memo only depends on `items`, not on `now`, so it does NOT
  // recompute on every clock tick — avoiding unnecessary re-selections.
  const urgentPromoItem = useMemo(() => {
    let closestItem: (typeof items)[0] | null = null;
    let minExpiration = Infinity;

    for (const item of items) {
      if (item.priceSource !== 'PROMOTION' || !item.validTo) continue;
      const exp = new Date(item.validTo).getTime();
      if (exp < minExpiration) {
        minExpiration = exp;
        closestItem = item;
      }
    }
    return closestItem;
  }, [items]);

  // Schedule a single one-shot timer that fires exactly when the promotion
  // expires (+ 1.5 s grace period for server clock skew).
  // Dependencies are the item's id and validTo — NOT `now` — so the timer
  // is set once per promotion and never cancelled mid-flight by the clock tick.
  useEffect(() => {
    if (!urgentPromoItem?.validTo) return;

    const expirationTime = new Date(urgentPromoItem.validTo).getTime();
    const delay = expirationTime - Date.now() + 1500;

    // Already expired when we mount — sync immediately
    if (delay <= 0) {
      syncPrices();
      return;
    }

    const timer = setTimeout(syncPrices, delay);
    return () => clearTimeout(timer);
  }, [urgentPromoItem?.id, urgentPromoItem?.validTo, syncPrices]);

  if (!urgentPromoItem?.validTo) return null;

  const expirationTime = new Date(urgentPromoItem.validTo).getTime();
  const diffMs = expirationTime - now;

  // Hide banner once the timer hits zero (visual only — timer above still fires)
  if (diffMs <= 0) return null;

  // Format time remaining
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  const timeString =
    days > 0
      ? `${days}d ${hours}h ${minutes}m`
      : hours > 0
      ? `${hours}h ${minutes}m ${seconds}s`
      : `${minutes}m ${seconds}s`;

  const isCritical = diffMs < 1000 * 60 * 5; // < 5 minutes

  return (
    <div
      className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-2 ${
        isCritical
          ? 'bg-red-500/10 border-red-500/20 text-red-500'
          : 'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {isCritical ? (
          <AlertTriangle className="h-4.5 w-4.5 animate-pulse shrink-0" />
        ) : (
          <Clock className="h-4.5 w-4.5 shrink-0" />
        )}
        <span className="text-xs sm:text-sm font-semibold truncate">
          ¡Apresúrate! La promoción para{' '}
          <strong className="font-extrabold uppercase">{urgentPromoItem.name}</strong>{' '}
          expira en:
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider tabular-nums ${
            isCritical
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-amber-500 text-zinc-950'
          }`}
        >
          {timeString}
        </span>
      </div>
    </div>
  );
}

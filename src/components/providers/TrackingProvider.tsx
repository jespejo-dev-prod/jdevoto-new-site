'use client';

import { createContext, useContext } from 'react';
import { useTracking } from '@/hooks/useTracking';

type TrackingContextType = ReturnType<typeof useTracking>;

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const tracking = useTracking();
  return (
    <TrackingContext.Provider value={tracking}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTrackingContext() {
  const ctx = useContext(TrackingContext);
  if (!ctx) {
    throw new Error('useTrackingContext must be used within TrackingProvider');
  }
  return ctx;
}

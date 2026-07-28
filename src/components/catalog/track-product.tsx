'use client';

import { useEffect } from 'react';
import { useTrackingContext } from '@/components/providers/TrackingProvider';

export function TrackProduct({ slug, sku, categoryId }: { slug: string; sku?: string; categoryId?: string }) {
  const { trackProductView } = useTrackingContext();

  useEffect(() => {
    trackProductView(slug, sku || '', categoryId);
  }, [slug, sku, categoryId, trackProductView]);

  return null;
}

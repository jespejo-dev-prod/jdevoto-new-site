'use client';

import { useEffect } from 'react';
import { trackProductView } from '@/lib/tracking';

export function TrackProduct({ slug }: { slug: string }) {
  useEffect(() => {
    trackProductView(slug);
  }, [slug]);

  return null;
}

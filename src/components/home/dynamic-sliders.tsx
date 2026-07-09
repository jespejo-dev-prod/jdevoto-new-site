"use client";

import dynamic from 'next/dynamic';

export const DynamicRecentlyViewedSlider = dynamic(
  () => import('@/components/home/client-sliders').then((mod) => mod.RecentlyViewedSlider),
  { ssr: false }
);

export const DynamicSearchHistorySlider = dynamic(
  () => import('@/components/home/client-sliders').then((mod) => mod.SearchHistorySlider),
  { ssr: false }
);

export const DynamicRelatedToViewedSlider = dynamic(
  () => import('@/components/home/client-sliders').then((mod) => mod.RelatedToViewedSlider),
  { ssr: false }
);

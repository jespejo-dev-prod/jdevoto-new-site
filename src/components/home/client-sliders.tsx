'use client';

import React, { useState, useEffect } from 'react';
import { ProductSlider } from '@/components/ui/product-slider';
import { getRecentlyViewed, getSearchQueries } from '@/lib/tracking';

interface SliderProps {
  fallbackProducts: any[];
}

export function RecentlyViewedSlider({ fallbackProducts }: SliderProps) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const slugs = getRecentlyViewed();
    if (slugs.length > 0) {
      fetch(`/api/products/by-slugs?slugs=${slugs.join(',')}`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success && Array.isArray(resData.data)) {
            setProducts(resData.data);
          }
        })
        .catch(err => console.error('Error fetching recently viewed:', err));
    }
  }, []);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <ProductSlider 
      title="Vistos Recientemente" 
      products={displayProducts} 
      linkHref="/products?recentlyViewed=true" 
      linkLabel="Ver todos los productos" 
    />
  );
}

export function SearchHistorySlider({ fallbackProducts }: SliderProps) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const queries = getSearchQueries();
    if (queries.length > 0) {
      fetch(`/api/products?search=${encodeURIComponent(queries[0])}&limit=10`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success && Array.isArray(resData.data)) {
            setProducts(resData.data);
          }
        })
        .catch(err => console.error('Error fetching search history:', err));
    }
  }, []);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <ProductSlider 
      title="Tu Historial de Búsqueda" 
      products={displayProducts} 
      linkHref="/products?searchHistory=true" 
      linkLabel="Ir a buscar" 
    />
  );
}

export function RelatedToViewedSlider({ fallbackProducts }: SliderProps) {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const slugs = getRecentlyViewed();
    if (slugs.length > 0) {
      fetch(`/api/products/by-slugs?slugs=${slugs.slice(0, 3).join(',')}&related=true`)
        .then(res => res.json())
        .then(resData => {
          if (resData.success && Array.isArray(resData.data)) {
            setProducts(resData.data);
          }
        })
        .catch(err => console.error('Error fetching related products:', err));
    }
  }, []);

  const displayProducts = products.length > 0 ? products : fallbackProducts;

  return (
    <ProductSlider 
      title="Relacionado con lo que viste" 
      products={displayProducts} 
      linkHref="/products?related=true" 
      linkLabel="Ver todas las ofertas" 
    />
  );
}

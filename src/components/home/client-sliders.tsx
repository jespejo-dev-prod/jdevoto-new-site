'use client';

import React, { useState, useEffect } from 'react';
import { ProductSlider } from '@/components/ui/product-slider';
import { getRecentlyViewed, getSearchQueries } from '@/lib/tracking';
import { ProductCard } from '@/modules/catalog/presentation/components/ProductList/ProductCard';
import { useAuth } from '@/context/auth-context';

interface SliderProps {
  fallbackProducts: any[];
}

export function RecentlyViewedSlider({ fallbackProducts }: SliderProps) {
  const [products, setProducts] = useState<any[]>([]);
  const { accessToken } = useAuth();
  const isAuthenticated = !!accessToken;

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
      linkHref="/products?recentlyViewed=true" 
      linkLabel="Ver todos los productos" 
    >
      {displayProducts.map((p, idx) => (
        <div 
          key={`${p.id}-${idx}`} 
          className="w-[85vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
        >
          <ProductCard product={p} variant="catalog" isAuthenticated={isAuthenticated} />
        </div>
      ))}
    </ProductSlider>
  );
}

export function SearchHistorySlider({ fallbackProducts }: SliderProps) {
  const [products, setProducts] = useState<any[]>([]);
  const { accessToken } = useAuth();
  const isAuthenticated = !!accessToken;

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
      linkHref="/products?searchHistory=true" 
      linkLabel="Ir a buscar" 
    >
      {displayProducts.map((p, idx) => (
        <div 
          key={`${p.id}-${idx}`} 
          className="w-[85vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
        >
          <ProductCard product={p} variant="catalog" isAuthenticated={isAuthenticated} />
        </div>
      ))}
    </ProductSlider>
  );
}

export function RelatedToViewedSlider({ fallbackProducts }: SliderProps) {
  const [products, setProducts] = useState<any[]>([]);
  const { accessToken } = useAuth();
  const isAuthenticated = !!accessToken;

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
      linkHref="/products?related=true" 
      linkLabel="Ver todas las ofertas" 
    >
      {displayProducts.map((p, idx) => (
        <div 
          key={`${p.id}-${idx}`} 
          className="w-[85vw] sm:w-[calc((100%-1rem)/2)] md:w-[calc((100%-2rem)/3)] lg:w-[calc((100%-3rem)/4)] xl:w-[calc((100%-4rem)/5)] shrink-0 snap-start"
        >
          <ProductCard product={p} variant="catalog" isAuthenticated={isAuthenticated} />
        </div>
      ))}
    </ProductSlider>
  );
}

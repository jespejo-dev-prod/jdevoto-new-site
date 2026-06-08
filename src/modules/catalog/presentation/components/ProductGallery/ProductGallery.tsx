'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  images: Array<{
    url: string;
    altText?: string;
    isPrimary?: boolean;
  }>;
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
  const primaryImage = images.find((img) => img.isPrimary) || images[0];
  const [activeImage, setActiveImage] = useState(primaryImage?.url || '');

  return (
    <div className="lg:col-span-6 flex gap-6">
      {/* Thumbnails */}
      <div className="flex flex-col gap-4">
        {images.map((img, i) => (
          <div
            key={i}
            onClick={() => setActiveImage(img.url)}
            className={cn(
              "w-20 h-20 rounded-2xl border-2 cursor-pointer overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md relative",
              activeImage === img.url 
                ? "border-blue-500 ring-2 ring-blue-500/20" 
                : "border-transparent hover:border-zinc-200"
            )}
          >
            <Image 
              src={img.url} 
              fill
              sizes="80px"
              className="object-cover" 
              alt={img.altText || `Thumbnail ${i + 1}`} 
            />
          </div>
        ))}
      </div>

      {/* Main Image Container */}
      <div className="flex-1 rounded-[48px] overflow-hidden bg-zinc-50/50 border border-zinc-100 flex items-center justify-center min-h-[500px] lg:min-h-[600px] relative shadow-inner group">
        <Image
          src={activeImage}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-contain p-12 mix-blend-multiply transition-all duration-700 ease-in-out transform group-hover:scale-105"
          alt={productName}
        />
        
        {/* Wishlist Button */}
        <button className="absolute top-10 right-10 h-14 w-14 rounded-full bg-white shadow-2xl flex items-center justify-center text-zinc-300 hover:text-red-500 transition-all duration-300 hover:scale-110 active:scale-90">
          <Heart className="h-7 w-7" />
        </button>

        {/* Badge or overlay could go here */}
      </div>
    </div>
  );
}

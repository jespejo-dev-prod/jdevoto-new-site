import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';
import { SliderScrollArea } from '@/components/ui/slider-scroll-area';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoriesSliderProps {
  categories: Category[];
}

const getCategoryImage = (name: string, slug: string) => {
  const cleanName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const cleanSlug = slug.toLowerCase();
  
  if (cleanName.includes('escolar') || cleanSlug.includes('escolar')) return '/home/escolar.jpg';
  if (cleanName.includes('ferreteria') || cleanSlug.includes('ferreteria')) return '/home/ferreteria.jpg';
  if (cleanName.includes('manualidades') || cleanSlug.includes('manualidades')) return '/home/manualidades.jpg';
  if (cleanName.includes('oficina') || cleanSlug.includes('oficina')) return '/home/oficina.jpg';
  if (cleanName.includes('outlet') || cleanSlug.includes('outlet')) return '/home/outlet.jpg';
  if (cleanName.includes('papeleria') || cleanSlug.includes('papeleria')) return '/home/papeleria.jpg';
  if (cleanName.includes('regalo') || cleanSlug.includes('regalo')) return '/home/regalos.jpg';
  
  const keys = ['escolar', 'ferreteria', 'manualidades', 'oficina', 'outlet', 'papeleria', 'regalos'];
  const fallbackKey = keys[name.length % keys.length];
  return `/home/${fallbackKey}.jpg`;
};

export function CategoriesSlider({ categories }: CategoriesSliderProps) {
  if (!categories || categories.length === 0) return null;

  return (
    <SliderScrollArea
      title="Categorías Destacadas"
      subtitle="Explora nuestro catálogo industrial B2B"
      containerClassName="mt-12 bg-white rounded-[32px] p-6 md:p-8 border border-zinc-100 shadow-[0_10px_35px_-10px_rgba(0,0,0,0.03)] overflow-hidden"
    >
      {categories.map((category, index) => (
        <Link 
          key={category.id} 
          href={`/categorias/${category.slug}`}
          className="w-[80vw] sm:w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2.5rem)/3)] lg:w-[calc((100%-5rem)/5)] shrink-0 snap-start group relative h-[360px] rounded-[28px] overflow-hidden flex flex-col justify-end p-6 border border-zinc-200/40 shadow-[0_8px_25px_rgba(0,0,0,0.02)] hover:shadow-2xl transition-shadow duration-500"
        >
          <Image 
            src={getCategoryImage(category.name, category.slug)}
            alt={category.name}
            fill
            priority={index < 3}
            sizes="(max-width: 640px) 80vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            quality={60}
            className="object-cover object-center transition-transform duration-[1200ms] ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent transition-opacity duration-500 group-hover:opacity-90" />
          <div className="relative z-10 flex flex-col gap-2.5">
            <h3 className="text-lg font-black text-white leading-tight uppercase tracking-tight group-hover:text-primary transition-colors duration-300">
              {category.name}
            </h3>
            <span className="text-[9px] font-black text-white/70 group-hover:text-white tracking-widest uppercase flex items-center gap-1.5 transition-colors">
              Ver Productos <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>
        </Link>
      ))}
    </SliderScrollArea>
  );
}

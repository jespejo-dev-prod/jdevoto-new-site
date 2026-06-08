import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  breadcrumbs: { label: string; href: string }[];
  productSlug?: string;
}

export function PageHeader({ title, breadcrumbs, productSlug }: PageHeaderProps) {
  return (
    <header className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <Link href={crumb.href} className="hover:text-primary transition-colors">
              {crumb.label}
            </Link>
            {i < breadcrumbs.length - 1 && <span className="text-zinc-800">/</span>}
          </span>
        ))}
        <span className="text-zinc-800">/</span>
        <span className="text-white">{title}</span>
      </div>
      <div className="flex gap-3">
        {productSlug ? (
          <Link href={`/products/${productSlug}`} target="_blank">
            <Button variant="ghost" className="text-zinc-500 hover:text-white text-xs font-bold gap-2">
              <Eye className="h-4 w-4" /> Vista Previa
            </Button>
          </Link>
        ) : (
          <Button variant="ghost" disabled className="text-zinc-800 text-xs font-bold gap-2 opacity-50 cursor-not-allowed">
            <Eye className="h-4 w-4" /> Vista Previa
          </Button>
        )}
      </div>
    </header>
  );
}

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();

  // Redirect /products?category=x to /categorias/x cleanly without appending ?category=x
  if (url.pathname === '/products' && url.searchParams.has('category')) {
    const categorySlug = url.searchParams.get('category');
    
    // Remove the category param so it doesn't get appended to the new URL
    url.searchParams.delete('category');
    
    // Construct the new pathname
    url.pathname = `/categorias/${categorySlug}`;
    
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/products',
  ],
};

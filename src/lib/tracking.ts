'use client';

// Helper to track a product view
export function trackProductView(slug: string) {
  if (typeof window === 'undefined') return;
  try {
    const list = localStorage.getItem('recently_viewed_products');
    let slugs: string[] = list ? JSON.parse(list) : [];
    
    // Remove if already exists to move it to the front (most recent)
    slugs = slugs.filter(s => s !== slug);
    slugs.unshift(slug);
    
    // Limit to 15 items
    slugs = slugs.slice(0, 15);
    localStorage.setItem('recently_viewed_products', JSON.stringify(slugs));
  } catch (e) {
    console.error('Failed to track product view:', e);
  }
}

// Helper to get recently viewed products
export function getRecentlyViewed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = localStorage.getItem('recently_viewed_products');
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

// Helper to track a search query
export function trackSearchQuery(query: string) {
  if (typeof window === 'undefined' || !query.trim()) return;
  try {
    const list = localStorage.getItem('search_queries');
    let queries: string[] = list ? JSON.parse(list) : [];
    
    // Remove if already exists to move to the front
    queries = queries.filter(q => q.toLowerCase() !== query.toLowerCase());
    queries.unshift(query);
    
    // Limit to last 5 queries
    queries = queries.slice(0, 5);
    localStorage.setItem('search_queries', JSON.stringify(queries));
  } catch (e) {
    console.error('Failed to track search query:', e);
  }
}

// Helper to get search queries
export function getSearchQueries(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const list = localStorage.getItem('search_queries');
    return list ? JSON.parse(list) : [];
  } catch (e) {
    return [];
  }
}

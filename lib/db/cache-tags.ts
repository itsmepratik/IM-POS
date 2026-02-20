/**
 * Centralized cache tags for Next.js unstable_cache and revalidateTag.
 * This ensures consistency across queries and mutations.
 */
export const CACHE_TAGS = {
  // Global data that doesn't depend on location
  BRANDS: 'brands-list',
  CATEGORIES: 'categories-list',
  SHOPS: 'shops-list',
  TYPES: 'types-list',
  
  // Dashboard and metrics
  DASHBOARD: 'dashboard-metrics',
  
  // Helpers for location-specific data
  products: (locationId: string) => `products-${locationId}`,
  inventory: (locationId: string, queryHash?: string) => 
    queryHash ? `inventory-${locationId}-${queryHash}` : `inventory-${locationId}`,
    
  // A global tag to revalidate ALL products across ALL locations (use sparingly)
  ALL_PRODUCTS: 'all-products',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS] | string;

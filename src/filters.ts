import type { NormalizedProduct, ProductSource } from './types';

export type SourceFilter = 'all' | ProductSource;
export type DiscountFilter = 'all' | 'discounted' | '10' | '20';
export type SortOption = 'default' | 'price-asc' | 'price-desc' | 'discount-desc';

export interface FilterState {
  source: SourceFilter;
  discount: DiscountFilter;
  inStockOnly: boolean;
  sort: SortOption;
  search: string;
}

export const defaultFilters: FilterState = {
  source: 'all',
  discount: 'all',
  inStockOnly: false,
  sort: 'default',
  search: '',
};

export function normalizePersian(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ؤ/g, 'و')
    .replace(/ة/g, 'ه')
    .replace(/[\u200c\u200f]/g, ' ');
}

function matchesSearch(product: NormalizedProduct, query: string): boolean {
  if (!query) return true;

  const normalizedQuery = normalizePersian(query);
  const fields = [
    product.name,
    product.storeName,
    product.category ?? '',
    ...product.badges,
  ];

  return fields.some((field) => normalizePersian(field).includes(normalizedQuery));
}

function matchesSource(product: NormalizedProduct, source: SourceFilter): boolean {
  return source === 'all' || product.source === source;
}

function matchesDiscount(product: NormalizedProduct, discount: DiscountFilter): boolean {
  switch (discount) {
    case 'all':
      return true;
    case 'discounted':
      return product.discountPercent > 0;
    case '10':
      return product.discountPercent >= 10;
    case '20':
      return product.discountPercent >= 20;
    default:
      return true;
  }
}

function sortProducts(products: NormalizedProduct[], sort: SortOption): NormalizedProduct[] {
  const sorted = [...products];

  switch (sort) {
    case 'price-asc':
      return sorted.sort((a, b) => a.finalPrice - b.finalPrice);
    case 'price-desc':
      return sorted.sort((a, b) => b.finalPrice - a.finalPrice);
    case 'discount-desc':
      return sorted.sort((a, b) => b.discountPercent - a.discountPercent);
    default:
      return sorted;
  }
}

export function applyFilters(
  products: NormalizedProduct[],
  filters: FilterState,
): NormalizedProduct[] {
  const filtered = products.filter((product) => {
    if (!matchesSource(product, filters.source)) return false;
    if (!matchesDiscount(product, filters.discount)) return false;
    if (filters.inStockOnly && !product.inStock) return false;
    if (!matchesSearch(product, filters.search)) return false;
    return true;
  });

  return sortProducts(filtered, filters.sort);
}

export function countBySource(products: NormalizedProduct[], filters: Omit<FilterState, 'source'>) {
  const base = products.filter((product) => {
    if (!matchesDiscount(product, filters.discount)) return false;
    if (filters.inStockOnly && !product.inStock) return false;
    if (!matchesSearch(product, filters.search)) return false;
    return true;
  });

  return {
    all: base.length,
    okala: base.filter((p) => p.source === 'okala').length,
    digikalajet: base.filter((p) => p.source === 'digikalajet').length,
  };
}

export function countByDiscount(products: NormalizedProduct[], filters: Omit<FilterState, 'discount'>) {
  const base = products.filter((product) => {
    if (!matchesSource(product, filters.source)) return false;
    if (filters.inStockOnly && !product.inStock) return false;
    if (!matchesSearch(product, filters.search)) return false;
    return true;
  });

  return {
    all: base.length,
    discounted: base.filter((p) => p.discountPercent > 0).length,
    '10': base.filter((p) => p.discountPercent >= 10).length,
    '20': base.filter((p) => p.discountPercent >= 20).length,
  };
}

import type { ApiResponse, NormalizedProduct, RawProduct } from './types';

const API_BASE = import.meta.env.DEV ? '/api' : 'https://azard.net';
const FETCH_TIMEOUT_MS = 45_000;

export async function fetchProducts(
  latitude: number,
  longitude: number,
): Promise<ApiResponse> {
  const url = `${API_BASE}/s/?latitude=${latitude}&longitude=${longitude}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });

    if (!response.ok) {
      throw new Error(`خطا در دریافت اطلاعات (${response.status})`);
    }

    const data: ApiResponse = await response.json();

    if (!data.success) {
      throw new Error('پاسخ سرور ناموفق بود');
    }

    if (!Array.isArray(data.products)) {
      throw new Error('فرمت پاسخ سرور نامعتبر است');
    }

    return data;
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('زمان درخواست تمام شد — لطفاً دوباره تلاش کنید');
    }
    if (err instanceof TypeError) {
      throw new Error('اتصال به سرور برقرار نشد — اینترنت یا پروکسی را بررسی کنید');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function parseOkalaBadges(catalogBadges: string): string[] {
  try {
    const parsed = JSON.parse(catalogBadges) as Array<{ name: string }>;
    return parsed.map((badge) => badge.name);
  } catch {
    return [];
  }
}

function isOkalaProduct(product: RawProduct): product is Extract<RawProduct, { source: 'okala' }> {
  return product.source === 'okala' || ('name' in product && 'storeName' in product && 'okPrice' in product);
}

function isDigikalaJetProduct(
  product: RawProduct,
): product is Extract<RawProduct, { source: 'digikalajet' }> {
  return product.source === 'digikalajet' || ('title' in product && 'shop' in product);
}

export function normalizeProduct(product: RawProduct): NormalizedProduct | null {
  try {
    if (isOkalaProduct(product)) {
      const badges = parseOkalaBadges(product.catalogBadges ?? '[]');
      if (product.isBundle) badges.push('بسته‌ای');

      return {
        id: `okala-${product.id}`,
        name: product.name ?? 'بدون نام',
        imageUrl: product.imageUrl ?? '',
        originalPrice: Number(product.price) || 0,
        finalPrice: Number(product.okPrice) || 0,
        discountPercent: Number(product.discountPercent) || 0,
        storeName: product.storeName ?? 'نامشخص',
        source: 'okala',
        inStock: Boolean(product.hasQuantity),
        badges,
      };
    }

    if (isDigikalaJetProduct(product)) {
      const badges: string[] = [];
      if (product.badges?.is_amazing) badges.push('شگفت‌انگیز');
      if (product.badges?.is_kalabarg) badges.push('کالابرگ');
      if (product.badges?.is_best_deal) badges.push('بهترین پیشنهاد');
      if (product.stock?.is_running_low) badges.push('رو به اتمام');

      const rate = product.shop?.rating?.rate;
      const deliveryMinutes = product.shop?.delivery?.estimate_time;

      return {
        id: `digikalajet-${product.id}`,
        name: product.title ?? 'بدون نام',
        imageUrl: product.media ?? '',
        originalPrice: Number(product.price?.price) || 0,
        finalPrice: Number(product.price?.aggregated_price) || 0,
        discountPercent: Number(product.price?.discount_percentage) || 0,
        storeName: product.shop?.title ?? 'نامشخص',
        source: 'digikalajet',
        inStock: Boolean(product.stock?.has_stock),
        category: product.category?.title,
        deliveryMinutes: typeof deliveryMinutes === 'number' ? deliveryMinutes : undefined,
        rating: typeof rate === 'number' ? rate : undefined,
        badges,
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function normalizeProducts(products: RawProduct[]): NormalizedProduct[] {
  return products
    .map(normalizeProduct)
    .filter((product): product is NormalizedProduct => product !== null);
}

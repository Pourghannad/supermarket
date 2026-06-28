export type ProductSource = 'okala' | 'digikalajet';

export interface OkalaProduct {
  id: number;
  name: string;
  shortDescription: string;
  isShowDiscount: boolean;
  discountPercent: number;
  quantity: number;
  maxOrderLimit: number;
  okPrice: number;
  noInPackage: number;
  webLink: string;
  hasQuantity: boolean;
  maximumOrderWholesale: number;
  price: number;
  storeName: string;
  storeId: number;
  storeTypeName: string | null;
  storeTypeId: number;
  imageUrl: string;
  catalogBadges: string;
  isBundle: boolean;
  itemAveragesSales: number;
  source: 'okala';
}

export interface DigikalaJetProduct {
  id: number;
  product_id: string;
  title: string;
  media: string;
  shop: {
    id: string;
    title: string;
    activity_description: string;
    delivery: {
      estimate_time: number;
      free_shipping_price: number;
    };
    rating: {
      rate: number;
      rate_count: string;
    };
    working_status: {
      is_open: boolean;
    };
  };
  badges: {
    is_amazing: boolean;
    is_kalabarg: boolean;
    is_best_deal: boolean;
  };
  category: {
    id: number;
    title: string;
  };
  price: {
    price: number;
    discount: number;
    discount_percentage: number;
    aggregated_price: number;
  };
  stock: {
    has_stock: boolean;
    is_running_low: boolean;
  };
  source: 'digikalajet';
}

export type RawProduct = OkalaProduct | DigikalaJetProduct;

export interface ApiResponse {
  success: boolean;
  total_products: number;
  okala_count: number;
  digikalajet_count: number;
  products: RawProduct[];
}

export interface NormalizedProduct {
  id: string;
  name: string;
  imageUrl: string;
  originalPrice: number;
  finalPrice: number;
  discountPercent: number;
  storeName: string;
  source: ProductSource;
  inStock: boolean;
  category?: string;
  deliveryMinutes?: number;
  rating?: number;
  badges: string[];
}

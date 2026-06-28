import { useCallback, useEffect, useMemo, useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, Box, Button, Container, Snackbar, Stack } from '@mui/material';
import { fetchProducts, normalizeProducts } from './api';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FilterBar } from './components/FilterBar';
import { Header } from './components/Header';
import { LocationMap } from './components/LocationMap';
import { ProductGrid } from './components/ProductGrid';
import { StatsBar } from './components/StatsBar';
import {
  applyFilters,
  countByDiscount,
  countBySource,
  defaultFilters,
  type FilterState,
} from './filters';
import type { NormalizedProduct } from './types';

const DEFAULT_LAT = '35.7777';
const DEFAULT_LNG = '51.4220';

export default function App() {
  const [latitude, setLatitude] = useState(DEFAULT_LAT);
  const [longitude, setLongitude] = useState(DEFAULT_LNG);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<NormalizedProduct[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    okalaCount: 0,
    digikalajetCount: 0,
  });

  const loadProducts = useCallback(async (lat: string, lng: string) => {
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (Number.isNaN(parsedLat) || Number.isNaN(parsedLng)) {
      setError('مختصات جغرافیایی معتبر نیست');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await fetchProducts(parsedLat, parsedLng);
      const normalized = normalizeProducts(data.products);

      if (normalized.length === 0) {
        throw new Error('هیچ محصولی قابل نمایش نبود');
      }

      setProducts(normalized);
      setStats({
        total: data.total_products,
        okalaCount: data.okala_count,
        digikalajetCount: data.digikalajet_count,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطای ناشناخته');
      setProducts([]);
      setStats({ total: 0, okalaCount: 0, digikalajetCount: 0 });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts(DEFAULT_LAT, DEFAULT_LNG);
  }, [loadProducts]);

  const filteredProducts = useMemo(
    () => applyFilters(products, filters),
    [products, filters],
  );

  const sourceCounts = useMemo(
    () =>
      countBySource(products, {
        discount: filters.discount,
        inStockOnly: filters.inStockOnly,
        sort: filters.sort,
        search: filters.search,
      }),
    [products, filters.discount, filters.inStockOnly, filters.sort, filters.search],
  );

  const discountCounts = useMemo(
    () =>
      countByDiscount(products, {
        source: filters.source,
        inStockOnly: filters.inStockOnly,
        sort: filters.sort,
        search: filters.search,
      }),
    [products, filters.source, filters.inStockOnly, filters.sort, filters.search],
  );

  const discountedCount = useMemo(
    () => products.filter((p) => p.discountPercent > 0).length,
    [products],
  );

  const updateFilters = (patch: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  };

  const resetFilters = () => {
    setFilters((prev) => ({ ...defaultFilters, search: prev.search }));
  };

  const handleSubmit = () => {
    loadProducts(latitude, longitude);
  };

  const showContent = !loading || products.length > 0;

  return (
    <ErrorBoundary>
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        <Header
          latitude={latitude}
          longitude={longitude}
          search={filters.search}
          onLatitudeChange={setLatitude}
          onLongitudeChange={setLongitude}
          onSearchChange={(search) => updateFilters({ search })}
          onSubmit={handleSubmit}
          loading={loading}
        />

        <Container maxWidth="xl" sx={{ py: 3 }}>
          <Stack spacing={3}>
            <LocationMap
              latitude={latitude}
              longitude={longitude}
              onLatitudeChange={setLatitude}
              onLongitudeChange={setLongitude}
              onSearch={handleSubmit}
              loading={loading}
            />

            {error && !loading && products.length === 0 && (
              <Alert
                severity="error"
                sx={{ borderRadius: 2 }}
                action={
                  <Button
                    color="inherit"
                    size="small"
                    startIcon={<RefreshIcon />}
                    onClick={handleSubmit}
                  >
                    تلاش مجدد
                  </Button>
                }
              >
                {error}
              </Alert>
            )}

            {showContent && (
              <Stack spacing={3}>
                <StatsBar
                  total={stats.total}
                  okalaCount={stats.okalaCount}
                  digikalajetCount={stats.digikalajetCount}
                  filteredCount={filteredProducts.length}
                  discountedCount={discountedCount}
                />

                <FilterBar
                  filters={filters}
                  sourceCounts={sourceCounts}
                  discountCounts={discountCounts}
                  onChange={updateFilters}
                  onReset={resetFilters}
                />
              </Stack>
            )}

            <ProductGrid
              products={filteredProducts}
              loading={loading && products.length === 0}
              totalLoaded={products.length}
              onRetry={handleSubmit}
            />
          </Stack>
        </Container>

        <Snackbar
          open={Boolean(error) && products.length > 0}
          autoHideDuration={6000}
          onClose={() => setError(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="warning" onClose={() => setError(null)} variant="filled">
            {error}
          </Alert>
        </Snackbar>
      </Box>
    </ErrorBoundary>
  );
}

import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, CircularProgress, Fade, Grid, Typography } from '@mui/material';
import type { NormalizedProduct } from '../types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: NormalizedProduct[];
  loading: boolean;
  totalLoaded: number;
  onRetry?: () => void;
}

export function ProductGrid({ products, loading, totalLoaded, onRetry }: ProductGridProps) {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 2 }}>
        <CircularProgress size={52} thickness={4} />
        <Typography color="text.secondary" fontWeight={600}>
          در حال دریافت محصولات از سرور...
        </Typography>
        <Typography variant="caption" color="text.disabled">
          ممکن است چند ثانیه طول بکشد
        </Typography>
      </Box>
    );
  }

  if (products.length === 0) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 10,
          px: 2,
          borderRadius: 3,
          border: '1px dashed',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Inventory2OutlinedIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" fontWeight={600}>
          محصولی یافت نشد
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          {totalLoaded > 0
            ? `از بین ${totalLoaded.toLocaleString('fa-IR')} محصول، هیچ موردی با فیلترهای فعلی مطابقت ندارد`
            : 'داده‌ای برای نمایش وجود ندارد — دوباره تلاش کنید'}
        </Typography>
        {onRetry && (
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={onRetry}>
            بارگذاری مجدد
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Fade in>
      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {products.length.toLocaleString('fa-IR')} محصول نمایش داده می‌شود
        </Typography>
        <Grid container spacing={2.5}>
          {products.map((product, index) => (
            <Grid key={product.id} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <ProductCard product={product} index={index} />
            </Grid>
          ))}
        </Grid>
      </Box>
    </Fade>
  );
}

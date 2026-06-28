import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import type { NormalizedProduct } from '../types';
import { formatPrice, formatSource } from '../utils';

interface ProductCardProps {
  product: NormalizedProduct;
  index: number;
}

const sourceStyles = {
  okala: { bg: '#e8f5e9', color: '#2e7d32', gradient: 'linear-gradient(135deg, #43a047, #2e7d32)' },
  digikalajet: { bg: '#fff3e0', color: '#ef6c00', gradient: 'linear-gradient(135deg, #fb8c00, #ef6c00)' },
} as const;

export function ProductCard({ product, index }: ProductCardProps) {
  const hasDiscount = product.discountPercent > 0;
  const style = sourceStyles[product.source];

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        opacity: product.inStock ? 1 : 0.75,
        border: '1px solid',
        borderColor: 'divider',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        animation: `fadeUp 0.4s ease ${Math.min(index * 0.04, 0.4)}s both`,
        '@keyframes fadeUp': {
          from: { opacity: 0, transform: 'translateY(12px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 16px 40px rgba(0,0,0,0.12)',
        },
      }}
    >
      <Box sx={{ position: 'relative', overflow: 'hidden' }}>
        <CardMedia
          component="img"
          height="200"
          image={product.imageUrl}
          alt={product.name}
          sx={{
            objectFit: 'contain',
            bgcolor: '#f9fafb',
            p: 2,
            transition: 'transform 0.3s ease',
            '.MuiCard-root:hover &': { transform: 'scale(1.04)' },
          }}
        />

        <Chip
          label={formatSource(product.source)}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: style.gradient,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
          }}
        />

        {hasDiscount && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              right: 0,
              background: 'linear-gradient(135deg, #ff5252, #d32f2f)',
              color: '#fff',
              px: 1.5,
              py: 0.5,
              borderRadius: '12px 0 0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              fontWeight: 800,
              fontSize: '0.8rem',
              boxShadow: '0 4px 12px rgba(211,47,47,0.4)',
            }}
          >
            <LocalOfferIcon sx={{ fontSize: 14 }} />
            {product.discountPercent.toLocaleString('fa-IR')}٪
          </Box>
        )}
      </Box>

      <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 1.25, p: 2 }}>
        <Typography
          variant="subtitle1"
          fontWeight={700}
          lineHeight={1.5}
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 48,
          }}
        >
          {product.name}
        </Typography>

        <Stack direction="row" alignItems="center" gap={0.5}>
          <StorefrontOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {product.storeName}
          </Typography>
        </Stack>

        {product.category && (
          <Chip label={product.category} size="small" variant="outlined" sx={{ alignSelf: 'flex-start' }} />
        )}

        <Box sx={{ mt: 'auto', pt: 1 }}>
          <Stack direction="row" alignItems="baseline" gap={1} flexWrap="wrap">
            <Typography variant="h6" fontWeight={800} sx={{ color: '#1565c0' }}>
              {formatPrice(product.finalPrice)}
              <Typography component="span" variant="caption" color="text.secondary" sx={{ mr: 0.5 }}>
                تومان
              </Typography>
            </Typography>
            {hasDiscount && (
              <Typography variant="body2" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
            {typeof product.deliveryMinutes === 'number' && (
              <Chip
                icon={<AccessTimeIcon sx={{ fontSize: '14px !important' }} />}
                label={`${product.deliveryMinutes.toLocaleString('fa-IR')} دقیقه`}
                size="small"
                sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 600 }}
              />
            )}
            {typeof product.rating === 'number' && (
              <Chip
                icon={<StarIcon sx={{ fontSize: '14px !important', color: '#f9a825 !important' }} />}
                label={product.rating.toLocaleString('fa-IR')}
                size="small"
                sx={{ bgcolor: '#fff8e1', color: '#f57f17', fontWeight: 600 }}
              />
            )}
            {!product.inStock && (
              <Chip label="ناموجود" size="small" sx={{ bgcolor: '#eceff1', fontWeight: 600 }} />
            )}
            {product.badges.slice(0, 2).map((badge) => (
              <Chip
                key={badge}
                label={badge}
                size="small"
                sx={{ bgcolor: style.bg, color: style.color, fontWeight: 600 }}
              />
            ))}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

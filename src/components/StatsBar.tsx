import InventoryIcon from '@mui/icons-material/Inventory';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StorefrontIcon from '@mui/icons-material/Storefront';
import { Box, Paper, Typography } from '@mui/material';

interface StatsBarProps {
  total: number;
  okalaCount: number;
  digikalajetCount: number;
  filteredCount: number;
  discountedCount: number;
}

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
}

function StatCard({ title, value, icon, gradient }: StatCardProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: gradient,
        color: '#fff',
        transition: 'transform 0.2s ease',
        '&:hover': { transform: 'translateY(-3px)' },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: 2,
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {title}
          </Typography>
          <Typography variant="h5" fontWeight={800}>
            {value.toLocaleString('fa-IR')}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export function StatsBar({
  total,
  okalaCount,
  digikalajetCount,
  filteredCount,
  discountedCount,
}: StatsBarProps) {
  return (
    <Box
      sx={{
        mb: 3,
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: 'repeat(5, 1fr)',
        },
        gap: 2,
      }}
    >
      <StatCard
        title="کل محصولات"
        value={total}
        icon={<InventoryIcon />}
        gradient="linear-gradient(135deg, #3949ab, #5c6bc0)"
      />
      <StatCard
        title="اکالا"
        value={okalaCount}
        icon={<StorefrontIcon />}
        gradient="linear-gradient(135deg, #2e7d32, #43a047)"
      />
      <StatCard
        title="دیجی‌کالا جت"
        value={digikalajetCount}
        icon={<LocalShippingIcon />}
        gradient="linear-gradient(135deg, #ef6c00, #fb8c00)"
      />
      <StatCard
        title="تخفیف‌دار"
        value={discountedCount}
        icon={<LocalOfferIcon />}
        gradient="linear-gradient(135deg, #c62828, #e53935)"
      />
      <StatCard
        title="نمایش داده شده"
        value={filteredCount}
        icon={<InventoryIcon />}
        gradient="linear-gradient(135deg, #6a1b9a, #8e24aa)"
      />
    </Box>
  );
}

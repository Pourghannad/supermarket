import ClearAllIcon from '@mui/icons-material/ClearAll';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import SortIcon from '@mui/icons-material/Sort';
import StorefrontIcon from '@mui/icons-material/Storefront';
import {
  Box,
  Chip,
  Divider,
  FormControlLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import type { DiscountFilter, FilterState, SortOption, SourceFilter } from '../filters';
import { defaultFilters } from '../filters';

interface FilterBarProps {
  filters: FilterState;
  sourceCounts: Record<SourceFilter, number>;
  discountCounts: Record<DiscountFilter, number>;
  onChange: (patch: Partial<FilterState>) => void;
  onReset: () => void;
}

const sourceOptions: { value: SourceFilter; label: string; color: string }[] = [
  { value: 'all', label: 'همه فروشگاه‌ها', color: '#5c6bc0' },
  { value: 'okala', label: 'اکالا', color: '#2e7d32' },
  { value: 'digikalajet', label: 'دیجی‌کالا جت', color: '#ef6c00' },
];

const discountOptions: { value: DiscountFilter; label: string }[] = [
  { value: 'all', label: 'همه قیمت‌ها' },
  { value: 'discounted', label: 'تخفیف‌دار' },
  { value: '10', label: '۱۰٪ به بالا' },
  { value: '20', label: '۲۰٪ به بالا' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'پیش‌فرض' },
  { value: 'price-asc', label: 'ارزان‌ترین' },
  { value: 'price-desc', label: 'گران‌ترین' },
  { value: 'discount-desc', label: 'بیشترین تخفیف' },
];

function FilterChip({
  label,
  count,
  active,
  color,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  color?: string;
  onClick: () => void;
}) {
  return (
    <Chip
      label={`${label} (${count.toLocaleString('fa-IR')})`}
      onClick={onClick}
      variant={active ? 'filled' : 'outlined'}
      sx={{
        fontWeight: active ? 700 : 500,
        bgcolor: active ? (color ?? 'primary.main') : 'transparent',
        color: active ? '#fff' : 'text.primary',
        borderColor: active ? 'transparent' : 'divider',
        '&:hover': {
          bgcolor: active ? (color ?? 'primary.dark') : 'action.hover',
        },
        transition: 'all 0.2s ease',
      }}
    />
  );
}

function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.source !== defaultFilters.source ||
    filters.discount !== defaultFilters.discount ||
    filters.inStockOnly !== defaultFilters.inStockOnly ||
    filters.sort !== defaultFilters.sort ||
    filters.search.trim() !== ''
  );
}

export function FilterBar({
  filters,
  sourceCounts,
  discountCounts,
  onChange,
  onReset,
}: FilterBarProps) {
  const active = hasActiveFilters(filters);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        mb: 3,
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Stack direction="row" alignItems="center" gap={1}>
          <FilterListIcon color="primary" />
          <Typography variant="subtitle1" fontWeight={700}>
            فیلترها
          </Typography>
        </Stack>
        {active && (
          <Chip
            icon={<ClearAllIcon />}
            label="پاک کردن فیلترها"
            size="small"
            onClick={onReset}
            color="default"
            variant="outlined"
            sx={{ cursor: 'pointer' }}
          />
        )}
      </Stack>

      <Stack spacing={2}>
        <Box>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <StorefrontIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              منبع محصول
            </Typography>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {sourceOptions.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                count={sourceCounts[option.value]}
                active={filters.source === option.value}
                color={option.color}
                onClick={() => onChange({ source: option.value })}
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        <Box>
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1 }}>
            <LocalOfferIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              تخفیف
            </Typography>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {discountOptions.map((option) => (
              <FilterChip
                key={option.value}
                label={option.label}
                count={discountCounts[option.value]}
                active={filters.discount === option.value}
                color="#d32f2f"
                onClick={() => onChange({ discount: option.value })}
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="space-between"
          gap={2}
        >
          <FormControlLabel
            control={
              <Switch
                checked={filters.inStockOnly}
                onChange={(e) => onChange({ inStockOnly: e.target.checked })}
                color="success"
              />
            }
            label="فقط موجود"
          />

          <Stack direction="row" alignItems="center" gap={1} sx={{ minWidth: 220 }}>
            <SortIcon fontSize="small" color="action" />
            <Select
              size="small"
              fullWidth
              value={filters.sort}
              onChange={(e) => onChange({ sort: e.target.value as SortOption })}
            >
              {sortOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}

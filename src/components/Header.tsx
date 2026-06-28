import LocationOnIcon from '@mui/icons-material/LocationOn';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import {
  AppBar,
  Box,
  Button,
  Container,
  InputAdornment,
  Paper,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material';

interface HeaderProps {
  latitude: string;
  longitude: string;
  search: string;
  onLatitudeChange: (value: string) => void;
  onLongitudeChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function Header({
  latitude,
  longitude,
  search,
  onLatitudeChange,
  onLongitudeChange,
  onSearchChange,
  onSubmit,
  loading,
}: HeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 50%, #1976d2 100%)',
        borderBottom: 'none',
      }}
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 2, gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 200 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocationOnIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>
                سوپرمارکت
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.85 }}>
                جستجوی محصولات اطراف شما
              </Typography>
            </Box>
          </Box>

          <Paper
            elevation={0}
            sx={{
              display: 'flex',
              gap: 1,
              p: 1,
              flex: { xs: '1 1 100%', lg: '0 0 auto' },
              borderRadius: 2.5,
              bgcolor: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <TextField
              size="small"
              label="عرض جغرافیایی"
              value={latitude}
              onChange={(e) => onLatitudeChange(e.target.value)}
              sx={{ width: 130 }}
              inputProps={{ dir: 'ltr' }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
              InputProps={{
                sx: {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                },
              }}
            />
            <TextField
              size="small"
              label="طول جغرافیایی"
              value={longitude}
              onChange={(e) => onLongitudeChange(e.target.value)}
              sx={{ width: 130 }}
              inputProps={{ dir: 'ltr' }}
              InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.8)' } }}
              InputProps={{
                sx: {
                  color: '#fff',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.5)' },
                },
              }}
            />
            <Button
              variant="contained"
              onClick={onSubmit}
              disabled={loading}
              startIcon={<MyLocationIcon />}
              sx={{
                whiteSpace: 'nowrap',
                bgcolor: '#ff6f00',
                fontWeight: 700,
                px: 2.5,
                '&:hover': { bgcolor: '#ef6c00' },
              }}
            >
              جستجو
            </Button>
          </Paper>

          <TextField
            size="small"
            placeholder="جستجوی محصول، فروشگاه یا دسته..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            sx={{
              flex: 1,
              minWidth: 240,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.95)',
                borderRadius: 2.5,
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Toolbar>
      </Container>
    </AppBar>
  );
}

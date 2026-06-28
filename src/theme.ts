import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: '"Vazirmatn", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  palette: {
    primary: {
      main: '#1565c0',
      light: '#5e92f3',
      dark: '#0d47a1',
    },
    secondary: {
      main: '#ef6c00',
    },
    success: {
      main: '#2e7d32',
    },
    background: {
      default: '#f0f4f8',
      paper: '#ffffff',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontFamily: '"Vazirmatn", sans-serif',
        },
      },
    },
  },
});

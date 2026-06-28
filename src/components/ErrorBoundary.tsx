import { Component, type ErrorInfo, type ReactNode } from 'react';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Box, Button, Paper, Typography } from '@mui/material';

interface ErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message || 'خطای ناشناخته' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, message: '' });
    this.props.onRetry?.();
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Paper sx={{ p: 4, maxWidth: 420, textAlign: 'center', borderRadius: 3 }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 56, mb: 2 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>
              خطا در نمایش صفحه
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {this.state.message}
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleRetry}>
              بارگذاری مجدد
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

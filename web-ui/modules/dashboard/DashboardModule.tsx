'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Button,
  IconButton,
  Skeleton,
  Alert,
  Paper,
  Stack,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Schedule,
  Assessment,
  PlayArrow,
  Refresh,
  Info,
  CheckCircle,
  Error as ErrorIcon,
  Warning,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { RunStatus } from '@/lib/types';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeIn, scaleIn, hoverScale } from '@/lib/animations';

interface KpiCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';
}

function KpiCard({ title, value, change, icon, color }: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Paper
        sx={{
          p: 3,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            bgcolor: `${color}.main`,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700}>
              {value}
            </Typography>
            {change !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                {change >= 0 ? (
                  <TrendingUp color="success" fontSize="small" />
                ) : (
                  <TrendingDown color="error" fontSize="small" />
                )}
                <Typography
                  variant="body2"
                  color={change >= 0 ? 'success.main' : 'error.main'}
                  sx={{ ml: 0.5 }}
                >
                  {Math.abs(change)}%
                </Typography>
              </Box>
            )}
          </Box>
          <Box sx={{ color: `${color}.main`, opacity: 0.3 }}>
            {icon}
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}

export function DashboardModule() {
  const kpis = [
    {
      title: 'Total Analyses',
      value: '247',
      change: 12,
      icon: <Assessment sx={{ fontSize: 48 }} />,
      color: 'primary' as const,
    },
    {
      title: 'Success Rate',
      value: '94.2%',
      change: 3.5,
      icon: <TrendingUp sx={{ fontSize: 48 }} />,
      color: 'success' as const,
    },
    {
      title: 'Avg. Runtime',
      value: '2.4s',
      change: -15,
      icon: <Schedule sx={{ fontSize: 48 }} />,
      color: 'info' as const,
    },
    {
      title: 'Active Reports',
      value: '18',
      change: 0,
      icon: <Assessment sx={{ fontSize: 48 }} />,
      color: 'warning' as const,
    },
  ];

  const recentAnalyses = [
    { id: 1, symbol: 'AAPL', status: 'completed', time: '2 minutes ago', result: 'bullish' },
    { id: 2, symbol: 'GOOGL', status: 'running', time: '5 minutes ago', result: null },
    { id: 3, symbol: 'MSFT', status: 'completed', time: '10 minutes ago', result: 'neutral' },
    { id: 4, symbol: 'AMZN', status: 'failed', time: '15 minutes ago', result: null },
    { id: 5, symbol: 'TSLA', status: 'completed', time: '20 minutes ago', result: 'bearish' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'running':
        return 'info';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const getResultColor = (result: string | null) => {
    switch (result) {
      case 'bullish':
        return 'success';
      case 'bearish':
        return 'error';
      case 'neutral':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Monitor your trading analysis performance and recent activities
      </Typography>

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {kpis.map((kpi, index) => (
          <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard {...kpi} />
          </Grid>
        ))}
      </Grid>

      {/* Recent Analyses */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Analyses
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Latest trading analyses and signals
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {recentAnalyses.map((analysis) => (
                <Paper
                  key={analysis.id}
                  variant="outlined"
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {analysis.symbol}
                    </Typography>
                    <Chip
                      label={analysis.status}
                      size="small"
                      color={getStatusColor(analysis.status) as any}
                      variant={analysis.status === 'running' ? 'filled' : 'outlined'}
                    />
                    {analysis.result && (
                      <Chip
                        label={analysis.result}
                        size="small"
                        color={getResultColor(analysis.result) as any}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {analysis.time}
                  </Typography>
                </Paper>
              ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Status
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current system health and performance
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">CPU Usage</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    45%
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={45} />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Memory</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    2.8 GB / 8 GB
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={35} color="secondary" />
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">API Quota</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    8,500 / 10,000
                  </Typography>
                </Box>
                <LinearProgress variant="determinate" value={85} color="warning" />
              </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

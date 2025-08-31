'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Skeleton,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  Tooltip,
  LinearProgress,
  Grid,
} from '@mui/material';
import {
  Download,
  MoreVert,
  Visibility,
  PictureAsPdf,
  Code,
  Description,
  TrendingUp,
  CalendarMonth,
  AccessTime,
  Analytics,
  BarChart as BarChartIcon,
  DonutSmall,
} from '@mui/icons-material';
import { Card } from '@/components/primitives';
import { TradingAgentsAPI } from '@/lib/api';
import { formatDistance, format, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const api = new TradingAgentsAPI();

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

interface ReportStats {
  totalReports: number;
  avgDuration: number;
  successRate: number;
  byProvider: Record<string, number>;
  byTicker: Record<string, number>;
  timeline: Array<{ date: string; count: number }>;
}

export function ReportsModule() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [timeRange, setTimeRange] = useState('7d');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: runsData, isLoading } = useQuery({
    queryKey: ['runs', 'completed', timeRange],
    queryFn: () => api.listRuns({ 
      status: 'completed',
      limit: 100
    }),
  });

  // Calculate statistics
  const stats = useMemo<ReportStats>(() => {
    if (!runsData?.runs) {
      return {
        totalReports: 0,
        avgDuration: 0,
        successRate: 0,
        byProvider: {},
        byTicker: {},
        timeline: [],
      };
    }

    const runs = runsData.runs;
    const byProvider: Record<string, number> = {};
    const byTicker: Record<string, number> = {};
    const dailyCounts: Record<string, number> = {};
    let totalDuration = 0;
    let validDurationCount = 0;

    runs.forEach(run => {
      // Provider stats
      const provider = run.config.llmProvider || 'unknown';
      byProvider[provider] = (byProvider[provider] || 0) + 1;

      // Ticker stats
      const ticker = run.config.ticker;
      byTicker[ticker] = (byTicker[ticker] || 0) + 1;

      // Duration stats
      if (run.startTime && run.endTime) {
        const duration = new Date(run.endTime).getTime() - new Date(run.startTime).getTime();
        totalDuration += duration;
        validDurationCount++;
      }

      // Timeline stats
      const date = format(new Date(run.startTime || new Date()), 'yyyy-MM-dd');
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    });

    // Create timeline data
    const timeline = Object.entries(dailyCounts)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30) // Last 30 days
      .map(([date, count]) => ({ date, count }));

    return {
      totalReports: runs.length,
      avgDuration: validDurationCount > 0 ? totalDuration / validDurationCount : 0,
      successRate: runs.length > 0 ? (runs.filter(r => r.status === 'completed').length / runs.length) * 100 : 0,
      byProvider,
      byTicker,
      timeline,
    };
  }, [runsData]);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, runId: string) => {
    setAnchorEl(event.currentTarget);
    setSelectedRunId(runId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRunId(null);
  };

  const handleDownload = async (format: 'pdf' | 'json' | 'md') => {
    if (!selectedRunId) return;
    const reportUrl = `/api/reports/${selectedRunId}/download?format=${format}`;
    window.open(reportUrl, '_blank');
    handleMenuClose();
  };

  const handleViewReport = (runId: string) => {
    router.push(`/run/${runId}`);
  };

  const pieData = Object.entries(stats.byProvider).map(([name, value]) => ({
    name,
    value,
  }));

  const barData = Object.entries(stats.byTicker)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([ticker, count]) => ({
      ticker,
      count,
    }));

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            分析报告
          </Typography>
          <Typography variant="body1" color="text.secondary">
            查看和下载已完成的分析报告，以及统计信息
          </Typography>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={3}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />
                  <Box>
                    <Typography variant="h4">{stats.totalReports}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      总报告数
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={3}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccessTime sx={{ fontSize: 40, color: 'secondary.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {Math.round(stats.avgDuration / 1000 / 60)}m
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      平均耗时
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={3}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {stats.successRate.toFixed(0)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      成功率
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>

          <Grid size={3}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <BarChartIcon sx={{ fontSize: 40, color: 'warning.main' }} />
                  <Box>
                    <Typography variant="h4">
                      {Object.keys(stats.byTicker).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      股票数量
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={8}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  报告生成趋势
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.timeline}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => format(parseISO(value), 'MM/dd')}
                    />
                    <YAxis />
                    <RechartsTooltip />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      dot={{ fill: '#8884d8' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>

          <Grid size={4}>
            <Card>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  模型使用分布
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Card>
          </Grid>
        </Grid>

        {/* Top Tickers Bar Chart */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              热门股票分析
            </Typography>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ticker" />
                <YAxis />
                <RechartsTooltip />
                <Bar dataKey="count" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Card>

        {/* Reports List */}
        <Card>
          <Box sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                最近报告
              </Typography>
              <ToggleButtonGroup
                value={viewMode}
                exclusive
                onChange={(e, newMode) => newMode && setViewMode(newMode)}
                size="small"
              >
                <ToggleButton value="grid">
                  <DonutSmall />
                </ToggleButton>
                <ToggleButton value="list">
                  <Description />
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {isLoading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} variant="rectangular" height={100} />
                ))}
              </Box>
            ) : runsData?.runs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography color="text.secondary">
                  暂无已完成的分析报告
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}>
                {runsData?.runs.slice(0, 12).map((run) => (
                  <Grid size={viewMode === 'grid' ? 4 : 12} key={run.id}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        '&:hover': {
                          boxShadow: 4,
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => handleViewReport(run.id)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                        <Box sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <Typography variant="h6">
                              {run.config.ticker}
                            </Typography>
                            <Chip
                              label="已完成"
                              color="success"
                              size="small"
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <CalendarMonth fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {run.config.date}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {formatDistance(new Date(run.endTime || run.startTime || new Date()), new Date(), {
                              addSuffix: true,
                              locale: zhCN,
                            })}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            <Chip
                              label={`${run.config.analysts?.length || 0} 分析师`}
                              size="small"
                              variant="outlined"
                              sx={{ mr: 1 }}
                            />
                            <Chip
                              label={run.config.llmProvider || 'OpenAI'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMenuOpen(e, run.id);
                            }}
                          >
                            <MoreVert />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Card>

        {/* Download Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={() => handleDownload('pdf')}>
            <PictureAsPdf sx={{ mr: 1 }} fontSize="small" />
            下载 PDF
          </MenuItem>
          <MenuItem onClick={() => handleDownload('md')}>
            <Description sx={{ mr: 1 }} fontSize="small" />
            下载 Markdown
          </MenuItem>
          <MenuItem onClick={() => handleDownload('json')}>
            <Code sx={{ mr: 1 }} fontSize="small" />
            下载 JSON
          </MenuItem>
        </Menu>
      </motion.div>
    </Box>
  );
}

'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  InputAdornment,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams, GridToolbar } from '@mui/x-data-grid';
import { 
  Search, 
  FilterList, 
  Visibility, 
  Refresh,
  TrendingUp,
  Schedule,
  CheckCircle,
  Error,
  HourglassEmpty
} from '@mui/icons-material';
import { Card, Button } from '@/components/primitives';
import { TradingAgentsAPI } from '@/lib/api';
import { format, formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { motion } from 'framer-motion';

const api = new TradingAgentsAPI();

interface RunData {
  id: string;
  status: 'running' | 'completed' | 'failed' | 'pending';
  config: {
    ticker: string;
    date: string;
    analysts: string[];
    llmProvider: string;
  };
  startTime?: string;
  endTime?: string;
}

const statusConfig = {
  running: { label: 'Running', color: 'info' as const, icon: <HourglassEmpty /> },
  completed: { label: 'Completed', color: 'success' as const, icon: <CheckCircle /> },
  failed: { label: 'Failed', color: 'error' as const, icon: <Error /> },
  pending: { label: 'Pending', color: 'warning' as const, icon: <Schedule /> },
};

export function HistoryModule() {
  const router = useRouter();
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  const [filterModel, setFilterModel] = useState({
    status: 'all',
    search: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['runs', paginationModel, filterModel],
    queryFn: () => api.listRuns({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      status: filterModel.status === 'all' ? undefined : filterModel.status,
      search: filterModel.search || undefined,
    }),
    placeholderData: (previousData) => previousData,
  });

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'ticker',
      headerName: 'Ticker',
      width: 120,
      renderCell: (params: GridRenderCellParams) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TrendingUp fontSize="small" color="primary" />
          <Typography variant="body2" fontWeight={600}>
            {params.row.config.ticker}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 140,
      renderCell: (params: GridRenderCellParams) => {
        const status = statusConfig[params.value as keyof typeof statusConfig];
        return (
          <Chip
            label={status.label}
            color={status.color}
            size="small"
            icon={status.icon}
            variant="outlined"
          />
        );
      },
    },
    {
      field: 'date',
      headerName: 'Analysis Date',
      width: 130,
      valueGetter: (value, row) => row.config.date,
    },
    {
      field: 'startTime',
      headerName: 'Started',
      width: 180,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.value) return '-';
        return (
          <Tooltip title={format(new Date(params.value), 'PPpp', { locale: zhCN })}>
            <Typography variant="caption">
              {formatDistance(new Date(params.value), new Date(), {
                addSuffix: true,
                locale: zhCN,
              })}
            </Typography>
          </Tooltip>
        );
      },
    },
    {
      field: 'analysts',
      headerName: 'Analysts',
      width: 200,
      renderCell: (params: GridRenderCellParams) => {
        const analysts = params.row.config.analysts || [];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {analysts.map((analyst: string) => (
              <Chip
                key={analyst}
                label={analyst}
                size="small"
                variant="filled"
                sx={{ fontSize: '0.7rem' }}
              />
            ))}
          </Box>
        );
      },
    },
    {
      field: 'llmProvider',
      headerName: 'Provider',
      width: 120,
      valueGetter: (value, row) => row.config.llmProvider || '-',
    },
    {
      field: 'duration',
      headerName: 'Duration',
      width: 120,
      renderCell: (params: GridRenderCellParams) => {
        if (!params.row.startTime || !params.row.endTime) return '-';
        const duration = new Date(params.row.endTime).getTime() - new Date(params.row.startTime).getTime();
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        return `${minutes}m ${seconds}s`;
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: (params: GridRenderCellParams) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => router.push(`/run/${params.row.id}`)}
            color="primary"
          >
            <Visibility />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [router]);

  const rows = data?.runs || [];
  const rowCount = data?.total || 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            Analysis History
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage all analysis task execution history
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<Refresh />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Box>

      <Card>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              placeholder="Search by ticker..."
              value={filterModel.search}
              onChange={(e) => setFilterModel({ ...filterModel, search: e.target.value })}
              size="small"
              sx={{ flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              select
              value={filterModel.status}
              onChange={(e) => setFilterModel({ ...filterModel, status: e.target.value })}
              size="small"
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <FilterList />
                  </InputAdornment>
                ),
              }}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="running">Running</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
            </TextField>
          </Box>
        </Box>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <DataGrid
            rows={rows}
            columns={columns}
            rowCount={rowCount}
            loading={isLoading}
            pageSizeOptions={[5, 10, 25, 50]}
            paginationModel={paginationModel}
            onPaginationModelChange={setPaginationModel}
            paginationMode="server"
            autoHeight
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': {
                borderBottom: 1,
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaders': {
                bgcolor: 'background.default',
                borderBottom: 2,
                borderColor: 'divider',
              },
              '& .MuiDataGrid-footerContainer': {
                borderTop: 2,
                borderColor: 'divider',
              },
              '& .MuiDataGrid-row:hover': {
                bgcolor: 'action.hover',
              },
            }}
            slots={{
              noRowsOverlay: () => (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  height: '100%',
                  p: 3 
                }}>
                  <Typography variant="h6" color="text.secondary">
                    No analysis runs found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try adjusting your filters or create a new analysis
                  </Typography>
                </Box>
              ),
            }}
            localeText={{
              toolbarDensity: 'Row density',
              toolbarDensityLabel: 'Row density',
              toolbarDensityCompact: 'Compact',
              toolbarDensityStandard: 'Standard',
              toolbarDensityComfortable: 'Comfortable',
              toolbarColumns: 'Columns',
              toolbarFilters: 'Filters',
              toolbarExport: 'Export',
            }}
          />
        </motion.div>
      </Card>
    </Box>
  );
}

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  LinearProgress,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Clear,
  Download,
  Search,
  FilterList,
  Terminal,
  BugReport,
  Info,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { Card } from '@/components/primitives';
import { TradingAgentsAPI } from '@/lib/api';
import { LogEntry as APILogEntry } from '@/lib/cli-contract';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';

const api = new TradingAgentsAPI();

interface LogEntry extends Omit<APILogEntry, 'timestamp'> {
  id: string;
  timestamp: string;
  source?: string;
}

interface LogStreamModuleProps {
  runId: string;
  height?: number | string;
}

const levelConfig = {
  info: { color: 'info', icon: <Info fontSize="small" /> },
  warn: { color: 'warning', icon: <Warning fontSize="small" /> },
  error: { color: 'error', icon: <ErrorIcon fontSize="small" /> },
  debug: { color: 'default', icon: <BugReport fontSize="small" /> },
} as const;

export function LogStreamModule({ runId, height = 600 }: LogStreamModuleProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);

  // Stream logs using EventSource
  useEffect(() => {
    setIsLoading(true);
    setIsConnected(false);
    
    const cleanup = api.streamLogs(
      runId,
      (log) => {
        setIsLoading(false);
        setIsConnected(true);
        
        const newLog: LogEntry = {
          id: `log-${Date.now()}-${Math.random()}`,
          timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : new Date().toISOString(),
          level: log.level || 'info',
          message: log.message || '',
          data: log.data,
        };
        
        setLogs(prev => [...prev, newLog]);
        
        // Auto-scroll to bottom if enabled
        if (autoScroll && parentRef.current) {
          setTimeout(() => {
            parentRef.current?.scrollTo({
              top: parentRef.current.scrollHeight,
              behavior: 'smooth',
            });
          }, 100);
        }
      },
      (error) => {
        console.error('Log stream error:', error);
        setIsConnected(false);
      }
    );

    return cleanup;
  }, [runId, autoScroll]);

  // Filter logs based on level and search term
  const filteredLogs = logs.filter((log) => {
    const levelMatch = filterLevel === 'all' || log.level === filterLevel;
    const searchMatch = !searchTerm || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source?.toLowerCase().includes(searchTerm.toLowerCase());
    return levelMatch && searchMatch;
  });

  const handleClearLogs = () => {
    setLogs([]);
  };

  const handleDownloadLogs = () => {
    const logText = filteredLogs
      .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.source ? `[${log.source}] ` : ''}${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${runId}-${new Date().toISOString()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const LogItem = useCallback(({ log }: { log: LogEntry }) => {
    const config = levelConfig[log.level];
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Box
          sx={{
            p: 1,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            borderBottom: 1,
            borderColor: 'divider',
            '&:hover': {
              bgcolor: 'action.hover',
            },
            fontFamily: 'monospace',
            fontSize: '0.875rem',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 200 }}>
            <Box sx={{ color: `${config.color}.main` }}>
              {config.icon}
            </Box>
            <Typography
              variant="caption"
              sx={{ 
                fontFamily: 'monospace',
                color: 'text.secondary',
                whiteSpace: 'nowrap',
              }}
            >
              {new Date(log.timestamp).toLocaleTimeString()}
            </Typography>
            {log.source && (
              <Chip
                label={log.source}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            )}
          </Box>
          <Typography
            sx={{
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              flex: 1,
              wordBreak: 'break-word',
              whiteSpace: 'pre-wrap',
              color: log.level === 'error' ? 'error.main' : 
                     log.level === 'warn' ? 'warning.main' : 
                     'text.primary',
            }}
          >
            {log.message}
          </Typography>
        </Box>
      </motion.div>
    );
  }, []);

  return (
    <Card>
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Terminal color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Live Logs
            </Typography>
            {isLoading && <LinearProgress sx={{ width: 100 }} />}
            <Chip
              label={`${filteredLogs.length} entries`}
              size="small"
              variant="outlined"
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <ToggleButton
              value="auto-scroll"
              selected={autoScroll}
              onChange={() => setAutoScroll(!autoScroll)}
              size="small"
            >
              {autoScroll ? <Pause /> : <PlayArrow />}
              {autoScroll ? 'Pause' : 'Resume'}
            </ToggleButton>
            <Tooltip title="Clear logs">
              <IconButton size="small" onClick={handleClearLogs}>
                <Clear />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download logs">
              <IconButton size="small" onClick={handleDownloadLogs}>
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
          <ToggleButtonGroup
            value={filterLevel}
            exclusive
            onChange={(_, value) => value && setFilterLevel(value)}
            size="small"
          >
            <ToggleButton value="all">
              <FilterList fontSize="small" />
              All
            </ToggleButton>
            <ToggleButton value="info">
              <Info fontSize="small" />
              Info
            </ToggleButton>
            <ToggleButton value="warn">
              <Warning fontSize="small" />
              Warning
            </ToggleButton>
            <ToggleButton value="error">
              <ErrorIcon fontSize="small" />
              Error
            </ToggleButton>
            <ToggleButton value="debug">
              <BugReport fontSize="small" />
              Debug
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      <Box
        sx={{
          height,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {filteredLogs.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'text.secondary',
            }}
          >
            <Terminal sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
            <Typography variant="body1">
              {searchTerm || filterLevel !== 'all' 
                ? 'No logs match your filters'
                : 'Waiting for logs...'}
            </Typography>
          </Box>
        ) : (
          <Box
            ref={parentRef}
            sx={{
              height: '100%',
              overflow: 'auto',
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(0,0,0,0.2) transparent',
              '&::-webkit-scrollbar': {
                width: 8,
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'action.disabled',
                borderRadius: 1,
                '&:hover': {
                  backgroundColor: 'action.selected',
                },
              },
            }}
          >
            {filteredLogs.map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </Box>
        )}
      </Box>
    </Card>
  );
}

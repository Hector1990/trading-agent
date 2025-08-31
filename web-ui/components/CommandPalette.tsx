'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Chip,
  InputAdornment,
  Paper,
  alpha,
  Divider,
  useTheme,
} from '@mui/material';
import {
  Search,
  Dashboard,
  PlayArrow,
  History,
  Description,
  Settings,
  Help,
  Code,
  Refresh,
  DarkMode,
  LightMode,
  ContentCopy,
  OpenInNew,
  Terminal,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useTheme as useAppTheme } from '@/app/theme-provider';
import { motion, AnimatePresence } from 'framer-motion';
import { modal, backdrop } from '@/lib/animations';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  category: 'navigation' | 'action' | 'theme' | 'developer';
}

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();

  const commands: Command[] = useMemo(() => [
    // Navigation commands
    {
      id: 'nav-dashboard',
      title: '前往仪表板',
      description: '查看系统概览和关键指标',
      icon: <Dashboard />,
      shortcut: 'G D',
      action: () => {
        router.push('/');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'nav-run',
      title: '运行分析',
      description: '创建新的股票分析任务',
      icon: <PlayArrow />,
      shortcut: 'G R',
      action: () => {
        router.push('/run');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'nav-history',
      title: '历史记录',
      description: '查看所有分析历史',
      icon: <History />,
      shortcut: 'G H',
      action: () => {
        router.push('/history');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'nav-reports',
      title: '分析报告',
      description: '查看详细分析报告',
      icon: <Description />,
      shortcut: 'G P',
      action: () => {
        router.push('/reports');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'nav-settings',
      title: '设置',
      description: '配置系统设置',
      icon: <Settings />,
      shortcut: 'G S',
      action: () => {
        router.push('/settings');
        setOpen(false);
      },
      category: 'navigation',
    },
    {
      id: 'nav-help',
      title: '帮助中心',
      description: '查看文档和帮助',
      icon: <Help />,
      shortcut: 'G ?',
      action: () => {
        router.push('/help');
        setOpen(false);
      },
      category: 'navigation',
    },
    // Action commands
    {
      id: 'action-refresh',
      title: '刷新页面',
      description: '重新加载当前页面',
      icon: <Refresh />,
      shortcut: 'R',
      action: () => {
        window.location.reload();
        setOpen(false);
      },
      category: 'action',
    },
    {
      id: 'action-copy-url',
      title: '复制当前URL',
      description: '复制当前页面URL到剪贴板',
      icon: <ContentCopy />,
      action: () => {
        navigator.clipboard.writeText(window.location.href);
        setOpen(false);
      },
      category: 'action',
    },
    {
      id: 'action-new-tab',
      title: '在新标签页打开',
      description: '在新标签页打开当前页面',
      icon: <OpenInNew />,
      action: () => {
        window.open(window.location.href, '_blank');
        setOpen(false);
      },
      category: 'action',
    },
    // Theme commands
    {
      id: 'theme-toggle',
      title: mode === 'dark' ? '切换到浅色模式' : '切换到深色模式',
      description: '切换应用主题',
      icon: mode === 'dark' ? <LightMode /> : <DarkMode />,
      shortcut: 'T',
      action: () => {
        toggleTheme();
        setOpen(false);
      },
      category: 'theme',
    },
    // Developer commands
    {
      id: 'dev-console',
      title: '打开控制台',
      description: '打开浏览器开发者控制台',
      icon: <Terminal />,
      shortcut: 'Ctrl+Shift+J',
      action: () => {
        // This doesn't actually open console but could trigger other dev actions
        console.log('Developer mode activated');
        setOpen(false);
      },
      category: 'developer',
    },
    {
      id: 'dev-api-test',
      title: 'API 健康检查',
      description: '测试后端API连接',
      icon: <Code />,
      action: async () => {
        const response = await fetch('/api/health');
        const data = await response.json();
        console.log('API Health:', data);
        setOpen(false);
      },
      category: 'developer',
    },
  ], [router, mode, toggleTheme]);

  const filteredCommands = useMemo(() => {
    if (!search) return commands;
    
    const searchLower = search.toLowerCase();
    return commands.filter(
      cmd =>
        cmd.title.toLowerCase().includes(searchLower) ||
        cmd.description?.toLowerCase().includes(searchLower) ||
        cmd.category.toLowerCase().includes(searchLower)
    );
  }, [commands, search]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Open command palette with Cmd+K or Ctrl+K
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setOpen(true);
      setSearch('');
      setSelectedIndex(0);
    }

    // Quick navigation shortcuts
    if (!open) {
      // G shortcuts for navigation
      if (e.key === 'g' || e.key === 'G') {
        const handleGShortcut = (e2: KeyboardEvent) => {
          switch(e2.key.toLowerCase()) {
            case 'd':
              router.push('/');
              break;
            case 'r':
              router.push('/run');
              break;
            case 'h':
              router.push('/history');
              break;
            case 'p':
              router.push('/reports');
              break;
            case 's':
              router.push('/settings');
              break;
            case '?':
              router.push('/help');
              break;
          }
          window.removeEventListener('keydown', handleGShortcut);
        };
        
        window.addEventListener('keydown', handleGShortcut);
        setTimeout(() => window.removeEventListener('keydown', handleGShortcut), 1000);
      }

      // Theme toggle
      if (e.key === 't' || e.key === 'T') {
        toggleTheme();
      }

      // Refresh
      if (e.key === 'r' || e.key === 'R') {
        if (!e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          window.location.reload();
        }
      }
    }
  }, [open, router, toggleTheme]);

  const handleDialogKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }, [filteredCommands, selectedIndex]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const getCategoryLabel = (category: string) => {
    switch(category) {
      case 'navigation': return '导航';
      case 'action': return '操作';
      case 'theme': return '主题';
      case 'developer': return '开发者';
      default: return category;
    }
  };

  const getCategoryColor = (category: string) => {
    switch(category) {
      case 'navigation': return 'primary';
      case 'action': return 'secondary';
      case 'theme': return 'warning';
      case 'developer': return 'info';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          position: 'fixed',
          top: '20%',
          transform: 'translateY(-20%)',
          maxHeight: '60vh',
          overflow: 'hidden',
        },
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={modal}
          >
            <DialogContent sx={{ p: 0 }}>
              <Box>
                <TextField
                  fullWidth
                  autoFocus
                  placeholder="输入命令或搜索..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleDialogKeyDown}
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    sx: {
                      '& fieldset': { border: 'none' },
                      fontSize: '1.125rem',
                      p: 2,
                    },
                  }}
                />
                <Divider />
                <List
                  sx={{
                    maxHeight: 'calc(60vh - 80px)',
                    overflow: 'auto',
                    py: 1,
                  }}
                >
                  {filteredCommands.length === 0 ? (
                    <Box sx={{ p: 3, textAlign: 'center' }}>
                      <Typography color="text.secondary">
                        没有找到匹配的命令
                      </Typography>
                    </Box>
                  ) : (
                    filteredCommands.map((cmd, index) => (
                      <ListItem
                        key={cmd.id}
                        disablePadding
                        onMouseEnter={() => setSelectedIndex(index)}
                      >
                        <ListItemButton
                          selected={index === selectedIndex}
                          onClick={cmd.action}
                          sx={{
                            borderRadius: 1,
                            mx: 1,
                            mb: 0.5,
                            '&.Mui-selected': {
                              backgroundColor: alpha(
                                theme.palette.primary.main,
                                0.08
                              ),
                            },
                          }}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {cmd.icon}
                          </ListItemIcon>
                          <ListItemText
                            primary={cmd.title}
                            secondary={cmd.description}
                            primaryTypographyProps={{
                              fontWeight: 500,
                            }}
                          />
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            {cmd.shortcut && (
                              <Chip
                                label={cmd.shortcut}
                                size="small"
                                variant="outlined"
                                sx={{ height: 22 }}
                              />
                            )}
                            <Chip
                              label={getCategoryLabel(cmd.category)}
                              size="small"
                              color={getCategoryColor(cmd.category) as any}
                              sx={{ height: 22 }}
                            />
                          </Box>
                        </ListItemButton>
                      </ListItem>
                    ))
                  )}
                </List>
                <Box
                  sx={{
                    p: 1.5,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 2,
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    <strong>↑↓</strong> 导航
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Enter</strong> 选择
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    <strong>Esc</strong> 关闭
                  </Typography>
                </Box>
              </Box>
            </DialogContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

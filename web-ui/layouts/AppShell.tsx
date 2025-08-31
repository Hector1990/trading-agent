'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Button,
  Tooltip,
  Divider,
  Container,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  PlayArrow,
  History,
  Description,
  Settings,
  Help,
  ChevronLeft,
  Notifications,
  Person,
  LightMode,
  DarkMode,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { useTheme as useAppTheme } from '@/app/theme-provider';
import AnimatedPage from '@/components/layout/AnimatedPage';
import CommandPalette from '@/components/CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';
import { slideIn, hover } from '@/lib/animations';

const drawerWidth = 280;
const collapsedDrawerWidth = 72;

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <Dashboard />, path: '/' },
  { label: 'Run Analysis', icon: <PlayArrow />, path: '/run' },
  { label: 'History', icon: <History />, path: '/history' },
  { label: 'Reports', icon: <Description />, path: '/reports' },
  { label: 'Settings', icon: <Settings />, path: '/settings' },
  { label: 'Help', icon: <Help />, path: '/help' },
];

interface AppShellProps {
  children: React.ReactNode;
  rightRail?: React.ReactNode;
}

export function AppShell({ children, rightRail }: AppShellProps) {
  const theme = useTheme();
  const { mode, toggleTheme } = useAppTheme();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);
  const [drawerCollapsed, setDrawerCollapsed] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    if (isMobile) {
      setDrawerOpen(!drawerOpen);
    } else {
      setDrawerCollapsed(!drawerCollapsed);
    }
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const effectiveDrawerWidth = drawerCollapsed ? collapsedDrawerWidth : drawerWidth;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="toggle drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            {drawerCollapsed && !isMobile ? <MenuIcon /> : <MenuIcon />}
          </IconButton>
          
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ flexGrow: 1, fontWeight: 600 }}
          >
            Trading Agents
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Toggle theme">
              <IconButton onClick={toggleTheme} color="inherit">
                {mode === 'dark' ? <LightMode /> : <DarkMode />}
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Badge badgeContent={3} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 1 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              <Avatar sx={{ width: 32, height: 32 }}>U</Avatar>
            </IconButton>
          </Box>

          <Menu
            anchorEl={anchorEl}
            id="account-menu"
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            onClick={handleProfileMenuClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={() => router.push('/profile')}>Profile</MenuItem>
            <MenuItem onClick={() => router.push('/settings')}>Settings</MenuItem>
            <Divider />
            <MenuItem>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Side Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? drawerOpen : true}
        onClose={() => setDrawerOpen(false)}
        sx={{
          width: effectiveDrawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: effectiveDrawerWidth,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', flex: 1 }}>
          <List>
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    selected={isActive}
                    sx={{
                      minHeight: 48,
                      justifyContent: drawerCollapsed ? 'center' : 'initial',
                      px: 2.5,
                      borderRadius: 2,
                      mx: 1,
                      my: 0.5,
                      '&.Mui-selected': {
                        backgroundColor: theme.palette.action.selected,
                        '&:hover': {
                          backgroundColor: theme.palette.action.selected,
                        },
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: drawerCollapsed ? 0 : 3,
                        justifyContent: 'center',
                        color: isActive ? theme.palette.primary.main : 'inherit',
                      }}
                    >
                      {item.badge ? (
                        <Badge badgeContent={item.badge} color="error">
                          {item.icon}
                        </Badge>
                      ) : (
                        item.icon
                      )}
                    </ListItemIcon>
                    {!drawerCollapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: isActive ? 600 : 400,
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        {!isMobile && (
          <Box sx={{ p: 2 }}>
            <IconButton
              onClick={() => setDrawerCollapsed(!drawerCollapsed)}
              sx={{
                backgroundColor: theme.palette.action.hover,
                '&:hover': {
                  backgroundColor: theme.palette.action.selected,
                },
              }}
            >
              <ChevronLeft
                sx={{
                  transform: drawerCollapsed ? 'rotate(180deg)' : 'none',
                  transition: theme.transitions.create('transform'),
                }}
              />
            </IconButton>
          </Box>
        )}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${effectiveDrawerWidth}px)` },
          ml: { sm: 0 },
        }}
      >
        <Toolbar />
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Container maxWidth={false} sx={{ p: 3 }}>
              <AnimatedPage>{children}</AnimatedPage>
            </Container>
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Optional Right Rail */}
      {rightRail && !isMobile && (
        <Box
          sx={{
            width: 320,
            flexShrink: 0,
            borderLeft: `1px solid ${theme.palette.divider}`,
            p: 3,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Toolbar />
          {rightRail}
        </Box>
      )}
      
      {/* Command Palette */}
      <CommandPalette />
    </Box>
  );
}

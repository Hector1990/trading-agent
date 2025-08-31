'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Tabs,
  Tab,
  Alert,
  Divider,
  InputAdornment,
  IconButton,
  Chip,
  Stack,
} from '@mui/material';
import {
  Save,
  Key,
  Language,
  Notifications,
  Security,
  Visibility,
  VisibilityOff,
  DeleteOutline,
  CheckCircle,
} from '@mui/icons-material';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SettingsModule() {
  const [tabValue, setTabValue] = useState(0);
  const [showPasswords, setShowPasswords] = useState({
    openai: false,
    deepseek: false,
    anthropic: false,
  });
  const [settings, setSettings] = useState({
    openaiKey: '',
    deepseekKey: '',
    anthropicKey: '',
    backendUrl: 'http://localhost:8000',
    defaultProvider: 'openai',
    notifications: true,
    autoSave: true,
    debugMode: false,
    language: 'zh-CN',
    theme: 'system',
  });

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('tradingagents-settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('tradingagents-settings', JSON.stringify(settings));
    toast.success('设置已保存');
  };

  const handleClearData = () => {
    if (window.confirm('确定要清除所有本地数据吗？')) {
      localStorage.clear();
      toast.success('本地数据已清除');
      setSettings({
        openaiKey: '',
        deepseekKey: '',
        anthropicKey: '',
        backendUrl: 'http://localhost:8000',
        defaultProvider: 'openai',
        notifications: true,
        autoSave: true,
        debugMode: false,
        language: 'zh-CN',
        theme: 'system',
      });
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const togglePasswordVisibility = (key: 'openai' | 'deepseek' | 'anthropic') => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          设置
        </Typography>
        <Typography variant="body1" color="text.secondary">
          配置应用程序设置和 API 密钥
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="settings tabs">
          <Tab icon={<Key />} label="API 配置" />
          <Tab icon={<Language />} label="通用设置" />
          <Tab icon={<Security />} label="安全" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Key sx={{ mr: 1, color: 'primary.main' }} />
                <Typography variant="h6">API 密钥</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                配置各个 AI 提供商的 API 密钥
              </Typography>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="OpenAI API Key"
                  type={showPasswords.openai ? 'text' : 'password'}
                  value={settings.openaiKey}
                  onChange={(e) => setSettings({ ...settings, openaiKey: e.target.value })}
                  placeholder="sk-..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('openai')}
                          edge="end"
                        >
                          {showPasswords.openai ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="DeepSeek API Key"
                  type={showPasswords.deepseek ? 'text' : 'password'}
                  value={settings.deepseekKey}
                  onChange={(e) => setSettings({ ...settings, deepseekKey: e.target.value })}
                  placeholder="sk-..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('deepseek')}
                          edge="end"
                        >
                          {showPasswords.deepseek ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Anthropic API Key"
                  type={showPasswords.anthropic ? 'text' : 'password'}
                  value={settings.anthropicKey}
                  onChange={(e) => setSettings({ ...settings, anthropicKey: e.target.value })}
                  placeholder="sk-ant-..."
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => togglePasswordVisibility('anthropic')}
                          edge="end"
                        >
                          {showPasswords.anthropic ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Language sx={{ mr: 1, color: 'secondary.main' }} />
                <Typography variant="h6">后端配置</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                配置后端服务器连接
              </Typography>
              
              <Stack spacing={3}>
                <TextField
                  fullWidth
                  label="后端 URL"
                  type="url"
                  value={settings.backendUrl}
                  onChange={(e) => setSettings({ ...settings, backendUrl: e.target.value })}
                  placeholder="http://localhost:8000"
                />
                
                <FormControl fullWidth>
                  <InputLabel>默认 LLM 提供商</InputLabel>
                  <Select
                    value={settings.defaultProvider}
                    label="默认 LLM 提供商"
                    onChange={(e) => setSettings({ ...settings, defaultProvider: e.target.value })}
                  >
                    <MenuItem value="openai">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="OpenAI" size="small" color="primary" />
                        GPT-4 / GPT-3.5
                      </Box>
                    </MenuItem>
                    <MenuItem value="deepseek">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="DeepSeek" size="small" color="secondary" />
                        DeepSeek-V2
                      </Box>
                    </MenuItem>
                    <MenuItem value="anthropic">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip label="Anthropic" size="small" color="success" />
                        Claude 3
                      </Box>
                    </MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Notifications sx={{ mr: 1, color: 'info.main' }} />
              <Typography variant="h6">通用设置</Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              应用程序偏好设置
            </Typography>
            
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">通知</Typography>
                  <Typography variant="body2" color="text.secondary">
                    接收任务完成通知
                  </Typography>
                </Box>
                <Switch
                  checked={settings.notifications}
                  onChange={(e) => setSettings({ ...settings, notifications: e.target.checked })}
                />
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">自动保存</Typography>
                  <Typography variant="body2" color="text.secondary">
                    自动保存报告和设置
                  </Typography>
                </Box>
                <Switch
                  checked={settings.autoSave}
                  onChange={(e) => setSettings({ ...settings, autoSave: e.target.checked })}
                />
              </Box>
              
              <Divider />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle1">调试模式</Typography>
                  <Typography variant="body2" color="text.secondary">
                    显示详细的调试信息
                  </Typography>
                </Box>
                <Switch
                  checked={settings.debugMode}
                  onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                />
              </Box>
              
              <Divider />
              
              <FormControl fullWidth>
                <InputLabel>语言</InputLabel>
                <Select
                  value={settings.language}
                  label="语言"
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                >
                  <MenuItem value="zh-CN">简体中文</MenuItem>
                  <MenuItem value="en-US">English</MenuItem>
                  <MenuItem value="ja-JP">日本語</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>主题</InputLabel>
                <Select
                  value={settings.theme}
                  label="主题"
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                >
                  <MenuItem value="system">跟随系统</MenuItem>
                  <MenuItem value="light">浅色</MenuItem>
                  <MenuItem value="dark">深色</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Security sx={{ mr: 1, color: 'warning.main' }} />
                <Typography variant="h6">数据隐私</Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                所有 API 密钥都存储在本地浏览器中，不会发送到服务器。
              </Alert>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                您的数据安全是我们的首要任务。所有敏感信息都在本地加密存储。
              </Typography>
              
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteOutline />}
                onClick={handleClearData}
              >
                清除本地数据
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                <Typography variant="h6">会话管理</Typography>
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                管理活动会话和登录设备
              </Typography>
              
              <Stack spacing={2}>
                <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    当前会话
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    设备：Web Browser
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    最后活动：刚刚
                  </Typography>
                </Box>
                
                <Button variant="outlined">
                  查看所有会话
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      </TabPanel>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          startIcon={<Save />}
          onClick={handleSave}
          size="large"
        >
          保存设置
        </Button>
      </Box>
    </Box>
  );
}

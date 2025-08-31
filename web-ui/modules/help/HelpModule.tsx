'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  AlertTitle,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Stack,
  Link as MuiLink,
} from '@mui/material';
import {
  ExpandMore,
  BookOutlined,
  Code,
  Forum,
  HelpOutline,
  GitHub,
  Email,
  CheckCircle,
  Speed,
  Security,
  Insights,
  PlayArrow,
  Settings,
} from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';

const faqs = [
  {
    question: '如何配置 API 密钥？',
    answer: '前往设置页面，在 API 配置选项卡中输入您的 OpenAI、DeepSeek 或 Anthropic API 密钥。密钥将安全地存储在您的浏览器本地存储中。',
    category: 'setup',
  },
  {
    question: '支持哪些股票代码？',
    answer: '系统支持美股市场的所有标准股票代码，如 AAPL、GOOGL、TSLA 等。请使用大写字母输入股票代码。',
    category: 'usage',
  },
  {
    question: '分析需要多长时间？',
    answer: '分析时间取决于选择的分析师数量和 LLM 提供商。通常单个分析师需要 2-5 分钟，多个分析师可能需要 10-20 分钟。',
    category: 'performance',
  },
  {
    question: '如何查看历史报告？',
    answer: '您可以在历史记录页面查看所有运行记录，或在报告页面查看已完成的分析报告。点击查看详情可以查看完整报告。',
    category: 'usage',
  },
  {
    question: '支持哪些 LLM 提供商？',
    answer: '目前支持 OpenAI (GPT-4)、DeepSeek 和 Anthropic (Claude) 三种 LLM 提供商。您可以在运行分析时选择使用哪个提供商。',
    category: 'features',
  },
  {
    question: '如何导出分析报告？',
    answer: '在报告详情页面，您可以选择以 Markdown、JSON 或 HTML 格式下载报告。点击相应的下载按钮即可。',
    category: 'usage',
  },
  {
    question: '是否支持批量分析？',
    answer: '是的，您可以在运行分析页面输入多个股票代码（用逗号分隔），系统将并行处理这些分析任务。',
    category: 'features',
  },
  {
    question: '数据是否安全？',
    answer: '所有敏感数据都存储在您的本地浏览器中。API 密钥使用加密存储，不会发送到我们的服务器。',
    category: 'security',
  },
];

const features = [
  {
    icon: <Speed />,
    title: '快速分析',
    description: '使用先进的 AI 模型快速分析股票数据',
  },
  {
    icon: <Security />,
    title: '安全可靠',
    description: '本地存储敏感数据，确保您的信息安全',
  },
  {
    icon: <Insights />,
    title: '深度洞察',
    description: '多角度分析，提供全面的投资建议',
  },
];

export default function HelpModule() {
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  const handleFaqChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFaq(isExpanded ? panel : false);
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
          帮助中心
        </Typography>
        <Typography variant="body1" color="text.secondary">
          获取使用指南和常见问题解答
        </Typography>
      </Box>

      {/* Quick Links */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BookOutlined sx={{ fontSize: 30, color: 'primary.main', mr: 2 }} />
                <Typography variant="h6">文档</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                查看完整的使用文档和 API 参考
              </Typography>
              <Button variant="outlined" fullWidth startIcon={<BookOutlined />}>
                查看文档
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Code sx={{ fontSize: 30, color: 'secondary.main', mr: 2 }} />
                <Typography variant="h6">API 参考</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                了解如何通过 API 集成 TradingAgents
              </Typography>
              <Button variant="outlined" fullWidth startIcon={<Code />}>
                API 文档
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Forum sx={{ fontSize: 30, color: 'success.main', mr: 2 }} />
                <Typography variant="h6">社区支持</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                加入社区获取帮助和分享经验
              </Typography>
              <Button variant="outlined" fullWidth startIcon={<Forum />}>
                访问社区
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Features */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            核心功能
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'background.default',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ color: 'primary.main', mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Quick Start Guide */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            快速入门
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            按照以下步骤开始使用 TradingAgents
          </Typography>
          
          <List>
            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  1
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    配置 API 密钥
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    在{' '}
                    <Link href="/settings" passHref legacyBehavior>
                      <MuiLink color="primary">设置页面</MuiLink>
                    </Link>{' '}
                    配置您的 AI 提供商 API 密钥
                  </Typography>
                }
              />
              <Settings color="action" />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  2
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    创建分析任务
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    在{' '}
                    <Link href="/run" passHref legacyBehavior>
                      <MuiLink color="primary">运行分析页面</MuiLink>
                    </Link>{' '}
                    输入股票代码和选择分析参数
                  </Typography>
                }
              />
              <PlayArrow color="action" />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                  }}
                >
                  3
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle1" fontWeight="medium">
                    查看分析结果
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" color="text.secondary">
                    分析完成后，在{' '}
                    <Link href="/reports" passHref legacyBehavior>
                      <MuiLink color="primary">报告页面</MuiLink>
                    </Link>{' '}
                    查看和下载详细报告
                  </Typography>
                }
              />
              <CheckCircle color="action" />
            </ListItem>
          </List>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
            常见问题
          </Typography>
          
          <Stack spacing={1} sx={{ mb: 2 }}>
            <Stack direction="row" spacing={1}>
              <Chip label="全部" color="primary" size="small" />
              <Chip label="设置" size="small" variant="outlined" />
              <Chip label="使用" size="small" variant="outlined" />
              <Chip label="功能" size="small" variant="outlined" />
              <Chip label="安全" size="small" variant="outlined" />
            </Stack>
          </Stack>

          {faqs.map((faq, index) => (
            <Accordion
              key={index}
              expanded={expandedFaq === `panel${index}`}
              onChange={handleFaqChange(`panel${index}`)}
            >
              <AccordionSummary
                expandIcon={<ExpandMore />}
                aria-controls={`panel${index}bh-content`}
                id={`panel${index}bh-header`}
              >
                <Typography sx={{ flexShrink: 0 }}>{faq.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Alert severity="info" sx={{ borderRadius: 2 }}>
        <AlertTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <HelpOutline sx={{ mr: 1 }} />
          需要更多帮助？
        </AlertTitle>
        <Typography variant="body2" sx={{ mb: 2 }}>
          如果您在使用过程中遇到任何问题，欢迎通过以下方式联系我们
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<GitHub />}
            href="https://github.com/TauricResearch/TradingAgents"
            target="_blank"
          >
            GitHub
          </Button>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Email />}
            href="mailto:support@tradingagents.com"
          >
            联系支持
          </Button>
        </Stack>
      </Alert>
    </Box>
  );
}

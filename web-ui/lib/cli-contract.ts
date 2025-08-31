import { z } from 'zod'

// Analyst types matching the CLI
export const AnalystType = z.enum([
  'market',
  'social',
  'news',
  'fundamentals'
])

export const LLMProvider = z.enum([
  'openai',
  'anthropic',
  'deepseek',
  'ollama'
])

// CLI command schema
export const RunConfigSchema = z.object({
  ticker: z.string().min(1).max(10).toUpperCase(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  analysts: z.array(AnalystType).min(1),
  llmProvider: LLMProvider,
  deepThinker: z.string(),
  backendUrl: z.string().url(),
  apiKey: z.string().optional(),
  resultsDir: z.string().optional().default('results'),
  debug: z.boolean().optional().default(false)
})

export type RunConfig = z.infer<typeof RunConfigSchema>

export const CommandRegistry = {
  run: {
    name: 'run',
    description: '运行交易分析',
    schema: RunConfigSchema,
    fields: [
      {
        name: 'ticker',
        type: 'text',
        label: '股票代码',
        placeholder: 'SPY',
        required: true,
        help: '要分析的股票代码（如：SPY, AAPL）'
      },
      {
        name: 'date',
        type: 'date',
        label: '分析日期',
        required: true,
        help: '分析的目标日期'
      },
      {
        name: 'analysts',
        type: 'multiselect',
        label: '分析师类型',
        required: true,
        options: [
          { value: 'market', label: '市场分析师' },
          { value: 'social', label: '社交媒体分析师' },
          { value: 'news', label: '新闻分析师' },
          { value: 'fundamentals', label: '基本面分析师' }
        ],
        help: '选择要使用的分析师类型'
      },
      {
        name: 'llmProvider',
        type: 'select',
        label: 'LLM 提供商',
        required: true,
        options: [
          { value: 'deepseek', label: 'DeepSeek' },
          { value: 'openai', label: 'OpenAI' },
          { value: 'anthropic', label: 'Anthropic' },
          { value: 'ollama', label: 'Ollama (Local)' }
        ],
        help: '选择AI模型提供商'
      },
      {
        name: 'deepThinker',
        type: 'text',
        label: '深度思考模型',
        placeholder: 'deepseek-reasoner',
        required: true,
        help: '用于深度分析的模型名称'
      },
      {
        name: 'backendUrl',
        type: 'url',
        label: 'API 端点',
        placeholder: 'https://api.deepseek.com/v1',
        required: true,
        help: 'LLM API的端点URL'
      },
      {
        name: 'apiKey',
        type: 'password',
        label: 'API 密钥',
        required: false,
        help: 'API访问密钥（如果需要）'
      },
      {
        name: 'debug',
        type: 'checkbox',
        label: '调试模式',
        required: false,
        help: '启用详细日志输出'
      }
    ]
  }
}

export interface RunStatus {
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  config: RunConfig
  startTime: Date
  endTime?: Date
  logs: LogEntry[]
  result?: any
  error?: string
}

export interface LogEntry {
  timestamp: Date
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  data?: any
}

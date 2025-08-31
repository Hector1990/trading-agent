export interface RunStatus {
  id: string;
  ticker: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
  result?: any;
}

export interface AnalysisRun {
  id: string;
  ticker: string;
  analysts: string[];
  provider: 'openai' | 'deepseek' | 'anthropic';
  status: RunStatus['status'];
  progress: number;
  startedAt: string;
  completedAt?: string;
  error?: string;
  logs?: string[];
  report?: AnalysisReport;
}

export interface AnalysisReport {
  id: string;
  ticker: string;
  date: string;
  summary: string;
  recommendation: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  targetPrice: number;
  currentPrice: number;
  confidence: number;
  analysts: AnalystReport[];
  consensusView: string;
  risks: string[];
  opportunities: string[];
}

export interface AnalystReport {
  name: string;
  role: string;
  analysis: string;
  recommendation: string;
  confidence: number;
}

export interface MarketData {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
}

export interface Settings {
  openaiApiKey?: string;
  deepseekApiKey?: string;
  anthropicApiKey?: string;
  defaultProvider: 'openai' | 'deepseek' | 'anthropic';
  language: 'en' | 'zh-CN';
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  autoSave: boolean;
}

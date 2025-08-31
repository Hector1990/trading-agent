"use client"

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { RunConfig, RunConfigSchema, CommandRegistry } from '@/lib/cli-contract'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

// Use a partial type to handle optional fields properly
type RunConfigForm = {
  ticker: string
  date: string
  analysts: Array<'market' | 'social' | 'news' | 'fundamentals'>
  llmProvider: 'openai' | 'anthropic' | 'deepseek' | 'ollama'
  deepThinker: string
  backendUrl: string
  apiKey?: string
  resultsDir?: string
  debug?: boolean
}

export interface CommandFormProps {
  onSubmit: (data: RunConfig) => Promise<void>
  isLoading?: boolean
}

export function CommandForm({ onSubmit, isLoading }: CommandFormProps) {
  const [selectedAnalysts, setSelectedAnalysts] = useState<Array<'market' | 'social' | 'news' | 'fundamentals'>>(['market'])
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RunConfigForm>({
    resolver: zodResolver(RunConfigSchema) as any,
    defaultValues: {
      ticker: 'SPY',
      date: format(new Date(), 'yyyy-MM-dd'),
      analysts: ['market'],
      llmProvider: 'deepseek',
      deepThinker: 'deepseek-reasoner',
      backendUrl: 'https://api.deepseek.com/v1',
      resultsDir: 'results',
      debug: false,
    },
  })

  const command = CommandRegistry.run
  const llmProvider = watch('llmProvider')

  const handleAnalystToggle = (analyst: string) => {
    const typedAnalyst = analyst as 'market' | 'social' | 'news' | 'fundamentals'
    const newAnalysts = selectedAnalysts.includes(typedAnalyst)
      ? selectedAnalysts.filter(a => a !== typedAnalyst)
      : [...selectedAnalysts, typedAnalyst]
    setSelectedAnalysts(newAnalysts)
    setValue('analysts', newAnalysts)
  }

  const onFormSubmit = handleSubmit(async (data) => {
    await onSubmit({ 
      ...data, 
      analysts: selectedAnalysts,
      resultsDir: data.resultsDir || 'results',
      debug: data.debug || false
    } as RunConfig)
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{command.description}</CardTitle>
        <CardDescription>配置并运行交易分析任务</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onFormSubmit} className="space-y-6">
          {/* Ticker */}
          <div className="space-y-2">
            <Label htmlFor="ticker">股票代码</Label>
            <Input
              id="ticker"
              {...register('ticker')}
              placeholder="SPY"
              className="uppercase"
            />
            {errors.ticker && (
              <p className="text-sm text-red-500">{errors.ticker.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">分析日期</Label>
            <Input
              id="date"
              type="date"
              {...register('date')}
            />
            {errors.date && (
              <p className="text-sm text-red-500">{errors.date.message}</p>
            )}
          </div>

          {/* Analysts */}
          <div className="space-y-2">
            <Label>分析师类型</Label>
            <div className="grid grid-cols-2 gap-4">
              {command.fields.find(f => f.name === 'analysts')?.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={option.value}
                    checked={selectedAnalysts.includes(option.value as any)}
                    onCheckedChange={() => handleAnalystToggle(option.value)}
                  />
                  <Label
                    htmlFor={option.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
            {errors.analysts && (
              <p className="text-sm text-red-500">请至少选择一个分析师</p>
            )}
          </div>

          {/* LLM Provider */}
          <div className="space-y-2">
            <Label htmlFor="llmProvider">LLM 提供商</Label>
            <Select
              value={llmProvider}
              onValueChange={(value) => setValue('llmProvider', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {command.fields.find(f => f.name === 'llmProvider')?.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Deep Thinker Model */}
          <div className="space-y-2">
            <Label htmlFor="deepThinker">深度思考模型</Label>
            <Input
              id="deepThinker"
              {...register('deepThinker')}
              placeholder="deepseek-reasoner"
            />
            {errors.deepThinker && (
              <p className="text-sm text-red-500">{errors.deepThinker.message}</p>
            )}
          </div>

          {/* Backend URL */}
          <div className="space-y-2">
            <Label htmlFor="backendUrl">API 端点</Label>
            <Input
              id="backendUrl"
              type="url"
              {...register('backendUrl')}
              placeholder="https://api.deepseek.com/v1"
            />
            {errors.backendUrl && (
              <p className="text-sm text-red-500">{errors.backendUrl.message}</p>
            )}
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 密钥（可选）</Label>
            <Input
              id="apiKey"
              type="password"
              {...register('apiKey')}
              placeholder="sk-..."
            />
          </div>

          {/* Debug Mode */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="debug"
              {...register('debug')}
            />
            <Label
              htmlFor="debug"
              className="text-sm font-normal cursor-pointer"
            >
              启用调试模式
            </Label>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                运行中...
              </>
            ) : (
              '开始分析'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

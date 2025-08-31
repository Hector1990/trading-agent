'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CommandForm } from '@/components/CommandForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { InfoIcon } from 'lucide-react'
import { TradingAgentsAPI } from '@/lib/api'
import { toast } from 'sonner'

const api = new TradingAgentsAPI()

export default function RunPage() {
  const router = useRouter()
  const [isRunning, setIsRunning] = useState(false)

  const handleRunSubmit = async (data: any) => {
    setIsRunning(true)
    try {
      const result = await api.startRun(data)
      toast.success('分析任务已启动')
      router.push(`/run/${result.id}`)
    } catch (error: any) {
      toast.error('启动失败: ' + (error.message || '未知错误'))
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">运行分析</h1>
        <p className="text-muted-foreground">
          配置并启动新的股票分析任务
        </p>
      </div>

      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertTitle>提示</AlertTitle>
        <AlertDescription>
          请确保您已配置好 API 密钥。分析将使用多个 AI 分析师对指定股票进行深度分析。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>分析配置</CardTitle>
          <CardDescription>
            设置分析参数并启动任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CommandForm 
            onSubmit={handleRunSubmit}
            isLoading={isRunning}
          />
        </CardContent>
      </Card>
    </div>
  )
}

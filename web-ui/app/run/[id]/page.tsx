'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogStreamModule } from '@/modules/logstream/LogStreamModule'
import { ReportViewer } from '@/components/ReportViewer'
import { TradingAgentsAPI } from '@/lib/api'
import { toast } from 'sonner'
import { ArrowLeft, StopCircle, Download, RefreshCw } from 'lucide-react'
import { formatDate } from '@/lib/utils'

const api = new TradingAgentsAPI()

export default function RunDetailPage() {
  const params = useParams()
  const router = useRouter()
  const runId = params.id as string

  const { data: status, isLoading: statusLoading, refetch } = useQuery({
    queryKey: ['run-status', runId],
    queryFn: () => api.getRunStatus(runId),
    refetchInterval: (query) => 
      query.state.data?.status === 'running' ? 2000 : false,
  })

  const { data: report } = useQuery({
    queryKey: ['report', runId],
    queryFn: async () => {
      // Fetch report when run is completed
      if (status?.status === 'completed') {
        // For now, return null until we have report handling
        return null
      }
      return null
    },
    enabled: status?.status === 'completed',
  })

  const stopMutation = useMutation({
    mutationFn: () => api.stopRun(runId),
    onSuccess: () => {
      toast.success('任务已停止')
      refetch()
    },
    onError: (error: any) => {
      toast.error('停止失败: ' + error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.deleteRun(runId),
    onSuccess: () => {
      toast.success('任务已删除')
      router.push('/history')
    },
    onError: (error: any) => {
      toast.error('删除失败: ' + error.message)
    },
  })

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'running':
        return 'default'
      case 'completed':
        return 'secondary'
      case 'failed':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              分析详情
            </h1>
            <p className="text-muted-foreground">
              {status?.config?.ticker} - {status?.startTime ? formatDate(status.startTime) : 'N/A'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {status?.status === 'running' && (
            <Button
              variant="destructive"
              onClick={() => stopMutation.mutate()}
              disabled={stopMutation.isPending}
            >
              <StopCircle className="mr-2 h-4 w-4" />
              停止运行
            </Button>
          )}
          {/* Delete button removed for now */}
          <Button
            variant="outline"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新
          </Button>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>运行状态</CardTitle>
          <CardDescription>
            任务执行信息和配置参数
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">状态:</span>
                <Badge variant={getStatusColor(status?.status)}>
                  {status?.status === 'running' ? '运行中' :
                   status?.status === 'completed' ? '已完成' :
                   status?.status === 'failed' ? '失败' : status?.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">股票代码:</span>
                <span className="font-medium">{status?.config?.ticker}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">分析日期:</span>
                <span className="font-medium">{status?.config?.date}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">LLM 提供商:</span>
                <span className="font-medium">{status?.config?.llmProvider || 'OpenAI'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">分析师:</span>
                <span className="font-medium">
                  {status?.config?.analysts?.length || 0} 个
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">创建时间:</span>
                <span className="font-medium">{status?.startTime ? formatDate(status.startTime) : 'N/A'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Logs */}
      {status?.status === 'running' && (
        <LogStreamModule runId={runId} />
      )}

      {/* Report */}
      {report && (
        <ReportViewer report={report} runId={runId} />
      )}
    </div>
  )
}

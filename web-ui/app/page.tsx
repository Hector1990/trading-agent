'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle,
  XCircle,
  PlayCircle,
  BarChart3,
  Users
} from 'lucide-react'
import Link from 'next/link'
import { TradingAgentsAPI } from '@/lib/api'
import { formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'

const api = new TradingAgentsAPI()

export default function DashboardPage() {
  const { data: recentRuns, isLoading } = useQuery({
    queryKey: ['runs', 'recent'],
    queryFn: () => api.listRuns({ limit: 5 }),
  })

  const stats = {
    totalRuns: recentRuns?.total || 0,
    activeRuns: recentRuns?.runs.filter(r => r.status === 'running').length || 0,
    completedRuns: recentRuns?.runs.filter(r => r.status === 'completed').length || 0,
    failedRuns: recentRuns?.runs.filter(r => r.status === 'failed').length || 0,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">仪表板</h1>
        <p className="text-muted-foreground">
          欢迎使用 TradingAgents 智能交易分析平台
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总运行次数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRuns}</div>
            <p className="text-xs text-muted-foreground">
              累计分析任务
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">运行中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeRuns}</div>
            <p className="text-xs text-muted-foreground">
              正在执行的任务
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已完成</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedRuns}</div>
            <p className="text-xs text-muted-foreground">
              成功完成的任务
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">失败</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedRuns}</div>
            <p className="text-xs text-muted-foreground">
              执行失败的任务
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>
            开始新的分析或查看最近的报告
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4">
          <Link href="/run">
            <Button>
              <PlayCircle className="mr-2 h-4 w-4" />
              新建分析
            </Button>
          </Link>
          <Link href="/history">
            <Button variant="outline">
              <BarChart3 className="mr-2 h-4 w-4" />
              查看历史
            </Button>
          </Link>
          <Link href="/reports">
            <Button variant="outline">
              <TrendingUp className="mr-2 h-4 w-4" />
              分析报告
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Recent Runs */}
      <Card>
        <CardHeader>
          <CardTitle>最近运行</CardTitle>
          <CardDescription>
            最近执行的分析任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : recentRuns?.runs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无运行记录
            </div>
          ) : (
            <div className="space-y-4">
              {recentRuns?.runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{run.config.ticker}</span>
                        <Badge variant={
                          run.status === 'running' ? 'default' :
                          run.status === 'completed' ? 'secondary' :
                          run.status === 'failed' ? 'destructive' : 'outline'
                        }>
                          {run.status === 'running' ? '运行中' :
                           run.status === 'completed' ? '已完成' :
                           run.status === 'failed' ? '失败' : run.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDistance(new Date(run.startTime || new Date()), new Date(), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                      </div>
                      {run.config.analysts && (
                        <span className="ml-2">
                          · {run.config.analysts.length} 分析师
                        </span>
                      )}
                    </div>
                  </div>
                  <Link href={`/run/${run.id}`}>
                    <Button variant="ghost" size="sm">
                      查看详情
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

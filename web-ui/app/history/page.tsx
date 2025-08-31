'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TradingAgentsAPI } from '@/lib/api'
import { format, formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import { Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'

const api = new TradingAgentsAPI()

export default function HistoryPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['runs', page, statusFilter, searchTerm],
    queryFn: () => api.listRuns({
      page,
      limit: 10,
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchTerm || undefined,
    }),
  })

  const totalPages = Math.ceil((data?.total || 0) / 10)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">历史记录</h1>
        <p className="text-muted-foreground">
          查看所有分析任务的执行历史
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>筛选和搜索</CardTitle>
          <CardDescription>
            按条件查找历史任务
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索股票代码..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="状态筛选" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="running">运行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>任务列表</CardTitle>
          <CardDescription>
            共 {data?.total || 0} 条记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : data?.runs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无记录
            </div>
          ) : (
            <div className="space-y-4">
              {data?.runs.map((run) => (
                <div
                  key={run.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">
                        {run.config.ticker}
                      </span>
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
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span>日期: {run.config.date}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(run.startTime || new Date()), 'PPP', { locale: zhCN })}
                      </span>
                      <span>•</span>
                      <span>
                        {formatDistance(new Date(run.startTime || new Date()), new Date(), {
                          addSuffix: true,
                          locale: zhCN
                        })}
                      </span>
                      {run.config.analysts && (
                        <>
                          <span>•</span>
                          <span>{run.config.analysts.length} 分析师</span>
                        </>
                      )}
                      {run.config.llmProvider && (
                        <>
                          <span>•</span>
                          <span>{run.config.llmProvider}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Link href={`/run/${run.id}`}>
                    <Button variant="outline">
                      查看详情
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                第 {page} 页，共 {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

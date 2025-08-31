'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TradingAgentsAPI } from '@/lib/api'
import { formatDistance } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import Link from 'next/link'
import { FileText, Download, Eye, Calendar } from 'lucide-react'

const api = new TradingAgentsAPI()

export default function ReportsPage() {
  const { data: runs, isLoading } = useQuery({
    queryKey: ['runs', 'completed'],
    queryFn: () => api.listRuns({ 
      status: 'completed',
      limit: 20 
    }),
  })

  const downloadReport = async (runId: string, format: 'pdf' | 'json' | 'md') => {
    // This would typically fetch and download the report
    const reportUrl = `/api/reports/${runId}/download?format=${format}`
    window.open(reportUrl, '_blank')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">分析报告</h1>
        <p className="text-muted-foreground">
          查看和下载已完成的分析报告
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <div className="col-span-full text-center py-8">
            加载中...
          </div>
        ) : runs?.runs.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            暂无已完成的分析报告
          </div>
        ) : (
          runs?.runs.map((run) => (
            <Card key={run.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {run.config.ticker}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3 w-3" />
                        {run.config.date}
                      </div>
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">
                    已完成
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <div>分析师: {run.config.analysts?.length || 0} 个</div>
                    <div>模型: {run.config.llmProvider || 'OpenAI'}</div>
                    <div>
                      生成时间: {formatDistance(new Date(run.endTime || run.startTime || new Date()), new Date(), {
                        addSuffix: true,
                        locale: zhCN
                      })}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/run/${run.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        <Eye className="mr-2 h-4 w-4" />
                        查看
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReport(run.id, 'pdf')}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

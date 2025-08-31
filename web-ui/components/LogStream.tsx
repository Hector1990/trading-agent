"use client"

import { useEffect, useRef, useState } from 'react'
import { LogEntry } from '@/lib/cli-contract'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'

interface LogStreamProps {
  runId: string
  onLog?: (log: LogEntry) => void
}

export function LogStream({ runId, onLog }: LogStreamProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const eventSource = new EventSource(`/api/run/${runId}/logs`)

    eventSource.onopen = () => {
      setIsConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data) as LogEntry
        setLogs(prev => [...prev, log])
        onLog?.(log)
        
        // Auto-scroll to bottom
        setTimeout(() => {
          scrollRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      } catch (err) {
        console.error('Failed to parse log:', err)
      }
    }

    eventSource.onerror = () => {
      setIsConnected(false)
      eventSource.close()
    }

    return () => {
      eventSource.close()
    }
  }, [runId, onLog])

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'error':
        return 'destructive'
      case 'warn':
        return 'warning'
      case 'debug':
        return 'secondary'
      default:
        return 'default'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>实时日志</CardTitle>
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? '已连接' : '未连接'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] w-full rounded-md border p-4">
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div
                key={index}
                className="flex items-start space-x-2 font-mono text-sm"
              >
                <span className="text-muted-foreground whitespace-nowrap">
                  {formatDate(log.timestamp)}
                </span>
                <Badge variant={getLevelColor(log.level)} className="px-1.5 py-0">
                  {log.level.toUpperCase()}
                </Badge>
                <span className="flex-1 whitespace-pre-wrap break-all">
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, FileText, Code } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface ReportViewerProps {
  report: any
  runId: string
}

export function ReportViewer({ report, runId }: ReportViewerProps) {
  const [viewMode, setViewMode] = useState<'markdown' | 'json'>('markdown')

  const downloadReport = (format: 'md' | 'json' | 'html') => {
    let content = ''
    let mimeType = ''
    let filename = `report-${runId}`

    switch (format) {
      case 'md':
        content = report.markdown || JSON.stringify(report, null, 2)
        mimeType = 'text/markdown'
        filename += '.md'
        break
      case 'json':
        content = JSON.stringify(report, null, 2)
        mimeType = 'application/json'
        filename += '.json'
        break
      case 'html':
        content = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trading Analysis Report</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
    code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
  </style>
</head>
<body>
  ${report.html || `<pre>${JSON.stringify(report, null, 2)}</pre>`}
</body>
</html>`
        mimeType = 'text/html'
        filename += '.html'
        break
    }

    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>分析报告</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport('md')}
            >
              <FileText className="h-4 w-4 mr-1" />
              Markdown
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport('json')}
            >
              <Code className="h-4 w-4 mr-1" />
              JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => downloadReport('html')}
            >
              <Download className="h-4 w-4 mr-1" />
              HTML
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="markdown">格式化视图</TabsTrigger>
            <TabsTrigger value="json">原始数据</TabsTrigger>
          </TabsList>
          <TabsContent value="markdown" className="mt-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {report.markdown ? (
                <ReactMarkdown>{report.markdown}</ReactMarkdown>
              ) : (
                <div className="space-y-4">
                  {Object.entries(report).map(([key, value]) => (
                    <div key={key}>
                      <h3 className="text-lg font-semibold capitalize">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <pre className="mt-2 overflow-x-auto rounded-lg bg-muted p-4">
                        {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="json" className="mt-4">
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              {JSON.stringify(report, null, 2)}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

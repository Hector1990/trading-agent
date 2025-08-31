import { NextRequest, NextResponse } from 'next/server'
import { LogEntry } from '@/lib/cli-contract'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const encoder = new TextEncoder()
  const { id } = await params
  
  const stream = new ReadableStream({
    async start(controller) {
      // Set up SSE headers
      controller.enqueue(encoder.encode('retry: 1000\n\n'))
      
      // Get run from global store
      const run = global.runs?.get(id)
      if (!run) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ 
          level: 'error', 
          message: 'Run not found',
          timestamp: new Date()
        })}\n\n`))
        controller.close()
        return
      }
      
      let lastLogIndex = 0
      const interval = setInterval(() => {
        // Send new logs
        const newLogs = run.logs.slice(lastLogIndex)
        for (const log of newLogs) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(log)}\n\n`))
        }
        lastLogIndex = run.logs.length
        
        // Close stream when run is complete
        if (run.status === 'completed' || run.status === 'failed') {
          clearInterval(interval)
          controller.close()
        }
      }, 500)
      
      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}

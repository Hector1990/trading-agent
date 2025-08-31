import { NextRequest, NextResponse } from 'next/server'

import { RunStatus } from '@/lib/cli-contract'

declare global {
  var processes: Map<string, any> | undefined
  var runs: Map<string, RunStatus> | undefined
}

if (!global.processes) {
  global.processes = new Map()
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const run = global.runs?.get(id)
  const process = global.processes?.get(id)
  
  if (process) {
    // Kill the process
    process.kill('SIGTERM')
    global.processes?.delete(id)
    
    // Update run status
    if (run) {
      run.status = 'failed'
      run.error = 'Cancelled by user'
      run.endTime = new Date()
    }
    
    return NextResponse.json({ message: 'Run stopped' })
  }
  
  return NextResponse.json(
    { error: 'Run not found or already stopped' },
    { status: 404 }
  )
}

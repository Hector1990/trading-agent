import { NextRequest, NextResponse } from 'next/server'
import { RunStatus } from '@/lib/cli-contract'

// This would be replaced with database in production
declare global {
  var runs: Map<string, RunStatus> | undefined
}

if (!global.runs) {
  global.runs = new Map<string, RunStatus>()
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const run = global.runs?.get(id)
  
  if (!run) {
    return NextResponse.json(
      { error: 'Run not found' },
      { status: 404 }
    )
  }
  
  return NextResponse.json(run)
}

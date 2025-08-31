import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import { randomUUID } from 'crypto'
import { RunConfig, RunStatus } from '@/lib/cli-contract'
import path from 'path'
import fs from 'fs/promises'

// In-memory store for runs (in production, use a database)
const runs = new Map<string, RunStatus>()
const processes = new Map<string, any>()

export async function POST(request: NextRequest) {
  try {
    const config: RunConfig = await request.json()
    const id = randomUUID()
    
    // Create run status
    const runStatus: RunStatus = {
      id,
      status: 'pending',
      config,
      startTime: new Date(),
      logs: []
    }
    
    runs.set(id, runStatus)
    
    // Prepare command arguments
    const args = [
      '-m', 'cli.main',
      '--ticker', config.ticker,
      '--date', config.date,
      '--analysts', ...config.analysts,
      '--llm-provider', config.llmProvider,
      '--deep-thinker', config.deepThinker,
      '--backend-url', config.backendUrl,
    ]
    
    if (config.apiKey) {
      process.env.OPENAI_API_KEY = config.apiKey
      process.env.ANTHROPIC_API_KEY = config.apiKey
      process.env.DEEPSEEK_API_KEY = config.apiKey
    }
    
    if (config.debug) {
      args.push('--debug')
    }
    
    // Spawn Python process
    const pythonProcess = spawn('python', args, {
      cwd: path.join(process.cwd(), '..'),
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1'
      }
    })
    
    processes.set(id, pythonProcess)
    runStatus.status = 'running'
    
    // Capture output
    pythonProcess.stdout.on('data', (data) => {
      const message = data.toString()
      runStatus.logs.push({
        timestamp: new Date(),
        level: 'info',
        message
      })
    })
    
    pythonProcess.stderr.on('data', (data) => {
      const message = data.toString()
      runStatus.logs.push({
        timestamp: new Date(),
        level: 'error',
        message
      })
    })
    
    pythonProcess.on('close', (code) => {
      runStatus.status = code === 0 ? 'completed' : 'failed'
      runStatus.endTime = new Date()
      if (code !== 0) {
        runStatus.error = `Process exited with code ${code}`
      }
      processes.delete(id)
    })
    
    return NextResponse.json({ id })
  } catch (error) {
    console.error('Failed to start run:', error)
    return NextResponse.json(
      { error: 'Failed to start run' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const status = searchParams.get('status')
  
  let filteredRuns = Array.from(runs.values())
  
  if (status) {
    filteredRuns = filteredRuns.filter(run => run.status === status)
  }
  
  // Sort by startTime descending
  filteredRuns.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
  
  const start = (page - 1) * limit
  const paginatedRuns = filteredRuns.slice(start, start + limit)
  
  return NextResponse.json({
    runs: paginatedRuns,
    total: filteredRuns.length
  })
}

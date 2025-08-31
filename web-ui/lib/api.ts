import { RunConfig, RunStatus, LogEntry } from './cli-contract'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || ''

export class TradingAgentsAPI {
  private activeRuns = new Map<string, AbortController>()

  async startRun(config: RunConfig): Promise<{ id: string }> {
    const response = await fetch(`${API_BASE}/api/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to start run: ${error}`)
    }

    return response.json()
  }

  async getRunStatus(runId: string): Promise<RunStatus> {
    const res = await fetch(`${API_BASE}/api/run/${runId}/status`)
    if (!res.ok) throw new Error('Failed to fetch run status')
    return res.json()
  }

  async listRuns(params?: {
    page?: number
    limit?: number
    status?: string
    search?: string
  }): Promise<{ runs: RunStatus[], total: number }> {
    const searchParams = new URLSearchParams()
    if (params?.page) searchParams.set('page', params.page.toString())
    if (params?.limit) searchParams.set('limit', params.limit.toString())
    if (params?.status) searchParams.set('status', params.status)
    if (params?.search) searchParams.set('search', params.search)
    
    const res = await fetch(`${API_BASE}/api/runs?${searchParams}`)
    if (!res.ok) throw new Error('Failed to fetch runs')
    return res.json()
  }

  streamLogs(
    id: string,
    onLog: (log: LogEntry) => void,
    onError?: (error: Error) => void
  ): () => void {
    const controller = new AbortController()
    this.activeRuns.set(id, controller)

    const eventSource = new EventSource(`${API_BASE}/api/run/${id}/logs`)

    eventSource.onmessage = (event) => {
      try {
        const log = JSON.parse(event.data) as LogEntry
        onLog(log)
      } catch (err) {
        console.error('Failed to parse log entry:', err)
      }
    }

    eventSource.onerror = (err) => {
      console.error('SSE error:', err)
      if (onError) {
        onError(new Error('Connection lost'))
      }
      eventSource.close()
      this.activeRuns.delete(id)
    }

    // Return cleanup function
    return () => {
      eventSource.close()
      controller.abort()
      this.activeRuns.delete(id)
    }
  }

  async stopRun(id: string): Promise<void> {
    const controller = this.activeRuns.get(id)
    if (controller) {
      controller.abort()
      this.activeRuns.delete(id)
    }

    await fetch(`${API_BASE}/api/run/${id}/stop`, {
      method: 'POST',
    })
  }

  async getRuns(
    page = 1,
    limit = 20,
    filters?: {
      status?: string
      startDate?: string
      endDate?: string
    }
  ): Promise<{ runs: RunStatus[]; total: number }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...filters,
    })

    const response = await fetch(`${API_BASE}/api/runs?${params}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get runs: ${response.statusText}`)
    }

    return response.json()
  }

  async getReport(runId: string, reportId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/api/reports/${runId}/${reportId}`)
    
    if (!response.ok) {
      throw new Error(`Failed to get report: ${response.statusText}`)
    }

    return response.json()
  }

  async deleteRun(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/api/run/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete run: ${response.statusText}`)
    }
  }
}

export const api = new TradingAgentsAPI()

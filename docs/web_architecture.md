# TradingAgents Web Platform Architecture

## Vision
Build a modern fintech web experience that surfaces the multi-agent research
pipeline already available in the CLI. The web system should make it easy to
submit research requests, observe model progress, and review generated reports
in a polished interface suitable for portfolio managers and quant researchers.

## High-Level Components

| Layer             | Responsibility                                                     |
|-------------------|---------------------------------------------------------------------|
| Web UI            | Responsive single-page layout delivered via FastAPI + Jinja2. Uses  |
|                   | progressive enhancement (Fetch + minimal JS) to provide a modern    |
|                   | glassmorphism-inspired fintech aesthetic.                           |
| REST API          | FastAPI endpoints that accept analysis jobs, expose status polling, |
|                   | and serve generated artefacts.                                      |
| Job Orchestrator  | ThreadPool-backed executor that runs long-lived TradingAgents jobs  |
|                   | without blocking the event loop; maintains in-memory job registry.   |
| Analysis Service  | Re-usable service that wraps `TradingAgentsGraph` and persists       |
|                   | reports/results to the existing `results/` hierarchy.               |
| Data Sources      | Existing adapter set (Yahoo Finance, AKShare, Eastmoney, NetEase,   |
|                   | etc.) used by the graph.                                            |

## Request Flow

1. User submits an analysis request via the web form (select market, ticker,
   analysts, depth, etc.).
2. Front-end POSTs to `/api/jobs`; the orchestrator enqueues the job, returning
   a UUID.
3. Background thread invokes the analysis service, which configures
   `TradingAgentsGraph` and persists output markdown + JSON summaries under the
   `results/{ticker}/{date}` folder.
4. The front-end polls `/api/jobs/{id}` every few seconds to render live status
   updates (queued → running → completed/failed) and eventually displays the
   generated reports/decision.

## Key Design Choices

- **FastAPI** chosen for async-friendly routing, easy background task support,
  and automatic OpenAPI documentation.
- **ThreadPoolExecutor** manages long-running LLM pipelines without introducing
  additional infrastructure.
- **Modular services** (`tradingagents.services.executor`) mean the CLI, web, or
  future schedulers can share the same execution core.
- **Fintech aesthetic** achieved with a gradient dark theme, glass panels, and
  neon accents implemented via static CSS (no build tooling required).
- **Extensibility**: job registry can be swapped for Redis/DB later; UI designed
  with reusable components for dashboards, history views, and live charts.

## Future Enhancements

- Persist job metadata/results in SQLite or Redis for horizontal scaling.
- Add WebSocket push updates for real-time progress streaming.
- Integrate authentication/role-based access for team usage.
- Expand UI with charting (e.g., price series, technical indicator visuals).
- Enable scheduled jobs and notification hooks (email/Slack) when analysis
  completes.


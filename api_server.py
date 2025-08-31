from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import uuid
from datetime import datetime
import asyncio
import os

from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

app = FastAPI(title="TradingAgents API", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store running analyses
running_analyses = {}

class AnalysisRequest(BaseModel):
    ticker: str
    date: Optional[str] = None
    provider: str = "openai"
    model: Optional[str] = None
    analysts: List[str] = ["technical", "fundamental", "sentiment"]
    max_debate_rounds: int = 1
    online_tools: bool = True

class AnalysisResponse(BaseModel):
    id: str
    status: str
    message: str

class AnalysisStatus(BaseModel):
    id: str
    ticker: str
    status: str
    progress: int
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    started_at: str
    completed_at: Optional[str] = None

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/api/health")
async def api_health():
    return {"status": "healthy", "service": "tradingagents-api"}

async def run_analysis(analysis_id: str, request: AnalysisRequest):
    """Background task to run the analysis"""
    try:
        # Update status to running
        running_analyses[analysis_id]["status"] = "running"
        running_analyses[analysis_id]["progress"] = 10
        
        # Configure the model
        config = DEFAULT_CONFIG.copy()
        
        # Map provider to config
        if request.provider == "openai":
            config["llm_provider"] = "openai"
            config["deep_think_llm"] = request.model or "gpt-4o"
            config["quick_think_llm"] = request.model or "gpt-4o-mini"
        elif request.provider == "deepseek":
            config["llm_provider"] = "deepseek"
            config["deep_think_llm"] = request.model or "deepseek-v3"
            config["quick_think_llm"] = request.model or "deepseek-v3"
        elif request.provider == "anthropic":
            config["llm_provider"] = "anthropic"
            config["deep_think_llm"] = request.model or "claude-3-sonnet"
            config["quick_think_llm"] = request.model or "claude-3-haiku"
        
        config["max_debate_rounds"] = request.max_debate_rounds
        config["online_tools"] = request.online_tools
        
        # Initialize graph
        running_analyses[analysis_id]["progress"] = 20
        ta = TradingAgentsGraph(debug=True, config=config)
        
        # Run analysis
        running_analyses[analysis_id]["progress"] = 50
        date = request.date or datetime.now().strftime("%Y-%m-%d")
        _, decision = ta.propagate(request.ticker, date)
        
        # Update with results
        running_analyses[analysis_id]["status"] = "completed"
        running_analyses[analysis_id]["progress"] = 100
        running_analyses[analysis_id]["result"] = decision
        running_analyses[analysis_id]["completed_at"] = datetime.now().isoformat()
        
    except Exception as e:
        running_analyses[analysis_id]["status"] = "failed"
        running_analyses[analysis_id]["error"] = str(e)
        running_analyses[analysis_id]["completed_at"] = datetime.now().isoformat()

@app.post("/api/run")
async def run_analysis_endpoint(request: AnalysisRequest, background_tasks: BackgroundTasks):
    """Start a new analysis"""
    analysis_id = str(uuid.uuid4())
    
    # Initialize analysis record
    running_analyses[analysis_id] = {
        "id": analysis_id,
        "ticker": request.ticker,
        "status": "pending",
        "progress": 0,
        "result": None,
        "error": None,
        "started_at": datetime.now().isoformat(),
        "completed_at": None
    }
    
    # Start background task
    background_tasks.add_task(run_analysis, analysis_id, request)
    
    return AnalysisResponse(
        id=analysis_id,
        status="started",
        message=f"Analysis started for {request.ticker}"
    )

@app.get("/api/run/{analysis_id}/status")
async def get_analysis_status(analysis_id: str):
    """Get the status of a running analysis"""
    if analysis_id not in running_analyses:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    return AnalysisStatus(**running_analyses[analysis_id])

@app.post("/api/run/{analysis_id}/stop")
async def stop_analysis(analysis_id: str):
    """Stop a running analysis"""
    if analysis_id not in running_analyses:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    if running_analyses[analysis_id]["status"] == "running":
        running_analyses[analysis_id]["status"] = "cancelled"
        running_analyses[analysis_id]["completed_at"] = datetime.now().isoformat()
    
    return {"message": "Analysis stopped"}

@app.get("/api/run/{analysis_id}/logs")
async def get_analysis_logs(analysis_id: str):
    """Get logs for an analysis (mock for now)"""
    if analysis_id not in running_analyses:
        raise HTTPException(status_code=404, detail="Analysis not found")
    
    # Mock log data
    logs = [
        f"[{datetime.now().isoformat()}] Starting analysis for {running_analyses[analysis_id]['ticker']}",
        f"[{datetime.now().isoformat()}] Fetching market data...",
        f"[{datetime.now().isoformat()}] Running technical analysis...",
        f"[{datetime.now().isoformat()}] Running fundamental analysis...",
        f"[{datetime.now().isoformat()}] Running sentiment analysis...",
        f"[{datetime.now().isoformat()}] Aggregating results...",
    ]
    
    return {"logs": logs}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

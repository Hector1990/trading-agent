from __future__ import annotations

import json
import os
from copy import deepcopy
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from fastapi import Depends, FastAPI, Form, HTTPException, Request, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field, field_validator
import markdown
from starlette.middleware.sessions import SessionMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from web.auth import is_admin, login_user, logout_user, require_admin, require_user
from web.db import get_db, init_db
from web.models import User, JobHistory
from web.services.jobs import submit_job, get_job, list_jobs

app = FastAPI(title="TradingAgents Web", version="0.1.0")

BASE_DIR = Path(__file__).resolve().parent
TEMPLATES = Jinja2Templates(directory=str(BASE_DIR / "templates"))
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

SESSION_SECRET = os.getenv("WEB_SESSION_SECRET", "dev-secret-key")
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET, https_only=False, same_site="lax")


@app.on_event("startup")
def on_startup() -> None:
    init_db()


MARKET_OPTIONS = [
    {
        "label": "A股（中国大陆）",
        "value": "cn",
        "description": "AKShare + 东方财富数据流，与中文报告输出",
        "ticker_hint": "600519",
        "timezone": "Asia/Shanghai",
    },
    {
        "label": "美股（美国）",
        "value": "us",
        "description": "Yahoo Finance + Reddit 舆情数据流",
        "ticker_hint": "SPY",
        "timezone": "America/New_York",
    },
]

RESEARCH_DEPTH_OPTIONS = [
    {"label": "浅度调研", "value": 1, "description": "快速洞察，单轮辩论"},
    {"label": "标准调研", "value": 3, "description": "平衡效率与深度"},
    {"label": "深度调研", "value": 5, "description": "多轮辩论，全方位分析"},
]

ANALYST_OPTIONS = [
    {"label": "市场分析", "value": "market"},
    {"label": "社交情绪", "value": "social"},
    {"label": "新闻洞察", "value": "news"},
    {"label": "基本面研究", "value": "fundamentals"},
]


LLM_PROVIDER_OPTIONS = [
    {
        "label": "DeepSeek",
        "value": "deepseek",
        "description": "官方 DeepSeek 云端模型",
        "requires_api_key": True,
        "env_var": "DEEPSEEK_API_KEY",
        "backend_url": "https://api.deepseek.com/v1",
        "quick_models": [
            {"label": "DeepSeek Chat", "value": "deepseek-chat"},
            {"label": "DeepSeek Coder", "value": "deepseek-coder"},
        ],
        "deep_models": [
            {"label": "DeepSeek Chat", "value": "deepseek-chat"},
            {"label": "DeepSeek Reasoner", "value": "deepseek-reasoner", "default": True},
        ],
    },
    {
        "label": "OpenAI",
        "value": "openai",
        "description": "OpenAI GPT 系列",
        "requires_api_key": True,
        "env_var": "OPENAI_API_KEY",
        "backend_url": "https://api.openai.com/v1",
        "quick_models": [
            {"label": "GPT-4o-mini", "value": "gpt-4o-mini"},
            {"label": "GPT-4.1-nano", "value": "gpt-4.1-nano"},
            {"label": "GPT-4.1-mini", "value": "gpt-4.1-mini"},
            {"label": "GPT-4o", "value": "gpt-4o"},
        ],
        "deep_models": [
            {"label": "GPT-4.1-nano", "value": "gpt-4.1-nano"},
            {"label": "GPT-4.1-mini", "value": "gpt-4.1-mini"},
            {"label": "GPT-4o", "value": "gpt-4o"},
            {"label": "o4-mini", "value": "o4-mini"},
            {"label": "o3-mini", "value": "o3-mini"},
            {"label": "o3", "value": "o3"},
            {"label": "o1", "value": "o1"},
        ],
    },
    {
        "label": "Anthropic",
        "value": "anthropic",
        "description": "Claude 3.x/4 系列",
        "requires_api_key": True,
        "env_var": "ANTHROPIC_API_KEY",
        "backend_url": "https://api.anthropic.com/",
        "quick_models": [
            {"label": "Claude 3.5 Haiku", "value": "claude-3-5-haiku-latest"},
            {"label": "Claude 3.5 Sonnet", "value": "claude-3-5-sonnet-latest"},
            {"label": "Claude 3.7 Sonnet", "value": "claude-3-7-sonnet-latest"},
            {"label": "Claude 4 Sonnet", "value": "claude-sonnet-4-0"},
        ],
        "deep_models": [
            {"label": "Claude 3.5 Haiku", "value": "claude-3-5-haiku-latest"},
            {"label": "Claude 3.5 Sonnet", "value": "claude-3-5-sonnet-latest"},
            {"label": "Claude 3.7 Sonnet", "value": "claude-3-7-sonnet-latest"},
            {"label": "Claude 4 Sonnet", "value": "claude-sonnet-4-0"},
            {"label": "Claude 4 Opus", "value": "claude-opus-4-0"},
        ],
    },
    {
        "label": "Google Gemini",
        "value": "google",
        "description": "Gemini 2.x 系列",
        "requires_api_key": True,
        "env_var": "GOOGLE_API_KEY",
        "backend_url": "https://generativelanguage.googleapis.com/v1",
        "quick_models": [
            {"label": "Gemini 2.0 Flash-Lite", "value": "gemini-2.0-flash-lite"},
            {"label": "Gemini 2.0 Flash", "value": "gemini-2.0-flash"},
            {"label": "Gemini 2.5 Flash", "value": "gemini-2.5-flash-preview-05-20"},
        ],
        "deep_models": [
            {"label": "Gemini 2.0 Flash-Lite", "value": "gemini-2.0-flash-lite"},
            {"label": "Gemini 2.0 Flash", "value": "gemini-2.0-flash"},
            {"label": "Gemini 2.5 Flash", "value": "gemini-2.5-flash-preview-05-20"},
            {"label": "Gemini 2.5 Pro", "value": "gemini-2.5-pro-preview-06-05"},
        ],
    },
    {
        "label": "OpenRouter",
        "value": "openrouter",
        "description": "OpenRouter 聚合模型",
        "requires_api_key": True,
        "env_var": "OPENROUTER_API_KEY",
        "backend_url": "https://openrouter.ai/api/v1",
        "quick_models": [
            {"label": "Meta Llama 4 Scout (免费)", "value": "meta-llama/llama-4-scout:free"},
            {"label": "Meta Llama 3.3 8B Instruct (免费)", "value": "meta-llama/llama-3.3-8b-instruct:free"},
            {"label": "Gemini 2.0 Flash (免费)", "value": "google/gemini-2.0-flash-exp:free"},
        ],
        "deep_models": [
            {"label": "DeepSeek V3 (免费)", "value": "deepseek/deepseek-chat-v3-0324:free"},
            {"label": "DeepSeek Chat (免费)", "value": "deepseek/deepseek-chat-v3-0324:free"},
        ],
    },
    {
        "label": "Ollama",
        "value": "ollama",
        "description": "本地 Ollama 服务",
        "requires_api_key": False,
        "env_var": None,
        "backend_url": "http://localhost:11434/v1",
        "quick_models": [
            {"label": "Llama 3.1", "value": "llama3.1"},
            {"label": "Llama 3.2", "value": "llama3.2"},
        ],
        "deep_models": [
            {"label": "Llama 3.1", "value": "llama3.1"},
            {"label": "Qwen 3", "value": "qwen3"},
        ],
    },
]


def get_llm_options() -> List[Dict[str, Any]]:
    options: List[Dict[str, Any]] = []
    for raw in LLM_PROVIDER_OPTIONS:
        option = deepcopy(raw)
        requires_key = option.get("requires_api_key", False)
        env_var = option.get("env_var")
        has_key = True
        if requires_key:
            env_name = env_var or ""
            has_key = bool(env_name and os.getenv(env_name))
        option["enabled"] = bool(has_key or not requires_key)
        option["has_api_key"] = has_key
        options.append(option)
    return options



class AnalysisRequest(BaseModel):
    market: str = Field(..., description="市场类型，如 cn/us")
    ticker: str = Field(..., description="股票代码")
    analysis_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    analysts: Optional[List[str]] = Field(default=None)
    research_depth: Optional[int] = Field(default=1, ge=1, le=5)
    shallow_thinker: Optional[str] = None
    deep_thinker: Optional[str] = None
    backend_url: Optional[str] = None
    llm_provider: Optional[str] = None

    @field_validator("market")
    def validate_market(cls, v: str) -> str:
        allowed = {opt["value"] for opt in MARKET_OPTIONS}
        if v not in allowed:
            raise ValueError(f"market must be one of {sorted(allowed)}")
        return v

    @field_validator("analysts", mode="before")
    def default_analysts(cls, v):
        if v in (None, "", [], ()):  # pydantic will coerce FormData to list
            return [opt["value"] for opt in ANALYST_OPTIONS]
        if isinstance(v, str):
            return [v]
        return v

    @field_validator("analysts")
    def normalize_analysts(cls, v: List[str]) -> List[str]:
        if not v:
            raise ValueError("analysts cannot be empty")
        return [item.lower() for item in v]


class JobResponse(BaseModel):
    id: str
    status: str
    created_at: datetime
    updated_at: datetime
    result_dir: Optional[str]
    decision: Optional[str]
    reports: Optional[dict]
    reports_html: Optional[dict]
    error: Optional[str]
    log_path: Optional[str]


class JobHistoryItem(BaseModel):
    job_id: str
    ticker: str
    analysis_date: str
    status: str
    decision: Optional[str]
    result_dir: Optional[str]
    log_path: Optional[str]
    error: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    summary: Optional[dict]


def _reports_to_html(reports: Optional[dict]) -> Optional[dict]:
    if not reports:
        return None
    rendered = {}
    for key, value in reports.items():
        if isinstance(value, str):
            rendered[key] = markdown.markdown(
                value,
                extensions=["extra", "sane_lists", "fenced_code"],
                output_format="html5",
            )
        else:
            rendered[key] = ""
    return rendered


def get_current_user_api(request: Request) -> str:
    return require_user(request)


def _llm_option_map() -> Dict[str, Dict[str, Any]]:
    return {option["value"]: option for option in get_llm_options()}


def _normalize_llm_selection(selections: Dict[str, Any]) -> None:
    provider_value = selections.get("llm_provider")
    if not provider_value:
        selections.pop("backend_url", None)
        if not selections.get("shallow_thinker"):
            selections.pop("shallow_thinker", None)
        if not selections.get("deep_thinker"):
            selections.pop("deep_thinker", None)
        return

    options = _llm_option_map()
    provider = options.get(provider_value)
    if not provider:
        raise HTTPException(status_code=400, detail="不支持的模型提供商")
    if not provider.get("enabled"):
        raise HTTPException(status_code=400, detail="模型提供商未启用或缺少 API Key")

    selections["backend_url"] = provider.get("backend_url")

    def _ensure_model(selection_key: str, bucket_key: str) -> None:
        available = provider.get(bucket_key, [])
        if not available:
            selections.pop(selection_key, None)
            return
        requested = selections.get(selection_key)
        valid_values = {model["value"] for model in available}
        if requested:
            if requested not in valid_values:
                raise HTTPException(status_code=400, detail="所选模型无效")
        else:
            default_model = next((m for m in available if m.get("default")), None)
            selections[selection_key] = default_model["value"] if default_model else available[0]["value"]

    _ensure_model("shallow_thinker", "quick_models")
    _ensure_model("deep_thinker", "deep_models")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    try:
        user = require_user(request)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=302)

    return TEMPLATES.TemplateResponse(
        "index.html",
        {
            "request": request,
            "user": user,
            "is_admin": is_admin(user),
            "market_options": MARKET_OPTIONS,
            "analyst_options": ANALYST_OPTIONS,
            "research_depth_options": RESEARCH_DEPTH_OPTIONS,
            "llm_options": get_llm_options(),
        },
    )


@app.get("/jobs/{job_id}", response_class=HTMLResponse)
async def job_detail(job_id: str, request: Request):
    try:
        user = require_user(request)
    except HTTPException:
        return RedirectResponse(url="/login", status_code=302)

    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return TEMPLATES.TemplateResponse(
        "job.html",
        {
            "request": request,
            "user": user,
            "is_admin": is_admin(user),
            "job_id": job_id,
        },
    )


@app.get("/login", response_class=HTMLResponse)
async def login_page(request: Request, db: Session = Depends(get_db)):
    if request.session.get("user"):
        return RedirectResponse(url="/", status_code=302)
    has_users = db.query(User).count() > 0
    return TEMPLATES.TemplateResponse(
        "login.html",
        {
            "request": request,
            "error": None,
            "show_creation_hint": not has_users,
        },
    )


@app.post("/login")
async def login_submit(
    request: Request,
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db),
):
    if login_user(request, db, username, password):
        return RedirectResponse(url="/", status_code=302)
    return TEMPLATES.TemplateResponse(
        "login.html",
        {
            "request": request,
            "error": "用户名或密码错误",
            "show_creation_hint": db.query(User).count() == 0,
        },
        status_code=401,
    )


@app.get("/metrics", response_class=HTMLResponse)
async def metrics_dashboard(request: Request, db: Session = Depends(get_db)):
    try:
        user = require_admin(request)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            return RedirectResponse(url="/login", status_code=302)
        raise

    job_count_expr = func.count(JobHistory.id)
    rows = (
        db.query(JobHistory.username, job_count_expr.label("job_count"))
        .group_by(JobHistory.username)
        .order_by(job_count_expr.desc())
        .all()
    )
    metrics = [
        {"username": username, "job_count": job_count}
        for username, job_count in rows
    ]
    total_jobs = sum(item["job_count"] for item in metrics)

    return TEMPLATES.TemplateResponse(
        "metrics.html",
        {
            "request": request,
            "user": user,
            "metrics": metrics,
            "total_jobs": total_jobs,
            "user_count": len(metrics),
        },
    )


@app.get("/logout")
async def logout(request: Request):
    logout_user(request)
    return RedirectResponse(url="/login", status_code=302)


@app.get("/api/options")
async def options():
    return {
        "market_options": MARKET_OPTIONS,
        "analyst_options": ANALYST_OPTIONS,
        "research_depth_options": RESEARCH_DEPTH_OPTIONS,
        "llm_options": get_llm_options(),
    }


@app.post("/api/jobs", response_model=JobResponse)
async def create_job(
    payload: AnalysisRequest,
    user: str = Depends(get_current_user_api),
):
    selections = {k: v for k, v in payload.dict().items() if v is not None}
    selections["username"] = user
    market_meta = next((opt for opt in MARKET_OPTIONS if opt["value"] == payload.market), {})
    selections["market_meta"] = market_meta
    _normalize_llm_selection(selections)
    job = submit_job(selections)
    return JobResponse(
        id=job.id,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        result_dir=None,
        decision=None,
        reports=None,
        reports_html=None,
        error=None,
        log_path=job.log_path,
    )


@app.get("/api/jobs/{job_id}", response_model=JobResponse)
async def job_status(job_id: str, user: str = Depends(get_current_user_api)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.username and job.username != user:
        raise HTTPException(status_code=404, detail="Job not found")

    reports = None
    reports_html = None
    decision = None
    result_dir = None
    if job.result:
        result_dir = job.result.get("result_dir")
        summary = job.result.get("summary", {})
        reports = summary.get("reports")
        reports_html = _reports_to_html(reports)
        decision = summary.get("decision")
    log_path = job.log_path or (job.result.get("log_path") if job.result else None)

    return JobResponse(
        id=job.id,
        status=job.status,
        created_at=job.created_at,
        updated_at=job.updated_at,
        result_dir=result_dir,
        decision=decision,
        reports=reports,
        reports_html=reports_html,
        error=job.error,
        log_path=log_path,
    )


@app.get("/api/jobs", response_model=List[JobResponse])
async def job_list(user: str = Depends(get_current_user_api)):
    jobs = [job for job in list_jobs().values() if not job.username or job.username == user]
    responses = []
    for job in jobs:
        summary = job.result.get("summary", {}) if job.result else {}
        responses.append(
            JobResponse(
                id=job.id,
                status=job.status,
                created_at=job.created_at,
                updated_at=job.updated_at,
                result_dir=job.result.get("result_dir") if job.result else None,
                decision=summary.get("decision"),
                reports=summary.get("reports"),
                reports_html=_reports_to_html(summary.get("reports")) if summary else None,
                error=job.error,
                log_path=job.log_path or (job.result.get("log_path") if job.result else None),
            )
        )
    return responses


@app.get("/api/history", response_model=List[JobHistoryItem])
async def job_history(
    user: str = Depends(get_current_user_api),
    db: Session = Depends(get_db),
    limit: int = 50,
):
    limit = max(1, min(limit, 200))
    records = (
        db.query(JobHistory)
        .filter(JobHistory.username == user)
        .order_by(JobHistory.created_at.desc())
        .limit(limit)
        .all()
    )

    items: List[JobHistoryItem] = []
    for record in records:
        summary = None
        if record.summary_json:
            try:
                summary = json.loads(record.summary_json)
            except Exception:
                summary = None

        items.append(
            JobHistoryItem(
                job_id=record.job_id,
                ticker=record.ticker,
                analysis_date=record.analysis_date,
                status=record.status,
                decision=record.decision,
                result_dir=record.result_dir,
                log_path=record.log_path,
                error=record.error,
                created_at=record.created_at,
                updated_at=record.updated_at,
                completed_at=record.completed_at,
                summary=summary,
            )
        )

    return items


@app.get("/api/jobs/{job_id}/logs")
async def job_logs(job_id: str, limit: int = 200, user: str = Depends(get_current_user_api)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.username and job.username != user:
        raise HTTPException(status_code=404, detail="Job not found")

    log_path = job.log_path or (job.result.get("log_path") if job.result else None)
    if not log_path:
        return {"lines": [], "updated_at": datetime.utcnow().isoformat() + "Z"}

    path = Path(log_path)
    if not path.exists():
        return {"lines": [], "updated_at": datetime.utcnow().isoformat() + "Z"}

    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except Exception:
        return {"lines": [], "updated_at": datetime.utcnow().isoformat() + "Z"}

    if limit > 0:
        lines = lines[-limit:]

    return {"lines": lines, "updated_at": datetime.utcnow().isoformat() + "Z"}


@app.get("/health")
async def healthcheck():
    return {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}

from __future__ import annotations

import json
import threading
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from tradingagents.default_config import DEFAULT_CONFIG
from web.db import session_scope
from web.models import JobHistory


@dataclass
class AnalysisJob:
    id: str
    selections: Dict[str, Any]
    status: str = "queued"
    created_at: datetime = field(default_factory=lambda: datetime.utcnow())
    updated_at: datetime = field(default_factory=lambda: datetime.utcnow())
    result: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    log_path: Optional[str] = None
    username: Optional[str] = None


def _prepare_log_file(selections: Dict[str, Any]) -> str:
    ticker = selections.get("ticker", "").upper()
    analysis_date = selections.get("analysis_date")
    if not ticker or not analysis_date:
        raise ValueError("Ticker and analysis date are required to prepare log file")

    base_dir = Path(DEFAULT_CONFIG["results_dir"]) / ticker / analysis_date
    base_dir.mkdir(parents=True, exist_ok=True)
    log_file = base_dir / "message_tool.log"
    log_file.touch(exist_ok=True)
    return str(log_file)


def _append_log(log_path: Optional[str], message: str) -> None:
    if not log_path:
        return
    try:
        path = Path(log_path)
        timestamp = datetime.utcnow().isoformat() + "Z"
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception:
        pass


class JobRegistry:
    def __init__(self, max_workers: int = 2) -> None:
        self._jobs: Dict[str, AnalysisJob] = {}
        self._lock = threading.Lock()
        self._executor = ThreadPoolExecutor(max_workers=max_workers)

    def submit(self, selections: Dict[str, Any]) -> AnalysisJob:
        job_id = uuid.uuid4().hex
        log_path = _prepare_log_file(selections)
        job = AnalysisJob(
            id=job_id,
            selections=selections,
            log_path=log_path,
            username=selections.get("username"),
        )
        with self._lock:
            self._jobs[job_id] = job

        self._upsert_history(job)
        self._executor.submit(self._run_job, job_id)
        return job

    def get(self, job_id: str) -> Optional[AnalysisJob]:
        with self._lock:
            return self._jobs.get(job_id)

    def list(self) -> Dict[str, AnalysisJob]:
        with self._lock:
            return dict(self._jobs)

    def _run_job(self, job_id: str) -> None:
        job = self.get(job_id)
        if not job:
            return

        self._update_job(job, status="running")
        _append_log(job.log_path, "任务已开始执行")
        try:
            from tradingagents.services import execute_analysis

            result = execute_analysis(job.selections, log_path=job.log_path)
            self._update_job(job, status="completed", result=result)
            _append_log(job.log_path, "任务成功完成")
        except Exception as exc:  # pragma: no cover - runtime failures
            _append_log(job.log_path, "任务执行失败: " + str(exc))
            _append_log(job.log_path, traceback.format_exc())
            self._update_job(job, status="failed", error=str(exc))

    def _update_job(
        self,
        job: AnalysisJob,
        *,
        status: Optional[str] = None,
        result: Optional[Dict[str, Any]] = None,
        error: Optional[str] = None,
    ) -> None:
        with self._lock:
            job.status = status or job.status
            job.updated_at = datetime.utcnow()
            job.result = result or job.result
            job.error = error
            if result and result.get("log_path"):
                job.log_path = result["log_path"]

        self._upsert_history(job)

    def _upsert_history(self, job: AnalysisJob) -> None:
        username = job.username or job.selections.get("username")
        ticker = job.selections.get("ticker")
        analysis_date = job.selections.get("analysis_date")
        if not username or not ticker or not analysis_date:
            return

        try:
            with session_scope() as session:
                history = (
                    session.query(JobHistory)
                    .filter(JobHistory.job_id == job.id)
                    .one_or_none()
                )

                if history is None:
                    history = JobHistory(
                        job_id=job.id,
                        username=username,
                        ticker=ticker,
                        analysis_date=analysis_date,
                        status=job.status,
                        created_at=job.created_at,
                        updated_at=job.updated_at,
                    )
                    session.add(history)

                history.status = job.status
                history.updated_at = job.updated_at
                history.error = job.error
                history.log_path = job.log_path
                if job.result:
                    summary = job.result.get("summary")
                    if summary:
                        history.decision = summary.get("decision")
                        history.result_dir = job.result.get("result_dir")
                        history.summary_json = json.dumps(summary, ensure_ascii=False)
                if job.status in {"completed", "failed"}:
                    history.completed_at = job.updated_at
        except Exception:
            # Best-effort persistence shouldn't break job execution.
            pass


registry = JobRegistry()


def submit_job(selections: Dict[str, Any]) -> AnalysisJob:
    return registry.submit(selections)


def get_job(job_id: str) -> Optional[AnalysisJob]:
    return registry.get(job_id)


def list_jobs() -> Dict[str, AnalysisJob]:
    return registry.list()

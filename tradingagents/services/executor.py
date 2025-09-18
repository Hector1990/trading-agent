from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

from tradingagents.default_config import DEFAULT_CONFIG
from tradingagents.graph.trading_graph import TradingAgentsGraph

REPORT_SECTIONS = [
    "market_report",
    "sentiment_report",
    "news_report",
    "fundamentals_report",
    "investment_plan",
    "trader_investment_plan",
    "final_trade_decision",
]


def _ensure_results_dirs(
    config: Dict[str, Any],
    selections: Dict[str, Any],
    base_result_dir: Optional[Path] = None,
) -> Dict[str, Path]:
    if base_result_dir is not None:
        result_dir = base_result_dir
    else:
        base_dir = Path(config["results_dir"])
        result_dir = base_dir / selections["ticker"] / selections["analysis_date"]
    report_dir = result_dir / "reports"
    result_dir.mkdir(parents=True, exist_ok=True)
    report_dir.mkdir(parents=True, exist_ok=True)
    return {"result": result_dir, "reports": report_dir}


def _persist_reports(
    final_state: Dict[str, Any],
    selections: Dict[str, Any],
    config: Dict[str, Any],
    dirs: Dict[str, Path],
) -> Dict[str, Any]:
    report_payload: Dict[str, Any] = {}

    for section in REPORT_SECTIONS:
        if section in final_state and final_state[section]:
            report_payload[section] = final_state[section]
            if isinstance(final_state[section], str):
                (dirs["reports"] / f"{section}.md").write_text(final_state[section], encoding="utf-8")

    summary = {
        "ticker": selections["ticker"],
        "analysis_date": selections["analysis_date"],
        "market": config.get("market", "us"),
        "reports": report_payload,
        "decision": final_state.get("final_trade_decision", ""),
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }

    # Persist JSON summary for external integrations (avoid non-serializable data).
    summary_path = dirs["result"] / "summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    return {"summary": summary, "result_dir": str(dirs["result"])}


def _sanitize_selections(raw: Dict[str, Any]) -> Dict[str, Any]:
    required = {"ticker", "analysis_date", "market"}
    missing = required - raw.keys()
    if missing:
        raise ValueError(f"Missing required selections: {', '.join(sorted(missing))}")

    selections = raw.copy()
    selections["ticker"] = selections["ticker"].upper()
    selections["analysis_date"] = selections["analysis_date"]

    # Default analysts when none provided
    analysts = selections.get("analysts")
    if not analysts:
        analysts = ["market", "social", "news", "fundamentals"]
    selections["analysts"] = [a.lower() for a in analysts]

    # Research depth fallback
    selections["research_depth"] = int(selections.get("research_depth", 1))

    return selections


def execute_analysis(
    raw_selections: Dict[str, Any],
    *,
    log_path: Optional[str] = None,
) -> Dict[str, Any]:
    """Run the TradingAgents pipeline for the provided selections.

    Args:
        raw_selections: Dictionary containing user selections similar to the CLI prompts.

    Returns:
        Dictionary with summary metadata, report excerpts, and paths.
    """

    selections = _sanitize_selections(raw_selections)

    config = DEFAULT_CONFIG.copy()
    config["max_debate_rounds"] = selections["research_depth"]
    config["max_risk_discuss_rounds"] = selections["research_depth"]

    shallow = raw_selections.get("shallow_thinker")
    deep = raw_selections.get("deep_thinker")
    backend = raw_selections.get("backend_url")
    provider = raw_selections.get("llm_provider")

    if shallow:
        config["quick_think_llm"] = shallow
    if deep:
        config["deep_think_llm"] = deep
    if backend:
        config["backend_url"] = backend
    if provider:
        config["llm_provider"] = provider

    market = selections.get("market") or config.get("market", "us")
    config["market"] = market
    config["market_meta"] = raw_selections.get("market_meta", {})

    prepared_result_dir: Optional[Path] = None
    if log_path:
        log_file = Path(log_path)
        prepared_result_dir = log_file.parent
        prepared_result_dir.mkdir(parents=True, exist_ok=True)
        log_file.touch(exist_ok=True)

    dirs = _ensure_results_dirs(config, selections, base_result_dir=prepared_result_dir)
    log_file = Path(log_path) if log_path else dirs["result"] / "message_tool.log"
    log_file.parent.mkdir(parents=True, exist_ok=True)
    log_file.touch(exist_ok=True)

    def _append_log(message: str) -> None:
        timestamp = datetime.utcnow().isoformat() + "Z"
        with log_file.open("a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")

    _append_log("任务初始化完成，开始执行分析流程")

    graph = TradingAgentsGraph(selections["analysts"], config=config, debug=False)

    init_state = graph.propagator.create_initial_state(
        selections["ticker"], selections["analysis_date"]
    )
    args = graph.propagator.get_graph_args()

    stage_messages = {
        "market_report": "市场分析完成",
        "sentiment_report": "情绪分析完成",
        "news_report": "新闻分析完成",
        "fundamentals_report": "基本面分析完成",
        "investment_plan": "研究团队总结完成",
        "trader_investment_plan": "交易员方案生成完成",
        "final_trade_decision": "风险评估完成",
    }
    emitted_stages: set[str] = set()

    final_state: Dict[str, Any] = {}
    for chunk in graph.graph.stream(init_state, **args):
        if not isinstance(chunk, dict):
            continue
        final_state.update(chunk)
        for key, message in stage_messages.items():
            if key in chunk and chunk[key] and key not in emitted_stages:
                _append_log(message)
                emitted_stages.add(key)

    _append_log("分析流程执行完毕，正在生成报告")

    persistence = _persist_reports(final_state, selections, config, dirs)
    _append_log("任务完成")
    return {
        "state": {section: final_state.get(section) for section in REPORT_SECTIONS},
        "result_dir": persistence["result_dir"],
        "summary": persistence["summary"],
        "log_path": str(log_file),
    }

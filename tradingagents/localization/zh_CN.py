"""
简体中文本地化配置
"""

# CLI 界面文本
CLI_MESSAGES = {
    # 欢迎消息
    "welcome_title": "欢迎使用 TradingAgents",
    "welcome_subtitle": "多智能体 LLM 金融交易框架",
    "workflow_steps": "工作流程步骤",
    "workflow_description": "I. 分析团队 → II. 研究团队 → III. 交易团队 → IV. 风险管理 → V. 组合管理",
    
    # 设置步骤
    "step_ticker": "步骤 1: 股票代码",
    "step_ticker_prompt": "请输入要分析的股票代码",
    "step_date": "步骤 2: 分析日期", 
    "step_date_prompt": "请输入分析日期 (YYYY-MM-DD)",
    'step_analysts': '步骤 3：分析师团队',
    'step_analysts_prompt': '选择用于分析的LLM分析师代理',
    'step_analysts_select': '选择分析师（用逗号分隔编号）',
    "step_research": "步骤 4: 研究深度",
    "step_research_prompt": "选择您的研究深度级别",
    'step_research_depth': '步骤 4: 研究深度',
    'step_research_depth_prompt': '选择分析的深度级别',
    'step_llm_provider': '步骤 5: LLM 提供商',
    'step_llm_provider_prompt': '选择要使用的 LLM 服务提供商',
    "step_backend": "步骤 5: LLM 后端",
    "step_backend_prompt": "选择要使用的 LLM 服务",
    "step_agents": "步骤 6: 思考代理",
    "step_agents_prompt": "选择您的分析思考代理",
    
    # 选项
    "selected_analysts": "已选择分析师",
    "selected_ticker": "已选择股票",
    "analysis_date": "分析日期",
    
    # 研究深度选项
    "research_shallow": "浅层 - 快速分析，简要评估",
    "research_medium": "中等 - 标准分析，平衡的辩论",
    "research_deep": "深度 - 全面研究，深入辩论和策略讨论",
    
    # 进度面板
    "progress_title": "进度",
    "messages_title": "消息与工具",
    "current_report_title": "当前报告",
    "complete_report_title": "完整分析报告",
    
    # 团队名称
    "team_analyst": "分析团队",
    "team_research": "研究团队", 
    "team_trading": "交易团队",
    "team_risk": "风险管理",
    "team_portfolio": "组合管理",
    
    # 代理名称
    "agent_market": "市场分析师",
    "agent_social": "社交分析师",
    "agent_news": "新闻分析师",
    "agent_fundamentals": "基本面分析师",
    "agent_bull": "看涨研究员",
    "agent_bear": "看跌研究员",
    "agent_research_manager": "研究经理",
    "agent_trader": "交易员",
    "agent_risky": "激进分析师",
    "agent_neutral": "中性分析师",
    "agent_safe": "保守分析师",
    "agent_portfolio": "组合经理",
    
    # 状态
    "status_pending": "等待中",
    "status_in_progress": "进行中",
    "status_completed": "已完成",
    "status_error": "错误",
    
    # 消息类型
    "type_system": "系统",
    "type_tool": "工具",
    "type_reasoning": "推理",
    "type_spinner": "处理中",
    
    # 统计信息
    "stats_tool_calls": "工具调用",
    "stats_llm_calls": "LLM 调用",
    "stats_reports": "生成报告",
    
    # 其他
    "waiting_for_analysis": "等待分析报告...",
    "analyzing": "正在分析",
    "messages_truncated": "显示最后 {shown} 条消息（共 {total} 条）",
    "error_invalid_date": "错误：日期格式无效。请使用 YYYY-MM-DD",
    "error_future_date": "错误：分析日期不能是未来日期",
}

# 报告部分标题
REPORT_SECTIONS = {
    "market_analysis": "市场分析",
    "social_sentiment": "社交情绪",
    "news_analysis": "新闻分析",
    "fundamentals_analysis": "基本面分析",
    "research_decision": "研究团队决策",
    "trading_plan": "交易团队计划",
    "portfolio_decision": "组合管理决策",
    "bull_analysis": "看涨分析",
    "bear_analysis": "看跌分析",
    "aggressive_analysis": "激进策略分析",
    "conservative_analysis": "保守策略分析",
    "neutral_analysis": "中性策略分析",
}

# 分析报告模板
REPORT_TEMPLATES = {
    "conclusion": "结论/建议",
    "rationale": "依据",
    "key_metrics": "关键指标",
    "risks": "风险与假设",
    "next_steps": "下一步",
    "entry_point": "入场点",
    "stop_loss": "止损位",
    "target": "目标价",
    "position_size": "仓位大小",
    "timeframe": "时间框架",
    "confidence": "置信度",
    "market_conditions": "市场状况",
    "technical_indicators": "技术指标",
    "fundamental_factors": "基本面因素",
    "sentiment_score": "情绪评分",
    "news_impact": "新闻影响",
    "risk_reward": "风险收益比",
}

# 错误消息
ERROR_MESSAGES = {
    "api_key_not_found": "未找到 API 密钥。请设置相应的环境变量。",
    "error_messages": {
        "api_error": "API 调用失败：{error}",
        "data_error": "数据获取错误：{error}",
        "analysis_error": "分析过程出错：{error}",
        "network_error": "网络连接错误：{error}",
        "config_error": "配置错误：{error}",
        "file_error": "文件操作错误：{error}",
        "validation_error": "数据验证失败：{error}",
        "timeout_error": "操作超时：{error}",
        "invalid_ticker": "无效的股票代码：{ticker}",
        "invalid_date": "无效的日期格式：{date}",
        "missing_data": "缺少必要的数据：{field}",
        "llm_error": "语言模型调用失败：{error}",
        "memory_error": "内存系统错误：{error}",
        "tool_error": "工具调用失败：{tool} - {error}",
    },
    "rate_limit": "达到速率限制",
    "insufficient_data": "数据不足",
    "model_unavailable": "模型不可用",
}

# 工具调用描述
TOOL_DESCRIPTIONS = {
    "fetch_price": "获取价格数据",
    "fetch_news": "获取新闻数据",
    "fetch_sentiment": "获取情绪数据",
    "fetch_fundamentals": "获取基本面数据",
    "calculate_indicators": "计算技术指标",
    "analyze_pattern": "分析图表形态",
    "generate_report": "生成报告",
    "save_memory": "保存记忆",
    "retrieve_memory": "检索记忆",
}

def get_message(key: str, **kwargs) -> str:
    """获取本地化消息"""
    if key in CLI_MESSAGES:
        return CLI_MESSAGES[key].format(**kwargs) if kwargs else CLI_MESSAGES[key]
    elif key in REPORT_SECTIONS:
        return REPORT_SECTIONS[key]
    elif key in REPORT_TEMPLATES:
        return REPORT_TEMPLATES[key]
    elif key in ERROR_MESSAGES:
        return ERROR_MESSAGES[key]
    elif key in TOOL_DESCRIPTIONS:
        return TOOL_DESCRIPTIONS[key]
    else:
        return key  # 如果没有找到翻译，返回原始键

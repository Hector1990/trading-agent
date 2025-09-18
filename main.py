from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

# Create a custom config
config = DEFAULT_CONFIG.copy()
config["llm_provider"] = "deepseek"  # Target the DeepSeek API
config["backend_url"] = "https://api.deepseek.com/v1"  # DeepSeek endpoint
config["deep_think_llm"] = "deepseek-chat"  # Use the flagship DeepSeek chat model for deep thinking
config["quick_think_llm"] = "deepseek-chat"  # Use the flagship DeepSeek chat model for quick tasks
config["max_debate_rounds"] = 1  # Increase debate rounds
config["online_tools"] = True  # Enable live data tools

# Initialize with custom config
ta = TradingAgentsGraph(debug=True, config=config)

# forward propagate
_, decision = ta.propagate("NVDA", "2024-05-10")
print(decision)

# Memorize mistakes and reflect
# ta.reflect_and_remember(1000) # parameter is the position returns

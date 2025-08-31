# DeepSeek API Migration Notes

## Overview
TradingAgents has been migrated from OpenAI API to DeepSeek API V3.1 as the default LLM provider, while maintaining full backward compatibility with OpenAI and other providers.

## Key Changes

### 1. Default Provider
- **Old**: OpenAI (`gpt-4o-mini`, `o4-mini`)
- **New**: DeepSeek (`deepseek-chat`, `deepseek-reasoner`)

### 2. Provider Abstraction Layer
Created `tradingagents/providers.py` that provides:
- Unified interface for all LLM providers
- Automatic handling of provider-specific configurations
- Support for DeepSeek, OpenAI, Anthropic, Google, OpenRouter, and Ollama

### 3. Environment Variables

#### Required for DeepSeek
```bash
export DEEPSEEK_API_KEY="your-deepseek-api-key"
```

#### Backward Compatibility
```bash
# Option 1: Force OpenAI provider
export USE_OPENAI_FALLBACK=true

# Option 2: Override provider via environment
export LLM_PROVIDER=openai  # or anthropic, google, etc.
```

#### API Key Priority
For DeepSeek, the system checks in order:
1. `DEEPSEEK_API_KEY`
2. `OPENAI_API_KEY` (fallback)

## Usage

### Interactive Mode (Default)
```bash
# Uses DeepSeek by default
python -m cli.main analyze

# The CLI will show DeepSeek as the first option
# Select your LLM Provider:
# > DeepSeek
#   OpenAI
#   Anthropic
#   ...
```

### Command Line Options
```bash
# Specify provider explicitly
python -m cli.main analyze --provider openai

# Specify custom models
python -m cli.main analyze \
  --provider deepseek \
  --quick-model deepseek-chat \
  --deep-model deepseek-reasoner

# Quick analysis with specific provider
python -m cli.main analyze \
  --provider anthropic \
  --quick-model claude-3-5-haiku-latest \
  --deep-model claude-3-5-sonnet-latest
```

### Programmatic Usage
```python
from tradingagents.providers import ProviderFactory

# Create DeepSeek LLM
llm = ProviderFactory.create_llm(
    provider="deepseek",
    model="deepseek-chat",
    thinking_type="quick",
    temperature=0.3,
    streaming=True
)

# Create with automatic model selection
quick_llm = ProviderFactory.create_llm(
    provider="deepseek",
    thinking_type="quick"  # Automatically uses deepseek-chat
)

deep_llm = ProviderFactory.create_llm(
    provider="deepseek", 
    thinking_type="deep"  # Automatically uses deepseek-reasoner
)
```

## DeepSeek-Specific Behavior

### DeepSeek Chat Model
- General purpose, fast inference
- Supports all standard parameters
- Compatible with OpenAI SDK format
- Suitable for quick analysis tasks

### DeepSeek Reasoner Model
- Advanced reasoning capabilities
- Special parameter handling:
  - Does NOT support: `response_format`, `top_p`, `frequency_penalty`, `presence_penalty`
  - These parameters are automatically filtered out
- Response handling:
  - Contains `reasoning_content` field showing thinking process
  - This field is automatically removed before passing to next round
  - Use `ProviderFactory.handle_reasoner_response()` for proper cleanup

### Streaming Behavior
DeepSeek streaming may include:
- Keep-alive lines (empty data chunks)
- Additional empty lines between chunks
- The system handles these automatically

## Migration Checklist

### For Users
1. ✅ Obtain DeepSeek API key from https://platform.deepseek.com
2. ✅ Set `DEEPSEEK_API_KEY` environment variable
3. ✅ Run the application normally - it will use DeepSeek by default
4. ✅ To use OpenAI: either set `USE_OPENAI_FALLBACK=true` or select OpenAI in CLI

### For Developers
1. ✅ Provider abstraction layer in `tradingagents/providers.py`
2. ✅ Updated default configuration to use DeepSeek
3. ✅ Modified CLI to support provider selection
4. ✅ Added command-line options for model override
5. ✅ Implemented environment variable controls
6. ✅ Added comprehensive tests in `tests/test_providers.py`
7. ✅ Maintained full backward compatibility

## Testing

### Unit Tests
```bash
# Run provider tests
pytest tests/test_providers.py -v

# Run with coverage
pytest tests/test_providers.py --cov=tradingagents.providers
```

### Integration Testing
```bash
# Test with DeepSeek (default)
python -m cli.main analyze

# Test with OpenAI fallback
USE_OPENAI_FALLBACK=true python -m cli.main analyze

# Test with explicit provider
python -m cli.main analyze --provider openai
```

## Rollback Instructions

If you need to rollback to OpenAI:

### Option 1: Environment Variable
```bash
export USE_OPENAI_FALLBACK=true
# or
export LLM_PROVIDER=openai
```

### Option 2: Update Default Config
Edit `tradingagents/default_config.py`:
```python
"llm_provider": "openai",
"deep_think_llm": "o4-mini",
"quick_think_llm": "gpt-4o-mini",
```

### Option 3: CLI Override
```bash
python -m cli.main analyze --provider openai
```

## Known Differences

### DeepSeek vs OpenAI
1. **Pricing**: DeepSeek is generally more cost-effective
2. **Reasoning**: DeepSeek Reasoner provides explicit reasoning traces
3. **Parameters**: Some OpenAI parameters not supported by DeepSeek Reasoner
4. **Response Format**: DeepSeek includes additional fields that are handled automatically

### Compatibility Notes
- Function calling: ✅ Fully compatible
- Streaming: ✅ Fully compatible (with automatic handling of keep-alive)
- JSON mode: ✅ Compatible (except for Reasoner model)
- Tools: ✅ Fully compatible
- Context length: Similar capabilities

## Troubleshooting

### Issue: "No API key found"
**Solution**: Set `DEEPSEEK_API_KEY` or `OPENAI_API_KEY` environment variable

### Issue: "Unsupported parameter" errors with Reasoner
**Solution**: The provider factory automatically filters these - ensure you're using `ProviderFactory.create_llm()`

### Issue: Streaming appears broken
**Solution**: DeepSeek may send keep-alive chunks - this is normal and handled automatically

### Issue: Want to use OpenAI instead
**Solution**: Set `USE_OPENAI_FALLBACK=true` or use `--provider openai` CLI option

## Support

For issues or questions about the migration:
1. Check this documentation
2. Review the test suite in `tests/test_providers.py`
3. Examine the provider implementation in `tradingagents/providers.py`

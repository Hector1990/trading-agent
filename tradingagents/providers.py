"""
Provider abstraction layer for LLM backends.
Supports OpenAI, DeepSeek, Anthropic, Google, and other providers.
"""

import os
import logging
from typing import Any, Dict, Optional, Union
from enum import Enum

from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI

logger = logging.getLogger(__name__)


class LLMProvider(Enum):
    """Supported LLM providers."""
    OPENAI = "openai"
    DEEPSEEK = "deepseek"
    ANTHROPIC = "anthropic"
    GOOGLE = "google"
    OPENROUTER = "openrouter"
    OLLAMA = "ollama"


class ProviderFactory:
    """Factory for creating LLM clients with provider-specific configurations."""
    
    # Provider-specific base URLs
    BASE_URLS = {
        LLMProvider.OPENAI: "https://api.openai.com/v1",
        LLMProvider.DEEPSEEK: "https://api.deepseek.com",
        LLMProvider.ANTHROPIC: "https://api.anthropic.com/",
        LLMProvider.GOOGLE: "https://generativelanguage.googleapis.com/v1",
        LLMProvider.OPENROUTER: "https://openrouter.ai/api/v1",
        LLMProvider.OLLAMA: "http://localhost:11434/v1",
    }
    
    # Default models per provider
    DEFAULT_MODELS = {
        LLMProvider.DEEPSEEK: {
            "quick": "deepseek-chat",
            "deep": "deepseek-reasoner"
        },
        LLMProvider.OPENAI: {
            "quick": "gpt-4o-mini",
            "deep": "o4-mini"
        },
        LLMProvider.ANTHROPIC: {
            "quick": "claude-3-5-haiku-latest",
            "deep": "claude-3-5-sonnet-latest"
        },
        LLMProvider.GOOGLE: {
            "quick": "gemini-2.0-flash",
            "deep": "gemini-2.5-pro-preview-06-05"
        },
    }
    
    @classmethod
    def get_provider(cls, provider_name: str) -> LLMProvider:
        """Get provider enum from string name."""
        # Check environment variable for fallback
        use_openai_fallback = os.getenv("USE_OPENAI_FALLBACK", "false").lower() == "true"
        llm_provider_env = os.getenv("LLM_PROVIDER", "").lower()
        
        if use_openai_fallback:
            logger.info("USE_OPENAI_FALLBACK is true, using OpenAI provider")
            return LLMProvider.OPENAI
            
        if llm_provider_env and llm_provider_env != provider_name.lower():
            logger.info(f"LLM_PROVIDER environment variable overrides config: {llm_provider_env}")
            provider_name = llm_provider_env
            
        try:
            return LLMProvider(provider_name.lower())
        except ValueError:
            logger.warning(f"Unknown provider {provider_name}, defaulting to DeepSeek")
            return LLMProvider.DEEPSEEK
    
    @classmethod
    def get_api_key(cls, provider: LLMProvider) -> str:
        """Get API key for provider from environment."""
        key_mapping = {
            LLMProvider.DEEPSEEK: ["DEEPSEEK_API_KEY", "OPENAI_API_KEY"],
            LLMProvider.OPENAI: ["OPENAI_API_KEY"],
            LLMProvider.ANTHROPIC: ["ANTHROPIC_API_KEY"],
            LLMProvider.GOOGLE: ["GOOGLE_API_KEY"],
            LLMProvider.OPENROUTER: ["OPENROUTER_API_KEY", "OPENAI_API_KEY"],
            LLMProvider.OLLAMA: [],  # No API key needed for local Ollama
        }
        
        for key_name in key_mapping.get(provider, []):
            api_key = os.getenv(key_name)
            if api_key:
                logger.debug(f"Using API key from {key_name}")
                return api_key
                
        if provider == LLMProvider.OLLAMA:
            return ""  # Ollama doesn't require API key
            
        raise ValueError(f"No API key found for provider {provider.value}. "
                        f"Please set one of: {', '.join(key_mapping.get(provider, []))}")
    
    @classmethod
    def create_llm(
        cls,
        provider: Union[str, LLMProvider],
        model: Optional[str] = None,
        thinking_type: str = "quick",
        temperature: float = 0.3,
        streaming: bool = True,
        **kwargs
    ) -> Any:
        """
        Create an LLM client for the specified provider.
        
        Args:
            provider: Provider name or enum
            model: Model name (if None, uses default for provider and thinking_type)
            thinking_type: "quick" or "deep" for selecting default model
            temperature: Temperature setting for generation
            streaming: Whether to enable streaming responses
            **kwargs: Additional provider-specific arguments
            
        Returns:
            LLM client instance (ChatOpenAI, ChatAnthropic, etc.)
        """
        # Convert string to enum if needed
        if isinstance(provider, str):
            provider = cls.get_provider(provider)
            
        # Get API key
        api_key = cls.get_api_key(provider)
        
        # Get model if not specified
        if model is None:
            model = cls.DEFAULT_MODELS.get(provider, {}).get(thinking_type, "")
            if not model:
                raise ValueError(f"No default {thinking_type} model for provider {provider.value}")
        
        # Log the configuration
        logger.info(f"Creating {provider.value} LLM with model={model}, thinking_type={thinking_type}")
        
        # Handle DeepSeek-specific configurations
        if provider == LLMProvider.DEEPSEEK:
            # DeepSeek uses OpenAI-compatible client
            base_url = kwargs.pop("base_url", cls.BASE_URLS[provider])
            
            # Special handling for reasoner model
            if "reasoner" in model.lower():
                logger.info("Configuring DeepSeek reasoner model")
                # Reasoner doesn't support some parameters
                kwargs.pop("response_format", None)
                kwargs.pop("top_p", None)
                kwargs.pop("frequency_penalty", None)
                kwargs.pop("presence_penalty", None)
            
            return ChatOpenAI(
                model=model,
                api_key=api_key,
                base_url=base_url,
                temperature=temperature,
                streaming=streaming,
                timeout=kwargs.pop("timeout", 60),
                max_retries=kwargs.pop("max_retries", 3),
                **kwargs
            )
            
        # Handle OpenAI and OpenRouter (both use ChatOpenAI)
        elif provider in [LLMProvider.OPENAI, LLMProvider.OPENROUTER, LLMProvider.OLLAMA]:
            base_url = kwargs.pop("base_url", cls.BASE_URLS[provider])
            
            return ChatOpenAI(
                model=model,
                api_key=api_key,
                base_url=base_url if provider != LLMProvider.OPENAI else None,
                temperature=temperature,
                streaming=streaming,
                **kwargs
            )
            
        # Handle Anthropic
        elif provider == LLMProvider.ANTHROPIC:
            return ChatAnthropic(
                model=model,
                api_key=api_key,
                temperature=temperature,
                streaming=streaming,
                **kwargs
            )
            
        # Handle Google
        elif provider == LLMProvider.GOOGLE:
            return ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                temperature=temperature,
                streaming=streaming,
                **kwargs
            )
            
        else:
            raise ValueError(f"Unsupported provider: {provider.value}")
    
    @classmethod
    def handle_reasoner_response(cls, response: Dict[str, Any]) -> Dict[str, Any]:
        """
        Handle DeepSeek reasoner model response by removing reasoning_content.
        
        Args:
            response: Raw response from the model
            
        Returns:
            Cleaned response suitable for next round
        """
        if "reasoning_content" in response:
            logger.debug("Removing reasoning_content from reasoner response")
            response = response.copy()
            response.pop("reasoning_content", None)
        return response
    
    @classmethod
    def get_provider_config(cls, provider: Union[str, LLMProvider]) -> Dict[str, Any]:
        """
        Get provider-specific configuration.
        
        Args:
            provider: Provider name or enum
            
        Returns:
            Configuration dictionary with provider settings
        """
        if isinstance(provider, str):
            provider = cls.get_provider(provider)
            
        config = {
            "provider": provider.value,
            "base_url": cls.BASE_URLS.get(provider),
            "models": cls.DEFAULT_MODELS.get(provider, {}),
            "requires_api_key": provider != LLMProvider.OLLAMA,
        }
        
        # Add provider-specific notes
        if provider == LLMProvider.DEEPSEEK:
            config["notes"] = {
                "reasoner_limitations": [
                    "No response_format parameter",
                    "No top_p, frequency_penalty, presence_penalty",
                    "Must remove reasoning_content before next round"
                ],
                "streaming_notes": "May include keep-alive lines and empty lines"
            }
            
        return config

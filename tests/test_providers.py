"""
Tests for the provider abstraction layer.
"""

import os
import pytest
from unittest.mock import patch, MagicMock, call
from tradingagents.providers import ProviderFactory, LLMProvider


class TestProviderFactory:
    """Test suite for ProviderFactory."""
    
    def test_get_provider_deepseek(self):
        """Test getting DeepSeek provider."""
        provider = ProviderFactory.get_provider("deepseek")
        assert provider == LLMProvider.DEEPSEEK
        
    def test_get_provider_openai(self):
        """Test getting OpenAI provider."""
        provider = ProviderFactory.get_provider("openai")
        assert provider == LLMProvider.OPENAI
        
    def test_get_provider_with_fallback(self):
        """Test provider fallback to OpenAI."""
        with patch.dict(os.environ, {"USE_OPENAI_FALLBACK": "true"}):
            provider = ProviderFactory.get_provider("deepseek")
            assert provider == LLMProvider.OPENAI
            
    def test_get_provider_with_env_override(self):
        """Test provider override from environment."""
        with patch.dict(os.environ, {"LLM_PROVIDER": "anthropic"}):
            provider = ProviderFactory.get_provider("deepseek")
            assert provider == LLMProvider.ANTHROPIC
            
    def test_get_api_key_deepseek(self):
        """Test getting API key for DeepSeek."""
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": "test-key"}):
            key = ProviderFactory.get_api_key(LLMProvider.DEEPSEEK)
            assert key == "test-key"
            
    def test_get_api_key_deepseek_fallback_to_openai(self):
        """Test DeepSeek API key fallback to OpenAI key."""
        with patch.dict(os.environ, {"OPENAI_API_KEY": "openai-key"}, clear=True):
            key = ProviderFactory.get_api_key(LLMProvider.DEEPSEEK)
            assert key == "openai-key"
            
    def test_get_api_key_missing(self):
        """Test error when API key is missing."""
        with patch.dict(os.environ, {}, clear=True):
            with pytest.raises(ValueError, match="No API key found"):
                ProviderFactory.get_api_key(LLMProvider.DEEPSEEK)
                
    @patch('tradingagents.providers.ChatOpenAI')
    def test_create_llm_deepseek_chat(self, mock_chat_openai):
        """Test creating DeepSeek chat model."""
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": "test-key"}):
            llm = ProviderFactory.create_llm(
                provider="deepseek",
                model="deepseek-chat",
                thinking_type="quick",
                temperature=0.5,
                streaming=True
            )
            
            mock_chat_openai.assert_called_once_with(
                model="deepseek-chat",
                api_key="test-key",
                base_url="https://api.deepseek.com",
                temperature=0.5,
                streaming=True,
                timeout=60,
                max_retries=3
            )
            
    @patch('tradingagents.providers.ChatOpenAI')
    def test_create_llm_deepseek_reasoner(self, mock_chat_openai):
        """Test creating DeepSeek reasoner model with special handling."""
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": "test-key"}):
            llm = ProviderFactory.create_llm(
                provider="deepseek",
                model="deepseek-reasoner",
                thinking_type="deep",
                temperature=0.3,
                streaming=True,
                response_format={"type": "json"},  # Should be removed
                top_p=0.9,  # Should be removed
                frequency_penalty=0.5,  # Should be removed
                presence_penalty=0.5  # Should be removed
            )
            
            # Verify unsupported parameters are removed for reasoner
            mock_chat_openai.assert_called_once()
            call_args = mock_chat_openai.call_args
            assert "response_format" not in call_args[1]
            assert "top_p" not in call_args[1]
            assert "frequency_penalty" not in call_args[1]
            assert "presence_penalty" not in call_args[1]
            
    @patch('tradingagents.providers.ChatOpenAI')
    def test_create_llm_with_default_model(self, mock_chat_openai):
        """Test creating LLM with default model selection."""
        with patch.dict(os.environ, {"DEEPSEEK_API_KEY": "test-key"}):
            llm = ProviderFactory.create_llm(
                provider="deepseek",
                thinking_type="quick"
            )
            
            mock_chat_openai.assert_called_once()
            call_args = mock_chat_openai.call_args
            assert call_args[1]["model"] == "deepseek-chat"
            
    def test_handle_reasoner_response(self):
        """Test handling DeepSeek reasoner response."""
        response = {
            "content": "This is the answer",
            "reasoning_content": "This is the reasoning process",
            "other_field": "keep this"
        }
        
        cleaned = ProviderFactory.handle_reasoner_response(response)
        
        assert "content" in cleaned
        assert "reasoning_content" not in cleaned
        assert "other_field" in cleaned
        assert cleaned["content"] == "This is the answer"
        assert cleaned["other_field"] == "keep this"
        
    def test_handle_reasoner_response_no_reasoning(self):
        """Test handling response without reasoning_content."""
        response = {
            "content": "This is the answer",
            "other_field": "keep this"
        }
        
        cleaned = ProviderFactory.handle_reasoner_response(response)
        
        assert cleaned == response
        
    def test_get_provider_config_deepseek(self):
        """Test getting DeepSeek provider configuration."""
        config = ProviderFactory.get_provider_config("deepseek")
        
        assert config["provider"] == "deepseek"
        assert config["base_url"] == "https://api.deepseek.com"
        assert config["models"]["quick"] == "deepseek-chat"
        assert config["models"]["deep"] == "deepseek-reasoner"
        assert config["requires_api_key"] is True
        assert "reasoner_limitations" in config["notes"]
        assert "streaming_notes" in config["notes"]
        
    @patch('tradingagents.providers.ChatAnthropic')
    def test_create_llm_anthropic(self, mock_chat_anthropic):
        """Test creating Anthropic model."""
        with patch.dict(os.environ, {"ANTHROPIC_API_KEY": "test-key"}):
            llm = ProviderFactory.create_llm(
                provider="anthropic",
                model="claude-3-5-sonnet-latest",
                temperature=0.7,
                streaming=False
            )
            
            mock_chat_anthropic.assert_called_once_with(
                model="claude-3-5-sonnet-latest",
                api_key="test-key",
                temperature=0.7,
                streaming=False
            )
            
    @patch('tradingagents.providers.ChatGoogleGenerativeAI')
    def test_create_llm_google(self, mock_chat_google):
        """Test creating Google model."""
        with patch.dict(os.environ, {"GOOGLE_API_KEY": "test-key"}):
            llm = ProviderFactory.create_llm(
                provider="google",
                model="gemini-2.0-flash",
                temperature=0.5,
                streaming=True
            )
            
            mock_chat_google.assert_called_once_with(
                model="gemini-2.0-flash",
                google_api_key="test-key",
                temperature=0.5,
                streaming=True
            )

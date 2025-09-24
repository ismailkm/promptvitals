import OllamaAdapter from './ollamaAdapter';
import type { LLMClient, LLMConfig } from '@/lib/types/aiTypes';

// Cache for lazy-loaded adapters
let openaiAdapterCache: LLMClient | null = null;

const providerConfigMap = {
  ollama: {
    primary: process.env.LLM_MODEL_PRIMARY ?? 'gemma3:270m',
    fallback: process.env.LLM_MODEL_FALLBACK ?? 'gemma3:270m',
  },
  openai: {
    primary: process.env.LLM_MODEL_PRIMARY ?? 'gpt-3.5-turbo',
    fallback: process.env.LLM_MODEL_FALLBACK ?? 'gpt-3.5-turbo',
  },
};

export function getLLMClient(): LLMClient {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();

  if (provider === 'ollama') {
    return OllamaAdapter;
  }
  
  // Lazy-load OpenAI adapter with caching
  if (!openaiAdapterCache) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    openaiAdapterCache = require('./openaiAdapter').default as LLMClient;
  }
  return openaiAdapterCache;
}


/**
 * Reads all LLM-related environment variables and returns a single, clean
 * configuration object. This is the single source of truth for LLM configuration.
 */
export function getLLMConfig(): LLMConfig {
  const provider = (process.env.LLM_PROVIDER || 'openai').toLowerCase();
  const config = providerConfigMap[provider as keyof typeof providerConfigMap] || providerConfigMap.openai;
  const temperature = process.env.LLM_TEMPERATURE && !isNaN(parseFloat(process.env.LLM_TEMPERATURE))
    ? parseFloat(process.env.LLM_TEMPERATURE)
    : 0.3;
  const maxTokens = process.env.LLM_MAX_TOKENS && !isNaN(parseInt(process.env.LLM_MAX_TOKENS, 10))
    ? parseInt(process.env.LLM_MAX_TOKENS, 10)
    : 800;

  return {
    provider: provider as LLMConfig['provider'],
    primaryModel: config.primary,
    fallbackModel: config.fallback,
    temperature,
    maxTokens,
  };
}
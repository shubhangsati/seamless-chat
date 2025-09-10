import { genUserLLMConfig } from './genUserLLMConfig';

export const DEFAULT_LLM_CONFIG = genUserLLMConfig({
  anthropic: {
    enabled: true,
  },
  lmstudio: {
    fetchOnClient: true,
  },
  ollama: {
    enabled: false,
    fetchOnClient: true,
  },
  openai: {
    enabled: false,
  },
});

export const DEFAULT_MODEL = 'claude-sonnet-4-20250514';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';
export const DEFAULT_EMBEDDING_PROVIDER = 'openai';

export const DEFAULT_RERANK_MODEL = 'rerank-english-v3.0';
export const DEFAULT_RERANK_PROVIDER = 'cohere';
export const DEFAULT_RERANK_QUERY_MODE = 'full_text';

export const DEFAULT_PROVIDER = 'anthropic';

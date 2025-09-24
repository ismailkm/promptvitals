import { ollamaChatCompletion } from '@/lib/llm-clients/ollamaClient';
import type { ChatMessage, LLMClient } from '@/lib/types/aiTypes';

const OllamaAdapter: LLMClient = {
  name: 'ollama',
  async chatJSON({ model = 'phi3', messages, temperature = 0, max_tokens = 200 }): Promise<{ content: string }> {
    // Ollama doesn't support JSON schemas directly; we return raw content and let caller parse/validate
    const { content } = await ollamaChatCompletion({ model, messages, temperature, max_tokens });
    return { content };
  },
};

export default OllamaAdapter;

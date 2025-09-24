// Minimal Ollama client for local LLM calls with tiny retry/timeout
import axios from 'axios';
import type { LLMChatCompletionParams } from '@/lib/types/aiTypes';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_TIMEOUT_MS = Number(process.env.OLLAMA_TIMEOUT_MS || 10000);
const OLLAMA_RETRIES = Math.max(0, Number(process.env.OLLAMA_RETRIES || 2));


const http = axios.create({
  baseURL: OLLAMA_BASE_URL,
  timeout: OLLAMA_TIMEOUT_MS,
});

function sleep(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

export async function ollamaChatCompletion({
  model = 'phi3',
  messages,
  temperature = 0,
  max_tokens = 200,
}: LLMChatCompletionParams): Promise<{ content: string }> {
  // Ollama expects a single prompt string, so we concatenate messages
  const prompt = messages.map(m => m.content).join('\n');

  let lastError: any;
  for (let attempt = 0; attempt <= OLLAMA_RETRIES; attempt++) {
    try {
      const response = await http.post('/api/generate', {
        model,
        prompt,
        options: { temperature, num_predict: max_tokens },
        stream: false,
      });
      return { content: response.data.response };
    } catch (err: any) {
      lastError = err;
      if (attempt < OLLAMA_RETRIES) {
        const backoff = 200 * Math.pow(2, attempt);
        await sleep(backoff);
        continue;
      }
    }
  }
  throw new Error(`Ollama request failed after ${OLLAMA_RETRIES + 1} attempts: ${lastError?.message || 'unknown error'}`);
}

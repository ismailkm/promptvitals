import { getOpenAIClient } from '@/lib/llm-clients/openaiClient';
import type { LLMClient } from '@/lib/types/aiTypes';

const OpenAIAdapter: LLMClient = {
  name: 'openai',
  async chatJSON({ model = 'gpt-4o-mini', messages, temperature = 0, max_tokens = 200, schema }): Promise<{ content: string }> {
  const openai = getOpenAIClient();
  const response = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens,
      ...(schema
        ? { response_format: { type: 'json_schema', json_schema: schema } as any }
        : { response_format: { type: 'json_object' } }),
    });
    const content = response.choices?.[0]?.message?.content ?? '';
    return { content };
  },
};

export default OpenAIAdapter;

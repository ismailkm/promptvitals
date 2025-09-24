// Conditional OpenAI client for Node.js with caching
let openaiInstance: any = null;

export function getOpenAIClient() {
  if (!openaiInstance) {
    require('openai/shims/node');
    const { default: OpenAI } = require('openai');
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

import type { LLMProvider } from './provider';
import { OpenAIProvider } from './openai';

export function getProvider(): LLMProvider | undefined {
  const key = process.env.LLM_API_KEY;
  return key ? new OpenAIProvider(key) : undefined;
}

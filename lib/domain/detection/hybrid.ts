import type { Analysis } from '@/lib/domain/types';
import type { LLMProvider } from '@/lib/llm/provider';
import { analyzeWithRules } from './engine';

export async function analyzeMessage(
  message: string,
  deps?: { provider?: LLMProvider },
): Promise<Analysis> {
  const rules = analyzeWithRules(message);
  const provider = deps?.provider;
  if (!provider) return rules;
  try {
    const llm = await provider.analyze(message);
    return {
      ...rules,
      isScopeCheck: rules.isScopeCheck || llm.isScopeCheck,
      confidence: Math.max(rules.confidence, llm.confidence),
      estimatedAdditionalHours: Math.max(rules.estimatedAdditionalHours, llm.estimatedHours),
      engine: 'hybrid',
    };
  } catch {
    return rules;
  }
}

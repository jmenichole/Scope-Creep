import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '@/lib/domain/detection/hybrid';
import type { LLMProvider } from '@/lib/llm/provider';

describe('analyzeMessage (hybrid)', () => {
  it('returns rules-only when no provider', async () => {
    const result = await analyzeMessage('The update looks great, thanks!');
    expect(result.engine).toBe('rules');
    expect(result.isScopeCheck).toBe(false);
  });

  it('merges LLM signal (takes stronger confidence) when provider present', async () => {
    const provider: LLMProvider = {
      analyze: async () => ({
        isScopeCheck: true,
        confidence: 95,
        estimatedHours: 6,
        formalRewrite: 'REQUEST FOR SCOPE ADJUSTMENT: ...',
      }),
    };
    const result = await analyzeMessage('subtle reworded ask', { provider });
    expect(result.engine).toBe('hybrid');
    expect(result.isScopeCheck).toBe(true);
    expect(result.confidence).toBe(95);
  });

  it('falls back to rules when the provider throws', async () => {
    const provider: LLMProvider = {
      analyze: async () => {
        throw new Error('down');
      },
    };
    const result = await analyzeMessage('can we just add a quick form?', { provider });
    expect(result.engine).toBe('rules');
    expect(result.isScopeCheck).toBe(true);
  });
});

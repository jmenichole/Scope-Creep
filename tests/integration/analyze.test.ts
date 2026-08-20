import { describe, expect, it } from 'vitest';
import { analyzeMessage } from '@/lib/domain/detection/hybrid';

describe('analyze pipeline', () => {
  it('flags a scope-check message and yields an alert-worthy result', async () => {
    const result = await analyzeMessage(
      "While you're at it, can we also just add a quick blog? Shouldn't be hard!",
    );
    expect(result.isScopeCheck).toBe(true);
    expect(['SEND_ALERT', 'SEND_RENEGOTIATION_REQUEST', 'PAUSE_AND_RENEGOTIATE']).toContain(
      result.recommendedAction,
    );
  });
});

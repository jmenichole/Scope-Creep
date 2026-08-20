import { describe, expect, it } from 'vitest';
import { computeHealthScore } from '@/lib/domain/healthScore';
import { computeRenegotiation, shouldAutoPause } from '@/lib/domain/renegotiation';

describe('renegotiation flow math', () => {
  it('auto-pause + health drop after 3 changes', () => {
    expect(shouldAutoPause(3)).toBe(true);
    expect(computeRenegotiation(5000, 5900).additionalCost).toBe(900);
    expect(computeHealthScore({ scopeChangeCount: 3, paused: true, lockedPayments: 0 })).toBe(25);
  });
});

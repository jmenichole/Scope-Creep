import { describe, expect, it } from 'vitest';
import { computeHealthScore } from '@/lib/domain/healthScore';
import { computeRenegotiation, shouldAutoPause } from '@/lib/domain/renegotiation';

describe('project math', () => {
  it('computes health score', () => {
    expect(computeHealthScore({ scopeChangeCount: 0, paused: false, lockedPayments: 0 })).toBe(100);
    expect(computeHealthScore({ scopeChangeCount: 2, paused: true, lockedPayments: 1 })).toBe(30);
  });

  it('computes renegotiation cost', () => {
    expect(computeRenegotiation(5000, 5750).additionalCost).toBe(750);
  });

  it('auto-pauses at 3 scope changes', () => {
    expect(shouldAutoPause(2)).toBe(false);
    expect(shouldAutoPause(3)).toBe(true);
  });
});

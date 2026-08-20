export function computeHealthScore(input: {
  scopeChangeCount: number;
  paused: boolean;
  lockedPayments: number;
}): number {
  let score = 100;
  score -= input.scopeChangeCount * 15;
  if (input.paused) score -= 30;
  score -= input.lockedPayments * 10;
  return Math.max(0, Math.min(100, score));
}

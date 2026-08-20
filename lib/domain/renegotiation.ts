export function computeRenegotiation(originalBudget: number, newQuote: number): { additionalCost: number } {
  return { additionalCost: newQuote - originalBudget };
}

export function shouldAutoPause(scopeChangeCount: number): boolean {
  return scopeChangeCount >= 3;
}

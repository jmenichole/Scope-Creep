import { describe, expect, it } from 'vitest';
import { analyzeWithRules, estimateAdditionalWork } from '@/lib/domain/detection/engine';

describe('analyzeWithRules', () => {
  it('flags scope check phrases', () => {
    const result = analyzeWithRules('Hey can we just add a quick contact form? Real quick!');
    expect(result.isScopeCheck).toBe(true);
    expect(result.confidence).toBeGreaterThan(50);
    expect(result.estimatedAdditionalHours).toBeGreaterThan(0);
    expect(result.engine).toBe('rules');
  });

  it('does not flag normal messages', () => {
    const result = analyzeWithRules('The project looks great! Thanks for the update.');
    expect(result.isScopeCheck).toBe(false);
  });

  it('estimates hours from work keywords', () => {
    expect(estimateAdditionalWork('add a new page with forms and mobile responsive design')).toBeGreaterThan(10);
  });

  it('detects passive-aggressive tone', () => {
    const result = analyzeWithRules('I thought this would be included already. Obviously everyone else does it.');
    expect(result.isPassiveAggressive).toBe(true);
  });
});

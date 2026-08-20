import type { Analysis } from '@/lib/domain/types';
import { PASSIVE_AGGRESSIVE_PATTERNS, SCOPE_CHECK_PATTERNS, WORK_KEYWORDS } from './patterns';

export function estimateAdditionalWork(message: string): number {
  const lower = message.toLowerCase();
  let hours = 0;
  for (const [keyword, keywordHours] of Object.entries(WORK_KEYWORDS)) {
    if (lower.includes(keyword)) hours += keywordHours;
  }
  if (hours === 0 && /just|quick|small|minor|tiny/.test(lower)) hours = 3;
  return hours;
}

function confidenceScore(scopeMatches: RegExp[], passiveMatches: RegExp[], message: string): number {
  let score = 0;
  score += scopeMatches.length * 25;
  score += passiveMatches.length * 15;
  if (message.length > 200) score += 10;
  const questionMarks = (message.match(/\?/g) || []).length;
  score += Math.min(questionMarks * 5, 20);
  return Math.min(score, 100);
}

function flagsFor(isScopeCheck: boolean, isPassiveAggressive: boolean, hours: number): string[] {
  const flags: string[] = [];
  if (isScopeCheck) flags.push('✨ SCOPE_AWARENESS');
  if (isPassiveAggressive) flags.push('⚠️ TONE_NOTED');
  if (hours > 10) flags.push('💫 SIGNIFICANT_ADDITIONAL_WORK');
  else if (hours > 5) flags.push('🌿 MODERATE_ADDITIONAL_WORK');
  else if (hours > 0) flags.push('📝 MINOR_ADDITIONAL_WORK');
  return flags;
}

function recommend(isScopeCheck: boolean, hours: number, confidence: number): string {
  if (!isScopeCheck) return 'CONTINUE';
  if (confidence > 75 && hours > 5) return 'PAUSE_AND_RENEGOTIATE';
  if (confidence > 50 && hours > 2) return 'SEND_RENEGOTIATION_REQUEST';
  return 'SEND_ALERT';
}

export function analyzeWithRules(message: string): Analysis {
  const scope = SCOPE_CHECK_PATTERNS.filter((pattern) => pattern.test(message));
  const passive = PASSIVE_AGGRESSIVE_PATTERNS.filter((pattern) => pattern.test(message));
  const isScopeCheck = scope.length > 0;
  const isPassiveAggressive = passive.length > 0;
  const hours = estimateAdditionalWork(message);
  const confidence = confidenceScore(scope, passive, message);
  return {
    isScopeCheck,
    isPassiveAggressive,
    confidence,
    matchedPatterns: scope.map((pattern) => pattern.source),
    estimatedAdditionalHours: hours,
    flags: flagsFor(isScopeCheck, isPassiveAggressive, hours),
    recommendedAction: recommend(isScopeCheck, hours, confidence),
    engine: 'rules',
  };
}

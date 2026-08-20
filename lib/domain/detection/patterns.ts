export const SCOPE_CHECK_PATTERNS: RegExp[] = [
  /can we (also|just|quickly)/i,
  /while you're at it/i,
  /one more (thing|quick thing)/i,
  /just takes? (five|5|ten|10) minutes?/i,
  /real quick/i,
  /shouldn't be (too )?hard/i,
  /easy change/i,
  /small tweak/i,
  /minor adjustment/i,
  /quick fix/i,
  /add(ing)? (a |one )?few/i,
  /could we (also|just)/i,
  /before we launch/i,
  /forgot to mention/i,
  /oh (and|also|by the way)/i,
];

export const PASSIVE_AGGRESSIVE_PATTERNS: RegExp[] = [
  /i thought (this|you) would/i,
  /i assumed/i,
  /obviously/i,
  /surely/i,
  /everyone else does/i,
  /this should have been/i,
  /why (isn't|wasn't) this/i,
];

export const WORK_KEYWORDS: Record<string, number> = {
  page: 4,
  feature: 6,
  integration: 8,
  api: 6,
  redesign: 20,
  animation: 4,
  form: 2,
  button: 0.5,
  color: 0.5,
  mobile: 10,
  responsive: 8,
};

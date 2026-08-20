export type Analysis = {
  isScopeCheck: boolean;
  isPassiveAggressive: boolean;
  confidence: number;
  matchedPatterns: string[];
  estimatedAdditionalHours: number;
  flags: string[];
  recommendedAction: string;
  engine: 'rules' | 'hybrid';
};

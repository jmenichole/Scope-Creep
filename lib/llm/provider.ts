export type LLMResult = {
  isScopeCheck: boolean;
  confidence: number;
  estimatedHours: number;
  formalRewrite: string;
};

export interface LLMProvider {
  analyze(message: string): Promise<LLMResult>;
}

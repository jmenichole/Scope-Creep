import type { LLMProvider, LLMResult } from './provider';

export class OpenAIProvider implements LLMProvider {
  constructor(
    private apiKey: string,
    private model = 'gpt-4o-mini',
  ) {}

  async analyze(message: string): Promise<LLMResult> {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You detect freelance scope creep. Reply ONLY as JSON: {"isScopeCheck":bool,"confidence":0-100,"estimatedHours":number,"formalRewrite":string}.',
          },
          { role: 'user', content: message },
        ],
      }),
    });
    if (!res.ok) throw new Error(`LLM ${res.status}`);
    const json = (await res.json()) as { choices: { message: { content: string } }[] };
    return JSON.parse(json.choices[0].message.content) as LLMResult;
  }
}

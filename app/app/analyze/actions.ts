'use server';

import { revalidatePath } from 'next/cache';
import { analyzeMessage } from '@/lib/domain/detection/hybrid';
import { getProvider } from '@/lib/llm';
import { allowRequest } from '@/lib/rateLimit';
import { createServerSupabase } from '@/lib/supabase/server';
import { analyzeSchema } from '@/lib/validation';

export async function analyzeAndStore(input: unknown) {
  const parsed = analyzeSchema.parse(input);
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (!allowRequest(`analyze:${user.id}`)) {
    throw new Error('Too many analyses. Please wait a minute.');
  }

  const analysis = await analyzeMessage(parsed.message, { provider: getProvider() });

  const { data: msg, error: msgErr } = await supabase
    .from('messages')
    .insert({
      project_id: parsed.projectId,
      user_id: user.id,
      sender: parsed.sender,
      body: parsed.message,
    })
    .select('id')
    .single();
  if (msgErr) throw new Error(msgErr.message);

  const { error: anaErr } = await supabase.from('analyses').insert({
    message_id: msg.id,
    project_id: parsed.projectId,
    user_id: user.id,
    is_scope_check: analysis.isScopeCheck,
    is_passive_aggressive: analysis.isPassiveAggressive,
    confidence: analysis.confidence,
    matched_patterns: analysis.matchedPatterns,
    estimated_additional_hours: analysis.estimatedAdditionalHours,
    flags: analysis.flags,
    recommended_action: analysis.recommendedAction,
    engine: analysis.engine,
  });
  if (anaErr) throw new Error(anaErr.message);

  let alertCreated = false;
  if (analysis.isScopeCheck) {
    const { error: alertErr } = await supabase.from('alerts').insert({
      project_id: parsed.projectId,
      user_id: user.id,
      type: 'scope_awareness',
      severity: analysis.estimatedAdditionalHours > 10 ? 'needs-attention' : 'awareness',
      title: 'Scope Check Detected',
      message: `Confidence ${analysis.confidence}%, +${analysis.estimatedAdditionalHours}h`,
    });
    if (alertErr) throw new Error(alertErr.message);
    alertCreated = true;
  }
  revalidatePath('/app/alerts');
  return { ...analysis, alertCreated };
}

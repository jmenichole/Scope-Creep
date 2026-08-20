'use server';

import { revalidatePath } from 'next/cache';
import { computeHealthScore } from '@/lib/domain/healthScore';
import { computeRenegotiation, shouldAutoPause } from '@/lib/domain/renegotiation';
import { createServerSupabase } from '@/lib/supabase/server';

async function userClient() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return { supabase, userId: user.id };
}

export async function createRenegotiation(projectId: string, additionalWork: string, newQuote: number) {
  const { supabase, userId } = await userClient();
  const { data: project } = await supabase.from('projects').select('*').eq('id', projectId).single();
  if (!project) throw new Error('Project not found');
  const { additionalCost } = computeRenegotiation(Number(project.budget), newQuote);
  const { error } = await supabase.from('renegotiations').insert({
    project_id: projectId,
    user_id: userId,
    additional_work: additionalWork,
    original_budget: project.budget,
    new_quote: newQuote,
    additional_cost: additionalCost,
  });
  if (error) throw new Error(error.message);
  const scopeChangeCount = project.scope_change_count + 1;
  const paused = shouldAutoPause(scopeChangeCount) || project.status === 'paused';
  await supabase
    .from('projects')
    .update({
      scope_change_count: scopeChangeCount,
      status: paused ? 'paused' : project.status,
      pause_reason: paused && project.status !== 'paused' ? 'Multiple scope adjustments' : project.pause_reason,
      health_score: computeHealthScore({ scopeChangeCount, paused, lockedPayments: 0 }),
    })
    .eq('id', projectId);
  await supabase.from('alerts').insert({
    project_id: projectId,
    user_id: userId,
    type: 'renegotiation_request',
    severity: 'gentle-reminder',
    title: 'Terms Update Suggested',
    message: additionalWork,
  });
  revalidatePath('/app/projects');
}

export async function pauseProject(projectId: string, reason: string) {
  const { supabase, userId } = await userClient();
  const { data: project } = await supabase
    .from('projects')
    .select('scope_change_count')
    .eq('id', projectId)
    .single();
  await supabase
    .from('projects')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      pause_reason: reason,
      health_score: computeHealthScore({
        scopeChangeCount: project?.scope_change_count ?? 0,
        paused: true,
        lockedPayments: 0,
      }),
    })
    .eq('id', projectId);
  await supabase.from('milestones').update({ payment_locked: true }).eq('project_id', projectId);
  await supabase.from('alerts').insert({
    project_id: projectId,
    user_id: userId,
    type: 'project_paused',
    severity: 'needs-attention',
    title: 'Project Paused',
    message: reason,
  });
  revalidatePath('/app/projects');
}

export async function resumeProject(projectId: string) {
  const { supabase } = await userClient();
  const { data: project } = await supabase
    .from('projects')
    .select('scope_change_count')
    .eq('id', projectId)
    .single();
  await supabase
    .from('projects')
    .update({
      status: 'active',
      resumed_at: new Date().toISOString(),
      health_score: computeHealthScore({
        scopeChangeCount: project?.scope_change_count ?? 0,
        paused: false,
        lockedPayments: 0,
      }),
    })
    .eq('id', projectId);
  await supabase.from('milestones').update({ payment_locked: false }).eq('project_id', projectId);
  revalidatePath('/app/projects');
}

export async function approveRenegotiation(renegotiationId: string) {
  const { supabase } = await userClient();
  const { data: renegotiation } = await supabase
    .from('renegotiations')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', renegotiationId)
    .select('*')
    .single();
  if (renegotiation) {
    await supabase.from('projects').update({ budget: renegotiation.new_quote }).eq('id', renegotiation.project_id);
  }
  revalidatePath('/app/projects');
}

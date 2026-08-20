'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';
import { projectSchema } from '@/lib/validation';

export async function createProject(input: unknown) {
  const parsed = projectSchema.parse(input);
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      client_name: parsed.clientName,
      freelancer_name: parsed.freelancerName,
      scope: parsed.scope,
      budget: parsed.budget,
    })
    .select('id')
    .single();
  if (error) throw new Error(error.message);
  revalidatePath('/app/projects');
  return { id: data.id as string };
}

export async function listProjects() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

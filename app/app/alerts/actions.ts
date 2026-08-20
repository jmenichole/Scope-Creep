'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabase } from '@/lib/supabase/server';

export async function listAlerts(unreadOnly = false) {
  const supabase = await createServerSupabase();
  let query = supabase.from('alerts').select('*').order('created_at', { ascending: false });
  if (unreadOnly) query = query.eq('read', false);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markAlertRead(alertId: string) {
  const supabase = await createServerSupabase();
  await supabase
    .from('alerts')
    .update({ read: true, read_at: new Date().toISOString() })
    .eq('id', alertId);
  revalidatePath('/app/alerts');
}

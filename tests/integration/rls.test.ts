import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const configured = Boolean(url && service && anon);

describe.skipIf(!configured)('RLS isolation', () => {
  it('prevents user B from reading user A project', async () => {
    const admin = createClient(url!, service!, { auth: { autoRefreshToken: false, persistSession: false } });
    const a = await admin.auth.admin.createUser({
      email: `a_${Date.now()}@t.dev`,
      password: 'Passw0rd!',
      email_confirm: true,
    });
    const userA = a.data.user!.id;
    const { data: project, error } = await admin
      .from('projects')
      .insert({ user_id: userA, client_name: 'acme', freelancer_name: 'me', scope: 's', budget: 1000 })
      .select()
      .single();
    expect(error).toBeNull();

    const b = await admin.auth.admin.createUser({
      email: `bq_${Date.now()}@t.dev`,
      password: 'Passw0rd!',
      email_confirm: true,
    });
    const bClient = createClient(url!, anon!);
    await bClient.auth.signInWithPassword({ email: b.data.user!.email!, password: 'Passw0rd!' });
    const { data: rows } = await bClient.from('projects').select('*').eq('id', project!.id);
    expect(rows).toEqual([]);
  });
});

describe.skipIf(!configured)('projects data', () => {
  it('inserts and lists a project for the owner', async () => {
    const admin = createClient(url!, service!, { auth: { persistSession: false } });
    const { data: created } = await admin.auth.admin.createUser({
      email: `p_${Date.now()}@t.dev`,
      password: 'Passw0rd!',
      email_confirm: true,
    });
    const userId = created.user!.id;
    await admin.from('projects').insert({
      user_id: userId,
      client_name: 'acme',
      freelancer_name: 'me',
      scope: 'site',
      budget: 6000,
    });
    const { data } = await admin.from('projects').select('*').eq('user_id', userId);
    expect(data!.length).toBe(1);
    expect(data![0].health_score).toBe(100);
  });
});

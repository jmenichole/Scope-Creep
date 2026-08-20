'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';

export async function signInWithEmail(formData: FormData) {
  const email = String(formData.get('email') || '');
  const supabase = await createServerSupabase();
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000';
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  return { error: error?.message ?? null, sent: !error };
}

export async function signInWithGoogle() {
  const supabase = await createServerSupabase();
  const origin = (await headers()).get('origin') ?? 'http://localhost:3000';
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) throw new Error(error?.message ?? 'Google sign-in unavailable');
  redirect(data.url);
}

export async function signOut() {
  const supabase = await createServerSupabase();
  await supabase.auth.signOut();
  redirect('/login');
}

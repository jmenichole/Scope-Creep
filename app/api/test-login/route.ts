import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

/**
 * Dev-only helper so Playwright can sign in without magic-link email.
 * Disabled in production unless ALLOW_TEST_LOGIN=true.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_TEST_LOGIN !== 'true') {
    return NextResponse.json({ error: 'disabled' }, { status: 403 });
  }
  const { email, password } = (await request.json()) as { email?: string; password?: string };
  if (!email || !password) return NextResponse.json({ error: 'missing credentials' }, { status: 400 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list: { name: string; value: string; options?: object }[]) => {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Fall back: create via service role then sign in
    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await admin.auth.admin.createUser({ email, password, email_confirm: true });
    const retry = await supabase.auth.signInWithPassword({ email, password });
    if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

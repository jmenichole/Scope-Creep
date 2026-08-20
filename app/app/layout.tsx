import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerSupabase } from '@/lib/supabase/server';
import { signOut } from '@/app/(auth)/login/actions';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <strong>Scope Check</strong>
        <ul>
          <li><Link href="/app/projects">Projects</Link></li>
          <li><Link href="/app/analyze">Analyze Message</Link></li>
          <li><Link href="/app/alerts">Alerts</Link></li>
        </ul>
        <form action={signOut}><button type="submit" className="secondary">Sign out</button></form>
      </nav>
      <div className="content">{children}</div>
    </div>
  );
}

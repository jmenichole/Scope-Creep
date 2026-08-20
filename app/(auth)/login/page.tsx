'use client';

import { useState } from 'react';
import { signInWithEmail, signInWithGoogle } from './actions';

export default function LoginPage() {
  const [message, setMessage] = useState<string | null>(null);

  async function onEmail(formData: FormData) {
    const result = await signInWithEmail(formData);
    setMessage(result.error ?? 'Check your email for a magic link.');
  }

  return (
    <main className="card">
      <h1>Sign in to Scope Check</h1>
      <p className="muted">Magic link or Google. No password in the product UI.</p>
      <form action={onEmail} className="stack">
        <input name="email" type="email" placeholder="you@example.com" required />
        <button type="submit">Send magic link</button>
      </form>
      <form action={signInWithGoogle}>
        <button type="submit" className="secondary">Continue with Google</button>
      </form>
      {message ? <p>{message}</p> : null}
    </main>
  );
}

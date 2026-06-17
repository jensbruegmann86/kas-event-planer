'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createSupabaseBrowserClient();

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: mail,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Anmelden</h1>
        <p className="mt-1 text-sm text-slate-600">Volunteer Planer Dashboard</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="mail" className="text-sm font-medium text-slate-700">
            E-Mail
          </label>
          <input
            id="mail"
            type="email"
            autoComplete="email"
            required
            value={mail}
            onChange={(e) => setMail(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="password" className="text-sm font-medium text-slate-700">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-emerald-700 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-50"
        >
          {loading ? 'Anmelden...' : 'Anmelden'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Noch kein Konto?{' '}
        <Link href="/auth/register" className="font-medium text-emerald-700 hover:underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}

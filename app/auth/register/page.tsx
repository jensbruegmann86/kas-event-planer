'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '../../../lib/supabase/browser';

export default function RegisterPage() {
  const router = useRouter();
  const [vorname, setVorname] = useState('');
  const [name, setName] = useState('');
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError('Passwort muss mindestens 8 Zeichen haben.');
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    const { data, error: authError } = await supabase.auth.signUp({
      email: mail,
      password,
      options: {
        data: { vorname, name },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      await supabase.from('users').upsert({
        id: data.user.id,
        vorname: vorname.trim(),
        name: name.trim(),
        mail: mail.trim(),
        rolle: 'Volunteer',
      });
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Registrieren</h1>
        <p className="mt-1 text-sm text-slate-600">Neuen Account anlegen</p>
      </div>

      <form onSubmit={onSubmit} className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <label htmlFor="vorname" className="text-sm font-medium text-slate-700">
              Vorname
            </label>
            <input
              id="vorname"
              type="text"
              required
              value={vorname}
              onChange={(e) => setVorname(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Nachname
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>
        </div>

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
            Passwort <span className="text-slate-400">(min. 8 Zeichen)</span>
          </label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
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
          {loading ? 'Registrieren...' : 'Account anlegen'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-600">
        Bereits ein Konto?{' '}
        <Link href="/auth/login" className="font-medium text-emerald-700 hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}

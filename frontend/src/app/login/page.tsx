'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Lock } from 'lucide-react';
import { FormEvent, useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid username or password');
      }

      const data = await response.json();
      localStorage.setItem('iocl-auth', JSON.stringify(data.user));
      document.cookie = `iocl-auth=${encodeURIComponent(JSON.stringify(data.user))}; path=/; max-age=86400; SameSite=Lax`;
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <section className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
        <Image src="/iocl-logo.svg" alt="IOCL Safety Vision" width={180} height={90} className="mb-5 h-16 w-auto" priority />
        <h1 className="text-2xl font-black text-[#003c71]">IOCL Safety Vision</h1>
        <p className="text-xs text-[#f58220] font-bold uppercase tracking-widest mt-2">Protected safety monitoring</p>
        <p className="text-sm text-slate-600 mt-7 mb-6">Sign in with the local admin account to access the live monitoring dashboard.</p>

        <form onSubmit={login} className="space-y-3 text-left">
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#f58220]" />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-slate-600">Password</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-[#f58220]" />
          </label>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#003c71] hover:bg-[#002b52] text-white font-bold text-sm rounded-xl disabled:opacity-60 cursor-pointer">
            <Lock size={17} /> {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}

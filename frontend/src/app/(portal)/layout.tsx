'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PortalProvider } from './PortalContext';
import Header from '@/components/Header';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  useEffect(() => {
    if (demoMode) {
      setIsAuthorized(true);
      return;
    }

    queueMicrotask(() => {
      const rawUser = localStorage.getItem('iocl-auth');

      if (!rawUser) {
        setIsAuthorized(false);
        return;
      }

      try {
        const user = JSON.parse(rawUser);

        if (user?.username === 'admin' && user?.role === 'admin') {
          setIsAuthorized(true);
          return;
        }
      } catch {
        localStorage.removeItem('iocl-auth');
      }

      setIsAuthorized(false);
    });
  }, [demoMode]);

  useEffect(() => {
    if (!demoMode && isAuthorized === false) {
      router.replace('/login');
    }
  }, [demoMode, isAuthorized, router]);

  if (isAuthorized !== true) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-sm font-semibold text-slate-600">
        Checking access...
      </div>
    );
  }

  return (
    <PortalProvider>
      <div className="flex flex-col h-screen bg-slate-50 text-slate-900">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </PortalProvider>
  );
}

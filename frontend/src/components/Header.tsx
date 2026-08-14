'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, BarChart3, Users, PlaySquare, Clock, LogOut } from 'lucide-react';
import { usePortal } from '../app/(portal)/PortalContext';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logs } = usePortal();
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const activeAlertsCount = logs.filter(log => log.status === 'Active').length;

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/members', label: 'Safety Team', icon: Users },
    { href: '/recordings', label: 'Recordings', icon: PlaySquare }
  ];

  return (
    <header className="flex flex-col md:flex-row md:items-center justify-between px-6 py-4 bg-white border-b border-slate-200 text-slate-900 gap-4 shadow-sm">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <Image src="/iocl-logo.svg" alt="IOCL Safety Vision" width={160} height={80} className="h-12 w-auto" priority />
        <div>
          <h1 className="text-lg font-black tracking-tight text-[#003c71]">
            IOCL Safety Vision
          </h1>
          <p className="text-[10px] text-[#f58220] font-bold uppercase tracking-widest leading-none">
            Real-time Threat Detection
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-xl">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                isActive
                  ? 'bg-[#003c71] text-white shadow-md shadow-slate-300'
                  : 'text-slate-600 hover:text-[#003c71] hover:bg-white'
              }`}
            >
              <Icon size={14} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Clock & Status */}
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600">
          <Clock size={14} className="text-slate-500" />
          <span className="font-mono w-[80px]">{time}</span>
        </div>

        {activeAlertsCount > 0 ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs font-bold text-rose-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>{activeAlertsCount} ACTIVE {activeAlertsCount === 1 ? 'ALERT' : 'ALERTS'}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ALL SYSTEMS OK</span>
          </div>
        )}
        <button
          onClick={() => {
            localStorage.removeItem('iocl-auth');
            router.push('/login');
          }}
          title="Sign out"
          className="p-2 text-slate-500 hover:text-[#003c71] cursor-pointer"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

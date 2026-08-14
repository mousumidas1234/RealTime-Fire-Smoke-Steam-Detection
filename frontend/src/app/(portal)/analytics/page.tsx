'use client';

import React, { useMemo } from 'react';
import { usePortal } from '../PortalContext';
import {
  BarChart3,
  Flame,
  Wind,
  Droplets,
  TrendingUp,
  Activity,
  Clock,
  Target,
} from 'lucide-react';

export default function AnalyticsPage() {
  const { logs } = usePortal();

  const stats = useMemo(() => {
    const fireCount = logs.filter((l) => l.type === 'fire').length;
    const smokeCount = logs.filter((l) => l.type === 'smoke').length;
    const steamCount = logs.filter((l) => l.type === 'steam').length;
    const total = logs.length;
    const activeCount = logs.filter((l) => l.status === 'Active').length;
    const resolvedCount = logs.filter((l) => l.status === 'Resolved').length;

    const avgConfidence =
      total > 0
        ? logs.reduce((sum, l) => sum + l.confidence, 0) / total
        : 0;

    return { fireCount, smokeCount, steamCount, total, activeCount, resolvedCount, avgConfidence };
  }, [logs]);

  const maxTypeCount = Math.max(stats.fireCount, stats.smokeCount, stats.steamCount, 1);

  const recentLogs = logs.slice(0, 20);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#003c71] flex items-center gap-2">
          <BarChart3 size={24} className="text-[#f58220]" />
          Detection Analytics
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-medium">
          Real-time safety event analysis and trend monitoring
        </p>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-orange-200 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#003c71] rounded-l-2xl" />
          <Activity size={20} className="text-[#f58220] mb-2" />
          <p className="text-3xl font-black text-[#003c71] font-mono">{stats.total}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Total Events</p>
        </div>

        {/* Fire */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-rose-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-rose-500 to-rose-600 rounded-l-2xl" />
          <Flame size={20} className="text-rose-400 mb-2" />
          <p className="text-3xl font-black text-[#003c71] font-mono">{stats.fireCount}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Fire Detections</p>
        </div>

        {/* Smoke */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-amber-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#f58220] to-orange-500 rounded-l-2xl" />
          <Wind size={20} className="text-amber-400 mb-2" />
          <p className="text-3xl font-black text-[#003c71] font-mono">{stats.smokeCount}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Smoke Detections</p>
        </div>

        {/* Steam */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden group hover:border-cyan-500/30 transition-colors">
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-cyan-600 rounded-l-2xl" />
          <Droplets size={20} className="text-cyan-400 mb-2" />
          <p className="text-3xl font-black text-[#003c71] font-mono">{stats.steamCount}</p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Steam Leak Detections</p>
        </div>
      </div>

      {/* Middle Row: Distribution + Confidence */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Event Distribution Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-bold text-[#003c71] uppercase tracking-wider mb-5 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#f58220]" />
            Event Distribution
          </h3>

          {stats.total === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <BarChart3 size={40} className="mb-3 text-slate-700" />
              <p className="text-sm font-semibold">No events recorded yet</p>
              <p className="text-xs mt-1">Start monitoring to see detection statistics</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Fire Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-rose-400">
                    <Flame size={12} /> Fire
                  </span>
                  <span className="font-mono text-slate-600">
                    {stats.fireCount} ({stats.total > 0 ? ((stats.fireCount / stats.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-rose-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(stats.fireCount / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Smoke Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-amber-400">
                    <Wind size={12} /> Smoke
                  </span>
                  <span className="font-mono text-slate-600">
                    {stats.smokeCount} ({stats.total > 0 ? ((stats.smokeCount / stats.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#f58220] to-orange-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(stats.smokeCount / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* Steam Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-cyan-400">
                    <Droplets size={12} /> Steam Leak
                  </span>
                  <span className="font-mono text-slate-600">
                    {stats.steamCount} ({stats.total > 0 ? ((stats.steamCount / stats.total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${(stats.steamCount / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Average Confidence Ring */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center">
          <h3 className="text-sm font-bold text-[#003c71] uppercase tracking-wider mb-5 flex items-center gap-2">
            <Target size={16} className="text-[#f58220]" />
            Avg Confidence
          </h3>

          {/* CSS Ring */}
          <div className="relative w-32 h-32">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle cx="60" cy="60" r="50" fill="none" stroke="#e2e8f0" strokeWidth="10" />
              {/* Progress ring */}
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="none"
                stroke="url(#confGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${stats.avgConfidence * 314} 314`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="confGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#003c71" />
                  <stop offset="100%" stopColor="#f58220" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-[#003c71] font-mono">
                {(stats.avgConfidence * 100).toFixed(0)}%
              </span>
              <span className="text-[10px] text-slate-500 font-semibold">CONFIDENCE</span>
            </div>
          </div>

          {/* Resolution stats */}
          <div className="flex gap-4 mt-5 text-xs">
            <div className="text-center">
              <p className="text-lg font-black text-emerald-700 font-mono">{stats.resolvedCount}</p>
              <p className="text-slate-500 font-semibold">Resolved</p>
            </div>
            <div className="w-px bg-slate-100" />
            <div className="text-center">
              <p className="text-lg font-black text-rose-400 font-mono">{stats.activeCount}</p>
              <p className="text-slate-500 font-semibold">Active</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200">
          <h3 className="text-sm font-bold text-[#003c71] uppercase tracking-wider flex items-center gap-2">
            <Clock size={16} className="text-[#f58220]" />
            Event Log
          </h3>
        </div>

        {recentLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Activity size={32} className="mb-2 text-slate-700" />
            <p className="text-sm font-semibold">No events to display</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-slate-500 uppercase tracking-wider border-b border-slate-200">
                  <th className="px-5 py-3 font-semibold">Time</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Confidence</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log, idx) => {
                  const timeStr = new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  const typeStyles: Record<string, string> = {
                    fire: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
                    smoke: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
                    steam: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
                  };

                  return (
                    <tr
                      key={log.id}
                      className={`border-b border-slate-200 hover:bg-slate-50 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-white'
                      }`}
                    >
                      <td className="px-5 py-3 font-mono text-slate-700">{timeStr}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
                            typeStyles[log.type] || ''
                          }`}
                        >
                          {log.type === 'steam' ? 'Steam Leak' : log.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-slate-700">
                        {(log.confidence * 100).toFixed(0)}%
                      </td>
                      <td className="px-5 py-3">
                        {log.status === 'Active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-full text-[10px] font-bold uppercase">
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-full text-[10px] font-bold uppercase">
                            Resolved
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

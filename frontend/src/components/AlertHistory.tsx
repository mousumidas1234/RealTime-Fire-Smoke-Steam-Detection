'use client';

import React, { useState } from 'react';
import { usePortal } from '../app/(portal)/PortalContext';
import { ShieldAlert, Volume2, VolumeX, CheckCircle, Trash2, Clock, Check } from 'lucide-react';

export default function AlertHistory() {
  const { logs, isMuted, setIsMuted, armAlarm, resolveLog, clearLogs } = usePortal();
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveNotes, setResolveNotes] = useState<string>('');

  const handleResolveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolvingId) {
      resolveLog(resolvingId, resolveNotes || 'Verified and resolved.');
      setResolvingId(null);
      setResolveNotes('');
    }
  };

  const getAlertStyles = (type: string) => {
    switch (type) {
      case 'fire':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          badge: 'bg-rose-100 text-rose-700 border-rose-200',
          dot: 'bg-rose-500'
        };
      case 'smoke':
        return {
          bg: 'bg-orange-50 border-orange-200 text-orange-700',
          badge: 'bg-orange-100 text-orange-700 border-orange-200',
          dot: 'bg-amber-500'
        };
      case 'steam':
        return {
          bg: 'bg-sky-50 border-sky-200 text-sky-700',
          badge: 'bg-sky-100 text-sky-700 border-sky-200',
          dot: 'bg-cyan-500'
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          badge: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-500'
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header controls */}
      <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="text-[#f58220]" size={20} />
          <h3 className="font-bold text-[#003c71]">Live Incident Monitor</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Mute toggle button */}
          <button
            onClick={() => {
              if (isMuted) void armAlarm();
              setIsMuted(!isMuted);
            }}
            title={isMuted ? "Unmute alarm sound" : "Mute alarm sound"}
            className={`p-2 rounded-lg border transition-all cursor-pointer ${
              isMuted
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                : 'bg-white border-slate-200 text-[#003c71] hover:bg-slate-100'
            }`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          
          {/* Clear logs button */}
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-[#003c71] transition-all cursor-pointer"
              title="Clear all logs"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Log list container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <CheckCircle className="text-slate-300 mb-3" size={32} />
            <p className="text-sm font-semibold text-slate-700">All Systems Normal</p>
            <p className="text-xs text-slate-500 mt-1">No active detections on camera</p>
          </div>
        ) : (
          logs.map((log) => {
            const styles = getAlertStyles(log.type);
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            return (
              <div
                key={log.id}
                className={`p-3.5 border rounded-xl flex flex-col gap-2.5 transition-all duration-300 ${styles.bg} ${
                  log.status === 'Active' ? 'shadow-md animate-pulse-slow' : 'opacity-60'
                }`}
              >
                {/* Alert Title / Meta Info */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${styles.dot} ${log.status === 'Active' ? 'animate-ping' : ''}`} />
                    <span className="text-sm font-bold uppercase tracking-wider">
                      {log.type === 'steam' ? 'steam leak' : log.type}
                    </span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold uppercase ${styles.badge}`}>
                    {log.status}
                  </span>
                </div>

                {/* Details line */}
                <div className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{timeStr}</span>
                  </div>
                  <span>Confidence: {(log.confidence * 100).toFixed(0)}%</span>
                </div>

                {/* Notes if resolved */}
                {log.notes && (
                  <div className="text-xs border-t border-slate-200 pt-2 text-slate-600 italic">
                    Note: {log.notes}
                  </div>
                )}

                {/* Action Button: Resolve Alert */}
                {log.status === 'Active' && resolvingId !== log.id && (
                  <button
                    onClick={() => setResolvingId(log.id)}
                    className="w-full mt-1.5 py-1.5 px-3 flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-xs font-semibold text-[#003c71] border border-slate-200 rounded-lg transition-all cursor-pointer"
                  >
                    <Check size={14} />
                    Resolve Alert
                  </button>
                )}

                {/* Resolution note form inline */}
                {resolvingId === log.id && (
                  <form onSubmit={handleResolveSubmit} className="mt-2 border-t border-slate-200 pt-2.5">
                    <input
                      type="text"
                      placeholder="Add resolution notes (e.g. Valve shut)"
                      value={resolveNotes}
                      onChange={(e) => setResolveNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#f58220]"
                      required
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        type="submit"
                        className="flex-1 py-1.5 bg-[#003c71] hover:bg-[#002b52] text-white font-semibold text-xs rounded-md shadow-sm transition-all cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setResolvingId(null)}
                        className="px-2.5 py-1.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 font-semibold text-xs rounded-md transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

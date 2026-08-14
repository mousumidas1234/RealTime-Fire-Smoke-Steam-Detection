'use client';

import React from 'react';
import { usePortal } from '../PortalContext';
import WebcamStream from '@/components/WebcamStream';
import AlertHistory from '@/components/AlertHistory';
import {
  Camera,
  CameraOff,
  Flame,
  Wind,
  Droplets,
  Activity,
  Timer,
  ShieldAlert,
  Volume2,
  VolumeX,
  Gauge,
  Zap,
  RotateCcw,
  Siren,
} from 'lucide-react';

export default function DashboardPage() {
  const {
    isStreaming,
    setIsStreaming,
    detections,
    isMuted,
    setIsMuted,
    isAlarmReady,
    armAlarm,
    fireSens,
    setFireSens,
    smokeSens,
    setSmokeSens,
    steamSens,
    setSteamSens,
    fps,
    latency,
    logs,
    clearLogs,
  } = usePortal();

  const activeAlerts = logs.filter((l) => l.status === 'Active').length;
  const applyPreset = (preset: 'balanced' | 'sensitive' | 'strict') => {
    const presets = {
      balanced: { fire: 65, smoke: 70, steam: 70 },
      sensitive: { fire: 80, smoke: 88, steam: 88 },
      strict: { fire: 45, smoke: 55, steam: 55 },
    };
    const next = presets[preset];
    setFireSens(next.fire);
    setSmokeSens(next.smoke);
    setSteamSens(next.steam);
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h2 className="text-2xl font-black tracking-tight text-[#003c71]">
          Live Monitoring Dashboard
        </h2>
        <p className="text-xs text-slate-600 mt-1 font-medium">
          Real-time fire, smoke &amp; steam leak detection powered by computer vision
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN — 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Webcam Feed */}
          <WebcamStream />

          {/* Control Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-[#003c71] uppercase tracking-wider flex items-center gap-2">
                <Gauge size={16} className="text-[#f58220]" />
                Control Panel
              </h3>
              <div className="flex items-center gap-2">
                {/* Mute Toggle */}
                <button
                  onClick={() => {
                    if (isMuted) void armAlarm();
                    setIsMuted(!isMuted);
                  }}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isMuted
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-slate-50 border-slate-200 text-[#003c71] hover:bg-slate-100'
                  }`}
                  title={isMuted ? 'Unmute alarm' : 'Mute alarm'}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>

                {/* Start/Stop Stream */}
                <button
                  onClick={() => {
                    if (!isStreaming) void armAlarm();
                    setIsStreaming(!isStreaming);
                  }}
                  className={`flex items-center gap-2 px-5 py-2.5 font-bold text-sm rounded-xl shadow-lg transition-all active:scale-95 cursor-pointer ${
                    isStreaming
                      ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20'
                      : 'bg-[#003c71] hover:bg-[#002b52] text-white shadow-slate-300'
                  }`}
                >
                  {isStreaming ? <CameraOff size={18} /> : <Camera size={18} />}
                  {isStreaming ? 'Stop Monitoring' : 'Start Monitoring'}
                </button>
              </div>
            </div>

            <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-4">
              <button onClick={() => applyPreset('balanced')} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-[#003c71] hover:bg-white cursor-pointer">
                Balanced preset
              </button>
              <button onClick={() => applyPreset('sensitive')} className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-[#a44900] hover:bg-orange-100 cursor-pointer">
                Smoke/steam boost
              </button>
              <button onClick={() => applyPreset('strict')} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                Reduce false alarms
              </button>
              <button onClick={() => { applyPreset('balanced'); clearLogs(); }} className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer">
                <RotateCcw size={14} />
                Reset panel
              </button>
            </div>

            <div className="mb-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                <Siren size={16} className={isAlarmReady && !isMuted ? 'text-emerald-600' : 'text-[#f58220]'} />
                Alarm audio is {isMuted ? 'muted' : isAlarmReady ? 'armed' : 'waiting for Start Monitoring'}
              </div>
              {!isAlarmReady && !isMuted && (
                <button onClick={() => void armAlarm()} className="rounded-lg bg-[#f58220] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#d96f18] cursor-pointer">
                  Arm alarm
                </button>
              )}
            </div>

            {/* Sensitivity Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {/* Fire Sensitivity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                    <Flame size={14} />
                    Fire Sensitivity
                  </label>
                  <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {fireSens}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={fireSens}
                  onChange={(e) => setFireSens(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200"
                  style={{ accentColor: '#f43f5e' }}
                />
              </div>

              {/* Smoke Sensitivity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-400">
                    <Wind size={14} />
                    Smoke Sensitivity
                  </label>
                  <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {smokeSens}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={smokeSens}
                  onChange={(e) => setSmokeSens(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200"
                  style={{ accentColor: '#f59e0b' }}
                />
              </div>

              {/* Steam Sensitivity */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-cyan-400">
                    <Droplets size={14} />
                    Steam Sensitivity
                  </label>
                  <span className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                    {steamSens}%
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={100}
                  value={steamSens}
                  onChange={(e) => setSteamSens(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-slate-200"
                  style={{ accentColor: '#06b6d4' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — 1/3 */}
        <div className="flex flex-col gap-6">
          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            {/* FPS */}
            <div className="bg-white backdrop-blur-sm border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <Activity size={18} className="mx-auto text-emerald-400 mb-1" />
              <p className="text-xl font-black text-[#003c71] font-mono">{fps}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                FPS
              </p>
            </div>

            {/* Latency */}
            <div className="bg-white backdrop-blur-sm border border-slate-200 rounded-xl p-3 text-center shadow-sm">
              <Timer size={18} className="mx-auto text-[#f58220] mb-1" />
              <p className="text-xl font-black text-[#003c71] font-mono">{latency}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                ms
              </p>
            </div>

            {/* Active Detections */}
            <div
              className={`backdrop-blur-sm border rounded-xl p-3 text-center transition-colors ${
                detections.length > 0
                  ? 'bg-rose-500/10 border-rose-500/20'
                  : 'bg-white border-slate-200'
              }`}
            >
              <ShieldAlert
                size={18}
                className={`mx-auto mb-1 ${
                  detections.length > 0 ? 'text-rose-500 animate-pulse' : 'text-slate-500'
                }`}
              />
              <p className="text-xl font-black text-[#003c71] font-mono">{detections.length}</p>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Threats
              </p>
            </div>
          </div>

          {/* Active Alerts Summary */}
          {activeAlerts > 0 && (
            <div className="flex items-center gap-3 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-pulse">
              <Zap size={18} className="text-rose-400" />
              <p className="text-xs font-bold text-rose-300">
                {activeAlerts} unresolved {activeAlerts === 1 ? 'incident' : 'incidents'} require
                attention
              </p>
            </div>
          )}

          {/* Alert History — fills remaining space */}
          <div className="flex-1 min-h-0">
            <AlertHistory />
          </div>
        </div>
      </div>
    </div>
  );
}

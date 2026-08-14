'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

export interface Detection {
  type: 'fire' | 'smoke' | 'steam';
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h]
}

export interface AlertLog {
  id: string;
  timestamp: string;
  type: 'fire' | 'smoke' | 'steam';
  confidence: number;
  status: 'Active' | 'Resolved';
  resolvedAt?: string;
  notes?: string;
}

interface PortalContextType {
  isStreaming: boolean;
  setIsStreaming: (streaming: boolean) => void;
  detections: Detection[];
  setDetections: (detections: Detection[]) => void;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  isAlarmReady: boolean;
  armAlarm: () => Promise<void>;
  fireSens: number;
  setFireSens: (val: number) => void;
  smokeSens: number;
  setSmokeSens: (val: number) => void;
  steamSens: number;
  setSteamSens: (val: number) => void;
  fps: number;
  setFps: (val: number) => void;
  latency: number;
  setLatency: (val: number) => void;
  logs: AlertLog[];
  addLog: (type: 'fire' | 'smoke' | 'steam', confidence: number) => void;
  resolveLog: (id: string, notes?: string) => void;
  clearLogs: () => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const PortalProvider = ({ children }: { children: ReactNode }) => {
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isAlarmReady, setIsAlarmReady] = useState<boolean>(false);
  const [fireSens, setFireSens] = useState<number>(50);
  const [smokeSens, setSmokeSens] = useState<number>(50);
  const [steamSens, setSteamSens] = useState<number>(50);
  const [fps, setFps] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [logs, setLogs] = useState<AlertLog[]>([]);
  const audioContextRef = React.useRef<AudioContext | null>(null);
  const lastAlarmAtRef = React.useRef<number>(0);

  const armAlarm = useCallback(async () => {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContextClass();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsAlarmReady(audioContextRef.current.state === 'running');
  }, []);

  // Sound generator function for alerts (in-browser Synthesizer)
  useEffect(() => {
    if (detections.length === 0 || isMuted) return;
    const now = Date.now();
    if (now - lastAlarmAtRef.current < 850) return;

    const audioCtx = audioContextRef.current;
    if (!audioCtx || audioCtx.state !== 'running') return;

    // Play different frequency sound depending on highest threat detection
    let frequency = 400; // default steam
    let type: 'sine' | 'sawtooth' | 'triangle' | 'square' = 'triangle';
    
    const activeTypes = detections.map(d => d.type);
    if (activeTypes.includes('fire')) {
      frequency = 900; // Fire is high pitch
      type = 'sawtooth';
    } else if (activeTypes.includes('smoke')) {
      frequency = 600; // Smoke is medium pitch
      type = 'square';
    } else if (activeTypes.includes('steam')) {
      frequency = 400; // Steam is lower alarm tone
      type = 'sine';
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    // Fade alert slightly
    gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + 0.45);
    lastAlarmAtRef.current = now;
  }, [detections, isMuted]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  const addLog = useCallback((type: 'fire' | 'smoke' | 'steam', confidence: number) => {
    const newLog: AlertLog = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      type,
      confidence,
      status: 'Active',
    };
    setLogs(prev => {
      const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
      const duplicate = prev.some(
        log => log.type === type && log.status === 'Active' && log.timestamp > fiveSecondsAgo
      );
      return duplicate ? prev : [newLog, ...prev];
    });
  }, []);

  // Log active detections. The duplicate check is inside the state updater so
  // rapid WebSocket updates cannot race with a stale `logs` closure.
  useEffect(() => {
    detections.forEach(det => addLog(det.type, det.confidence));
  }, [detections, addLog]);

  const resolveLog = (id: string, notes?: string) => {
    setLogs(prev =>
      prev.map(log =>
        log.id === id
          ? { ...log, status: 'Resolved' as const, resolvedAt: new Date().toISOString(), notes }
          : log
      )
    );
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <PortalContext.Provider
      value={{
        isStreaming,
        setIsStreaming,
        detections,
        setDetections,
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
        setFps,
        latency,
        setLatency,
        logs,
        addLog,
        resolveLog,
        clearLogs,
      }}
    >
      {children}
    </PortalContext.Provider>
  );
};

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

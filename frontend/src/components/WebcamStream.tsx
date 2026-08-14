'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePortal } from '../app/(portal)/PortalContext';
import { Camera, CameraOff, AlertTriangle, RefreshCw, Upload } from 'lucide-react';

export default function WebcamStream() {
  const {
    isStreaming,
    setIsStreaming,
    setDetections,
    armAlarm,
    fireSens,
    smokeSens,
    steamSens,
    setFps,
    setLatency
  } = usePortal();

  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [modelWarning, setModelWarning] = useState<string>('');
  const [uploadedFrameActive, setUploadedFrameActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastFrameSentTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const sessionRef = useRef(0);
  const isStreamingRef = useRef(isStreaming);

  // Keep sensitivity settings in ref to access inside loop without re-triggering effect
  const settingsRef = useRef({ fireSens, smokeSens, steamSens });
  useEffect(() => {
    settingsRef.current = { fireSens, smokeSens, steamSens };
  }, [fireSens, smokeSens, steamSens]);
  useEffect(() => {
    isStreamingRef.current = isStreaming;
  }, [isStreaming]);

  const resolveWsUrl = () => {
    const configuredUrl = process.env.NEXT_PUBLIC_WS_URL;
    if (configuredUrl) return configuredUrl;

    const host = window.location.hostname;
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '[::1]';
    const targetHost = isLocalHost ? '127.0.0.1' : host;
    return `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${targetHost}:8000/ws`;
  };

  async function startCameraAndSocket() {
    stopCameraAndSocket();
    const session = ++sessionRef.current;
    setConnectionStatus('connecting');
    setErrorMessage('');
    setUploadedFrameActive(false);

    try {
      const stream = await openCameraStream();
      streamRef.current = stream;
      if (session !== sessionRef.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      requestRef.current = requestAnimationFrame(sendFrameLoop);
      connectWebSocket(session);

    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setConnectionStatus('error');
      setErrorMessage(getCameraErrorMessage(err));
    }
  }

  async function openCameraStream() {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('MEDIA_DEVICES_UNAVAILABLE');
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 } },
        audio: false
      });
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      if (name === 'NotFoundError' || name === 'OverconstrainedError') {
        return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      throw err;
    }
  }

  function getCameraErrorMessage(err: unknown) {
    const name = err instanceof DOMException ? err.name : err instanceof Error ? err.message : '';
    if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
      return "No webcam was found by the browser. Attach or enable a camera for this Ubuntu session, then try again.";
    }
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      return "Camera permission was blocked. Allow camera access for localhost in the browser, then try again.";
    }
    if (name === 'NotReadableError' || name === 'TrackStartError') {
      return "The webcam is visible but busy. Close other camera apps or browser tabs, then try again.";
    }
    if (name === 'MEDIA_DEVICES_UNAVAILABLE') {
      return "This browser context does not expose camera APIs. Open the app in a regular browser on localhost.";
    }
    return "Failed to access webcam. Allow camera permission, close other camera apps, and try again.";
  }

  function connectWebSocket(session: number, onOpen?: () => void) {
    try {
      const ws = new WebSocket(resolveWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        if (session !== sessionRef.current) return;
        setConnectionStatus('connected');
        setErrorMessage('');
        onOpen?.();
      };

      ws.onmessage = (event) => {
        if (session !== sessionRef.current) return;
        try {
          const data = JSON.parse(event.data);

          if (data.error) {
            console.error("Backend error:", data.error);
            isProcessingRef.current = false;
            return;
          }

          if (data.fps !== undefined) setFps(data.fps);
          if (data.latency !== undefined) setLatency(data.latency);
          if (data.detections !== undefined) setDetections(data.detections);
          if (data.model?.ready === false) {
            setModelWarning(data.model.error || 'The trained detection model is not loaded.');
          } else if (data.model?.ready === true) {
            setModelWarning('');
          }

          if (data.image && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.onload = () => {
              if (canvasRef.current) {
                ctx?.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height);
              }
            };
            img.onerror = () => {
              console.error('Failed to decode annotated image from backend');
            };
            img.src = data.image;
          }

          isProcessingRef.current = false;
        } catch (err) {
          console.error("Error parsing WebSocket response:", err);
          isProcessingRef.current = false;
        }
      };

      ws.onerror = (event) => {
        if (session !== sessionRef.current) return;
        console.error("WebSocket error:", event);
        setConnectionStatus('error');
        setErrorMessage("Webcam is active, but the CV backend is not connected. Start the backend on port 8000 for fire, smoke, and steam detection.");
        isProcessingRef.current = false;
      };

      ws.onclose = () => {
        if (session !== sessionRef.current) return;
        isProcessingRef.current = false;
        if (isStreamingRef.current) {
          setConnectionStatus('error');
          setErrorMessage("Webcam is active, but the CV backend is not connected. Start the backend on port 8000 for fire, smoke, and steam detection.");
        } else {
          setConnectionStatus('disconnected');
        }
      };
    } catch (err: unknown) {
      console.error("Failed to start socket:", err);
      setConnectionStatus('error');
      setErrorMessage("Webcam is active, but the CV backend could not be reached.");
    }
  }

  function stopCameraAndSocket() {
    sessionRef.current += 1;
    // Stop animation frame
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }

    // Stop camera tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Reset video src
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }

    setDetections([]);
    setFps(0);
    setLatency(0);
    isProcessingRef.current = false;
    setModelWarning('');
    setUploadedFrameActive(false);
    setConnectionStatus('disconnected');
  }

  async function handleImageUpload(file: File | undefined) {
    if (!file || !file.type.startsWith('image/')) return;

    stopCameraAndSocket();
    const session = ++sessionRef.current;
    setUploadedFrameActive(true);
    setConnectionStatus('connecting');
    setErrorMessage('');

    try {
      const dataUrl = await readFileAsDataUrl(file);
      const frame = await imageToFrame(dataUrl);
      if (session !== sessionRef.current) return;
      drawFrame(frame);
      connectWebSocket(session, () => sendStaticFrame(frame));
    } catch (err) {
      console.error('Image upload error:', err);
      setConnectionStatus('error');
      setErrorMessage('Could not read that image. Choose a JPG or PNG frame and try again.');
    } finally {
      if (uploadInputRef.current) uploadInputRef.current.value = '';
    }
  }

  function readFileAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function imageToFrame(src: string) {
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas unavailable'));
          return;
        }
        ctx.fillStyle = '#020617';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
        const width = image.width * scale;
        const height = image.height * scale;
        ctx.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height);
        resolve(canvas);
      };
      image.onerror = reject;
      image.src = src;
    });
  }

  function drawFrame(frame: HTMLCanvasElement) {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
  }

  function sendStaticFrame(frame: HTMLCanvasElement) {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    isProcessingRef.current = true;
    wsRef.current.send(JSON.stringify({
      image: frame.toDataURL('image/jpeg', 0.8),
      settings: settingsRef.current
    }));
  }

  function sendFrameLoop(now: number) {
    if (!isStreamingRef.current) return;

    // A model inference is more useful than flooding the server with frames.
    // Ten source frames/second keeps webcam CPU, websocket traffic and YOLO latency stable.
    if (
      wsRef.current?.readyState === WebSocket.OPEN &&
      videoRef.current &&
      videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA &&
      !isProcessingRef.current
    ) {
      if (now - lastFrameSentTimeRef.current >= 100) {
        captureAndSendFrame();
        lastFrameSentTimeRef.current = now;
      }
    }

    requestRef.current = requestAnimationFrame(sendFrameLoop);
  }

  function captureAndSendFrame() {
    if (!videoRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    const sourceWidth = videoRef.current.videoWidth;
    const sourceHeight = videoRef.current.videoHeight;
    if (!sourceWidth || !sourceHeight) return;

    // Preserve the camera's aspect ratio. The previous fixed 640x480 canvas
    // stretched common 16:9 camera frames into 4:3, which weakens the diffuse
    // texture cues the model uses for smoke and steam. Keep enough detail for
    // those classes while limiting websocket payload size.
    const maxCaptureWidth = 960;
    const scale = Math.min(1, maxCaptureWidth / sourceWidth);
    const captureWidth = Math.round(sourceWidth * scale);
    const captureHeight = Math.round(sourceHeight * scale);

    // Reuse the capture canvas, resizing only if the camera stream changes.
    if (!captureCanvasRef.current) {
      const canvas = document.createElement('canvas');
      captureCanvasRef.current = canvas;
    }
    const offscreenCanvas = captureCanvasRef.current;
    if (offscreenCanvas.width !== captureWidth || offscreenCanvas.height !== captureHeight) {
      offscreenCanvas.width = captureWidth;
      offscreenCanvas.height = captureHeight;
    }
    const offscreenCtx = offscreenCanvas.getContext('2d');

    if (offscreenCtx) {
      offscreenCtx.drawImage(videoRef.current, 0, 0, captureWidth, captureHeight);
      
      const base64Img = offscreenCanvas.toDataURL('image/jpeg', 0.9);

      // Send to server
      const payload = {
        image: base64Img,
        settings: settingsRef.current
      };
      
      isProcessingRef.current = true;
      wsRef.current.send(JSON.stringify(payload));
    }
  }

  // Setup/teardown is deliberately tied only to the user-controlled stream
  // switch. Sensitivities are read from settingsRef inside the frame loop.
  useEffect(() => {
    if (isStreaming) {
      // This effect owns the external camera/socket lifecycle.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      startCameraAndSocket();
    } else {
      stopCameraAndSocket();
    }

    return stopCameraAndSocket;
    // The lifecycle functions intentionally use refs for current stream state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  return (
    <div className="relative flex flex-col items-center justify-center w-full aspect-video bg-slate-100 border border-slate-200 rounded-2xl overflow-hidden shadow-xl group">
      {/* Source webcam preview stays visible even when backend detection is offline. */}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isStreaming ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        }`}
        playsInline
        muted
      />

      {/* Annotated backend frames render over the live camera when available. */}
      <canvas
        ref={canvasRef}
        width={640}
        height={480}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
          (isStreaming || uploadedFrameActive) && connectionStatus === 'connected' ? 'opacity-100' : 'opacity-0 absolute pointer-events-none'
        }`}
      />

      {/* Fallback overlays depending on connection/streaming state */}
      {!isStreaming && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/90 text-center">
          <div className="p-4 mb-4 bg-slate-50 border border-slate-200 rounded-full text-slate-500 group-hover:scale-105 transition-transform duration-300">
            <CameraOff size={40} />
          </div>
          <h3 className="text-xl font-bold text-[#003c71] mb-2">Camera Feed Offline</h3>
          <p className="text-sm text-slate-600 max-w-sm mb-6">
            Start the camera monitoring feed to begin real-time fire, smoke, and steam detection.
          </p>
          <button
            onClick={() => {
              void armAlarm();
              setIsStreaming(true);
            }}
            className="flex items-center gap-2 px-6 py-3 font-semibold text-white bg-[#003c71] hover:bg-[#002b52] active:scale-95 rounded-xl shadow-lg shadow-slate-300 transition-all duration-200 cursor-pointer"
          >
            <Camera size={20} />
            Start Monitoring
          </button>
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="mt-3 flex items-center gap-2 px-5 py-2.5 font-semibold text-[#003c71] bg-white hover:bg-slate-50 active:scale-95 rounded-xl border border-slate-200 transition-all duration-200 cursor-pointer"
          >
            <Upload size={18} />
            Test Image
          </button>
        </div>
      )}

      {(isStreaming || uploadedFrameActive) && connectionStatus === 'connecting' && (
        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/85 px-3 py-2 text-xs font-semibold text-slate-700 backdrop-blur-md">
          <RefreshCw size={15} className="text-[#f58220] animate-spin" />
          <span>Connecting to CV engine on port 8000...</span>
        </div>
      )}

      {(isStreaming || uploadedFrameActive) && connectionStatus === 'error' && (
        <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-3 rounded-xl border border-rose-200 bg-white/90 p-3 text-center backdrop-blur-md sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <div className="flex min-w-0 items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-400" />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900">Detection connection issue</h3>
              <p className="text-xs text-slate-600">{errorMessage}</p>
            </div>
          </div>
          <button
            onClick={startCameraAndSocket}
            className="flex shrink-0 items-center justify-center gap-2 px-4 py-2 font-semibold text-white bg-[#003c71] hover:bg-[#002b52] active:scale-95 rounded-lg border border-[#003c71] transition-all cursor-pointer"
          >
            <RefreshCw size={16} />
            Retry
          </button>
          <button
            onClick={() => uploadInputRef.current?.click()}
            className="flex shrink-0 items-center justify-center gap-2 px-4 py-2 font-semibold text-[#003c71] bg-white hover:bg-slate-50 active:scale-95 rounded-lg border border-slate-200 transition-all cursor-pointer"
          >
            <Upload size={16} />
            Test Image
          </button>
        </div>
      )}

      {(isStreaming || uploadedFrameActive) && connectionStatus === 'connected' && modelWarning && (
        <div className="absolute bottom-4 left-4 right-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-white/90 p-3 text-left backdrop-blur-md">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#f58220]" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">Detection model not loaded</h3>
            <p className="text-xs text-slate-600">{modelWarning}</p>
          </div>
        </div>
      )}

      {/* Top right status badge */}
      {(isStreaming || uploadedFrameActive) && connectionStatus === 'connected' && (
        <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-white/80 backdrop-blur-md border border-slate-200 rounded-full text-xs font-medium text-slate-700">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute" />
          {uploadedFrameActive ? 'TEST FRAME' : 'LIVE FEED'}
        </div>
      )}
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => handleImageUpload(event.target.files?.[0])}
      />
    </div>
  );
}

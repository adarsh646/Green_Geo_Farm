import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { CAMERA_CONFIG } from '../config/cameraConfig';
import './LiveCattleMonitor.css';

const PROBE_INTERVAL_MS = 3000;   // how often to check if the server is reachable
const STREAM_REFRESH_MS  = 15000; // periodic nonce refresh to keep MJPEG alive
const SIGNAL_TIMEOUT_MS  = 8000;  // WS watchdog: mark signal lost after 8 s silence

const LiveCattleMonitorZoom = ({ cowId }) => {
  const [cowTelemetry,  setCowTelemetry]  = useState(null);
  const [streamNonce,   setStreamNonce]   = useState(() => Date.now());
  // 'connecting' | 'live' | 'reconnecting'
  const [streamState,   setStreamState]   = useState('connecting');
  const [lastSignalAt,  setLastSignalAt]  = useState(0);
  const probeAbortRef = useRef(null);

  /* ── 1. PTZ command + WebSocket telemetry ─────────────────────────────── */
  useEffect(() => {
    // Tell the Python tracker to focus on this cow
    const triggerFocus = async () => {
      try {
        await axios.post(CAMERA_CONFIG.PTZ_TARGET, { target_zoom_id: cowId });
      } catch (err) {
        console.error('Failed to command PTZ hardware for cow:', cowId);
      }
    };
    if (cowId) triggerFocus();

    let isCancelled = false;
    let ws = null;
    let reconnectTimeout = null;

    const connectWS = () => {
      if (isCancelled) return;
      
      ws = new WebSocket(CAMERA_CONFIG.WS_URL);

      ws.onopen = () => {
        setLastSignalAt(Date.now());
      };

      ws.onmessage = (event) => {
        setLastSignalAt(Date.now());
        try {
          const payload  = JSON.parse(event.data);
          const dataArr  = (payload.data && Array.isArray(payload.data))
            ? payload.data
            : (Array.isArray(payload) ? payload : []);

          if (dataArr.length > 0) {
            const specificCow = dataArr.find(c => c.cow_id === cowId);
            if (specificCow) setCowTelemetry(specificCow);
          }
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      ws.onclose = () => {
        // Automatically reconnect if connection drops
        if (!isCancelled) reconnectTimeout = window.setTimeout(connectWS, 2000);
      };
      
      ws.onerror = () => {
        if (ws.readyState === 1 && !isCancelled) ws.close(); // Force jump to onclose
      };
    };

    connectWS();

    return () => { 
      isCancelled = true;
      if (reconnectTimeout) window.clearTimeout(reconnectTimeout);
      if (ws) ws.close(); 
    };
  }, [cowId]);

  /* ── 2. WS watchdog ────────────────────────────────────────────────────── */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (!lastSignalAt) return;
      if (Date.now() - lastSignalAt > SIGNAL_TIMEOUT_MS) {
        // WS went silent — but stream may still be alive; don't force reconnecting
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [lastSignalAt]);

  /* ── 3. HTTP probe — drives streamState reliably for MJPEG ────────────── */
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      if (cancelled) return;
      try {
        // A lightweight fetch to confirm the server is up.
        await fetch(`${CAMERA_CONFIG.WIDE_FEED}?probe=${Date.now()}`, {
          method: 'GET',
          signal: AbortSignal.timeout(2500)
        });
        if (!cancelled) {
          setStreamState(prev => {
             // If we are recovering from a lost signal, force the video frame to restart!
             if (prev !== 'live') setStreamNonce(Date.now());
             return 'live';
          });
        }
      } catch {
        if (!cancelled) setStreamState(prev => prev === 'live' ? 'reconnecting' : prev);
      }
    };

    probe(); // immediate first check
    const id = window.setInterval(probe, PROBE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  /* ── 4. Periodic nonce refresh to keep MJPEG stream alive ─────────────── */
  useEffect(() => {
    const id = window.setInterval(() => setStreamNonce(Date.now()), STREAM_REFRESH_MS);
    const onVisible = () => { if (!document.hidden) setStreamNonce(Date.now()); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  /* ── Stream source: wide feed always (upgrades to zoom when tracked) ───── */
  const isTracked = Boolean(cowTelemetry);
  const streamSrc = isTracked
    ? `${CAMERA_CONFIG.ZOOM_FEED}?t=${streamNonce}`
    : `${CAMERA_CONFIG.WIDE_FEED}?t=${streamNonce}`;

  return (
    <div className="live-monitor-zoom-container" style={{ padding: 0 }}>
      <div className="video-stream-container zoom-mode">

        {/* The MJPEG <img> — always rendered so the browser opens the stream */}
        <img
          key={streamSrc}
          src={streamSrc}
          alt={`Live PTZ feed for ${cowId}`}
          className="live-video-feed ptz-feed"
          style={{ display: streamState === 'live' ? 'block' : 'none' }}
          onError={() => {
            setStreamState('reconnecting');
            window.setTimeout(() => setStreamNonce(Date.now()), 1000);
          }}
        />

        {/* Live / Reconnecting badge */}
        <span className={`stream-health-badge ${streamState === 'live' ? 'state-live' : 'state-reconnecting'}`}>
          {streamState === 'live' ? 'Live' : 'Reconnecting...'}
        </span>

        {/* Feed-type badge (bottom-left) */}
        {streamState === 'live' && (
          <span style={{
            position: 'absolute', bottom: 8, left: 8,
            background: isTracked ? 'rgba(45,90,63,0.88)' : 'rgba(15,23,42,0.80)',
            color: '#fff', fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.8px', padding: '3px 8px', borderRadius: '6px',
            textTransform: 'uppercase', backdropFilter: 'blur(4px)',
          }}>
            {isTracked ? `🔍 PTZ · ${cowId}` : '📷 Wide · Searching...'}
          </span>
        )}

        {/* Signal-lost overlay — only when not live */}
        {streamState !== 'live' && (
          <div className="stream-no-signal-overlay">
            <strong>Camera signal lost</strong>
            <span>Waiting for camera stream on port 8000...</span>
          </div>
        )}

        {/* Telemetry overlay — only shown when this cow is tracked */}
        {cowTelemetry && (
          <div className="glassmorphism-card zoom-telemetry-overlay">
            <div className="telemetry-stats-grid">
              <div className="t-stat">
                <span>Action</span>
                <strong>{cowTelemetry.state?.replace('cow_', '').toUpperCase() || 'STATIONARY'}</strong>
              </div>
              <div className="t-stat">
                <span>Mood</span>
                <strong>{cowTelemetry.mood || 'STABLE'}</strong>
              </div>
              <div className="t-stat">
                <span>CPM (Chews)</span>
                <strong>{Math.round(cowTelemetry.cpm) || 0}</strong>
              </div>
              <div className="t-stat">
                <span>Diagnosis</span>
                <strong className={cowTelemetry.diagnosis === 'OK' ? 'color-success' : 'color-danger'}>
                  {cowTelemetry.diagnosis}
                </strong>
              </div>
            </div>
            {cowTelemetry.risk && (
              <div style={{
                marginTop: '4px', fontSize: '9px', fontWeight: 600,
                color: cowTelemetry.risk === 'Low' ? '#22c55e' : '#ef4444',
              }}>
                DIAGNOSTIC RISK: {cowTelemetry.risk.toUpperCase()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCattleMonitorZoom;

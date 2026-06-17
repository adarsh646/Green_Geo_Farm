import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CAMERA_CONFIG } from '../config/cameraConfig';
import './LiveCattleMonitor.css';

const PROBE_INTERVAL_MS  = 3000;   // How often to confirm the stream server is up
const STREAM_REFRESH_MS  = 15000;  // Periodic nonce to keep MJPEG socket alive
const SIGNAL_TIMEOUT_MS  = 8000;   // WS watchdog

const LiveCattleMonitorWide = ({ cattleList = [] }) => {
  const navigate = useNavigate();
  const [telemetry,   setTelemetry]   = useState([]);
  const [cameraId,    setCameraId]    = useState('CAM_01');
  const [streamNonce, setStreamNonce] = useState(() => Date.now());
  // 'connecting' | 'live' | 'reconnecting'
  const [streamState, setStreamState] = useState('connecting');
  const [lastSignalAt, setLastSignalAt] = useState(0);

  /* ── 1. WebSocket — telemetry only, no stream-state coupling ─────────── */
  useEffect(() => {
    const ws = new WebSocket(CAMERA_CONFIG.WS_URL);

    ws.onopen = () => {
      setLastSignalAt(Date.now());
    };

    ws.onmessage = (event) => {
      setLastSignalAt(Date.now());
      try {
        const payload = JSON.parse(event.data);
        if (payload.camera_id) {
          setCameraId(payload.camera_id);
        }
        
        if (payload.data && Array.isArray(payload.data)) {
          setTelemetry(payload.data);
        } else if (Array.isArray(payload)) {
          setTelemetry(payload);
        }
      } catch (error) {
        console.error('WebSocket parse error:', error);
      }
    };

    ws.onclose = () => {
      // WS dropped - probe will handle stream-state
    };

    return () => { ws.close(); };
  }, []);

  /* ── 2. WS watchdog (kept for telemetry staleness, not stream state) ─── */
  useEffect(() => {
    const watchdog = window.setInterval(() => {
      if (!lastSignalAt) return;
      if (Date.now() - lastSignalAt > SIGNAL_TIMEOUT_MS) {
        // telemetry went stale — telemetry pills will just show SEARCHING
      }
    }, 1000);
    return () => window.clearInterval(watchdog);
  }, [lastSignalAt]);

  /* ── 3. HTTP probe — ONLY reliable way to detect MJPEG stream liveness ─ */
  // MJPEG responses never complete, so img.onLoad never fires on chrome/edge.
  // A simple fetch() that doesn't throw means the server is up → show feed.
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      if (cancelled) return;
      try {
        await fetch(`${CAMERA_CONFIG.WIDE_FEED}?probe=${Date.now()}`, {
          signal: AbortSignal.timeout(2500),
        });
        if (!cancelled) setStreamState('live');
      } catch {
        if (!cancelled) {
          setStreamState(prev => prev === 'live' ? 'reconnecting' : prev);
        }
      }
    };

    probe(); // fire immediately on mount
    const id = window.setInterval(probe, PROBE_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  /* ── 4. Periodic nonce refresh to keep the MJPEG socket alive ─────────  */
  useEffect(() => {
    const id = window.setInterval(() => setStreamNonce(Date.now()), STREAM_REFRESH_MS);

    const onVisible = () => {
      if (!document.hidden) setStreamNonce(Date.now());
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  // Nonce is appended so the refresh timer works; key forces remount on error
  const streamSrc = `${CAMERA_CONFIG.WIDE_FEED}?t=${streamNonce}`;

  return (
    <div className="live-monitor-wide-container cattle-model-plain">
      <div className="live-monitor-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Wide-Angle Observer (Live)</h3>
        <span className="camera-id-badge" style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600, border: '1px solid #e2e8f0', padding: '2px 8px', borderRadius: '4px' }}>
            ID: {cameraId}
        </span>
      </div>

      <div className="video-stream-container">
        {/* The <img> is always rendered so the browser opens the MJPEG stream.
            It is hidden behind the overlay until probe confirms the server is up. */}
        <img
          key={streamNonce}
          src={streamSrc}
          alt="Live Wide-Angle Cattle Feed"
          className="live-video-feed"
          style={{ display: streamState === 'live' ? 'block' : 'none' }}
          onError={() => {
            setStreamState('reconnecting');
            window.setTimeout(() => setStreamNonce(Date.now()), 1000);
          }}
        />

        <span className={`stream-health-badge ${streamState === 'live' ? 'state-live' : 'state-reconnecting'}`}>
          {streamState === 'live' ? 'Live' : 'Reconnecting...'}
        </span>

        {streamState !== 'live' && (
          <div className="stream-no-signal-overlay">
            <strong>Camera signal lost</strong>
            <span>Waiting for camera stream on port 8000...</span>
          </div>
        )}
      </div>

      {/* Telemetry pills — all original logic preserved */}
      <div className="telemetry-compact-grid">
        {cattleList.map(cow => {
          const data = telemetry.find(t => t.cow_id === cow.tagNumber);
          const riskClass = (data?.diagnosis === 'WARNING' || data?.risk?.includes('High'))
            ? 'pill-danger'
            : 'pill-success';

          return (
            <div
              key={cow._id}
              className={`telemetry-pill ${data ? 'active' : ''}`}
              onClick={() => navigate(`/cattle-details/${cow._id}`, { state: { cattle: cow } })}
            >
              <span className="pill-tag">{cow.tagNumber}</span>
              <span className="pill-status">
                {data ? data.state?.replace('cow_', '').toUpperCase() : 'SEARCHING'}
              </span>
              {data?.diagnosis === 'WARNING' && <div className="pill-alert-dot"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveCattleMonitorWide;

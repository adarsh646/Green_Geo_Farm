import React, { useEffect, useRef, useState } from 'react';
import CowAnimation from './CowAnimation';
import {
  COW_HEALTH_API_BASE_URL,
  COW_HEALTH_WS_URL,
  buildCowHealthApiUrl,
} from '../../api/http';

const resolveCowHealthWsUrl = () => {
  if (COW_HEALTH_WS_URL) {
    return COW_HEALTH_WS_URL;
  }

  return `${COW_HEALTH_API_BASE_URL.replace(/^http/i, 'ws')}/ws`;
};

const RealTimeCowMonitor = ({ cowId = 'cow-001' }) => {
  const cowAnimationRef = useRef();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket server
    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(resolveCowHealthWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          setConnectionStatus('connected');
          console.log('Connected to cow health monitoring server');

          // Subscribe to specific cow updates
          ws.send(JSON.stringify({
            type: 'subscribe',
            cowId: cowId,
          }));
        };

        ws.onmessage = (event) => {
          const message = JSON.parse(event.data);

          if (message.type === 'healthUpdate' && message.cowId === cowId) {
            const healthData = message.data;

            // Update animation based on health data
            if (cowAnimationRef.current) {
              cowAnimationRef.current.setCowHealthStatus(healthData);
            }

            setLastUpdate(new Date(message.timestamp));
          }
        };

        ws.onclose = () => {
          setConnectionStatus('disconnected');
          console.log('Disconnected from server');

          // Attempt to reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          setConnectionStatus('error');
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnectionStatus('error');
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [cowId]);

  const handleManualStatusUpdate = (status) => {
    // Send manual status update to server
    fetch(buildCowHealthApiUrl(`/api/cow-health/${cowId}`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(status),
    })
      .then((response) => response.json())
      .then((data) => {
        console.log('Status updated:', data);
      })
      .catch((error) => {
        console.error('Error updating status:', error);
      });
  };

  return (
    <div style={{ background: '#000', minHeight: '100vh', padding: '20px' }}>
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          background: 'rgba(0,0,0,0.8)',
          padding: '10px',
          borderRadius: '5px',
          color: 'white',
          fontSize: '12px',
          zIndex: 100,
        }}
      >
        <div>
          Connection:{' '}
          <span
            style={{
              color:
                connectionStatus === 'connected'
                  ? '#4CAF50'
                  : connectionStatus === 'error'
                    ? '#f44336'
                    : '#ff9800',
            }}
          >
            {connectionStatus}
          </span>
        </div>
        {lastUpdate && <div>Last Update: {lastUpdate.toLocaleTimeString()}</div>}
        <div>Monitoring: {cowId}</div>
      </div>

      <CowAnimation ref={cowAnimationRef} cowImageUrl={null} autoDemo={connectionStatus !== 'connected'} />
    </div>
  );
};

export default RealTimeCowMonitor;

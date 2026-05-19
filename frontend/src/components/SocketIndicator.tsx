'use client';

import React from 'react';
import { SocketState } from '../hooks/useSocket';

interface SocketIndicatorProps {
  state: SocketState;
}

export default function SocketIndicator({ state }: SocketIndicatorProps) {
  const { connected, reconnecting, attempts, socketId } = state;

  return (
    <div className="status-badge" title={socketId ? `Socket ID: ${socketId}` : 'Not connected'}>
      <span 
        className={`status-dot ${connected ? 'connected' : 'disconnected'}`}
      />
      <span>
        {connected ? (
          <span style={{ color: '#10b981' }}>Live Connection</span>
        ) : reconnecting ? (
          <span style={{ color: '#f59e0b' }}>
            Reconnecting (Attempt #{attempts})
          </span>
        ) : (
          <span style={{ color: '#ef4444' }}>Offline</span>
        )}
      </span>
    </div>
  );
}

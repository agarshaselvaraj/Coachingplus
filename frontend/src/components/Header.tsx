'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SocketState } from '../hooks/useSocket';

interface HeaderProps {
  socketState: SocketState;
}

export default function Header({ socketState }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="header">
      <Link href="/" className="logo">
        <span className="logo-icon" aria-hidden="true" />
        <span>CoachingPulse</span>
      </Link>

      <div className="nav-links">
        {/* Live connection pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            padding: '6px 14px',
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.76rem',
            fontWeight: 600,
            border: `1px solid ${socketState.connected ? 'rgba(16,185,129,0.22)' : 'rgba(239,68,68,0.22)'}`,
            background: socketState.connected ? 'rgba(16,185,129,0.07)' : 'rgba(239,68,68,0.06)',
            color: socketState.connected ? '#059669' : '#dc2626',
            transition: 'all 0.3s ease',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: socketState.connected ? 'var(--color-green)' : 'var(--color-red)',
              boxShadow: socketState.connected ? '0 0 7px var(--color-green)' : '0 0 7px var(--color-red)',
              display: 'inline-block',
              animation: socketState.connected ? 'pulseDot 1.8s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}
          />
          {socketState.connected ? 'Live' : socketState.reconnecting ? `Reconnecting…` : 'Offline'}
        </div>

        <Link
          href="/"
          className={`nav-btn ${pathname === '/' ? 'active' : ''}`}
          id="nav-feeds"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Feed
        </Link>

        <Link
          href="/admin"
          className={`nav-btn ${pathname === '/admin' ? 'active' : ''}`}
          id="nav-publish"
          style={pathname !== '/admin' ? {
            background: 'var(--color-brand)',
            color: '#fff',
            border: '1px solid transparent',
            boxShadow: '0 2px 10px rgba(91,94,244,0.3)',
          } : {}}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Publish
        </Link>
      </div>
    </header>
  );
}

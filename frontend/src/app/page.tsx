'use client';

import React, { useState, useEffect } from 'react';
import { Brain, ChartNoAxesColumn, Dumbbell, TrendingUp, Users, Heart, Radio } from 'lucide-react';
import Header from '../components/Header';
import FeedList from '../components/FeedList';
import { useSocket, FeedItem } from '../hooks/useSocket';

export default function HomePage() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real-time Event Hooks
  const handleNewFeed = (newFeed: FeedItem) => {
    setFeeds((prev) => {
      if (prev.some((f) => f.id === newFeed.id)) return prev;
      return [newFeed, ...prev];
    });
  };

  const handleFeedUpdated = (update: { id: string; likes_count: number }) => {
    setFeeds((prev) =>
      prev.map((f) => (f.id === update.id ? { ...f, likes_count: update.likes_count } : f))
    );
  };

  const { socketState } = useSocket(handleNewFeed, handleFeedUpdated);

  const fetchFeeds = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/feed`);
      if (!response.ok) throw new Error(`Server returned ${response.status}`);
      const resData = await response.json();
      if (resData.success) {
        setFeeds(resData.data);
      } else {
        throw new Error(resData.message || 'Failed to fetch feeds');
      }
    } catch (err: any) {
      setError(err.message || 'Could not connect to CoachingPulse server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchFeeds(); }, []);

  const handleLikeUpdate = (id: string, newLikesCount: number) => {
    setFeeds((prev) => prev.map((f) => (f.id === id ? { ...f, likes_count: newLikesCount } : f)));
  };

  const totalLikes = feeds.reduce((sum, f) => sum + f.likes_count, 0);

  return (
    <main className="app-container">
      <Header socketState={socketState} />

      {/* ── Welcome Banner ── */}
      <section className="welcome-banner" aria-label="Feed overview">

        {/* Headline */}
        <h1 className="banner-title">
          Your coaching feed,{' '}
          <span>updated instantly.</span>
        </h1>

        {/* Stat pills */}
        <div className="banner-stats">
          <div className="banner-stat">
            <Users size={14} />
            <strong style={{ color: 'var(--text-primary)' }}>{feeds.length}</strong>&nbsp;posts
          </div>
          <div className="banner-stat">
            <Heart size={14} />
            <strong style={{ color: 'var(--text-primary)' }}>{totalLikes}</strong>&nbsp;likes
          </div>
          <div className="banner-stat">
            <Radio size={14} />
            {socketState.connected ? 'Live' : 'Reconnecting…'}
          </div>
        </div>

        {/* Category breakdown — horizontal row */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { label: 'Mindset',  color: '#6366f1', bg: '#eef0ff', Icon: Brain,            count: feeds.filter(f => f.category.toLowerCase() === 'mindset').length },
            { label: 'Strategy', color: '#0284c7', bg: '#e0f2fe', Icon: ChartNoAxesColumn, count: feeds.filter(f => f.category.toLowerCase() === 'strategy').length },
            { label: 'Fitness',  color: '#059669', bg: '#dcfce7', Icon: Dumbbell,          count: feeds.filter(f => f.category.toLowerCase() === 'fitness').length },
            { label: 'Business', color: '#d97706', bg: '#fef3c7', Icon: TrendingUp,        count: feeds.filter(f => f.category.toLowerCase() === 'business').length },
          ].map(({ label, color, bg, Icon, count }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 14px',
                borderRadius: 'var(--radius-md)',
                background: bg,
                border: `1px solid ${color}22`,
                flex: '1 1 140px',
              }}
            >
              <div style={{
                width: '30px', height: '30px',
                borderRadius: '7px',
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                color,
              }}>
                <Icon size={15} strokeWidth={2} />
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '1px' }}>
                  {count} <span style={{ fontSize: '0.73rem', fontWeight: 500, color: 'var(--text-muted)' }}>{count === 1 ? 'post' : 'posts'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </section>

      {/* ── Error Alert ── */}
      {error && (
        <div className="error-alert" role="alert">
          <span>
            <strong>Connection error:&nbsp;</strong>{error}
          </span>
          <button className="error-retry-btn" onClick={fetchFeeds}>
            Retry
          </button>
        </div>
      )}

      {/* ── Feed Content ── */}
      {loading ? (
        <div className="feed-grid" aria-busy="true" aria-label="Loading feeds">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="shimmer-card">
              <div className="shimmer shimmer-bar short" style={{ height: '22px', borderRadius: '100px' }} />
              <div className="shimmer shimmer-bar" style={{ marginTop: '8px' }} />
              <div className="shimmer shimmer-bar medium" />
              <div className="shimmer shimmer-bar" />
              <div className="shimmer shimmer-bar medium" />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '12px', gap: '8px' }}>
                <div className="shimmer shimmer-bar short" style={{ height: '28px', borderRadius: '100px' }} />
                <div className="shimmer shimmer-bar short" style={{ height: '28px', borderRadius: '8px', width: '18%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <FeedList feeds={feeds} onLikeUpdate={handleLikeUpdate} />
      )}
    </main>
  );
}

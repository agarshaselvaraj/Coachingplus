'use client';

import React, { useState } from 'react';
import { FeedItem } from '../hooks/useSocket';

interface FeedCardProps {
  feed: FeedItem;
  onLikeSuccess?: (id: string, newLikesCount: number) => void;
}

function formatTimeAgo(dateString: string): string {
  try {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 5)  return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24)   return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  } catch {
    return 'Recently';
  }
}

function getInitials(name: string): string {
  const parts = name.replace(/^Coach\s+/i, '').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

const AVATAR_COLORS: [string, string][] = [
  ['#e0e7ff', '#6366f1'],
  ['#dcfce7', '#16a34a'],
  ['#fef3c7', '#d97706'],
  ['#fce7f3', '#db2777'],
  ['#e0f2fe', '#0284c7'],
  ['#f3e8ff', '#9333ea'],
  ['#fff7ed', '#ea580c'],
];

function getAvatarColors(name: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Top accent gradient per category
const CATEGORY_ACCENT: Record<string, string> = {
  mindset:  'linear-gradient(90deg, #6366f1, #a78bfa)',
  strategy: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
  fitness:  'linear-gradient(90deg, #10b981, #34d399)',
  business: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
};

function CategoryIcon({ category }: { category: string }) {
  const cat = category.toLowerCase();
  const size = 11;
  const base = {
    width: size, height: size, viewBox: '0 0 24 24',
    fill: 'none', stroke: 'currentColor',
    strokeWidth: 2.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  if (cat === 'mindset')  return <svg {...base}><path d="M9.663 17h4.673M12 3a6 6 0 0 1 6 6c0 2.4-1.4 4.5-3.5 5.5V16H9.5v-1.5C7.4 13.5 6 11.4 6 9a6 6 0 0 1 6-6Z" /></svg>;
  if (cat === 'strategy') return <svg {...base}><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /></svg>;
  if (cat === 'fitness')  return <svg {...base}><path d="M6 5v14M18 5v14M3 12h18M3 8h3M18 8h3M3 16h3M18 16h3" /></svg>;
  if (cat === 'business') return <svg {...base}><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>;
  return null;
}

export default function FeedCard({ feed, onLikeSuccess }: FeedCardProps) {
  const { id, title, content, coach_name, category, likes_count, created_at } = feed;

  const [isLiking, setIsLiking]   = useState(false);
  const [localLiked, setLocalLiked] = useState(false);

  const handleLike = async () => {
    if (isLiking || localLiked) return;
    setIsLiking(true);
    setLocalLiked(true);
    if (onLikeSuccess) onLikeSuccess(id, likes_count + 1);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/feed/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to like');
      const resData = await response.json();
      if (resData.success && onLikeSuccess) onLikeSuccess(id, resData.data.likes_count);
    } catch {
      if (onLikeSuccess) onLikeSuccess(id, likes_count);
      setLocalLiked(false);
    } finally {
      setIsLiking(false);
    }
  };

  const catKey = category.toLowerCase() as keyof typeof CATEGORY_ACCENT;
  const accentGradient = CATEGORY_ACCENT[catKey] ?? CATEGORY_ACCENT.mindset;
  const initials = getInitials(coach_name);
  const [bgColor, textColor] = getAvatarColors(coach_name);

  return (
    <article
      className="feed-card"
      style={{ '--card-accent': accentGradient } as React.CSSProperties}
    >
      {/* Top accent stripe */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          height: '3px',
          borderRadius: '16px 16px 0 0',
          background: accentGradient,
          opacity: 0.7,
        }}
      />

      {/* Header row */}
      <div className="feed-header">
        <span className={`category-tag ${catKey}`}>
          <CategoryIcon category={category} />
          {category}
        </span>
        <time className="time-ago" dateTime={created_at}>
          {formatTimeAgo(created_at)}
        </time>
      </div>

      {/* Body */}
      <div className="feed-body">
        <h3 className="feed-title">{title}</h3>
        <p className="feed-content">{content}</p>
      </div>

      {/* Footer */}
      <div className="feed-footer">
        {/* Avatar + coach name */}
        <div className="coach-info">
          <div
            aria-hidden="true"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: bgColor,
              color: textColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.62rem',
              fontWeight: 800,
              letterSpacing: '0.03em',
              flexShrink: 0,
              border: `2px solid ${textColor}28`,
              boxShadow: `0 0 0 3px ${bgColor}`,
            }}
          >
            {initials}
          </div>
          <div>
            <div className="coach-name">{coach_name}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '1px' }}>Coach</div>
          </div>
        </div>

        {/* Like button */}
        <button
          className={`like-btn ${localLiked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={isLiking || localLiked}
          aria-label={`Like this post. ${likes_count} likes`}
          id={`like-btn-${id}`}
        >
          <svg
            className="like-icon"
            viewBox="0 0 24 24"
            fill={localLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          </svg>
          <span>{likes_count}</span>
        </button>
      </div>
    </article>
  );
}

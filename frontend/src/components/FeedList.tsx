'use client';

import React, { useState } from 'react';
import FeedCard from './FeedCard';
import { FeedItem } from '../hooks/useSocket';

interface FeedListProps {
  feeds: FeedItem[];
  onLikeUpdate: (id: string, newLikesCount: number) => void;
}

const CATEGORIES = ['All', 'Mindset', 'Strategy', 'Fitness', 'Business'];

const CATEGORY_COUNTS = (feeds: FeedItem[]) =>
  CATEGORIES.reduce<Record<string, number>>((acc, cat) => {
    acc[cat] = cat === 'All'
      ? feeds.length
      : feeds.filter((f) => f.category.toLowerCase() === cat.toLowerCase()).length;
    return acc;
  }, {});

export default function FeedList({ feeds, onLikeUpdate }: FeedListProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const counts = CATEGORY_COUNTS(feeds);

  const filteredFeeds = feeds.filter((feed) =>
    selectedCategory === 'All' || feed.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <div>
      {/* ── Category Filter Pill Bar ── */}
      <div className="filter-container" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={selectedCategory === cat}
            className={`filter-btn ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            id={`filter-${cat.toLowerCase()}`}
          >
            {cat}
            {counts[cat] > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '100px',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '0 5px',
                  marginLeft: '5px',
                  background: selectedCategory === cat ? 'rgba(255,255,255,0.25)' : 'var(--bg-hover)',
                  color: selectedCategory === cat ? '#fff' : 'var(--text-muted)',
                  lineHeight: 1,
                }}
              >
                {counts[cat]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Feed Grid or Empty State ── */}
      {filteredFeeds.length > 0 ? (
        <div className="feed-grid" role="feed" aria-label={`${selectedCategory} coaching posts`}>
          {filteredFeeds.map((feed, i) => (
            <div
              key={feed.id}
              style={{ animationDelay: `${Math.min(i * 40, 300)}ms` }}
            >
              <FeedCard feed={feed} onLikeSuccess={onLikeUpdate} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state" role="status">
          <div className="empty-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M11 8v6M8 11h6" />
            </svg>
          </div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '10px' }}>
            No {selectedCategory === 'All' ? '' : selectedCategory + ' '}posts yet
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '360px', margin: '0 auto' }}>
            {selectedCategory === 'All'
              ? 'No coaching posts have been published yet. Head to the Publish page to broadcast the first one.'
              : `There are no posts in the ${selectedCategory} category yet. Try a different filter or publish one now.`}
          </p>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import { Brain, ChartNoAxesColumn, Dumbbell, TrendingUp, Send, Loader2 } from 'lucide-react';
import Header from '../../components/Header';
import { useSocket } from '../../hooks/useSocket';

const CATEGORY_META: Record<string, { Icon: React.ElementType; color: string; bg: string }> = {
  Mindset:  { Icon: Brain,            color: '#6366f1', bg: '#eef0ff' },
  Strategy: { Icon: ChartNoAxesColumn, color: '#0284c7', bg: '#e0f2fe' },
  Fitness:  { Icon: Dumbbell,          color: '#059669', bg: '#dcfce7' },
  Business: { Icon: TrendingUp,        color: '#d97706', bg: '#fef3c7' },
};

export default function AdminPage() {
  const { socketState } = useSocket();

  const [coachName, setCoachName] = useState('');
  const [category,  setCategory]  = useState('Mindset');
  const [title,     setTitle]     = useState('');
  const [content,   setContent]   = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!coachName.trim() || !title.trim() || !content.trim()) {
      showToast('error', 'Please fill in all fields before publishing.');
      return;
    }
    setSubmitting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      const response = await fetch(`${apiUrl}/feed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          coach_name: coachName.trim(),
          category,
          title: title.trim(),
          content: content.trim(),
        }),
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.message || 'Server error');
      if (resData.success) {
        showToast('success', '🎉 Feed broadcasted in real-time to all connected clients!');
        setTitle('');
        setContent('');
      } else {
        throw new Error(resData.message || 'Unknown error');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to connect to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const meta = CATEGORY_META[category];
  const charCount = content.length;

  return (
    <main className="app-container">
      <Header socketState={socketState} />

      <div style={{ maxWidth: '680px', margin: '0 auto' }}>

        {/* Page title above the card */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, letterSpacing: '-0.04em', fontFamily: "'Plus Jakarta Sans', sans-serif", color: 'var(--text-primary)' }}>
            Broadcast a Post
          </h1>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.65 }}>
            Publish a coaching insight directly to the live feed. It will appear instantly for all connected clients.
          </p>
        </div>

        {/* Form Card */}
        <section className="admin-card" aria-label="Create coaching post">
          <form onSubmit={handleSubmit} noValidate>

            {/* Coach Name */}
            <div className="form-group">
              <label className="form-label" htmlFor="coach_name">Coach / Author</label>
              <input
                type="text"
                id="coach_name"
                className="form-input"
                placeholder="e.g. Coach David Goggins"
                value={coachName}
                onChange={(e) => setCoachName(e.target.value)}
                disabled={submitting}
                maxLength={80}
                required
              />
            </div>

            {/* Category — visual pill selector */}
            <div className="form-group">
              <label className="form-label" htmlFor="category">Category</label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
                {Object.entries(CATEGORY_META).map(([cat, m]) => {
                  const active = category === cat;
                  const CatIcon = m.Icon;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      disabled={submitting}
                      style={{
                        padding: '10px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: active ? `2px solid ${m.color}` : '1.5px solid var(--border-color)',
                        background: active ? m.bg : '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                        boxShadow: active ? `0 0 0 3px ${m.color}18` : 'none',
                        color: active ? m.color : 'var(--text-muted)',
                      }}
                    >
                      <CatIcon size={18} strokeWidth={2} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        {cat}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="form-group">
              <label className="form-label" htmlFor="title">Post Title</label>
              <input
                type="text"
                id="title"
                className="form-input"
                placeholder="e.g. Compounding Marginal Gains"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                maxLength={160}
                required
              />
            </div>

            {/* Content */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="content">Content</label>
                <span style={{ fontSize: '0.72rem', color: charCount > 900 ? 'var(--color-red)' : 'var(--text-muted)' }}>
                  {charCount} / 1000
                </span>
              </div>
              <textarea
                id="content"
                className="form-textarea"
                placeholder="Describe your strategy, philosophy, or coaching insight in detail…"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={submitting}
                maxLength={1000}
                required
              />
            </div>

            {/* Preview strip */}
            {(title || coachName) && (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: meta.bg,
                  border: `1px solid ${meta.color}28`,
                  marginBottom: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  fontSize: '0.82rem',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>{meta.emoji}</span>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{title || 'Untitled post'}</div>
                  <div style={{ color: meta.color, fontWeight: 600, fontSize: '0.75rem', marginTop: '2px' }}>{coachName || 'Unknown coach'} · {category}</div>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
              id="submit-broadcast"
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Broadcasting…
                </span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                  <Send size={15} />
                  Publish to Live Feed
                </span>
              )}
            </button>

          </form>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status" aria-live="polite">
          {toast.type === 'success' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-green)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-red)" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
          <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{toast.message}</span>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Scores.jsx
 * ============================================================
 * Manual score entry REMOVED.
 * Scores are auto-calculated from:
 *   - Completed scheduled tasks  → productivity + discipline
 *   - Diary written + mood       → mindset
 *   - Activity log entries       → health, learning, social
 * ============================================================
 */

import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { format, parseISO, subDays, isSameDay } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';
import { Info } from 'lucide-react';

const CATEGORIES = [
  { key: 'productivity', label: 'Productivity', color: '#a78bfa', emoji: '⚡' },
  { key: 'health',       label: 'Health',       color: '#34d399', emoji: '💪' },
  { key: 'mindset',      label: 'Mindset',      color: '#6366f1', emoji: '🧠' },
  { key: 'social',       label: 'Social',       color: '#fbbf24', emoji: '🤝' },
  { key: 'learning',     label: 'Learning',     color: '#f472b6', emoji: '📚' },
  { key: 'discipline',   label: 'Discipline',   color: '#fb923c', emoji: '🎯' },
];

const HOW_EARNED = [
  { emoji: '✅', text: 'Completing scheduled tasks → Productivity & Discipline' },
  { emoji: '📖', text: 'Writing diary + high mood → Mindset' },
  { emoji: '💪', text: 'Health activity log entries → Health' },
  { emoji: '📚', text: 'Learning activity log entries → Learning' },
  { emoji: '🤝', text: 'Social activity log entries → Social' },
];

export default function Scores() {
  const { scores, loading, autoScore } = useData();
  const [activeTab,  setActiveTab]  = useState('Weekly');
  const [showInfo,   setShowInfo]   = useState(false);

  const range = activeTab === 'Weekly' ? 7 : 30;

  const chartData = useMemo(() => {
    const days = [];
    for (let i = range - 1; i >= 0; i--) {
      const day   = subDays(new Date(), i);
      const entry = scores.find(s => {
        try { return isSameDay(parseISO(s.scoreDate || s.date || s.createdAt), day); } catch { return false; }
      });
      const row = { date: format(day, 'MMM d'), day: format(day, 'EEE') };
      CATEGORIES.forEach(c => { row[c.key] = entry?.categories?.[c.key] ?? null; });
      // Inject today's auto-score
      if (i === 0 && autoScore) {
        CATEGORIES.forEach(c => { row[c.key] = autoScore.categories[c.key] ?? null; });
      }
      days.push(row);
    }
    return days;
  }, [scores, range, autoScore]);

  const averages = useMemo(() => {
    const cutoff = subDays(new Date(), range);
    const recent = scores.filter(s => {
      try { return parseISO(s.scoreDate || s.date || s.createdAt) >= cutoff; } catch { return false; }
    });
    return Object.fromEntries(CATEGORIES.map(c => {
      const vals = recent.map(s => s.categories?.[c.key]).filter(v => v != null);
      if (autoScore) vals.push(autoScore.categories[c.key]);
      return [c.key, vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—'];
    }));
  }, [scores, range, autoScore]);

  const todayOverall  = autoScore?.overall ?? 0;
  const todayDisplay  = Math.round(todayOverall * 10);

  const avgDisplay = useMemo(() => {
    const avgs = Object.values(averages).filter(v => v !== '—').map(Number);
    return avgs.length ? Math.round(avgs.reduce((a, b) => a + b, 0) / avgs.length * 10) : 0;
  }, [averages]);

  const scoreColor = (v) => v >= 7 ? '#34d399' : v >= 5 ? '#a78bfa' : '#f87171';

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: '#111118', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, padding: '10px 14px', fontSize: 12,
      }}>
        <p style={{ color: '#f1f5f9', fontWeight: 600, marginBottom: 4 }}>{label}</p>
        {payload.map(p => p.value != null && (
          <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
            {CATEGORIES.find(c => c.key === p.dataKey)?.emoji} {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="page-enter">

      {/* ── Top ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '24px 20px 0', minHeight: 150,
      }}>
        <div style={{ paddingTop: 8 }}>
          <div className="aegis-label">ANALYSIS</div>
          <div className="aegis-title">Performance</div>
          <p style={{ fontSize: 12, color: '#52525b', marginTop: 6 }}>Auto-calculated from your activity</p>
        </div>
        <div style={{ marginRight: -8, marginTop: -8 }}>
          <NeuralSphere size={130} state={todayOverall < 3 ? 'alert' : 'idle'} />
        </div>
      </div>

      {/* ── How scores work info banner ── */}
      <div style={{ padding: '8px 16px 0' }}>
        <button
          onClick={() => setShowInfo(v => !v)}
          style={{
            width: '100%', background: '#111118',
            border: '1px solid rgba(110,80,190,0.20)',
            borderRadius: 14, padding: '12px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 10,
          }}
        >
          <Info size={16} color="#a78bfa" style={{ flexShrink: 0 }} />
          <span style={{ flex: 1, textAlign: 'left', fontSize: 13, color: '#a78bfa', fontFamily: "'Inter',sans-serif" }}>
            How are my scores calculated?
          </span>
          <span style={{ fontSize: 12, color: '#52525b' }}>{showInfo ? '▲' : '▼'}</span>
        </button>
        {showInfo && (
          <div className="aegis-card" style={{ marginTop: 6, borderRadius: '0 0 14px 14px' }}>
            <p style={{ fontSize: 11, color: '#52525b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.10em', marginBottom: 10 }}>HOW SCORES ARE EARNED</p>
            {HOW_EARNED.map((h, i) => (
              <p key={i} style={{ fontSize: 13, color: '#a1a1aa', display: 'flex', gap: 8, marginBottom: 8 }}>
                <span>{h.emoji}</span> {h.text}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Today's score + period toggle ── */}
      <div style={{ padding: '14px 16px 0', display: 'flex', gap: 10, alignItems: 'stretch' }}>
        {/* Today tile */}
        <div className="aegis-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 12px' }}>
          <div className="aegis-label" style={{ marginBottom: 6 }}>TODAY</div>
          <div style={{ fontSize: 38, fontWeight: 700, color: scoreColor(todayOverall), fontFamily: "'Inter',sans-serif", lineHeight: 1 }}>
            {todayDisplay}
          </div>
          <div style={{ fontSize: 12, color: '#52525b', marginTop: 2 }}>/100</div>
        </div>

        {/* Period toggle + avg tile */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{
            display: 'flex', background: '#111118',
            borderRadius: 999, border: '1px solid rgba(255,255,255,0.06)', padding: 3,
          }}>
            {['Weekly', 'Monthly'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                flex: 1, padding: '7px 0', borderRadius: 999, border: 'none', cursor: 'pointer',
                background: activeTab === tab ? '#6e50be' : 'transparent',
                color: activeTab === tab ? 'white' : '#71717a',
                fontSize: 13, fontWeight: 500, fontFamily: "'Inter',sans-serif",
              }}>{tab}</button>
            ))}
          </div>
          <div className="aegis-card" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 700, color: scoreColor(avgDisplay / 10), fontFamily: "'Inter',sans-serif" }}>
                {avgDisplay}
              </div>
              <div style={{ fontSize: 10, color: '#52525b', fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.10em' }}>
                {activeTab.toUpperCase()} AVG
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chart ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 14 }}>{range}-DAY TREND</div>
          <div style={{ height: 160 }}>
            {loading.scores ? (
              <div className="shimmer-skeleton" style={{ height: '100%' }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a24" />
                  <XAxis dataKey="day" tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fill: '#52525b', fontSize: 10 }} axisLine={false} tickLine={false} width={20} />
                  <Tooltip content={<CustomTooltip />} />
                  {CATEGORIES.map(c => (
                    <Line key={c.key} type="monotone" dataKey={c.key} stroke={c.color}
                      strokeWidth={2} dot={false} connectNulls={false} name={c.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* ── Today's breakdown ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 12 }}>TODAY'S BREAKDOWN</div>
          {autoScore ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {CATEGORIES.map(cat => {
                const val = autoScore.categories[cat.key] ?? 0;
                return (
                  <div key={cat.key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 14, color: '#f1f5f9' }}>{cat.emoji} {cat.label}</span>
                      <span style={{ fontWeight: 700, fontSize: 13, color: cat.color }}>{val}/10</span>
                    </div>
                    <div style={{ height: 5, background: '#18181f', borderRadius: 999, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${val * 10}%`, borderRadius: 999,
                        background: cat.color, boxShadow: `0 0 6px ${cat.color}55`,
                        transition: 'width 0.6s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#52525b', fontSize: 13, padding: '12px 0' }}>
              Start logging activities and completing tasks to see scores.
            </p>
          )}
        </div>
      </div>

      {/* ── Category averages grid ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 12 }}>{range}-DAY AVERAGES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
            {CATEGORIES.map(c => (
              <div key={c.key} style={{
                background: '#18181f', border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 14, padding: '12px 8px', textAlign: 'center',
              }}>
                <p style={{ fontSize: 20, margin: '0 0 4px' }}>{c.emoji}</p>
                <p style={{ fontWeight: 700, fontSize: 15, color: c.color, margin: '0 0 2px', fontFamily: "'Inter',sans-serif" }}>
                  {averages[c.key]}
                </p>
                <p style={{ fontSize: 10, color: '#52525b', margin: 0 }}>{c.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── History ── */}
      <div style={{ padding: '12px 16px 24px' }}>
        <div className="aegis-label" style={{ marginBottom: 10 }}>HISTORY</div>
        {loading.scores ? (
          <SkeletonList count={4} />
        ) : scores.length === 0 ? (
          <div className="aegis-card" style={{ textAlign: 'center' }}>
            <p style={{ color: '#52525b', fontSize: 13, padding: '12px 0' }}>
              No history yet. Keep completing tasks and logging activities!
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {scores.slice(0, 14).map(s => {
              const avg = s.overall ?? 5;
              const avgColor = scoreColor(avg);
              return (
                <div key={s.id} className="aegis-card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ textAlign: 'center', width: 44 }}>
                    <p style={{ fontWeight: 700, fontSize: 20, color: avgColor, margin: 0, fontFamily: "'Inter',sans-serif" }}>
                      {parseFloat(avg).toFixed(1)}
                    </p>
                    <p style={{ fontSize: 9, color: '#52525b', margin: 0 }}>avg</p>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, color: '#52525b', margin: '0 0 4px' }}>
                      {format(parseISO(s.scoreDate || s.date || s.createdAt), 'EEEE, MMM d')}
                    </p>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {CATEGORIES.map(c => s.categories?.[c.key] != null && (
                        <span key={c.key} style={{ fontSize: 12, color: c.color }}>
                          {c.emoji}{s.categories[c.key]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonList({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-skeleton" style={{ height: 60 }} />
      ))}
    </div>
  );
}

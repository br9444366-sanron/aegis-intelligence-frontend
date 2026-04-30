/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Home.jsx (Purple UI Overhaul)
 * ============================================================
 * Keeps all hooks, contexts, API calls, and business logic.
 * Only visual structure and styling updated.
 * ============================================================
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import NeuralSphere from '../components/NeuralSphere.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { isToday, format } from 'date-fns';
import {
  RefreshCw, ChevronRight,
  CheckCircle2, Circle, Clock,
  Target, BookOpen, Calendar,
} from 'lucide-react';

const SPHERE_STATES = ['idle', 'alert', 'alert', 'restricted'];

export default function Home() {
  const { user }                                                     = useAuth();
  const { goals, schedule, diary, loading, refetch, accountabilityLevel, scores } = useData();
  const { unreadCount }                                              = useNotifications();
  const navigate                                                     = useNavigate();

  const [sphereState, setSphereState] = useState('idle');
  const [analyzing,   setAnalyzing]   = useState(false);
  const [diaryText,   setDiaryText]   = useState('');

  useEffect(() => {
    setSphereState(SPHERE_STATES[accountabilityLevel] ?? 'idle');
  }, [accountabilityLevel]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setSphereState('thinking');
    try {
      await api.post('/ai/analyze');
      toast.success('Analysis complete!');
      refetch('insights');
    } catch (err) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setAnalyzing(false);
      setSphereState(SPHERE_STATES[accountabilityLevel] ?? 'idle');
    }
  };

  const handleDiarySubmit = async () => {
    if (!diaryText.trim()) return;
    try {
      await api.post('/diary', { content: diaryText, date: format(new Date(), 'yyyy-MM-dd') });
      toast.success('Reflection saved!');
      setDiaryText('');
      refetch('diary');
    } catch (err) {
      toast.error(err.message || 'Failed to save reflection');
    }
  };

  const activeGoals = goals.filter(g => g.status === 'active');
  const todayTasks  = schedule.filter(t => {
    try {
      const raw = t.date || t.scheduledDate || t.createdAt;
      if (!raw) return false;
      const d = raw?.toDate ? raw.toDate() : new Date(raw);
      return isToday(d);
    } catch { return false; }
  });
  const completedCount = todayTasks.filter(t => t.completed).length;

  // Today's overall score (0–100 scale from 0–10 avg * 10)
  const todayScoreObj = scores.find(s => {
    try {
      const raw = s.scoreDate || s.date || s.createdAt;
      return isToday(raw?.toDate ? raw.toDate() : new Date(raw));
    } catch { return false; }
  });
  const todayScore = todayScoreObj
    ? Math.round((todayScoreObj.overall ?? 0) * 10)
    : null;

  return (
    <div className="page-enter" style={{ paddingBottom: 24 }}>

      {/* ── Header text ── */}
      <div style={{ padding: '24px 20px 0' }}>
        <div className="aegis-label">AEGIS · OS</div>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 13,
          color: '#52525b',
          marginTop: 4,
        }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </div>

      {/* ── Hero Sphere + Score ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 20px 24px',
      }}>
        <NeuralSphere
          size={220}
          state={sphereState}
          showScore={todayScore !== null}
          score={todayScore !== null ? `${todayScore}/100` : '0/100'}
        />
      </div>

      {/* ── Quick stats strip ── */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 12px' }}>
        {[
          { label: 'Goals',  value: loading.goals    ? '…' : activeGoals.length,                  color: '#a78bfa' },
          { label: 'Tasks',  value: loading.schedule ? '…' : `${completedCount}/${todayTasks.length}`, color: '#34d399' },
          { label: 'Diary',  value: loading.diary    ? '…' : diary.length,                         color: '#6366f1' },
        ].map((s, i) => (
          <div key={i} style={{
            flex: 1,
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: 16,
            padding: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
          }}>
            <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 700, fontSize: 18, color: s.color }}>
              {s.value}
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#52525b',
            }}>{s.label}</span>
          </div>
        ))}

        {/* AI Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          style={{
            flex: 1,
            background: '#111118',
            border: '1px solid rgba(110,80,190,0.25)',
            borderRadius: 16,
            padding: '12px 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
            opacity: analyzing ? 0.5 : 1,
          }}
        >
          <RefreshCw
            size={18}
            color="#a78bfa"
            style={{ animation: analyzing ? 'spin 1s linear infinite' : 'none' }}
          />
          <span style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#52525b',
          }}>{analyzing ? 'Running' : 'Analyze'}</span>
        </button>
      </div>

      {/* ── Schedule Card ── */}
      <div style={{ padding: '0 16px' }}>
        <div className="aegis-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div className="aegis-label">SCHEDULE</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', marginTop: 2 }}>
                Today's Operations
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                color: '#a78bfa',
                background: 'rgba(110,80,190,0.15)',
                border: '1px solid rgba(110,80,190,0.30)',
                borderRadius: 999,
                padding: '2px 8px',
              }}>
                {completedCount}/{todayTasks.length}
              </span>
              <button
                onClick={() => navigate('/schedule')}
                style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#18181f',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#a1a1aa', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {loading.schedule ? (
            <SkeletonRows count={3} />
          ) : todayTasks.length === 0 ? (
            <EmptyState message="No operations queued. Head to Schedule to add tasks." />
          ) : (
            todayTasks.slice(0, 5).map((task, i) => (
              <ScheduleRow key={task.id} task={task} isLast={i === Math.min(todayTasks.length, 5) - 1} />
            ))
          )}
        </div>
      </div>

      {/* ── Diary Card ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 6 }}>DIARY</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 14 }}>
            📖 Reflection
          </div>
          <textarea
            className="aegis-input"
            placeholder="What shaped your day?"
            rows={3}
            style={{ minHeight: 80 }}
            value={diaryText}
            onChange={e => setDiaryText(e.target.value)}
          />
          <button
            className="aegis-btn"
            style={{ marginTop: 12 }}
            onClick={handleDiarySubmit}
          >
            Submit Reflection
          </button>
        </div>
      </div>

      {/* ── Goals summary card ── */}
      {activeGoals.length > 0 && (
        <div style={{ padding: '12px 16px 0' }}>
          <div className="aegis-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className="aegis-label">GOALS</div>
              <button
                onClick={() => navigate('/goals')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#52525b', display: 'flex', alignItems: 'center',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            {activeGoals.slice(0, 3).map(g => (
              <GoalRow key={g.id} goal={g} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function ScheduleRow({ task, isLast }) {
  const pc = { high: '#f87171', medium: '#fbbf24', low: '#34d399' }[task.priority] ?? '#52525b';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0',
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
    }}>
      {task.completed
        ? <CheckCircle2 size={18} color="#34d399" style={{ flexShrink: 0 }} />
        : <Circle size={18} color="#3f3f46" style={{ flexShrink: 0 }} />
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 14, fontWeight: 500, color: task.completed ? '#52525b' : '#f1f5f9',
          textDecoration: task.completed ? 'line-through' : 'none',
          margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{task.title}</p>
        {task.time && (
          <p style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#52525b', margin: '2px 0 0' }}>
            <Clock size={9} /> {task.time}
          </p>
        )}
      </div>
      {task.priority && (
        <span style={{
          fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', padding: '2px 8px', borderRadius: 999,
          color: pc, background: `${pc}18`, border: `1px solid ${pc}30`, flexShrink: 0,
        }}>{task.priority}</span>
      )}
    </div>
  );
}

function GoalRow({ goal }) {
  const pct   = goal.progress ?? 0;
  const color = pct >= 60 ? '#34d399' : pct >= 30 ? '#a78bfa' : '#fbbf24';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#f1f5f9' }}>{goal.title}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Inter',sans-serif" }}>{pct}%</span>
      </div>
      <div style={{ height: 4, background: '#18181f', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`, borderRadius: 999,
          background: `linear-gradient(90deg, ${color}, ${color}88)`,
          boxShadow: `0 0 6px ${color}55`,
          transition: 'width 0.7s ease',
        }} />
      </div>
    </div>
  );
}

function SkeletonRows({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-skeleton" style={{ height: 36 }} />
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <p style={{ textAlign: 'center', color: '#52525b', fontSize: 13, padding: '16px 0' }}>{message}</p>
  );
}

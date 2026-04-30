/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — YouTube Recommendations Page
 * Standalone page (was inside AIMemory). Nav slot: right of center.
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { Youtube, ExternalLink, Plus, X, RefreshCw, PlayCircle } from 'lucide-react';
import NeuralSphere from '../components/NeuralSphere.jsx';

function YoutubeThumbnail({ topic }) {
  return (
    <div style={{
      width: '100%', aspectRatio: '16/9', borderRadius: '14px 14px 0 0',
      background: 'linear-gradient(135deg, rgba(127,29,29,0.4), #111118)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '0 16px',
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%', background: '#dc2626',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 24px rgba(220,38,38,0.45)',
      }}>
        <PlayCircle size={28} color="white" />
      </div>
      <p style={{ fontSize: 12, color: '#a1a1aa', textAlign: 'center', lineHeight: 1.4, maxWidth: 220 }}>{topic}</p>
    </div>
  );
}

export default function YouTube() {
  const [recs,         setRecs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [analyzing,    setAnalyzing]    = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTopic,     setNewTopic]     = useState('');

  useEffect(() => { loadRecs(); }, []);

  const loadRecs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ai/insights', { params: { type: 'youtube', limit: 50 } });
      setRecs(data.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    toast.loading('Generating recommendations…', { id: 'yt-analyze' });
    try {
      await api.post('/ai/analyze');
      toast.success('Done! New videos added.', { id: 'yt-analyze' });
      loadRecs();
    } catch (err) {
      toast.error(err.message || 'Analysis failed', { id: 'yt-analyze' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAdd = () => {
    const t = newTopic.trim();
    if (!t) return;
    const item = {
      id: `local-${Date.now()}`, title: t,
      description: 'Manually added topic',
      youtubeSearchUrl: `https://www.youtube.com/results?search_query=${encodeURIComponent(t)}`,
      createdAt: new Date().toISOString(),
    };
    setRecs(prev => [item, ...prev]);
    toast.success(`🎬 "${t}" added`);
    setNewTopic('');
    setShowAddModal(false);
  };

  const handleRemove = (id) => {
    setRecs(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="page-enter">

      {/* ── Top header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '24px 20px 0',
      }}>
        <div>
          <div className="aegis-label">AEGIS · MEDIA</div>
          <div className="aegis-title">YouTube</div>
          <p style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>
            {recs.length} recommendation{recs.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ marginRight: -4, marginTop: -8 }}>
          <NeuralSphere size={110} state="idle" />
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div style={{ display: 'flex', gap: 10, padding: '16px 16px 0' }}>
        <button onClick={handleAnalyze} disabled={analyzing} style={{
          flex: 1, padding: '12px 0', borderRadius: 14, border: 'none',
          background: 'linear-gradient(135deg, #6e50be, #5b3fa8)',
          color: 'white', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: analyzing ? 0.6 : 1,
          boxShadow: '0 0 20px rgba(110,80,190,0.30)',
          fontFamily: "'Inter',sans-serif",
        }}>
          <RefreshCw size={16} style={{ animation: analyzing ? 'spin 1s linear infinite' : 'none' }} />
          {analyzing ? 'Generating…' : 'Generate via AI'}
        </button>
        <button onClick={() => setShowAddModal(true)} style={{
          flex: 1, padding: '12px 0', borderRadius: 14,
          background: '#111118', border: '1px solid rgba(220,38,38,0.25)',
          color: '#f87171', fontWeight: 600, fontSize: 14, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: "'Inter',sans-serif",
        }}>
          <Plus size={16} /> Add Topic
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: '16px 16px 0' }}>
        {loading ? (
          <SkeletonList count={3} />
        ) : recs.length === 0 ? (
          <div className="aegis-card" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(220,38,38,0.12)', border: '1px solid rgba(220,38,38,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
            }}>
              <Youtube size={32} color="#f87171" />
            </div>
            <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 15, margin: '0 0 8px' }}>
              No recommendations yet
            </p>
            <p style={{ fontSize: 13, color: '#52525b', margin: '0 0 20px', lineHeight: 1.5 }}>
              Run AI analysis to get YouTube videos tailored to your weak areas, or add a topic manually.
            </p>
            <button onClick={handleAnalyze} disabled={analyzing} className="aegis-btn">
              {analyzing ? 'Generating…' : 'Generate Recommendations'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {recs.map(rec => (
              <div key={rec.id} className="aegis-card" style={{
                padding: 0, overflow: 'hidden',
                border: '1px solid rgba(220,38,38,0.15)',
              }}>
                <YoutubeThumbnail topic={rec.title} />
                <div style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
                    <Youtube size={16} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px', lineHeight: 1.3 }}>
                        {rec.title}
                      </p>
                      <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>
                        {rec.description || 'Based on your weak areas'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(rec.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    >
                      <X size={14} color="#52525b" />
                    </button>
                  </div>
                  <button
                    onClick={() => window.open(rec.youtubeSearchUrl, '_blank', 'noopener,noreferrer')}
                    style={{
                      width: '100%', padding: '11px 0', borderRadius: 12, border: 'none',
                      background: '#dc2626', color: 'white', fontWeight: 600, fontSize: 14,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: "'Inter',sans-serif",
                    }}
                  >
                    <ExternalLink size={15} /> Watch on YouTube
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 24 }} />
      </div>

      {/* ── Add Topic Modal ── */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50,
          background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'flex-end', padding: '0 16px 40px',
        }}>
          <div style={{
            width: '100%', background: '#111118',
            border: '1px solid rgba(220,38,38,0.20)',
            borderRadius: 20, padding: 24,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Youtube size={16} color="#f87171" /> Add Topic
              </p>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} color="#52525b" />
              </button>
            </div>
            <input
              className="aegis-input"
              placeholder="e.g. focus techniques, deep work"
              value={newTopic}
              onChange={e => setNewTopic(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              style={{ marginBottom: 12 }}
            />
            <button
              onClick={handleAdd}
              disabled={!newTopic.trim()}
              style={{
                width: '100%', padding: '13px 0', borderRadius: 14, border: 'none',
                background: newTopic.trim() ? '#dc2626' : '#27272a',
                color: 'white', fontWeight: 600, fontSize: 15, cursor: 'pointer',
                fontFamily: "'Inter',sans-serif",
              }}
            >
              Add Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SkeletonList({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-skeleton" style={{ height: 240, borderRadius: 20 }} />
      ))}
    </div>
  );
}

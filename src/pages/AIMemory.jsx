/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — AIMemory.jsx (Commander)
 * ============================================================
 * Chat with AEGIS + Insights/Patterns tabs.
 * YouTube recommendations moved to /youtube route.
 * AI chat uses /ai/chat backend endpoint.
 * ============================================================
 */
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../context/DataContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import {
  Brain, Zap, RefreshCw, ThumbsUp, ThumbsDown,
  ChevronDown, ChevronUp, Sparkles, SendHorizontal,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';

export default function AIMemory() {
  const { insights, loading, refetch } = useData();
  const { user }                       = useAuth();

  const [patterns,        setPatterns]        = useState([]);
  const [patternsLoading, setPatternsLoading] = useState(false);
  const [analyzing,       setAnalyzing]       = useState(false);
  const [tab,             setTab]             = useState('insights');
  const [expandedId,      setExpandedId]      = useState(null);
  const [feedbackSent,    setFeedbackSent]    = useState({});
  const [activeView,      setActiveView]      = useState('chat');

  // Chat state
  const [messages,    setMessages]    = useState([
    { role: 'assistant', content: "Hello! I'm AEGIS. Ask me anything about your patterns, goals, progress, or get personalised advice. I can see your activity data and help you improve." }
  ]);
  const [inputText,   setInputText]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [aiState,     setAiState]     = useState('idle');
  const messagesEndRef = useRef(null);

  useEffect(() => { loadPatterns(); }, []);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadPatterns = async () => {
    setPatternsLoading(true);
    try {
      const { data } = await api.get('/ai/insights', { params: { type: 'pattern', limit: 30 } });
      setPatterns(data.data || []);
    } catch { /* silent */ }
    finally { setPatternsLoading(false); }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setAiState('thinking');
    toast.loading('Aegis is analysing your data…', { id: 'analyze' });
    try {
      await api.post('/ai/analyze');
      toast.success('Analysis complete!', { id: 'analyze' });
      refetch('insights');
      loadPatterns();
    } catch (err) {
      toast.error(err.message || 'Analysis failed', { id: 'analyze' });
    } finally {
      setAnalyzing(false);
      setAiState('idle');
    }
  };

  const handleFeedback = async (insight, type) => {
    if (feedbackSent[insight.id]) return;
    setFeedbackSent(p => ({ ...p, [insight.id]: type }));
    try {
      await api.post(`/ai/insights/${insight.id}/feedback`, { feedback: type });
      toast.success(type === 'helpful' ? '👍 Thanks!' : '👎 Noted, will improve');
    } catch { /* silent */ }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || chatLoading) return;
    setInputText('');
    setMessages(p => [...p, { role: 'user', content: text }]);
    setChatLoading(true);
    setAiState('thinking');
    try {
      const { data } = await api.post('/ai/chat', { message: text });
      const reply = data.data?.response || data.response || data.message || 'I processed your request.';
      setMessages(p => [...p, { role: 'assistant', content: reply }]);
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Error';
      setMessages(p => [...p, {
        role: 'assistant',
        content: `Sorry, I encountered an issue: ${errMsg}. Please check that your backend is running and Gemini API key is set.`,
      }]);
    } finally {
      setChatLoading(false);
      setAiState('idle');
    }
  };

  const QUICK = ['📅 Plan my day', '📊 How am I doing?', '🎯 Review my goals', '💡 Give me advice'];

  const formatDate = (iso) => {
    try { return format(parseISO(iso), 'MMM d, h:mm a'); } catch { return ''; }
  };

  const insightTypeConfig = {
    pattern:        { icon: '🔄', label: 'Pattern',    color: '#6366f1' },
    recommendation: { icon: '💡', label: 'Tip',        color: '#fbbf24' },
    warning:        { icon: '⚠️', label: 'Warning',    color: '#fb923c' },
    achievement:    { icon: '🏆', label: 'Achievement', color: '#34d399' },
    analysis:       { icon: '🧠', label: 'Analysis',   color: '#a78bfa' },
  };

  const getTC = (insight) => {
    const t = insight.type || 'analysis';
    return insightTypeConfig[t] || insightTypeConfig.analysis;
  };

  const insightsToShow = insights.filter(i => i.type !== 'pattern' && i.type !== 'youtube');
  const patternsToShow = patterns.length > 0 ? patterns : insights.filter(i => i.type === 'pattern');

  const TABS = [
    { key: 'insights', label: 'Insights',  count: insightsToShow.length },
    { key: 'patterns', label: 'Patterns',  count: patternsToShow.length },
  ];

  return (
    <div className="page-enter" style={{
      display: 'flex', flexDirection: 'column',
      height: '100dvh',
      paddingBottom: 'calc(80px + env(safe-area-inset-bottom))',
    }}>

      {/* ── Top header ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '24px 20px 0', flexShrink: 0,
      }}>
        <div>
          <div className="aegis-label">AEGIS · CORE</div>
          <div className="aegis-title">Commander</div>
          {user?.displayName && (
            <p style={{ fontSize: 13, color: '#52525b', marginTop: 4 }}>{user.displayName}</p>
          )}
        </div>
        <div style={{ marginRight: -4, marginTop: -8 }}>
          <NeuralSphere size={120} state={aiState} />
        </div>
      </div>

      {/* ── View toggle pills ── */}
      <div style={{ padding: '12px 20px 0', flexShrink: 0, display: 'flex', gap: 8 }}>
        {[
          { v: 'chat',     label: '💬 Chat' },
          { v: 'insights', label: '🧠 Insights' },
        ].map(({ v, label }) => (
          <button key={v} onClick={() => setActiveView(v)} style={{
            padding: '9px 20px', borderRadius: 999, border: 'none', cursor: 'pointer',
            background: activeView === v ? '#6e50be' : '#111118',
            color: activeView === v ? 'white' : '#71717a',
            fontSize: 13, fontWeight: 500,
            border: activeView === v ? 'none' : '1px solid rgba(255,255,255,0.06)',
            fontFamily: "'Inter',sans-serif", transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {/* ═══════════════════ CHAT VIEW ═══════════════════ */}
      {activeView === 'chat' && (
        <>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
            {messages.map((msg, i) => msg.role === 'assistant' ? (
              <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                  background: 'linear-gradient(135deg,#60a5fa,#6e50be)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={15} color="white" fill="white" />
                </div>
                <div style={{
                  background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px 18px 18px 18px', padding: '12px 14px',
                  maxWidth: '85%', fontSize: 14, lineHeight: 1.6, color: '#f1f5f9',
                }}>
                  {msg.content}
                </div>
              </div>
            ) : (
              <div key={i} style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <div style={{
                  background: '#6e50be', borderRadius: '18px 18px 4px 18px',
                  padding: '12px 14px', maxWidth: '80%',
                  fontSize: 14, color: 'white', lineHeight: 1.6,
                }}>
                  {msg.content}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'flex-start' }}>
                <div style={{
                  width: 34, height: 34, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#60a5fa,#6e50be)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Sparkles size={15} color="white" />
                </div>
                <div style={{
                  background: '#111118', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '4px 18px 18px 18px', padding: '14px 16px',
                }}>
                  <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                    {[0, 0.18, 0.36].map((d, i) => (
                      <div key={i} style={{
                        width: 6, height: 6, borderRadius: '50%', background: '#6e50be',
                        animation: `badgeDot 1s ease-in-out ${d}s infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick pills */}
          <div style={{
            display: 'flex', gap: 8, padding: '6px 16px', overflowX: 'auto', flexShrink: 0,
          }}>
            {QUICK.map(p => (
              <button key={p} className="aegis-pill"
                onClick={() => setInputText(p)}>{p}</button>
            ))}
          </div>

          {/* Input bar */}
          <div style={{
            display: 'flex', gap: 10, padding: '8px 16px 12px',
            flexShrink: 0, alignItems: 'center',
          }}>
            <input
              type="text"
              className="aegis-input"
              placeholder="Speak to AEGIS…"
              style={{ borderRadius: 999, flex: 1, padding: '12px 20px' }}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!inputText.trim() || chatLoading}
              style={{
                width: 46, height: 46, borderRadius: '50%', flexShrink: 0, border: 'none',
                background: 'linear-gradient(135deg,#60a5fa,#6e50be)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', opacity: (!inputText.trim() || chatLoading) ? 0.45 : 1,
                boxShadow: '0 0 16px rgba(99,102,241,0.35)',
              }}
            >
              <SendHorizontal size={18} color="white" />
            </button>
          </div>
        </>
      )}

      {/* ═══════════════════ INSIGHTS VIEW ═══════════════════ */}
      {activeView === 'insights' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 0' }}>

          {/* Analyze card */}
          <div className="aegis-card" style={{
            marginBottom: 12,
            background: 'linear-gradient(135deg,rgba(110,80,190,0.12),#111118)',
            border: '1px solid rgba(110,80,190,0.22)',
          }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
              <Sparkles size={22} color="#a78bfa" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ fontWeight: 600, color: '#f1f5f9', fontSize: 14, margin: '0 0 4px' }}>Run Full Analysis</p>
                <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>
                  Aegis will analyse all your data and generate new insights via Gemini AI.
                </p>
              </div>
            </div>
            <button onClick={handleAnalyze} disabled={analyzing} className="aegis-btn"
              style={{ opacity: analyzing ? 0.6 : 1 }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <RefreshCw size={16} style={{ animation: analyzing ? 'spin 1s linear infinite' : 'none' }} />
                {analyzing ? 'Analysing…' : 'Analyse My Data'}
              </span>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                flex: 1, padding: '9px 4px', borderRadius: 14, border: 'none', cursor: 'pointer',
                background: tab === t.key ? '#6e50be' : '#111118',
                color: tab === t.key ? 'white' : '#71717a',
                fontSize: 12, fontWeight: 600,
                border: tab === t.key ? 'none' : '1px solid rgba(255,255,255,0.06)',
                fontFamily: "'Inter',sans-serif",
              }}>
                {t.label} ({t.count})
              </button>
            ))}
          </div>

          {/* Insights */}
          {tab === 'insights' && (
            loading.insights ? <SkeletonList count={4} /> :
            insightsToShow.length === 0 ? (
              <div className="aegis-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <Zap size={32} color="#52525b" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>No insights yet</p>
                <p style={{ color: '#52525b', fontSize: 12, margin: '0 0 16px' }}>Run an analysis to get started</p>
                <button onClick={handleAnalyze} disabled={analyzing} className="aegis-btn"
                  style={{ opacity: analyzing ? 0.6 : 1 }}>
                  {analyzing ? 'Analysing…' : 'Run Analysis Now'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {insightsToShow.map(insight => {
                  const tc = getTC(insight);
                  const isExpanded = expandedId === insight.id;
                  const fb = feedbackSent[insight.id];
                  return (
                    <div key={insight.id} className="aegis-card"
                      style={{ background: `${tc.color}0a`, border: `1px solid ${tc.color}22` }}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'flex-start', gap: 12 }}
                      >
                        <span style={{ fontSize: 20, flexShrink: 0 }}>{tc.icon}</span>
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, color: tc.color, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>
                              {tc.label.toUpperCase()}
                            </span>
                            <span style={{ fontSize: 10, color: '#52525b' }}>{formatDate(insight.createdAt)}</span>
                          </div>
                          <p style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500, margin: 0 }}>
                            {insight.title || insight.pattern || 'AI Insight'}
                          </p>
                          {!isExpanded && (
                            <p style={{ fontSize: 12, color: '#71717a', marginTop: 4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                              {insight.description || insight.recommendation}
                            </p>
                          )}
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="#52525b" style={{ flexShrink: 0 }} />
                                    : <ChevronDown size={16} color="#52525b" style={{ flexShrink: 0 }} />}
                      </button>

                      {isExpanded && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <p style={{ fontSize: 14, color: '#f1f5f9', lineHeight: 1.6, marginBottom: 12 }}>
                            {insight.description || insight.recommendation}
                          </p>
                          {insight.actionItems?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <p style={{ fontSize: 11, color: tc.color, marginBottom: 6, fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>
                                ACTION ITEMS
                              </p>
                              {insight.actionItems.map((item, i) => (
                                <p key={i} style={{ fontSize: 12, color: '#a1a1aa', display: 'flex', gap: 6, marginBottom: 4 }}>
                                  <span style={{ color: tc.color }}>→</span> {item}
                                </p>
                              ))}
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            {['helpful','not_helpful'].map(type => (
                              <button key={type} onClick={() => handleFeedback(insight, type)} style={{
                                flex: 1, padding: '8px 0', borderRadius: 10, border: 'none', cursor: 'pointer',
                                background: fb === type
                                  ? (type === 'helpful' ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)')
                                  : '#18181f',
                                color: fb === type
                                  ? (type === 'helpful' ? '#34d399' : '#f87171')
                                  : '#52525b',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13,
                                fontFamily: "'Inter',sans-serif",
                              }}>
                                {type === 'helpful' ? <ThumbsUp size={14}/> : <ThumbsDown size={14}/>}
                                {type === 'helpful' ? 'Helpful' : 'Not Helpful'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* Patterns */}
          {tab === 'patterns' && (
            patternsLoading ? <SkeletonList count={3} /> :
            patternsToShow.length === 0 ? (
              <div className="aegis-card" style={{ textAlign: 'center', padding: '36px 20px' }}>
                <Brain size={32} color="#52525b" style={{ margin: '0 auto 12px' }} />
                <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14, margin: '0 0 6px' }}>No patterns learned yet</p>
                <p style={{ color: '#52525b', fontSize: 12, margin: 0 }}>Use the app consistently and run analyses regularly.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patternsToShow.map(p => {
                  const isExpanded = expandedId === p.id;
                  const conf = p.confidence ?? 0;
                  const confColor = conf >= 0.8 ? '#34d399' : conf >= 0.5 ? '#fbbf24' : '#fb923c';
                  return (
                    <div key={p.id} className="aegis-card">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'flex-start', gap: 10 }}
                      >
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <p style={{ fontSize: 14, color: '#f1f5f9', fontWeight: 500, margin: '0 0 5px' }}>
                            {p.pattern || p.title || 'Learned Pattern'}
                          </p>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {p.category && (
                              <span className="badge badge-purple">{p.category}</span>
                            )}
                            {conf > 0 && (
                              <span style={{ fontSize: 11, color: confColor }}>{Math.round(conf*100)}% confidence</span>
                            )}
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp size={16} color="#52525b" style={{ flexShrink: 0 }} />
                                    : <ChevronDown size={16} color="#52525b" style={{ flexShrink: 0 }} />}
                      </button>
                      {conf > 0 && (
                        <div style={{ marginTop: 8, height: 3, background: '#18181f', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${conf*100}%`, background: confColor, borderRadius: 999 }} />
                        </div>
                      )}
                      {isExpanded && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <p style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>
                            {p.description || p.recommendation}
                          </p>
                          {p.dataPoints && (
                            <p style={{ fontSize: 11, color: '#52525b', marginTop: 6 }}>
                              Based on {p.dataPoints} data points
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}

          <div style={{ height: 24 }} />
        </div>
      )}
    </div>
  );
}

function SkeletonList({ count }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="shimmer-skeleton" style={{ height: 72 }} />
      ))}
    </div>
  );
}

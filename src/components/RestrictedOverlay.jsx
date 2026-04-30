/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Restricted Overlay
 * ============================================================
 * Full-screen overlay shown when accountabilityLevel === 3.
 * Features:
 *  - NeuralSphere in "restricted" state
 *  - Animated warning text
 *  - Message input (min 50 chars) + "I'm back on track" button
 *  - Calls POST /api/ai/chat on submit → resets accountability
 * ============================================================
 */

import React, { useState, useEffect, useRef } from 'react';
import NeuralSphere from './NeuralSphere.jsx';
import { useData } from '../context/DataContext.jsx';
import api from '../api/apiClient.js';

// ── Animated glitch text ─────────────────────────────────────
const GLITCH_CHARS = '!@#$%^&*AEGIS01'.split('');
function useGlitchText(original, active) {
  const [display, setDisplay] = useState(original);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!active) { setDisplay(original); return; }
    let step = 0;
    const total = 18;
    const tick = () => {
      step++;
      setDisplay(
        original
          .split('')
          .map((ch, i) =>
            ch === ' '
              ? ' '
              : step < total - i * 0.6
              ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
              : ch
          )
          .join('')
      );
      if (step < total + original.length) {
        frameRef.current = setTimeout(tick, 38);
      } else {
        setDisplay(original);
      }
    };
    frameRef.current = setTimeout(tick, 120);
    return () => clearTimeout(frameRef.current);
  }, [original, active]);

  return display;
}

// ── Scanline overlay style ───────────────────────────────────
const scanlineStyle = {
  backgroundImage:
    'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,68,68,0.03) 2px, rgba(255,68,68,0.03) 4px)',
  pointerEvents: 'none',
};

// ── Pulsing dot indicator ────────────────────────────────────
function PulsingDot({ color = '#ff4444' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 10,
        height: 10,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}`,
        animation: 'aegis-blink 1s ease-in-out infinite',
        verticalAlign: 'middle',
        marginRight: 8,
      }}
    />
  );
}

// ── Main component ───────────────────────────────────────────
export default function RestrictedOverlay() {
  const { resetAccountability } = useData();

  const [showInput,   setShowInput]   = useState(false);
  const [message,     setMessage]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitted,   setSubmitted]   = useState(false);

  // Glitch effect fires once on mount, then loops every 8s
  const [glitchActive, setGlitchActive] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 1200);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const headingText  = useGlitchText('ACCESS RESTRICTED', glitchActive);
  const subText      = useGlitchText('UNRESOLVED COMMITMENTS', !glitchActive && glitchActive);

  const MIN_CHARS = 50;
  const remaining = Math.max(0, MIN_CHARS - message.length);
  const canSubmit = message.trim().length >= MIN_CHARS && !submitting;

  // ── Submit handler ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError('');
    try {
      await api.post('/ai/chat', {
        message: `User confirmed they are back on track. Their personal commitment: "${message.trim()}"`,
        context: 'accountability_reset',
      });
      setSubmitted(true);
      // Short delay so user sees success state before overlay closes
      setTimeout(() => {
        resetAccountability();
      }, 1800);
    } catch (err) {
      setSubmitError('Could not reach Aegis. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* ── Injected keyframes ─────────────────────────────── */}
      <style>{`
        @keyframes aegis-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }
        @keyframes aegis-fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes aegis-shake {
          0%, 100% { transform: translateX(0); }
          20%       { transform: translateX(-4px); }
          40%       { transform: translateX(4px); }
          60%       { transform: translateX(-3px); }
          80%       { transform: translateX(3px); }
        }
        @keyframes aegis-pulse-border {
          0%, 100% { border-color: rgba(255,68,68,0.4); }
          50%       { border-color: rgba(255,68,68,0.9); }
        }
        @keyframes aegis-success-pop {
          0%   { transform: scale(0.85); opacity: 0; }
          60%  { transform: scale(1.06); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        .aegis-restricted-overlay {
          animation: aegis-fadeIn 0.45s ease both;
        }
        .aegis-input-box:focus {
          outline: none;
          border-color: rgba(255,68,68,0.7) !important;
          box-shadow: 0 0 0 2px rgba(255,68,68,0.18);
        }
        .aegis-btn-track {
          transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
        }
        .aegis-btn-track:active {
          transform: scale(0.97);
        }
        .aegis-btn-track:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      {/* ── Backdrop ──────────────────────────────────────── */}
      <div
        className="aegis-restricted-overlay"
        style={{
          position:   'fixed',
          inset:       0,
          zIndex:      200,
          background: 'rgba(8,12,24,0.92)',
          backdropFilter: 'blur(2px)',
          display:    'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding:    '24px 20px',
          overflow:   'auto',
        }}
      >
        {/* Scanline texture */}
        <div style={{ ...scanlineStyle, position: 'absolute', inset: 0 }} />

        {/* ── Content card ──────────────────────────────── */}
        <div
          style={{
            position:     'relative',
            width:        '100%',
            maxWidth:     420,
            background:   'rgba(17,34,64,0.95)',
            border:       '1px solid rgba(255,68,68,0.35)',
            borderRadius: 16,
            padding:      '32px 24px 28px',
            animation:    'aegis-pulse-border 2.4s ease-in-out infinite',
            boxShadow:    '0 0 40px rgba(255,68,68,0.18), 0 8px 32px rgba(0,0,0,0.6)',
            textAlign:    'center',
          }}
        >

          {/* ── NeuralSphere in restricted state ────────── */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
            <NeuralSphere state="restricted" size={140} />
          </div>

          {/* ── Status line ─────────────────────────────── */}
          <div style={{ marginBottom: 12 }}>
            <PulsingDot color="#ff4444" />
            <span style={{
              fontFamily: "'Courier New', monospace",
              fontSize:   11,
              letterSpacing: 3,
              color:      '#ff6666',
              fontWeight: 700,
            }}>
              AEGIS SECURITY PROTOCOL ACTIVE
            </span>
          </div>

          {/* ── Heading ─────────────────────────────────── */}
          <h2
            style={{
              fontFamily:    "'Courier New', monospace",
              fontSize:      22,
              fontWeight:    900,
              color:         '#ff4444',
              letterSpacing: 3,
              margin:        '0 0 8px',
              textShadow:    '0 0 18px rgba(255,68,68,0.6)',
              lineHeight:    1.2,
            }}
          >
            {headingText}
          </h2>

          {/* ── Sub message ─────────────────────────────── */}
          <p
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize:   12,
              color:      '#ff8888',
              letterSpacing: 2,
              margin:     '0 0 20px',
            }}
          >
            {subText}
          </p>

          {/* ── Divider ─────────────────────────────────── */}
          <div style={{
            height: 1,
            background: 'linear-gradient(to right, transparent, rgba(255,68,68,0.4), transparent)',
            margin: '0 0 20px',
          }} />

          {/* ── Main message ────────────────────────────── */}
          {!submitted ? (
            <>
              <p style={{
                color:      '#cbd5e1',
                fontSize:   14,
                lineHeight: 1.6,
                margin:     '0 0 24px',
              }}>
                Aegis has restricted access.
                <br />
                <span style={{ color: '#94a3b8' }}>
                  You have unresolved commitments that require your attention before proceeding.
                </span>
              </p>

              {/* ── Button or input popup ──────────────── */}
              {!showInput ? (
                <button
                  className="aegis-btn-track"
                  onClick={() => setShowInput(true)}
                  style={{
                    width:        '100%',
                    padding:      '14px 24px',
                    background:   'linear-gradient(135deg, rgba(255,68,68,0.15), rgba(255,68,68,0.08))',
                    border:       '1px solid rgba(255,68,68,0.5)',
                    borderRadius: 10,
                    color:        '#ff8888',
                    fontFamily:   "'Courier New', monospace",
                    fontSize:     14,
                    fontWeight:   700,
                    letterSpacing: 1.5,
                    cursor:       'pointer',
                    boxShadow:    '0 0 16px rgba(255,68,68,0.12)',
                  }}
                >
                  ✅ I'M BACK ON TRACK
                </button>
              ) : (
                /* ── Message input popup ─────────────── */
                <div
                  style={{
                    background:   'rgba(10,22,40,0.8)',
                    border:       '1px solid rgba(255,68,68,0.3)',
                    borderRadius: 12,
                    padding:      '18px 16px 16px',
                    animation:    'aegis-fadeIn 0.3s ease both',
                  }}
                >
                  <p style={{
                    color:     '#94a3b8',
                    fontSize:  12,
                    margin:    '0 0 10px',
                    textAlign: 'left',
                    lineHeight: 1.5,
                  }}>
                    Tell Aegis what you're committing to right now.
                    <span style={{ color: '#ff8888' }}> (min {MIN_CHARS} characters)</span>
                  </p>

                  <textarea
                    className="aegis-input-box"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="e.g. I will complete my pending tasks today, focus on my goals, and log my activity every 2 hours..."
                    rows={4}
                    style={{
                      width:        '100%',
                      background:   'rgba(17,34,64,0.7)',
                      border:       '1px solid rgba(255,68,68,0.3)',
                      borderRadius: 8,
                      padding:      '10px 12px',
                      color:        '#e8eaf6',
                      fontSize:     13,
                      lineHeight:   1.6,
                      resize:       'vertical',
                      fontFamily:   'inherit',
                      boxSizing:    'border-box',
                      transition:   'border-color 0.2s, box-shadow 0.2s',
                    }}
                    disabled={submitting}
                    autoFocus
                  />

                  {/* Character counter */}
                  <div style={{
                    display:        'flex',
                    justifyContent: 'space-between',
                    alignItems:     'center',
                    margin:         '8px 0 12px',
                  }}>
                    <span style={{
                      fontSize: 11,
                      color:    remaining > 0 ? '#ff8888' : '#00ff88',
                      fontFamily: "'Courier New', monospace",
                    }}>
                      {remaining > 0
                        ? `${remaining} more characters needed`
                        : `✓ ${message.trim().length} characters`}
                    </span>
                    <button
                      onClick={() => { setShowInput(false); setMessage(''); setSubmitError(''); }}
                      style={{
                        background: 'none',
                        border:     'none',
                        color:      '#475569',
                        fontSize:   12,
                        cursor:     'pointer',
                        padding:    0,
                      }}
                    >
                      cancel
                    </button>
                  </div>

                  {/* Error message */}
                  {submitError && (
                    <p style={{
                      color:     '#ff6666',
                      fontSize:  12,
                      margin:    '0 0 10px',
                      animation: 'aegis-shake 0.4s ease',
                    }}>
                      {submitError}
                    </p>
                  )}

                  {/* Submit button */}
                  <button
                    className="aegis-btn-track"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    style={{
                      width:        '100%',
                      padding:      '13px 24px',
                      background:   canSubmit
                        ? 'linear-gradient(135deg, rgba(0,255,136,0.18), rgba(0,212,255,0.10))'
                        : 'rgba(255,255,255,0.04)',
                      border:       `1px solid ${canSubmit ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 10,
                      color:        canSubmit ? '#00ff88' : '#475569',
                      fontFamily:   "'Courier New', monospace",
                      fontSize:     13,
                      fontWeight:   700,
                      letterSpacing: 1.5,
                      cursor:       canSubmit ? 'pointer' : 'not-allowed',
                      boxShadow:    canSubmit ? '0 0 16px rgba(0,255,136,0.10)' : 'none',
                    }}
                  >
                    {submitting ? '⏳ CONTACTING AEGIS...' : '✅ SUBMIT COMMITMENT'}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── Success state ──────────────────────────── */
            <div style={{
              animation: 'aegis-success-pop 0.5s ease both',
              padding:   '12px 0',
            }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <p style={{
                color:      '#00ff88',
                fontFamily: "'Courier New', monospace",
                fontSize:   15,
                fontWeight: 700,
                letterSpacing: 2,
                margin:     '0 0 8px',
                textShadow: '0 0 12px rgba(0,255,136,0.5)',
              }}>
                COMMITMENT LOGGED
              </p>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: 0 }}>
                Aegis acknowledges your commitment.
                <br />Restrictions lifting…
              </p>
            </div>
          )}

          {/* ── Footer note ───────────────────────────────── */}
          {!submitted && (
            <p style={{
              marginTop:  20,
              fontSize:   11,
              color:      '#334155',
              lineHeight: 1.5,
            }}>
              Access will be restored for 24 hours after your commitment is received by Aegis.
            </p>
          )}
        </div>
      </div>
    </>
  );
}

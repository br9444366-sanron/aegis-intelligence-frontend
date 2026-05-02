/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Cinematic Boot Loader
 * ============================================================
 * Replaces the plain spinner with a full cinematic
 * initialization sequence. Drop-in replacement — same props:
 *   <LoadingSpinner fullScreen message="Initializing Aegis..." />
 * ============================================================
 */
import React, { useEffect, useState, useRef } from 'react';

// Boot sequence lines that scroll during initialization
const BOOT_LINES = [
  'AEGIS INTELLIGENCE v2.1',
  'Establishing secure connection...',
  'Loading neural core modules...',
  'Verifying user credentials...',
  'Syncing pattern memory...',
  'Calibrating accountability engine...',
  'System ready.',
];

// Hex grid background — purely decorative SVG pattern
function HexGrid() {
  return (
    <svg
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%',
        opacity: 0.04, pointerEvents: 'none',
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
          <polygon
            points="28,2 52,14 52,34 28,46 4,34 4,14"
            fill="none" stroke="#00d4ff" strokeWidth="0.8"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

// Animated corner brackets
function CornerBrackets() {
  const s = { position: 'absolute', width: 28, height: 28 };
  const line = { stroke: '#00d4ff', strokeWidth: 2, fill: 'none', opacity: 0.7 };
  return (
    <>
      {/* Top-left */}
      <svg style={{ ...s, top: 24, left: 24 }} viewBox="0 0 28 28">
        <polyline points="0,14 0,0 14,0" {...line} />
      </svg>
      {/* Top-right */}
      <svg style={{ ...s, top: 24, right: 24 }} viewBox="0 0 28 28">
        <polyline points="28,14 28,0 14,0" {...line} />
      </svg>
      {/* Bottom-left */}
      <svg style={{ ...s, bottom: 24, left: 24 }} viewBox="0 0 28 28">
        <polyline points="0,14 0,28 14,28" {...line} />
      </svg>
      {/* Bottom-right */}
      <svg style={{ ...s, bottom: 24, right: 24 }} viewBox="0 0 28 28">
        <polyline points="28,14 28,28 14,28" {...line} />
      </svg>
    </>
  );
}

// Pulsing ring around the logo
function PulseRings() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          borderRadius: '50%',
          border: '1px solid rgba(0,212,255,0.25)',
          animation: `aegis-ring-pulse 3s ease-out ${i * 1}s infinite`,
        }} />
      ))}
    </div>
  );
}

// Hexagonal logo mark
function AegisLogo({ size = 80 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="100%" stopColor="#6e50be" />
        </linearGradient>
        <filter id="logoGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      {/* Outer hex */}
      <polygon
        points="40,4 72,22 72,58 40,76 8,58 8,22"
        stroke="url(#logoGrad)" strokeWidth="1.5" fill="none"
        filter="url(#logoGlow)"
      />
      {/* Inner hex */}
      <polygon
        points="40,16 62,28 62,52 40,64 18,52 18,28"
        stroke="rgba(0,212,255,0.35)" strokeWidth="1" fill="rgba(0,212,255,0.04)"
      />
      {/* Lightning bolt */}
      <path
        d="M44 20 L32 42 L40 42 L36 60 L52 36 L43 36 Z"
        fill="url(#logoGrad)" filter="url(#logoGlow)"
      />
    </svg>
  );
}

// Animated scan line that sweeps down
function ScanLine() {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, height: 2,
      background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.6), transparent)',
      animation: 'aegis-scan 3s linear infinite',
      pointerEvents: 'none',
    }} />
  );
}

// Progress bar
function ProgressBar({ progress }) {
  return (
    <div style={{
      width: '100%', height: 2,
      background: 'rgba(0,212,255,0.1)',
      borderRadius: 1, overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        height: '100%',
        width: `${progress}%`,
        background: 'linear-gradient(90deg, #6e50be, #00d4ff)',
        borderRadius: 1,
        transition: 'width 0.4s ease',
        boxShadow: '0 0 8px rgba(0,212,255,0.8)',
      }} />
    </div>
  );
}

export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [progress,     setProgress]     = useState(0);
  const [cursorOn,     setCursorOn]     = useState(true);
  const intervalRef = useRef(null);

  // Determine which boot lines to show based on message
  const lines = message.toLowerCase().includes('initializing')
    ? BOOT_LINES
    : ['System module loading...', message, 'Please wait...'];

  useEffect(() => {
    // Reveal boot lines one by one
    let line = 0;
    intervalRef.current = setInterval(() => {
      line++;
      setVisibleLines(line);
      setProgress(Math.min(95, Math.round((line / lines.length) * 100)));
      if (line >= lines.length) clearInterval(intervalRef.current);
    }, 420);

    // Blinking cursor
    const cursorTimer = setInterval(() => setCursorOn(p => !p), 530);

    return () => {
      clearInterval(intervalRef.current);
      clearInterval(cursorTimer);
    };
  }, [lines.length]);

  const content = (
    <>
      {/* Keyframe styles injected inline */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@700;900&display=swap');

        @keyframes aegis-ring-pulse {
          0%   { width: 90px;  height: 90px;  opacity: 0.6; }
          100% { width: 280px; height: 280px; opacity: 0;   }
        }
        @keyframes aegis-scan {
          0%   { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes aegis-flicker {
          0%, 95%, 100% { opacity: 1; }
          96%           { opacity: 0.7; }
          97%           { opacity: 1; }
          98%           { opacity: 0.5; }
        }
        @keyframes aegis-logo-in {
          0%   { opacity: 0; transform: scale(0.7) translateY(10px); filter: brightness(3); }
          60%  { filter: brightness(1.5); }
          100% { opacity: 1; transform: scale(1) translateY(0);    filter: brightness(1); }
        }
        @keyframes aegis-fade-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        @keyframes aegis-glow-pulse {
          0%, 100% { text-shadow: 0 0 8px rgba(0,212,255,0.4); }
          50%       { text-shadow: 0 0 20px rgba(0,212,255,0.9), 0 0 40px rgba(0,212,255,0.3); }
        }
        .aegis-logo-enter {
          animation: aegis-logo-in 0.9s cubic-bezier(0.16,1,0.3,1) forwards;
        }
        .aegis-title-glow {
          animation: aegis-glow-pulse 2.5s ease-in-out infinite, aegis-flicker 8s linear infinite;
        }
      `}</style>

      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
        width: '100%',
        maxWidth: 320,
        padding: '0 24px',
      }}>

        {/* Pulse rings behind logo */}
        <PulseRings />

        {/* Logo */}
        <div className="aegis-logo-enter" style={{ marginBottom: 24, position: 'relative', zIndex: 1 }}>
          <AegisLogo size={76} />
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            className="aegis-title-glow"
            style={{
              fontFamily: "'Orbitron', monospace",
              fontWeight: 900,
              fontSize: 22,
              letterSpacing: '0.18em',
              color: '#00d4ff',
              marginBottom: 4,
            }}
          >
            AEGIS
          </div>
          <div style={{
            fontFamily: "'Share Tech Mono', monospace",
            fontSize: 10,
            letterSpacing: '0.35em',
            color: 'rgba(0,212,255,0.45)',
            textTransform: 'uppercase',
          }}>
            Intelligence v2.1
          </div>
        </div>

        {/* Terminal boot log */}
        <div style={{
          width: '100%',
          background: 'rgba(0,212,255,0.03)',
          border: '1px solid rgba(0,212,255,0.12)',
          borderRadius: 6,
          padding: '14px 16px',
          marginBottom: 20,
          minHeight: 130,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Scan line inside terminal */}
          <ScanLine />

          {/* Terminal header dots */}
          <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
            {['#ff5f57','#febc2e','#28c840'].map(c => (
              <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', background: c, opacity: 0.5 }} />
            ))}
          </div>

          {lines.slice(0, visibleLines).map((line, i) => (
            <div
              key={i}
              style={{
                fontFamily: "'Share Tech Mono', monospace",
                fontSize: 11,
                color: i === 0 ? '#00d4ff' : i === lines.length - 1 && visibleLines === lines.length
                  ? '#00ff88' : 'rgba(0,212,255,0.65)',
                marginBottom: 4,
                animation: 'aegis-fade-up 0.3s ease forwards',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ color: 'rgba(0,212,255,0.3)' }}>›</span>
              {line}
              {i === visibleLines - 1 && (
                <span style={{ opacity: cursorOn ? 1 : 0, color: '#00d4ff' }}>█</span>
              )}
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', marginBottom: 10 }}>
          <ProgressBar progress={progress} />
        </div>

        {/* Progress label */}
        <div style={{
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 10,
          color: 'rgba(0,212,255,0.35)',
          letterSpacing: '0.15em',
          alignSelf: 'flex-end',
        }}>
          {progress}%
        </div>

        {/* Bottom status row */}
        <div style={{
          marginTop: 28,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontFamily: "'Share Tech Mono', monospace",
          fontSize: 9,
          color: 'rgba(0,212,255,0.25)',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: '#00ff88',
            boxShadow: '0 0 6px #00ff88',
            animation: 'aegis-glow-pulse 1.5s ease-in-out infinite',
          }} />
          Secure Channel Active
        </div>
      </div>
    </>
  );

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: '#080f1e',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
      }}>
        <HexGrid />
        <CornerBrackets />

        {/* Radial glow behind content */}
        <div style={{
          position: 'absolute',
          width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {content}
      </div>
    );
  }

  // Inline (non-fullscreen) version
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 32, background: '#080f1e', borderRadius: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      {content}
    </div>
  );
}

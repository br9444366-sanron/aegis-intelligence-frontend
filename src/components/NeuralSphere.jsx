/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — NeuralSphere Component
 * Pure SVG sphere with 3D shading, no canvas, no WebGL.
 * ============================================================
 */

export default function NeuralSphere({ state = 'idle', size = 220, showScore = false, score = '0/100' }) {
  const half = size / 2;
  const R = size * 0.34;

  const CFG = {
    idle:       { c1: '#c4b5fd', c2: '#6e50be', c3: '#2d1b69', c4: '#0d0028', glow: 'rgba(110,80,190,0.45)' },
    thinking:   { c1: '#e0e7ff', c2: '#818cf8', c3: '#3730a3', c4: '#0f0a2e', glow: 'rgba(129,140,248,0.55)' },
    alert:      { c1: '#fef3c7', c2: '#d97706', c3: '#78350f', c4: '#1c0a00', glow: 'rgba(217,119,6,0.50)'   },
    restricted: { c1: '#fee2e2', c2: '#dc2626', c3: '#7f1d1d', c4: '#1a0000', glow: 'rgba(220,38,38,0.50)'   },
  };
  const c = CFG[state] || CFG.idle;
  const uid = 'ns_' + state;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      animation: 'sphereFloat 4s ease-in-out infinite',
      position: 'relative',
    }}>
      <div style={{
        animation: 'spherePulse 3s ease-in-out infinite',
        position: 'relative',
        width: size,
        height: size,
      }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">
          <defs>
            <radialGradient id={`${uid}_sg`} cx="45%" cy="32%" r="68%">
              <stop offset="0%"   stopColor={c.c1} stopOpacity="0.95" />
              <stop offset="30%"  stopColor={c.c2} />
              <stop offset="65%"  stopColor={c.c3} />
              <stop offset="100%" stopColor={c.c4} />
            </radialGradient>

            <radialGradient id={`${uid}_ag`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={c.glow} stopOpacity="0.9" />
              <stop offset="50%"  stopColor={c.glow} stopOpacity="0.35" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>

            <filter id={`${uid}_blur`} x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation={size * 0.025} />
            </filter>
          </defs>

          {/* Layer 1: Ambient glow */}
          <circle cx={half} cy={half} r={size * 0.50}
            fill={`url(#${uid}_ag)`} />

          {/* Layer 2: Outer halo ring */}
          <circle cx={half} cy={half} r={size * 0.42}
            fill="none" stroke={c.glow} strokeWidth="1"
            strokeDasharray="5 4" opacity="0.35" />

          {/* Layer 3: Inner halo ring */}
          <circle cx={half} cy={half} r={size * 0.37}
            fill="none" stroke={c.glow} strokeWidth="0.8" opacity="0.25" />

          {/* Layer 4: Main sphere */}
          <circle cx={half} cy={half} r={R}
            fill={`url(#${uid}_sg)`} />

          {/* Layer 5: Large soft specular highlight */}
          <ellipse
            cx={half * 0.92} cy={half * 0.72}
            rx={R * 0.42} ry={R * 0.28}
            fill="white" opacity="0.22"
            filter={`url(#${uid}_blur)`} />

          {/* Layer 6: Crisp small specular dot */}
          <ellipse
            cx={half * 0.88} cy={half * 0.70}
            rx={R * 0.14} ry={R * 0.09}
            fill="white" opacity="0.70" />

          {/* Layer 7: Score text overlay */}
          {showScore && (
            <>
              <text x={half} y={half - 8}
                textAnchor="middle" dominantBaseline="middle"
                fill="rgba(255,255,255,0.55)"
                fontFamily="'JetBrains Mono',monospace"
                fontSize={size * 0.065}
                letterSpacing="0.15em"
                fontWeight="500">
                SCORE
              </text>
              <text x={half} y={half + size * 0.095}
                textAnchor="middle" dominantBaseline="middle"
                fill="white"
                fontFamily="'Inter',sans-serif"
                fontSize={size * 0.135}
                fontWeight="700">
                {score}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

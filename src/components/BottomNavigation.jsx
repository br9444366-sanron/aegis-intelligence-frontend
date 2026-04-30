/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Bottom Navigation (4 slots)
 * Home | Scores | AI Commander | YouTube | Settings
 * ============================================================
 * Removed: centre AI FAB (merged into AI Commander slot)
 * Added: YouTube as 4th nav item, Settings as 5th
 * ============================================================
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Brain, Youtube, Settings } from 'lucide-react';

const NAV = [
  { to: '/',          icon: Home,     label: 'Home',    end: true  },
  { to: '/scores',    icon: BarChart2, label: 'Scores'             },
  { to: '/ai-memory', icon: Brain,    label: 'AI',      highlight: true },
  { to: '/youtube',   icon: Youtube,  label: 'Watch'              },
  { to: '/settings',  icon: Settings, label: 'Settings'           },
];

export default function BottomNavigation() {
  return (
    <nav style={{
      position: 'fixed',
      bottom: 'calc(16px + env(safe-area-inset-bottom))',
      left: 16, right: 16,
      zIndex: 40,
      background: 'rgba(12,12,18,0.97)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderRadius: 999,
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.70)',
      padding: '10px 8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
    }}>
      {NAV.map(({ to, icon: Icon, label, end, highlight }) => (
        <NavLink key={to} to={to} end={end} style={{ textDecoration: 'none', flex: 1 }}>
          {({ isActive }) => (
            <div style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: highlight ? '6px 0' : '6px 0',
            }}>
              {/* Highlight glow pill for AI button */}
              {highlight && isActive && (
                <div style={{
                  position: 'absolute', inset: '-4px -12px',
                  background: 'rgba(110,80,190,0.15)',
                  borderRadius: 999,
                  border: '1px solid rgba(110,80,190,0.25)',
                }} />
              )}

              <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.6}
                color={
                  isActive
                    ? (highlight ? '#a78bfa' : '#a78bfa')
                    : '#3a3a4e'
                }
                style={{ position: 'relative' }}
              />
              <span style={{
                fontSize: 9,
                fontFamily: "'JetBrains Mono',monospace",
                letterSpacing: '0.05em',
                color: isActive ? '#a78bfa' : '#3a3a4e',
                fontWeight: isActive ? 600 : 400,
                position: 'relative',
              }}>
                {label.toUpperCase()}
              </span>

              {/* Active indicator dot */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  bottom: -6,
                  width: 4, height: 4,
                  borderRadius: '50%',
                  background: '#7c5af6',
                }} />
              )}
            </div>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

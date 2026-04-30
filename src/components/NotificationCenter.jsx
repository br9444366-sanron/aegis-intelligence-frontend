import { useMemo } from 'react';
import { useNotifications } from '../context/NotificationContext';

// ─── Time-ago helper ─────────────────────────────────────────────────────────
function timeAgo(dateValue) {
  if (!dateValue) return '';
  const date =
    dateValue?.toDate?.() ??
    (typeof dateValue === 'string' || typeof dateValue === 'number'
      ? new Date(dateValue)
      : dateValue);
  const diffMs = Date.now() - date.getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ─── Notification type config ─────────────────────────────────────────────────
const TYPE_CONFIG = {
  'activity-prompt': {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    color: '#00d4ff', bg: 'rgba(0,212,255,0.10)', border: 'rgba(0,212,255,0.25)', label: 'Activity',
  },
  insight: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
    color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)', label: 'Insight',
  },
  reminder: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    color: '#00ff88', bg: 'rgba(0,255,136,0.08)', border: 'rgba(0,255,136,0.22)', label: 'Reminder',
  },
  deadline: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    color: '#ffaa00', bg: 'rgba(255,170,0,0.10)', border: 'rgba(255,170,0,0.25)', label: 'Deadline',
  },
  warning: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:18,height:18}}>
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    color: '#ff4444', bg: 'rgba(255,68,68,0.10)', border: 'rgba(255,68,68,0.25)', label: 'Warning',
  },
};

const DEFAULT_CFG = TYPE_CONFIG['reminder'];

// ─── Single notification row ──────────────────────────────────────────────────
function NotificationItem({ notification, onRead }) {
  const cfg = TYPE_CONFIG[notification.type] ?? DEFAULT_CFG;

  return (
    <button
      onClick={() => !notification.read && onRead(notification.id)}
      style={{
        background: notification.read ? 'rgba(17,34,64,0.45)' : 'rgba(17,34,64,0.88)',
        border: `1px solid ${notification.read ? 'rgba(255,255,255,0.06)' : cfg.border}`,
        borderLeft: `3px solid ${notification.read ? 'rgba(255,255,255,0.08)' : cfg.color}`,
        transition: 'all 0.18s ease',
        width: '100%',
        textAlign: 'left',
        borderRadius: 12,
        padding: '12px 14px',
        marginBottom: 8,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        cursor: notification.read ? 'default' : 'pointer',
      }}
    >
      {/* Icon */}
      <span style={{
        color: cfg.color,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        minWidth: 34, height: 34,
        borderRadius: 9,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {cfg.icon}
      </span>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{
            color: notification.read ? '#5e7490' : '#e2e8f0',
            fontSize: 13, fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {notification.title}
          </span>
          <span style={{ color: '#4a5568', fontSize: 11, flexShrink: 0 }}>
            {timeAgo(notification.createdAt)}
          </span>
        </div>

        <p style={{
          color: notification.read ? '#3d5166' : '#7a90a8',
          fontSize: 12, lineHeight: 1.5, margin: 0,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {notification.message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <span style={{
            color: cfg.color, background: cfg.bg,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            textTransform: 'uppercase', padding: '2px 6px', borderRadius: 4,
          }}>
            {cfg.label}
          </span>
          {!notification.read && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: cfg.color,
              animation: 'aegis-pulse 2s ease-in-out infinite',
            }} />
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{ padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.18)',
        color: '#00d4ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 14,
      }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:26,height:26}}>
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <p style={{ color: '#cbd5e0', fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>You're all caught up ✓</p>
      <p style={{ color: '#4a5568', fontSize: 12, margin: 0 }}>No new notifications right now.</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function NotificationCenter({ onClose }) {
  const { notifications, unreadCount, loading, markAsRead, markAllRead } = useNotifications();

  const sorted = useMemo(() => {
    return [...notifications].sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1;
      const getTime = (v) => v?.toDate?.()?.getTime() ?? new Date(v).getTime() ?? 0;
      return getTime(b.createdAt) - getTime(a.createdAt);
    });
  }, [notifications]);

  return (
    <>
      {/* Keyframe for unread pulse dot */}
      <style>{`
        @keyframes aegis-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>

      <div style={{
        background: '#0a1628',
        border: '1px solid rgba(0,212,255,0.16)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,212,255,0.05)',
        borderRadius: 18,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        maxWidth: 360,
        maxHeight: '80vh',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(0,212,255,0.10)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#e2e8f0', fontWeight: 700, fontSize: 13, letterSpacing: '0.03em' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{
                background: '#00d4ff', color: '#0a1628',
                fontSize: 10, fontWeight: 900,
                padding: '2px 6px', borderRadius: 99, minWidth: 18, textAlign: 'center',
              }}>
                {unreadCount}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{ color: '#00d4ff', fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Mark all read
              </button>
            )}
            {onClose && (
              <button
                onClick={onClose}
                style={{ color: '#4a5568', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:16,height:16}}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', padding: '10px 12px', flex: 1 }}>
          {loading && notifications.length === 0 ? (
            <div style={{ padding: '40px 0', textAlign: 'center', color: '#2d4a6e', fontSize: 12 }}>
              Loading...
            </div>
          ) : sorted.length === 0 ? (
            <EmptyState />
          ) : (
            sorted.map((n) => (
              <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
            ))
          )}
        </div>
      </div>
    </>
  );
}

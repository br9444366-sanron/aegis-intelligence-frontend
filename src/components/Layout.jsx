/**
 * Layout — no more onChatOpen prop (chat is now inside AIMemory page)
 */
import React, { useEffect, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from './BottomNavigation.jsx';
import RestrictedOverlay from './RestrictedOverlay.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useData } from '../context/DataContext.jsx';

export default function Layout() {
  const { addNotification }         = useNotifications();
  const { accountabilityLevel }     = useData();
  const firedLevel2Notif            = useRef(false);

  useEffect(() => {
    if (accountabilityLevel === 2 && !firedLevel2Notif.current) {
      firedLevel2Notif.current = true;
      if (typeof addNotification === 'function') {
        addNotification({
          title:   '⚠️ Aegis Warning',
          message: 'Your scores have been consistently low. Time to refocus.',
          type:    'warning',
        });
      }
    }
    if (accountabilityLevel < 2) firedLevel2Notif.current = false;
  }, [accountabilityLevel, addNotification]);

  const BANNERS = {
    1: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)', msg: 'Aegis notices you need more attention. Keep pushing.' },
    2: { color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.20)', msg: 'Aegis Warning: Your progress needs urgent attention.' },
    3: { color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.20)', msg: 'Critical accountability. Restricted mode active.' },
  };
  const banner = BANNERS[accountabilityLevel] || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', background: '#09090f' }}>
      <main
        style={{
          flex: 1, overflowY: 'auto', paddingBottom: 120,
          ...(accountabilityLevel >= 3
            ? { filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none' }
            : {}),
        }}
        className="page-enter"
      >
        {banner && (
          <div style={{
            margin: '16px 20px 0',
            background: banner.bg, border: `1px solid ${banner.border}`,
            borderRadius: 12, padding: '10px 16px',
            display: 'flex', alignItems: 'center', gap: 10,
            fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: banner.color,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: banner.color,
              flexShrink: 0, animation: 'badgeDot 1.4s ease-in-out infinite',
            }} />
            {banner.msg}
          </div>
        )}
        <Outlet />
      </main>

      {accountabilityLevel >= 3 && <RestrictedOverlay />}
      <BottomNavigation />
    </div>
  );
}

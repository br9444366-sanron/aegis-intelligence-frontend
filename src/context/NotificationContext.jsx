import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../api/apiClient';

const NotificationContext = createContext(null);

// Random delay: fully spread — 5 minutes to 3 hours.
// Each cycle independently re-rolls so there is no detectable pattern.
const randDelay = () => {
  const MIN = 5 * 60 * 1000;       // 5 minutes
  const MAX = 3 * 60 * 60 * 1000;  // 3 hours
  return MIN + Math.random() * (MAX - MIN);
};

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      const list = data.notifications ?? data ?? [];
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.read).length);
    } catch (err) {
      console.error('[NotificationContext] fetch error:', err);
    }
  }, []);

  // Start / stop polling based on auth state
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Initial fetch on login
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));

    // Recursive setTimeout — each cycle picks a brand-new random delay
    const scheduleNext = () => {
      timerRef.current = setTimeout(async () => {
        await fetchNotifications();
        scheduleNext();
      }, randDelay());
    };

    scheduleNext();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [user, fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] markAsRead error:', err);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] markAllRead error:', err);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, loading, markAsRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import apiClient from '../api/apiClient';

const NotificationContext = createContext(null);

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

const pushSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(false);
  const [pushEnabled,   setPushEnabled]   = useState(false);
  const [pushError,     setPushError]     = useState(null);
  const pollingRef      = useRef(null);
  const swRegRef        = useRef(null);
  const subscriptionRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await apiClient.get('/notifications');
      const list = data.notifications ?? data ?? [];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (err) { console.error('[NotificationContext] fetch error:', err); }
  }, []);

  const subscribeToPush = useCallback(async (swReg) => {
    if (!pushSupported()) return;
    if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) {
      console.warn('[Push] VITE_VAPID_PUBLIC_KEY not set.'); return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;
      let sub = await swReg.pushManager.getSubscription();
      if (!sub) {
        sub = await swReg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });
      }
      subscriptionRef.current = sub;
      await apiClient.post('/notifications/subscribe', { subscription: sub.toJSON() });
      setPushEnabled(true); setPushError(null);
    } catch (err) { console.error('[Push] Subscription failed:', err); setPushError(err.message); }
  }, []);

  const unsubscribeFromPush = useCallback(async () => {
    try {
      if (subscriptionRef.current) { await subscriptionRef.current.unsubscribe(); subscriptionRef.current = null; }
      await apiClient.delete('/notifications/subscribe').catch(() => {});
      setPushEnabled(false);
    } catch (err) { console.error('[Push] Unsubscribe error:', err); }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]); setUnreadCount(0); setPushEnabled(false);
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      // Only call unsubscribeFromPush if we had an active subscription (avoid 401 on logout/load)
      if (subscriptionRef.current) unsubscribeFromPush();
      return;
    }
    setLoading(true);
    fetchNotifications().finally(() => setLoading(false));
    pollingRef.current = setInterval(fetchNotifications, 60_000);
    if (pushSupported()) {
      navigator.serviceWorker.ready.then(reg => { swRegRef.current = reg; return subscribeToPush(reg); })
        .catch(err => console.error('[Push] SW ready error:', err));
    }
    return () => { if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; } };
  }, [user, fetchNotifications, subscribeToPush, unsubscribeFromPush]);

  useEffect(() => {
    const onMessage = (event) => { if (event.data?.type === 'AEGIS_PUSH_RECEIVED') fetchNotifications(); };
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => navigator.serviceWorker?.removeEventListener('message', onMessage);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      await apiClient.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { console.error('[NotificationContext] markAsRead error:', err); }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true }))); setUnreadCount(0);
    } catch (err) { console.error('[NotificationContext] markAllRead error:', err); }
  }, []);

  const enablePush = useCallback(async () => {
    if (!swRegRef.current) {
      try { swRegRef.current = await navigator.serviceWorker.ready; }
      catch { setPushError('Service worker not available'); return; }
    }
    await subscribeToPush(swRegRef.current);
  }, [subscribeToPush]);

  const disablePush = useCallback(async () => { await unsubscribeFromPush(); }, [unsubscribeFromPush]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, loading, pushEnabled, pushError, markAsRead, markAllRead, enablePush, disablePush }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
}

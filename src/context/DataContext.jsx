import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../api/apiClient.js';
import { useAuth } from './AuthContext';
import { isToday, parseISO } from 'date-fns';

const DataContext = createContext(null);

const DEFAULT_STATE   = { goals:[], schedule:[], diary:[], activityLog:[], events:[], scores:[], insights:[] };
const DEFAULT_LOADING = { goals:true, schedule:true, diary:true, activityLog:true, events:true, scores:true, insights:true };

function isNewUser(user) {
  if (!user?.metadata?.creationTime) return false;
  return Date.now() - new Date(user.metadata.creationTime).getTime() < 72 * 60 * 60 * 1000;
}

export function DataProvider({ children }) {
  const { user } = useAuth();
  const [data,                setData]                = useState(DEFAULT_STATE);
  const [loading,             setLoading]             = useState(DEFAULT_LOADING);
  const [accountabilityLevel, setAccountabilityLevel] = useState(0);
  const [autoScore,           setAutoScore]           = useState(null);
  const fetchedRef = useRef(false);

  const fetchOne = useCallback(async (key, endpoint) => {
    try {
      const { data: res } = await api.get(endpoint);
      setData(prev => ({ ...prev, [key]: res.data || [] }));
    } catch (err) {
      console.warn(`[DataContext] fetch ${key} failed:`, err.message);
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, []);

  const fetchAll = useCallback(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(DEFAULT_LOADING);
    fetchOne('goals',       '/goals');
    fetchOne('schedule',    '/schedule');
    fetchOne('diary',       '/diary');
    fetchOne('activityLog', '/activity-log');
    fetchOne('events',      '/events');
    fetchOne('scores',      '/scores');
    fetchOne('insights',    '/ai/insights');
  }, [fetchOne]);

  useEffect(() => { if (user) { fetchedRef.current = false; fetchAll(); } }, [user, fetchAll]);

  const refetch = useCallback((key) => {
    const MAP = { goals:'/goals', schedule:'/schedule', diary:'/diary',
      activityLog:'/activity-log', events:'/events', scores:'/scores', insights:'/ai/insights' };
    if (MAP[key]) { setLoading(prev => ({ ...prev, [key]: true })); fetchOne(key, MAP[key]); }
  }, [fetchOne]);

  useEffect(() => {
    const todayTasks = data.schedule.filter(t => {
      try { const d = t.date || t.scheduledDate; return d && isToday(d.toDate ? d.toDate() : parseISO(d)); } catch { return false; }
    });
    const completedTasks = todayTasks.filter(t => t.completed);
    const todayDiary = data.diary.find(e => { try { return isToday(parseISO(e.date || e.createdAt)); } catch { return false; } });
    const todayActivity = data.activityLog.filter(a => { try { return isToday(parseISO(a.createdAt)); } catch { return false; } });

    const taskRatio    = todayTasks.length > 0 ? completedTasks.length / todayTasks.length : 0;
    const productivity = Math.round(taskRatio * 10);
    const discipline   = todayTasks.length === 0 ? 5 : Math.min(10, Math.round(taskRatio * 10));
    const mindset      = todayDiary ? Math.min(10, 6 + (todayDiary.mood || 3)) : 3;
    const health       = Math.min(10, todayActivity.filter(a => a.activityType === 'health').length   * 3 + 4);
    const learning     = Math.min(10, todayActivity.filter(a => a.activityType === 'learning').length * 2 + 3);
    const social       = Math.min(10, todayActivity.filter(a => a.activityType === 'social').length   * 2 + 3);
    const categories   = { productivity, discipline, mindset, health, learning, social };
    const overall      = parseFloat((Object.values(categories).reduce((a,b) => a+b, 0) / 6).toFixed(1));
    setAutoScore({ categories, overall });

    if (isNewUser(user)) { setAccountabilityLevel(0); return; }

    const recent    = data.scores.slice(0, 3);
    const avgRecent = recent.length ? recent.reduce((s,sc) => s + (sc.overall ?? 5), 0) / recent.length : overall;
    const lastActivity = data.activityLog[0];
    const activityGap  = lastActivity ? (Date.now() - new Date(lastActivity.createdAt).getTime()) / 3600000 : 999;

    if      (activityGap > 48 && overall < 3)        setAccountabilityLevel(4);
    else if (avgRecent < 3 && recent.length >= 3)     setAccountabilityLevel(3);
    else if (avgRecent < 4 && recent.length >= 2)     setAccountabilityLevel(2);
    else if (overall < 5)                             setAccountabilityLevel(1);
    else                                              setAccountabilityLevel(0);
  }, [data.schedule, data.diary, data.activityLog, data.scores, user]);

  const addItem    = (key, item)       => setData(p => ({ ...p, [key]: [item, ...p[key]] }));
  const updateItem = (key, id, patch)  => setData(p => ({ ...p, [key]: p[key].map(i => i.id === id ? { ...i, ...patch } : i) }));
  const removeItem = (key, id)         => setData(p => ({ ...p, [key]: p[key].filter(i => i.id !== id) }));

  return (
    <DataContext.Provider value={{ ...data, loading, refetch, addItem, updateItem, removeItem, accountabilityLevel, autoScore }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used inside DataProvider');
  return ctx;
};

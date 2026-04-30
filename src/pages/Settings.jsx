/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Settings Page
 * ============================================================
 * - Username display/edit (saved to Firestore via backend)
 * - Notifications on/off (saved to backend)
 * - Delete all data (with confirmation)
 * - Sign out
 * ============================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import {
  User, Bell, Trash2, LogOut,
  ChevronRight, Check, X, Shield,
} from 'lucide-react';
import NeuralSphere from '../components/NeuralSphere.jsx';

export default function Settings() {
  const { user, signOut } = useAuth();

  const [username,      setUsername]      = useState('');
  const [editingName,   setEditingName]   = useState(false);
  const [nameInput,     setNameInput]     = useState('');
  const [savingName,    setSavingName]    = useState(false);
  const [notifOn,       setNotifOn]       = useState(true);
  const [savingNotif,   setSavingNotif]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [confirmText,   setConfirmText]   = useState('');

  // ── Load user profile ────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/users/me');
        const profile = data.data || {};
        setUsername(profile.displayName || user?.displayName || '');
        setNotifOn(profile.notifications !== false);
      } catch {
        setUsername(user?.displayName || '');
      }
    };
    load();
  }, [user]);

  // ── Save username ─────────────────────────────────────────
  const handleSaveName = async () => {
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await api.put('/users/me', { displayName: nameInput.trim() });
      setUsername(nameInput.trim());
      setEditingName(false);
      toast.success('Name updated!');
    } catch (err) {
      toast.error(err.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  // ── Toggle notifications ──────────────────────────────────
  const handleToggleNotif = async () => {
    const newVal = !notifOn;
    setNotifOn(newVal);
    setSavingNotif(true);
    try {
      await api.patch('/users/me/preferences', { notifications: newVal });
      toast.success(newVal ? 'Notifications enabled' : 'Notifications disabled');
    } catch (err) {
      setNotifOn(!newVal); // revert
      toast.error(err.message || 'Failed to update setting');
    } finally {
      setSavingNotif(false);
    }
  };

  // ── Delete all data ───────────────────────────────────────
  const handleDeleteData = async () => {
    if (confirmText.trim().toLowerCase() !== 'delete') {
      toast.error('Type "delete" to confirm');
      return;
    }
    setDeleting(true);
    try {
      await api.delete('/users/me/data');
      toast.success('All data deleted');
      setConfirmDelete(false);
      setConfirmText('');
    } catch (err) {
      // endpoint may not exist yet — warn gracefully
      toast.error(err.response?.status === 404
        ? 'Delete endpoint not configured yet on backend'
        : (err.message || 'Failed to delete data'));
    } finally {
      setDeleting(false);
    }
  };

  const initials = (username || user?.displayName || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="page-enter">

      {/* ── Top: label + sphere ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '24px 20px 0',
      }}>
        <div>
          <div className="aegis-label">AEGIS · CONFIG</div>
          <div className="aegis-title">Settings</div>
        </div>
        <div style={{ marginRight: -4, marginTop: -8 }}>
          <NeuralSphere size={110} state="idle" />
        </div>
      </div>

      {/* ── Profile card ── */}
      <div style={{ padding: '20px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 14 }}>PROFILE</div>

          {/* Avatar + info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #60a5fa, #6e50be)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'white',
              fontFamily: "'Inter',sans-serif",
              boxShadow: '0 0 20px rgba(110,80,190,0.35)',
            }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                : initials}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', margin: '0 0 2px' }}>
                {username || 'Set your name'}
              </p>
              <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>{user?.email}</p>
            </div>
            <button
              onClick={() => { setEditingName(true); setNameInput(username); }}
              style={{
                background: '#18181f', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 10, padding: '8px 12px', cursor: 'pointer',
                fontSize: 12, color: '#a78bfa', fontFamily: "'Inter',sans-serif",
              }}
            >
              Edit
            </button>
          </div>

          {/* Inline edit field */}
          {editingName && (
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <input
                className="aegis-input"
                style={{ flex: 1 }}
                placeholder="Your display name"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveName()}
                autoFocus
              />
              <button onClick={handleSaveName} disabled={savingName} style={{
                width: 44, height: 44, borderRadius: 12, border: 'none',
                background: '#6e50be', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: savingName ? 0.6 : 1,
              }}>
                <Check size={18} color="white" />
              </button>
              <button onClick={() => setEditingName(false)} style={{
                width: 44, height: 44, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
                background: '#18181f', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <X size={18} color="#52525b" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Preferences card ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 4 }}>PREFERENCES</div>

          {/* Notifications toggle */}
          <div className="aegis-settings-item">
            <div className="aegis-settings-icon">
              <Bell size={20} color="#a78bfa" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 500, fontSize: 15, color: '#f1f5f9', margin: '0 0 2px' }}>
                Notifications
              </p>
              <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>
                Activity prompts & accountability alerts
              </p>
            </div>
            <button
              onClick={handleToggleNotif}
              disabled={savingNotif}
              className={`aegis-toggle-track ${notifOn ? 'on' : ''}`}
              style={{ opacity: savingNotif ? 0.6 : 1 }}
            >
              <div className="aegis-toggle-thumb" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Account actions card ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom: 4 }}>ACCOUNT</div>

          {/* Sign out */}
          <button
            onClick={signOut}
            style={{
              width: '100%', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}
          >
            <div className="aegis-settings-item">
              <div className="aegis-settings-icon">
                <LogOut size={20} color="#fbbf24" />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontWeight: 500, fontSize: 15, color: '#fbbf24', margin: 0 }}>
                  Sign Out
                </p>
              </div>
              <ChevronRight size={16} color="#52525b" />
            </div>
          </button>

          {/* Delete data */}
          <button
            onClick={() => setConfirmDelete(true)}
            style={{
              width: '100%', background: 'none', border: 'none',
              cursor: 'pointer', padding: 0,
            }}
          >
            <div className="aegis-settings-item" style={{ borderBottom: 'none' }}>
              <div className="aegis-settings-icon">
                <Trash2 size={20} color="#f87171" />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ fontWeight: 500, fontSize: 15, color: '#f87171', margin: '0 0 2px' }}>
                  Delete All Data
                </p>
                <p style={{ fontSize: 12, color: '#52525b', margin: 0 }}>
                  Permanently remove all your data
                </p>
              </div>
              <ChevronRight size={16} color="#52525b" />
            </div>
          </button>
        </div>
      </div>

      {/* ── App info ── */}
      <div style={{ padding: '20px 20px 32px', textAlign: 'center' }}>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: '#27272a', letterSpacing: '0.12em' }}>
          AEGIS INTELLIGENCE v2.1
        </p>
        <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: '#27272a', marginTop: 4 }}>
          Powered by Gemini · Firebase · React
        </p>
      </div>

      {/* ── Delete Confirmation Modal ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 60,
          background: 'rgba(0,0,0,0.80)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'flex-end', padding: '0 16px 40px',
        }}>
          <div style={{
            width: '100%', background: '#111118',
            border: '1px solid rgba(248,113,113,0.25)',
            borderRadius: 20, padding: 24,
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'rgba(248,113,113,0.12)',
              border: '1px solid rgba(248,113,113,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <Shield size={24} color="#f87171" />
            </div>
            <p style={{ textAlign: 'center', fontWeight: 700, fontSize: 16, color: '#f1f5f9', margin: '0 0 8px' }}>
              Delete All Data?
            </p>
            <p style={{ textAlign: 'center', fontSize: 13, color: '#52525b', margin: '0 0 20px', lineHeight: 1.5 }}>
              This permanently deletes all your goals, schedule, diary, activity logs, events, and scores. This cannot be undone.
            </p>
            <input
              className="aegis-input"
              placeholder='Type "delete" to confirm'
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              style={{ marginBottom: 12, borderColor: 'rgba(248,113,113,0.30)' }}
              autoFocus
            />
            <button
              onClick={handleDeleteData}
              disabled={deleting || confirmText.trim().toLowerCase() !== 'delete'}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
                background: confirmText.trim().toLowerCase() === 'delete' ? '#dc2626' : '#27272a',
                color: 'white', fontWeight: 700, fontSize: 15, cursor: 'pointer',
                opacity: deleting ? 0.6 : 1, marginBottom: 10,
                fontFamily: "'Inter',sans-serif",
              }}
            >
              {deleting ? 'Deleting…' : 'Delete Everything'}
            </button>
            <button
              onClick={() => { setConfirmDelete(false); setConfirmText(''); }}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 14,
                background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
                color: '#71717a', fontWeight: 500, fontSize: 15, cursor: 'pointer',
                fontFamily: "'Inter',sans-serif",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

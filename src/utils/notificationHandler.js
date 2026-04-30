/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Notification Handler
 * ============================================================
 * Browser Web Notifications API helper.
 * Pure JavaScript — no React, no imports.
 *
 * Provides:
 *   isSupported()                        — feature detection
 *   requestPermission()                  — async permission request
 *   showLocalNotification(title, body, icon) — fire a notification now
 *   scheduleReminder(title, body, delayMinutes) — delayed notification
 *   cancelReminder(id)                   — cancel a pending reminder
 *   cancelAllReminders()                 — clear all pending reminders
 *
 * Usage:
 *   import { requestPermission, showLocalNotification,
 *            scheduleReminder } from '../utils/notificationHandler';
 * ============================================================
 */

// ── Default icon (inline SVG data URL — works offline) ───────
const DEFAULT_ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E" +
  "%3Ccircle cx='32' cy='32' r='32' fill='%230a1628'/%3E" +
  "%3Ccircle cx='32' cy='32' r='16' fill='none' stroke='%2300d4ff' stroke-width='3'/%3E" +
  "%3Ccircle cx='32' cy='32' r='6' fill='%2300d4ff'/%3E" +
  "%3C/svg%3E";

// ── In-memory registry of scheduled reminders ────────────────
// Maps reminderId → { timeoutId, title, body, scheduledAt, fireAt }
const _reminders = new Map();
let _nextReminderId = 1;

// ────────────────────────────────────────────────────────────
// 1. isSupported
// ────────────────────────────────────────────────────────────
/**
 * Returns true if the browser supports the Web Notifications API.
 * Does NOT check permission — call requestPermission() for that.
 *
 * @returns {boolean}
 */
export function isSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

// ────────────────────────────────────────────────────────────
// 2. requestPermission
// ────────────────────────────────────────────────────────────
/**
 * Ask the user for notification permission (if not already granted).
 * Safe to call multiple times — browsers cache the decision.
 *
 * Returns true  if permission is (or was already) "granted".
 * Returns false if permission is "denied" or the API is unsupported.
 *
 * Note: Many browsers require this to be called from a user gesture
 * (click/tap) to show the permission prompt.
 *
 * @returns {Promise<boolean>}
 */
export async function requestPermission() {
  if (!isSupported()) return false;

  // Already granted — nothing to do
  if (Notification.permission === 'granted') return true;

  // Already denied — can't re-ask (user must change in browser settings)
  if (Notification.permission === 'denied') return false;

  try {
    const result = await Notification.requestPermission();
    return result === 'granted';
  } catch (_err) {
    // Older Safari uses callback form
    return new Promise((resolve) => {
      Notification.requestPermission((result) => resolve(result === 'granted'));
    });
  }
}

// ────────────────────────────────────────────────────────────
// 3. showLocalNotification
// ────────────────────────────────────────────────────────────
/**
 * Immediately show a browser notification.
 * Silently no-ops if permission is not granted or API is unavailable.
 *
 * @param {string} title        Notification headline
 * @param {string} body         Notification body text
 * @param {string} [icon]       Icon URL (defaults to Aegis logo)
 * @param {object} [options]    Extra Notification options (badge, tag, data, …)
 * @returns {Notification|null} The Notification instance, or null on failure
 */
export function showLocalNotification(title = 'Aegis', body = '', icon, options = {}) {
  if (!isSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  if (!title) return null;

  try {
    const notif = new Notification(title, {
      body,
      icon:   icon || DEFAULT_ICON,
      badge:  icon || DEFAULT_ICON,
      silent: false,
      ...options,
    });

    // Auto-close after 8 seconds to avoid notification pile-up
    setTimeout(() => notif.close(), 8000);

    return notif;
  } catch (err) {
    // In some environments (e.g. service worker contexts) Notification
    // constructor is unavailable; fail silently.
    console.warn('[AegisNotification] showLocalNotification failed:', err.message);
    return null;
  }
}

// ────────────────────────────────────────────────────────────
// 4. scheduleReminder
// ────────────────────────────────────────────────────────────
/**
 * Schedule a browser notification to appear after a delay.
 * Internally uses setTimeout — reminders are lost if the page is closed.
 * For persistent reminders, use a Service Worker push strategy.
 *
 * @param {string} title          Notification headline
 * @param {string} body           Notification body text
 * @param {number} delayMinutes   How many minutes from now to show it
 * @param {string} [icon]         Icon URL (optional)
 * @param {object} [options]      Extra Notification options
 * @returns {number|null}         reminderId you can pass to cancelReminder(),
 *                                or null if notifications are unsupported/denied
 */
export function scheduleReminder(title, body, delayMinutes, icon, options = {}) {
  if (!isSupported()) return null;
  if (Notification.permission !== 'granted') return null;
  if (typeof delayMinutes !== 'number' || delayMinutes < 0) return null;

  const delayMs = Math.round(delayMinutes * 60 * 1000);
  const fireAt  = new Date(Date.now() + delayMs);
  const id      = _nextReminderId++;

  const timeoutId = setTimeout(() => {
    showLocalNotification(title, body, icon, options);
    _reminders.delete(id);
  }, delayMs);

  _reminders.set(id, {
    timeoutId,
    title,
    body,
    scheduledAt: new Date(),
    fireAt,
  });

  return id;
}

// ────────────────────────────────────────────────────────────
// 5. cancelReminder
// ────────────────────────────────────────────────────────────
/**
 * Cancel a previously scheduled reminder by its ID.
 *
 * @param {number} reminderId  ID returned by scheduleReminder()
 * @returns {boolean}          true if found and cancelled, false otherwise
 */
export function cancelReminder(reminderId) {
  const entry = _reminders.get(reminderId);
  if (!entry) return false;

  clearTimeout(entry.timeoutId);
  _reminders.delete(reminderId);
  return true;
}

// ────────────────────────────────────────────────────────────
// 6. cancelAllReminders
// ────────────────────────────────────────────────────────────
/**
 * Cancel every pending reminder.
 * Call this on user sign-out or page unload to clean up.
 *
 * @returns {number}  Number of reminders cancelled
 */
export function cancelAllReminders() {
  let count = 0;
  _reminders.forEach(({ timeoutId }) => {
    clearTimeout(timeoutId);
    count++;
  });
  _reminders.clear();
  return count;
}

// ────────────────────────────────────────────────────────────
// 7. getPendingReminders  (bonus utility — useful for debug UI)
// ────────────────────────────────────────────────────────────
/**
 * Return a read-only snapshot of all pending reminders.
 *
 * @returns {Array<{ id, title, body, scheduledAt, fireAt }>}
 */
export function getPendingReminders() {
  return Array.from(_reminders.entries()).map(([id, r]) => ({
    id,
    title:       r.title,
    body:        r.body,
    scheduledAt: r.scheduledAt,
    fireAt:      r.fireAt,
  }));
}

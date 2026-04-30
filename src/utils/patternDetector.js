/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Pattern Detector Utilities
 * ============================================================
 * Lightweight, client-side pattern detection.
 * No AI calls. No imports. All functions are pure JS exports.
 *
 * These provide fast, local insights to complement the
 * server-side Gemini analysis (aiAnalysisController.js).
 *
 * Usage:
 *   import { detectProductiveHours, calculateStreak,
 *            getMoodTrend, getCompletionRate } from '../utils/patternDetector';
 * ============================================================
 */

// ── Internal helpers ─────────────────────────────────────────

/**
 * Parse a Firestore Timestamp, ISO string, or Date into a JS Date.
 * Returns null if unparseable.
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000);
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Return true if two Date objects fall on the same calendar day.
 */
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Return the start of a day (00:00:00.000) for a given Date.
 */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Return the arithmetic mean of a numeric array.
 * Returns 0 for empty arrays.
 */
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

// ────────────────────────────────────────────────────────────
// 1. detectProductiveHours
// ────────────────────────────────────────────────────────────
/**
 * Analyse an activity log and return a human-readable string
 * describing the hours when the user is most productive.
 *
 * "Productive" is defined as activities whose category is one of:
 *   work, study, learning, productivity, focus, deep-work
 * or whose productivityScore / score field ≥ 6.
 *
 * Input shape (each document):
 *   {
 *     createdAt : Timestamp | string | Date,
 *     category  : string,
 *     productivityScore : number   (optional, 0-10)
 *   }
 *
 * @param {Array}  activityLog   Raw ACTIVITY_LOG documents
 * @param {number} minSamples    Minimum data points needed (default 5)
 * @returns {string}
 *   e.g. "You are most productive between 9 AM – 11 AM"
 *        "Not enough data yet to detect productive hours"
 */
export function detectProductiveHours(activityLog = [], minSamples = 5) {
  if (!Array.isArray(activityLog) || activityLog.length === 0) {
    return 'Not enough data yet to detect productive hours.';
  }

  const PRODUCTIVE_CATEGORIES = new Set([
    'work', 'study', 'learning', 'productivity',
    'focus', 'deep-work', 'deep work', 'coding',
  ]);

  // Count productive activity by hour bucket
  const hourCounts = new Array(24).fill(0);
  let total = 0;

  activityLog.forEach((doc) => {
    const d = toDate(doc.createdAt || doc.date || doc.timestamp);
    if (!d) return;

    const cat   = (doc.category || doc.type || '').toLowerCase();
    const score = typeof doc.productivityScore === 'number'
      ? doc.productivityScore
      : typeof doc.score === 'number'
      ? doc.score
      : -1;

    const isProductive = PRODUCTIVE_CATEGORIES.has(cat) || score >= 6;
    if (!isProductive) return;

    const hour = d.getHours();
    hourCounts[hour]++;
    total++;
  });

  if (total < minSamples) {
    return 'Not enough data yet to detect productive hours.';
  }

  // Find the peak 2-hour window using a sliding sum
  let bestStart = 0;
  let bestSum   = 0;

  for (let h = 0; h < 24; h++) {
    const windowSum = hourCounts[h] + hourCounts[(h + 1) % 24];
    if (windowSum > bestSum) {
      bestSum   = windowSum;
      bestStart = h;
    }
  }

  if (bestSum === 0) {
    return 'No clear productive hour pattern detected yet.';
  }

  function fmt12(h) {
    if (h === 0)  return '12 AM';
    if (h === 12) return '12 PM';
    if (h < 12)   return `${h} AM`;
    return `${h - 12} PM`;
  }

  const startLabel = fmt12(bestStart);
  const endLabel   = fmt12((bestStart + 2) % 24);

  return `You are most productive between ${startLabel} – ${endLabel}.`;
}

// ────────────────────────────────────────────────────────────
// 2. calculateStreak
// ────────────────────────────────────────────────────────────
/**
 * Calculate the current consecutive-day streak for diary entries.
 * A "streak" requires at least one entry per calendar day,
 * ending today (or yesterday if today has no entry yet).
 *
 * Input shape (each document):
 *   {
 *     createdAt : Timestamp | string | Date
 *     date      : string | Date   (fallback)
 *   }
 *
 * @param {Array} diary  Raw DIARY documents
 * @returns {number}     Number of consecutive days (0 if no streak)
 */
export function calculateStreak(diary = []) {
  if (!Array.isArray(diary) || diary.length === 0) return 0;

  // Collect unique calendar days that have at least one entry
  const daySet = new Set();
  diary.forEach((doc) => {
    const d = toDate(doc.createdAt || doc.date);
    if (!d) return;
    daySet.add(startOfDay(d).getTime());
  });

  if (daySet.size === 0) return 0;

  const sortedDays = Array.from(daySet)
    .map((ts) => new Date(ts))
    .sort((a, b) => b - a); // descending

  const today     = startOfDay(new Date());
  const yesterday = new Date(today.getTime() - 86_400_000);

  // Streak must include today or yesterday as anchor
  const anchor = sortedDays[0];
  if (!isSameDay(anchor, today) && !isSameDay(anchor, yesterday)) {
    return 0; // Most recent entry is older than yesterday
  }

  let streak   = 1;
  let expected = new Date(anchor.getTime() - 86_400_000); // day before anchor

  for (let i = 1; i < sortedDays.length; i++) {
    if (isSameDay(sortedDays[i], expected)) {
      streak++;
      expected = new Date(expected.getTime() - 86_400_000);
    } else if (!isSameDay(sortedDays[i], sortedDays[i - 1])) {
      // Gap found — streak ends
      break;
    }
  }

  return streak;
}

// ────────────────────────────────────────────────────────────
// 3. getMoodTrend
// ────────────────────────────────────────────────────────────
/**
 * Determine whether the user's mood is improving, stable, or declining
 * by comparing the average mood score in the first vs. second half of
 * the look-back window.
 *
 * Input shape (each diary document):
 *   {
 *     createdAt : Timestamp | string | Date,
 *     mood      : string | number
 *       — string values: "great"|"good"|"okay"|"bad"|"terrible"
 *       — number values: 1-5 (5 = best)
 *   }
 *
 * @param {Array}  diary   Raw DIARY documents
 * @param {number} days    Look-back window in days (default 14)
 * @returns {"improving" | "stable" | "declining"}
 */
export function getMoodTrend(diary = [], days = 14) {
  const MOOD_MAP = {
    great:    5,
    good:     4,
    okay:     3,
    neutral:  3,
    bad:      2,
    terrible: 1,
    awful:    1,
  };

  function moodToNum(raw) {
    if (typeof raw === 'number') return Math.min(5, Math.max(1, raw));
    if (typeof raw === 'string') {
      const key = raw.toLowerCase().trim();
      return MOOD_MAP[key] ?? null;
    }
    return null;
  }

  if (!Array.isArray(diary) || diary.length === 0) return 'stable';

  const now    = Date.now();
  const dayMs  = 86_400_000;
  const cutOff = now - days * dayMs;
  const midPt  = now - (days / 2) * dayMs;

  const firstHalf  = [];
  const secondHalf = [];

  diary.forEach((doc) => {
    const d = toDate(doc.createdAt || doc.date);
    if (!d) return;
    const t   = d.getTime();
    if (t < cutOff) return;

    const score = moodToNum(doc.mood);
    if (score === null) return;

    if (t < midPt) firstHalf.push(score);
    else           secondHalf.push(score);
  });

  if (firstHalf.length === 0 || secondHalf.length === 0) return 'stable';

  const avgFirst  = mean(firstHalf);
  const avgSecond = mean(secondHalf);
  const delta     = avgSecond - avgFirst;

  if (delta >  0.4) return 'improving';
  if (delta < -0.4) return 'declining';
  return 'stable';
}

// ────────────────────────────────────────────────────────────
// 4. getCompletionRate
// ────────────────────────────────────────────────────────────
/**
 * Calculate the task completion rate (as a percentage) for
 * schedule items over the last N days.
 *
 * Input shape (each schedule document):
 *   {
 *     createdAt  : Timestamp | string | Date,
 *     date       : string | Date   (fallback — the scheduled date),
 *     completed  : boolean
 *   }
 *
 * @param {Array}  schedule  Raw SCHEDULE documents
 * @param {number} days      Look-back window in days (default 7)
 * @returns {number}         Percentage 0-100 (integer)
 */
export function getCompletionRate(schedule = [], days = 7) {
  if (!Array.isArray(schedule) || schedule.length === 0) return 0;

  const cutOff = Date.now() - days * 86_400_000;
  let total     = 0;
  let completed = 0;

  schedule.forEach((doc) => {
    const d = toDate(doc.date || doc.createdAt || doc.scheduledAt);
    if (!d) return;
    if (d.getTime() < cutOff) return;

    total++;
    if (doc.completed === true || doc.done === true) completed++;
  });

  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
}

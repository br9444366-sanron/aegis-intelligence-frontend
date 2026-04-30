/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Chart Generator Utilities
 * ============================================================
 * Pure JavaScript helper functions for formatting Firestore
 * data into shapes expected by Recharts components.
 *
 * No React imports. No side effects. All functions are pure.
 *
 * Usage:
 *   import { formatScoreHistory, formatActivityBreakdown,
 *            formatGoalProgress, getScoreTrend } from '../utils/chartGenerator';
 * ============================================================
 */

// ── Score categories (matches backend schema) ────────────────
const SCORE_CATEGORIES = [
  'productivity',
  'health',
  'mindset',
  'social',
  'learning',
  'discipline',
];

// ── Internal helpers ─────────────────────────────────────────

/**
 * Parse a Firestore Timestamp, ISO string, or Date into a JS Date.
 * Returns null if the value is not parseable.
 */
function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  // Firestore Timestamp shape: { seconds, nanoseconds }
  if (typeof value === 'object' && 'seconds' in value) {
    return new Date(value.seconds * 1000);
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format a Date to a short label: "Apr 20"
 */
function shortDateLabel(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Return the arithmetic mean of an array of numbers.
 * Returns 0 for empty arrays.
 */
function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((sum, n) => sum + n, 0) / arr.length;
}

// ────────────────────────────────────────────────────────────
// 1. formatScoreHistory
// ────────────────────────────────────────────────────────────
/**
 * Format raw score documents from the SCORES collection into
 * an array suitable for a Recharts <LineChart>.
 *
 * Input shape (each score document):
 *   {
 *     date      : string | Timestamp | Date,
 *     scores    : { productivity, health, mindset, social, learning, discipline },
 *     overall   : number   (0-10, optional — computed if absent)
 *   }
 *
 * Output shape (each element):
 *   {
 *     date        : "Apr 20"   (x-axis label),
 *     isoDate     : "2024-04-20"  (for tooltip / sorting),
 *     productivity: 7,
 *     health      : 8,
 *     mindset     : 6,
 *     social      : 5,
 *     learning    : 7,
 *     discipline  : 9,
 *     overall     : 7.0         (average of all 6)
 *   }
 *
 * @param {Array}  scores   Raw score documents from Firestore
 * @param {number} maxDays  How many recent days to include (default 30)
 * @returns {Array}
 */
export function formatScoreHistory(scores = [], maxDays = 30) {
  if (!Array.isArray(scores) || scores.length === 0) return [];

  // Normalise and sort by date ascending
  const normalised = scores
    .map((doc) => {
      const d = toDate(doc.date || doc.createdAt);
      if (!d) return null;
      const cats = doc.scores || doc.categories || {};
      const vals = SCORE_CATEGORIES.map((k) => (typeof cats[k] === 'number' ? cats[k] : null));
      const defined = vals.filter((v) => v !== null);
      const overall =
        typeof doc.overall === 'number'
          ? doc.overall
          : defined.length > 0
          ? parseFloat(mean(defined).toFixed(1))
          : null;
      return { d, doc, vals, overall };
    })
    .filter(Boolean)
    .sort((a, b) => a.d - b.d)
    .slice(-maxDays);

  return normalised.map(({ d, doc, overall }) => {
    const cats = doc.scores || doc.categories || {};
    const entry = {
      date:    shortDateLabel(d),
      isoDate: d.toISOString().split('T')[0],
      overall: overall,
    };
    SCORE_CATEGORIES.forEach((k) => {
      entry[k] = typeof cats[k] === 'number' ? parseFloat(cats[k].toFixed(1)) : null;
    });
    return entry;
  });
}

// ────────────────────────────────────────────────────────────
// 2. formatActivityBreakdown
// ────────────────────────────────────────────────────────────
/**
 * Format activity log documents into a Recharts <PieChart> data array.
 *
 * Input shape (each activity document):
 *   {
 *     category : string   e.g. "work" | "health" | "leisure" | ...
 *     duration : number   minutes (optional)
 *   }
 *
 * Output shape (each element):
 *   {
 *     name  : "Work",     (display label)
 *     value : 14,         (count of activities OR total minutes)
 *     color : "#00d4ff",  (assigned colour from palette)
 *   }
 *
 * @param {Array}   activityLog  Raw documents from ACTIVITY_LOG
 * @param {string}  metric       "count" | "duration" (default "count")
 * @returns {Array}
 */
export function formatActivityBreakdown(activityLog = [], metric = 'count') {
  if (!Array.isArray(activityLog) || activityLog.length === 0) return [];

  const PALETTE = [
    '#00d4ff', '#00ff88', '#a78bfa', '#fbbf24',
    '#f472b6', '#fb923c', '#34d399', '#60a5fa',
  ];

  const buckets = {};

  activityLog.forEach((doc) => {
    const raw = (doc.category || doc.type || 'other').toLowerCase().trim();
    const key = raw.charAt(0).toUpperCase() + raw.slice(1); // Title-case

    if (!buckets[key]) buckets[key] = { count: 0, duration: 0 };
    buckets[key].count += 1;
    buckets[key].duration += typeof doc.duration === 'number' ? doc.duration : 0;
  });

  const keys = Object.keys(buckets);
  return keys
    .map((name, i) => ({
      name,
      value: metric === 'duration' ? buckets[name].duration : buckets[name].count,
      color: PALETTE[i % PALETTE.length],
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

// ────────────────────────────────────────────────────────────
// 3. formatGoalProgress
// ────────────────────────────────────────────────────────────
/**
 * Format goal documents into a Recharts <BarChart> data array.
 *
 * Input shape (each goal document):
 *   {
 *     title    : string,
 *     progress : number   (0-100, percentage)
 *     target   : number   (optional, e.g. 100)
 *     status   : "active" | "completed" | "abandoned"
 *   }
 *
 * Output shape (each element):
 *   {
 *     name      : "Finish course",
 *     progress  : 65,
 *     remaining : 35,
 *     status    : "active",
 *     fill      : "#00d4ff",
 *   }
 *
 * @param {Array}  goals    Raw goal documents from Firestore
 * @param {number} maxItems Maximum bars to show (default 8)
 * @returns {Array}
 */
export function formatGoalProgress(goals = [], maxItems = 8) {
  if (!Array.isArray(goals) || goals.length === 0) return [];

  const STATUS_COLOR = {
    completed: '#00ff88',
    abandoned: '#ff4444',
    active:    '#00d4ff',
    paused:    '#ffaa00',
  };

  return goals
    .filter((g) => g && g.title)
    .slice(0, maxItems)
    .map((g) => {
      const progress  = typeof g.progress === 'number'
        ? Math.min(100, Math.max(0, g.progress))
        : 0;
      const status    = g.status || 'active';
      const remaining = 100 - progress;
      // Truncate long titles for the bar chart axis
      const name = g.title.length > 20 ? g.title.slice(0, 18) + '…' : g.title;

      return {
        name,
        progress,
        remaining,
        status,
        fill: STATUS_COLOR[status] || STATUS_COLOR.active,
      };
    });
}

// ────────────────────────────────────────────────────────────
// 4. getScoreTrend
// ────────────────────────────────────────────────────────────
/**
 * Compute the trend direction, rolling average, and change for
 * a given category (or "overall") over the last N days.
 *
 * @param {Array}  scores    Raw score documents from Firestore
 * @param {number} days      Look-back window in days (default 7)
 * @param {string} category  One of the 6 categories or "overall" (default)
 * @returns {{ trend: "up"|"down"|"stable", avg: number, change: number, dataPoints: number }}
 *
 *   trend      — direction vs the previous equal window
 *   avg        — mean score in the current window (rounded to 1 dp)
 *   change     — avg(current) - avg(previous), rounded to 1 dp
 *   dataPoints — number of data points found in the current window
 */
export function getScoreTrend(scores = [], days = 7, category = 'overall') {
  const EMPTY = { trend: 'stable', avg: 0, change: 0, dataPoints: 0 };

  if (!Array.isArray(scores) || scores.length === 0) return EMPTY;

  const now     = Date.now();
  const dayMs   = 86_400_000;
  const cutCurr = now - days * dayMs;
  const cutPrev = now - days * 2 * dayMs;

  function extractValue(doc) {
    if (category === 'overall') {
      if (typeof doc.overall === 'number') return doc.overall;
      const cats = doc.scores || doc.categories || {};
      const vals = SCORE_CATEGORIES.map((k) => cats[k]).filter((v) => typeof v === 'number');
      return vals.length ? mean(vals) : null;
    }
    const cats = doc.scores || doc.categories || {};
    const v = cats[category];
    return typeof v === 'number' ? v : null;
  }

  const currentWindow = [];
  const previousWindow = [];

  scores.forEach((doc) => {
    const d = toDate(doc.date || doc.createdAt);
    if (!d) return;
    const t   = d.getTime();
    const val = extractValue(doc);
    if (val === null) return;

    if (t >= cutCurr && t <= now)       currentWindow.push(val);
    else if (t >= cutPrev && t < cutCurr) previousWindow.push(val);
  });

  if (currentWindow.length === 0) return EMPTY;

  const avgCurr = mean(currentWindow);
  const avgPrev = previousWindow.length > 0 ? mean(previousWindow) : avgCurr;
  const change  = parseFloat((avgCurr - avgPrev).toFixed(1));

  let trend = 'stable';
  if (change > 0.3)       trend = 'up';
  else if (change < -0.3) trend = 'down';

  return {
    trend,
    avg:        parseFloat(avgCurr.toFixed(1)),
    change,
    dataPoints: currentWindow.length,
  };
}

/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Frontend Gemini Client
 * ============================================================
 * Direct Gemini API calls from the frontend.
 * ⚠️  WARNING: Only use in development/prototyping.
 *    In production, route all AI calls through your backend
 *    (/api/ai/*) to keep your API key secret.
 *
 * Used as a fallback when the backend AI endpoint is unavailable.
 * ============================================================
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * generateContent
 * Sends a prompt directly to the Gemini API from the browser.
 *
 * @param {string} prompt
 * @returns {Promise<string>} Generated text
 */
export const generateContent = async (prompt) => {
  if (!GEMINI_API_KEY) {
    throw new Error('VITE_GEMINI_API_KEY is not set in .env');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gemini API error');
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export default { generateContent };

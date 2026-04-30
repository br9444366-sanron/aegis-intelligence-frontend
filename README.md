# ⚡ Aegis Intelligence v2.1 — Frontend

React 18 + Vite + Tailwind CSS + Firebase Auth frontend for the Aegis Intelligence AI productivity system.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Environment Setup
```bash
cp .env.example .env
```

Fill in your `.env` with values from:
- **Firebase Console** → Project Settings → Your apps → Web app → `firebaseConfig`
- **Backend URL**: `VITE_API_URL=http://localhost:4000/api`
- **Gemini API**: https://aistudio.google.com/app/apikey

### 3. Tailwind CSS Setup

Tailwind is already configured. The `tailwind.config.js` in `src/styles/` contains Aegis design tokens. The main `tailwind.config.js` at the root is used by Vite:

```bash
# Create root-level config (required by Vite's PostCSS plugin)
cp src/styles/tailwind.config.js tailwind.config.js
```

Create `postcss.config.js` in the frontend root:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 4. Start Development Server
```bash
npm run dev
```

Frontend starts at: **http://localhost:5173**

> The Vite proxy forwards `/api/*` requests to `http://localhost:4000` automatically — no CORS issues in development.

---

## 📦 Build for Production
```bash
npm run build   # Outputs to dist/
npm run preview # Preview the production build locally
```

---

## 🗂 Project Structure

```
src/
├── api/
│   ├── apiClient.js       # Axios + Firebase auth interceptor
│   └── geminiClient.js    # Direct Gemini (dev only)
├── components/
│   ├── Layout.jsx          # Main shell (header + bottom nav)
│   ├── BottomNavigation.jsx
│   ├── AIChat.jsx          # Floating AI chat
│   ├── NotificationCenter.jsx
│   ├── LoadingSpinner.jsx
│   └── ErrorBoundary.jsx
├── context/
│   ├── AuthContext.jsx     # Firebase Auth state
│   ├── DataContext.jsx     # Global data fetching (Zustand)
│   └── NotificationContext.jsx
├── pages/
│   ├── AuthPage.jsx        # Google sign-in
│   ├── Home.jsx            # Dashboard
│   ├── Goals.jsx
│   ├── Schedule.jsx
│   ├── Diary.jsx
│   ├── ActivityLog.jsx
│   ├── Events.jsx
│   ├── Scores.jsx
│   └── AIMemory.jsx        # AI insights + analysis
├── styles/
│   ├── globals.css         # Tailwind directives + custom CSS
│   └── tailwind.config.js  # Design tokens
├── App.jsx                 # Router + provider tree
└── main.jsx               # ReactDOM.createRoot
```

---

## 🎨 Design System

The Aegis design system is built on CSS variables and Tailwind utility classes:

| Token               | Value     | Usage                          |
|---------------------|-----------|--------------------------------|
| `--aegis-navy`      | `#0a1628` | Page backgrounds               |
| `--aegis-navy-card` | `#112240` | Card backgrounds               |
| `--aegis-cyan`      | `#00d4ff` | Primary accent, interactive    |
| `--aegis-success`   | `#00ff88` | Positive states, completion    |
| `--aegis-warning`   | `#ffaa00` | Caution states                 |
| `--aegis-danger`    | `#ff4444` | Error states, restricted mode  |

**Component classes:** `.aegis-card`, `.aegis-btn-primary`, `.aegis-btn-secondary`, `.aegis-input`, `.aegis-glow`

**Badge classes:** `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`

---

## 📱 Mobile-First Design

- Bottom navigation with AI Chat FAB center button
- Safe area insets for Android navigation bar (`env(safe-area-inset-bottom)`)
- Dynamic viewport height (`min-h-dvh`) for mobile browser chrome
- Touch-friendly tap targets (minimum 44×44px)

---

## 🔐 Authentication Flow

1. User clicks "Continue with Google" → Firebase Google popup
2. Firebase returns an ID token
3. `apiClient.js` interceptor attaches token to every API request: `Authorization: Bearer <token>`
4. Backend `authMiddleware.js` verifies token with Firebase Admin SDK
5. Token auto-refreshes before expiry (every ~55 minutes)

---

## 🔧 Key Dependencies

| Package           | Purpose                              |
|-------------------|--------------------------------------|
| `firebase`        | Auth (client SDK)                    |
| `react-router-dom`| Client-side routing                  |
| `axios`           | HTTP client with interceptors        |
| `zustand`         | Lightweight global state             |
| `recharts`        | Charts (Scores trend)                |
| `date-fns`        | Date formatting and calculations     |
| `react-hot-toast` | Toast notifications                  |
| `lucide-react`    | Icons                                |
| `tailwindcss`     | Utility-first CSS                    |

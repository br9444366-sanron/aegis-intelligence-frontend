/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — React Entry Point
 * ============================================================
 * Mounts the React app into the #root DOM element.
 * Wraps the app in StrictMode for development warnings.
 * ============================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — Auth / Login Page
 * ============================================================
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthPage() {
  const { signInWithGoogle, loading } = useAuth();

  return (
    <div className="min-h-screen min-h-dvh bg-[#0a1628] flex flex-col items-center
                    justify-center px-6 relative overflow-hidden">

      {/* Background grid effect */}
      <div className="absolute inset-0 opacity-5"
           style={{
             backgroundImage: 'linear-gradient(#00d4ff 1px, transparent 1px), linear-gradient(90deg, #00d4ff 1px, transparent 1px)',
             backgroundSize: '40px 40px',
           }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64
                      rounded-full bg-[#00d4ff]/5 blur-3xl pointer-events-none" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-2xl bg-[#00d4ff]/10 border border-[#00d4ff]/30
                          flex items-center justify-center mb-5 aegis-glow neural-sphere">
            <Zap size={40} className="text-[#00d4ff]" fill="currentColor" />
          </div>

          <h1 className="text-3xl font-bold text-[#e8eaf6] font-mono tracking-tight">
            AEGIS
          </h1>
          <p className="text-sm text-[#8892b0] mt-1 font-mono">
            Intelligence v2.1
          </p>
        </div>

        {/* Tagline */}
        <div className="text-center mb-8">
          <p className="text-[#e8eaf6] font-medium mb-1">Your AI Accountability Partner</p>
          <p className="text-sm text-[#4a5568] leading-relaxed">
            Track goals. Analyze patterns. Stay accountable.
            Powered by Gemini AI.
          </p>
        </div>

        {/* Features */}
        <div className="space-y-2.5 mb-8">
          {[
            ['⚡', 'AI-driven activity tracking & analysis'],
            ['🎯', 'Smart goal monitoring with progress alerts'],
            ['🧠', 'Pattern detection & productivity insights'],
            ['🔥', 'Accountability levels with restricted mode'],
          ].map(([icon, text]) => (
            <div key={text} className="flex items-center gap-3 text-sm text-[#8892b0]">
              <span className="text-base">{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Sign-in button */}
        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 px-6
                     bg-white hover:bg-gray-50 active:bg-gray-100
                     text-gray-900 font-semibold rounded-xl
                     transition-all duration-150 active:scale-98
                     disabled:opacity-60 disabled:cursor-not-allowed
                     shadow-lg"
        >
          {/* Google SVG logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'Connecting...' : 'Continue with Google'}
        </button>

        <p className="text-center text-[10px] text-[#2d4f7c] mt-6 leading-relaxed">
          By continuing, you agree to Aegis Intelligence's terms of service.
          Your data is stored securely in Firebase Firestore.
        </p>
      </div>
    </div>
  );
}

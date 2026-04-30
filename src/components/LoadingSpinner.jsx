/**
 * LoadingSpinner.jsx
 */
import React from 'react';
import { Zap } from 'lucide-react';

export default function LoadingSpinner({ fullScreen = false, message = 'Loading...' }) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-[#1e3a5f] animate-spin
                        border-t-[#00d4ff]" />
        <Zap size={16} className="absolute inset-0 m-auto text-[#00d4ff]" fill="currentColor" />
      </div>
      <p className="text-sm text-[#8892b0] font-mono animate-pulse">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-[#0a1628] flex items-center justify-center z-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center p-8">{content}</div>;
}

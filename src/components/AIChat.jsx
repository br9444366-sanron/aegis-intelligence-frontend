/**
 * ============================================================
 * AEGIS INTELLIGENCE v2.1 — AI Chat Component
 * ============================================================
 * Full-featured chat interface with Aegis AI:
 *  - Multi-turn conversation with history
 *  - Command detection display (e.g., "Goal created!")
 *  - Auto-scroll to latest message
 *  - Loading skeleton for AI thinking state
 *  - Predefined quick-action prompts
 * ============================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Zap, ChevronDown } from 'lucide-react';
import api from '../api/apiClient.js';
import { useAuth } from '../context/AuthContext.jsx';
import toast from 'react-hot-toast';

const QUICK_PROMPTS = [
  'Analyze my productivity today',
  'What should I focus on?',
  'Add a goal to study for 2 hours',
  'How am I doing this week?',
  'Schedule a review session tomorrow at 5 PM',
];

export default function AIChat({ onClose }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hey ${user?.displayName?.split(' ')[0] || 'there'}! I'm Aegis, your AI accountability partner. 
How can I help you today? You can ask me to analyze your productivity, create goals, schedule tasks, or just chat about your progress. ⚡`,
    },
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input on open
  useEffect(() => { inputRef.current?.focus(); }, []);

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    setInput('');

    // Add user message immediately (optimistic update)
    const userMessage = { role: 'user', content: messageText };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      // Build history (exclude the opening greeting for cleaner context)
      const history = messages.slice(1).map((m) => ({
        role:    m.role,
        content: m.content,
      }));

      const { data } = await api.post('/ai/chat', {
        message: messageText,
        history,
      });

      const assistantMessage = {
        role:    'assistant',
        content: data.data.reply,
        // Attach command info if a command was executed
        commandExecuted: data.data.commandExecuted,
        commandType:     data.data.commandType,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Show success toast if a command was executed
      if (data.data.commandExecuted) {
        const labels = { goal: '🎯 Goal', schedule: '📅 Task', diary: '📓 Diary entry' };
        toast.success(`${labels[data.data.commandType] || 'Item'} created!`);
      }
    } catch (err) {
      toast.error('Aegis is having a moment. Try again!');
      // Remove the optimistic user message on error
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="bg-[#0f2040] border border-[#1e3a5f] rounded-t-2xl
                    flex flex-col h-[70vh] max-h-[600px] shadow-2xl">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3
                      border-b border-[#1e3a5f]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 border border-[#00d4ff]/40
                          flex items-center justify-center">
            <Zap size={16} className="text-[#00d4ff]" fill="currentColor" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#e8eaf6]">Aegis AI</p>
            <p className="text-[10px] text-[#00d4ff]">● Online</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[#1e3a5f] transition-colors">
          <ChevronDown size={20} className="text-[#8892b0]" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={[
              'max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-[#00d4ff] text-[#0a1628] font-medium rounded-br-sm'
                : 'bg-[#112240] text-[#e8eaf6] border border-[#1e3a5f] rounded-bl-sm',
            ].join(' ')}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {/* Command badge */}
              {msg.commandExecuted && (
                <span className="inline-block mt-1 text-[10px] bg-[#00ff88]/20
                                  text-[#00ff88] px-2 py-0.5 rounded-full">
                  ✓ {msg.commandType} created
                </span>
              )}
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-[#112240] border border-[#1e3a5f] rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-1.5 h-1.5 rounded-full bg-[#00d4ff]
                                            animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => sendMessage(prompt)}
              disabled={loading}
              className="flex-shrink-0 text-[11px] text-[#8892b0] bg-[#112240]
                         border border-[#1e3a5f] rounded-full px-3 py-1.5
                         hover:border-[#00d4ff]/40 hover:text-[#00d4ff]
                         transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="flex items-end gap-2 px-4 pb-4 pt-2 border-t border-[#1e3a5f]">
        <textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Aegis..."
          rows={1}
          style={{ maxHeight: '100px', resize: 'none' }}
          className="flex-1 aegis-input text-sm py-2.5 leading-5
                     scrollbar-hide overflow-y-auto"
          onInput={(e) => {
            // Auto-grow textarea
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
        />
        <button
          onClick={() => sendMessage()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-[#00d4ff] text-[#0a1628]
                     disabled:opacity-40 disabled:cursor-not-allowed
                     hover:bg-[#00b8d9] active:scale-95 transition-all"
        >
          <Send size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

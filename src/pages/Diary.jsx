import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { BookOpen, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';

const MOODS = [
  { emoji:'😄', label:'Great',   value:5, color:'#34d399' },
  { emoji:'🙂', label:'Good',    value:4, color:'#6366f1' },
  { emoji:'😐', label:'Neutral', value:3, color:'#fbbf24' },
  { emoji:'😔', label:'Low',     value:2, color:'#fb923c' },
  { emoji:'😞', label:'Bad',     value:1, color:'#f87171' },
];

export default function Diary() {
  const { diary, loading, addItem, updateItem } = useData();
  const [selectedMood, setSelectedMood] = useState(3);
  const [content,      setContent]      = useState('');
  const [tags,         setTags]         = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [expandedId,   setExpandedId]   = useState(null);

  const todayEntry = useMemo(() =>
    diary.find(e => { try { return isToday(parseISO(e.date||e.createdAt)); } catch { return false; } }),
  [diary]);

  const handleSave = async () => {
    if (!content.trim()) { toast.error('Write something first!'); return; }
    setSubmitting(true);
    const payload = {
      content: content.trim(), mood: selectedMood,
      tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
      date: format(new Date(),'yyyy-MM-dd'),
    };
    try {
      if (todayEntry) {
        const { data } = await api.patch(`/diary/${todayEntry.id}`, payload);
        updateItem('diary', todayEntry.id, data.data || payload);
        toast.success('Entry updated!');
      } else {
        const { data } = await api.post('/diary', payload);
        addItem('diary', data.data);
        toast.success('Entry saved! ✨');
      }
      setContent(''); setTags(''); setSelectedMood(3);
    } catch (err) { toast.error(err.message || 'Failed to save'); }
    finally { setSubmitting(false); }
  };

  const moodStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...diary].sort((a,b) => new Date(b.date||b.createdAt) - new Date(a.date||a.createdAt));
    for (const e of sorted) { if ((e.mood||3) >= 3) streak++; else break; }
    return streak;
  }, [diary]);

  const dateLabel = (e) => {
    try {
      const d = parseISO(e.date||e.createdAt);
      if (isToday(d)) return 'Today';
      if (isYesterday(d)) return 'Yesterday';
      return format(d,'EEEE, MMM d');
    } catch { return ''; }
  };

  const currentMood = MOODS.find(m => m.value === selectedMood) || MOODS[2];

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 20px 0' }}>
        <div>
          <div className="aegis-label">AEGIS · DIARY</div>
          <div className="aegis-title">Journal</div>
          <p style={{ fontSize:13, color:'#52525b', marginTop:4 }}>
            {moodStreak > 0 ? `🔥 ${moodStreak} day positive streak` : 'How are you feeling?'}
          </p>
        </div>
        <div style={{ marginRight:-4, marginTop:-8 }}>
          <NeuralSphere size={110} state="idle" />
        </div>
      </div>

      {/* Write entry card */}
      <div style={{ padding:'16px 16px 0' }}>
        <div className="aegis-card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div className="aegis-label">{todayEntry ? "TODAY'S ENTRY (EDIT)" : "TODAY'S ENTRY"}</div>
            <span style={{ fontSize:12, color:'#52525b', fontFamily:"'Inter',sans-serif" }}>
              {format(new Date(),'MMM d, yyyy')}
            </span>
          </div>

          {/* Mood selector */}
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {MOODS.map(m => (
              <button key={m.value} onClick={() => setSelectedMood(m.value)} style={{
                flex:1, padding:'10px 0', borderRadius:14, border:'none', cursor:'pointer',
                background: selectedMood===m.value ? `${m.color}20` : '#18181f',
                border: selectedMood===m.value ? `1px solid ${m.color}40` : '1px solid rgba(255,255,255,0.06)',
                display:'flex', flexDirection:'column', alignItems:'center', gap:3, transition:'all 0.15s',
              }}>
                <span style={{ fontSize:22 }}>{m.emoji}</span>
                <span style={{ fontSize:9, color: selectedMood===m.value ? m.color : '#52525b',
                  fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.06em' }}>
                  {m.label.toUpperCase()}
                </span>
              </button>
            ))}
          </div>

          <textarea className="aegis-input"
            placeholder="What happened today? What are you thinking?"
            rows={4} style={{ marginBottom:10, minHeight:100 }}
            value={content} onChange={e => setContent(e.target.value)}
          />

          <input className="aegis-input"
            placeholder="Tags (optional): study, gym, work…"
            value={tags} onChange={e => setTags(e.target.value)}
            style={{ marginBottom:14 }}
          />

          <button onClick={handleSave} disabled={submitting} className="aegis-btn"
            style={{ opacity:submitting?0.6:1 }}>
            {submitting ? 'Saving…' : todayEntry ? 'Update Entry' : 'Save Entry'}
          </button>
        </div>
      </div>

      {/* Past entries */}
      <div style={{ padding:'16px 16px 24px' }}>
        <div className="aegis-label" style={{ marginBottom:10 }}>PAST ENTRIES</div>
        {loading.diary ? <SkeletonList count={3}/> :
         diary.length === 0 ? (
          <div className="aegis-card" style={{ textAlign:'center', padding:'32px 20px' }}>
            <BookOpen size={36} color="#52525b" style={{ margin:'0 auto 12px' }}/>
            <p style={{ color:'#52525b', fontSize:13 }}>No entries yet. Start journaling!</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {diary.map(entry => {
              const mood     = MOODS.find(m => m.value === entry.mood) || MOODS[2];
              const expanded = expandedId === entry.id;
              return (
                <div key={entry.id} className="aegis-card">
                  <button
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    style={{ width:'100%', background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:12 }}
                  >
                    <span style={{ fontSize:28, flexShrink:0 }}>{mood.emoji}</span>
                    <div style={{ flex:1, textAlign:'left' }}>
                      <p style={{ fontSize:12, color:'#52525b', margin:'0 0 3px', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.08em' }}>
                        {dateLabel(entry).toUpperCase()}
                      </p>
                      <p style={{ fontSize:14, color:'#f1f5f9', fontWeight:500, margin:0,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
                        display: expanded ? 'block' : undefined }}>
                        {entry.content}
                      </p>
                    </div>
                    {expanded ? <ChevronUp size={16} color="#52525b"/> : <ChevronDown size={16} color="#52525b"/>}
                  </button>

                  {expanded && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize:14, color:'#a1a1aa', lineHeight:1.6, marginBottom:10 }}>{entry.content}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span style={{ fontSize:11, color:mood.color, background:`${mood.color}18`,
                          border:`1px solid ${mood.color}30`, borderRadius:999, padding:'3px 10px' }}>
                          {mood.emoji} {mood.label}
                        </span>
                        {entry.tags?.map(t => (
                          <span key={t} style={{ fontSize:11, color:'#52525b', background:'#18181f',
                            border:'1px solid rgba(255,255,255,0.06)', borderRadius:999, padding:'3px 10px' }}>
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonList({ count }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} className="shimmer-skeleton" style={{ height:72 }}/>
      ))}
    </div>
  );
}

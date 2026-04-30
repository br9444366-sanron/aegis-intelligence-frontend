import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { Activity, Send, Zap, Clock } from 'lucide-react';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';

const CAT = {
  productive:    { label:'Productive',  color:'#34d399' },
  neutral:       { label:'Neutral',     color:'#6366f1' },
  distraction:   { label:'Distraction', color:'#f87171' },
  rest:          { label:'Rest',        color:'#a78bfa' },
  social:        { label:'Social',      color:'#fbbf24' },
  work:          { label:'Work',        color:'#60a5fa' },
  learning:      { label:'Learning',    color:'#f472b6' },
  health:        { label:'Health',      color:'#34d399' },
  other:         { label:'Other',       color:'#71717a' },
  uncategorized: { label:'Processing…', color:'#71717a' },
};

export default function ActivityLog() {
  const { activityLog, loading, addItem, refetch } = useData();
  const [activityText, setActivityText] = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [filter,       setFilter]       = useState('all');

  const handleLog = async () => {
    const text = activityText.trim();
    if (!text) { toast.error('Describe what you are doing'); return; }
    setSubmitting(true);
    const optimistic = { id:'temp-'+Date.now(), description:text, activityType:'uncategorized', createdAt:new Date().toISOString() };
    addItem('activityLog', optimistic);
    setActivityText('');
    try {
      const { data } = await api.post('/activity-log', { description:text });
      toast.success(`Logged! AI: ${data.data?.classification||'categorizing…'}`);
      refetch('activityLog');
    } catch (err) { toast.error(err.message||'Failed'); refetch('activityLog'); }
    finally { setSubmitting(false); }
  };

  const filtered = useMemo(() =>
    filter === 'all' ? activityLog :
    activityLog.filter(a => (a.activityType||'').toLowerCase() === filter),
  [activityLog, filter]);

  const todayCount = useMemo(() =>
    activityLog.filter(a => { try { return isToday(parseISO(a.createdAt)); } catch { return false; } }).length,
  [activityLog]);

  const dateLabel = (e) => {
    try {
      const d = parseISO(e.createdAt);
      if (isToday(d)) return format(d,'h:mm a');
      if (isYesterday(d)) return 'Yesterday '+format(d,'h:mm a');
      return format(d,'MMM d, h:mm a');
    } catch { return ''; }
  };

  const FILTERS = ['all','work','learning','health','productive','distraction','rest'];

  return (
    <div className="page-enter">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 20px 0' }}>
        <div>
          <div className="aegis-label">AEGIS · ACTIVITY</div>
          <div className="aegis-title">Log</div>
          <p style={{ fontSize:13, color:'#52525b', marginTop:4 }}>{todayCount} logged today</p>
        </div>
        <div style={{ marginRight:-4, marginTop:-8 }}>
          <NeuralSphere size={110} state="idle"/>
        </div>
      </div>

      {/* Input */}
      <div style={{ padding:'16px 16px 0' }}>
        <div className="aegis-card">
          <div className="aegis-label" style={{ marginBottom:12 }}>WHAT ARE YOU DOING?</div>
          <div style={{ display:'flex', gap:10 }}>
            <input className="aegis-input" style={{ flex:1, borderRadius:999, padding:'12px 18px' }}
              placeholder="e.g. Studying physics, watching YouTube…"
              value={activityText}
              onChange={e => setActivityText(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleLog()}
            />
            <button onClick={handleLog} disabled={submitting} style={{
              width:46, height:46, borderRadius:'50%', border:'none', cursor:'pointer', flexShrink:0,
              background:'linear-gradient(135deg,#60a5fa,#6e50be)',
              display:'flex', alignItems:'center', justifyContent:'center',
              opacity:submitting?0.5:1,
              boxShadow:'0 0 16px rgba(99,102,241,0.35)',
            }}>
              <Send size={18} color="white"/>
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:6, padding:'12px 16px 0', overflowX:'auto' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter===f ? 'aegis-pill aegis-pill-active' : 'aegis-pill'}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding:'12px 16px 24px' }}>
        {loading.activityLog ? <SkeletonList count={4}/> :
         filtered.length === 0 ? (
          <div className="aegis-card" style={{ textAlign:'center', padding:'40px 20px' }}>
            <Zap size={36} color="#52525b" style={{ margin:'0 auto 12px' }}/>
            <p style={{ color:'#52525b', fontSize:13 }}>No activities logged yet</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {filtered.map(entry => {
              const cat = CAT[entry.activityType] || CAT.other;
              return (
                <div key={entry.id} className="aegis-card" style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 16px', border:`1px solid ${cat.color}20` }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:cat.color, flexShrink:0, marginTop:5 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:14, color:'#f1f5f9', margin:'0 0 6px', lineHeight:1.4 }}>{entry.description}</p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span style={{ fontSize:11, color:cat.color, background:`${cat.color}18`,
                        border:`1px solid ${cat.color}30`, borderRadius:999, padding:'2px 8px' }}>
                        {entry.classification || cat.label}
                      </span>
                      {entry.productivityScore != null && (
                        <span style={{ fontSize:11, color:'#52525b' }}>⚡ {entry.productivityScore}/10</span>
                      )}
                      <span style={{ fontSize:11, color:'#52525b', display:'flex', alignItems:'center', gap:3, marginLeft:'auto' }}>
                        <Clock size={10}/> {dateLabel(entry)}
                      </span>
                    </div>
                  </div>
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
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {Array.from({length:count}).map((_,i) => (
        <div key={i} className="shimmer-skeleton" style={{ height:70 }}/>
      ))}
    </div>
  );
}

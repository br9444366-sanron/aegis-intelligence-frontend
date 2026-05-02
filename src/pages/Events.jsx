import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { CalendarDays, Plus, Trash2, MapPin, Clock, X, ChevronDown, ChevronUp } from 'lucide-react';
import { format, parseISO, isPast, isFuture, isToday, differenceInHours, differenceInDays } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';

const EVENT_TYPES = ['Meeting','Deadline','Personal','Health','Social','Learning','Other'];
const TYPE_CFG = {
  Meeting:  { color:'#6366f1', emoji:'📅' },
  Deadline: { color:'#f87171', emoji:'⏰' },
  Personal: { color:'#a78bfa', emoji:'🌟' },
  Health:   { color:'#34d399', emoji:'💪' },
  Social:   { color:'#fbbf24', emoji:'🎉' },
  Learning: { color:'#f472b6', emoji:'📚' },
  Other:    { color:'#71717a', emoji:'📌' },
};

export default function Events() {
  const { events, loading, addItem, removeItem } = useData();
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [filter,      setFilter]      = useState('upcoming');
  const [expandedId,  setExpandedId]  = useState(null);
  const [form, setForm] = useState({ title:'', date:'', time:'', location:'', description:'', type:'Meeting' });

  const { upcoming, past } = useMemo(() => {
    const sorted = [...events].sort((a,b) =>
      new Date(a.date+(a.time?'T'+a.time:'')) - new Date(b.date+(b.time?'T'+b.time:'')));
    return {
      upcoming: sorted.filter(e => { try { return isFuture(parseISO(e.date))||isToday(parseISO(e.date)); } catch { return false; } }),
      past:     sorted.filter(e => { try { return isPast(parseISO(e.date))&&!isToday(parseISO(e.date)); } catch { return false; } }).reverse(),
    };
  }, [events]);

  const displayed = filter === 'upcoming' ? upcoming : past;
  const nextEvent = upcoming[0];

  const countdown = useMemo(() => {
    if (!nextEvent) return null;
    try {
      const dt = parseISO(nextEvent.date+(nextEvent.time?'T'+nextEvent.time:''));
      const hours = differenceInHours(dt, new Date());
      const days = differenceInDays(dt, new Date());
      if (hours < 1) return 'Starting very soon!';
      if (hours < 24) return `In ${hours}h`;
      return `In ${days} day${days!==1?'s':''}`;
    } catch { return null; }
  }, [nextEvent]);

  const handleCreate = async () => {
    if (!form.title.trim()||!form.date) { toast.error('Title and date required'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/events', form);
      addItem('events', data.data);
      toast.success('Event created!');
      setForm({ title:'', date:'', time:'', location:'', description:'', type:'Meeting' });
      setShowForm(false);
    } catch (err) { toast.error(err.message||'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (ev) => {
    if (!window.confirm('Delete this event?')) return;
    removeItem('events', ev.id);
    try { await api.delete(`/events/${ev.id}`); toast.success('Event deleted'); }
    catch { addItem('events', ev); toast.error('Failed'); }
  };

  return (
    <div className="page-enter">
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 20px 0' }}>
        <div>
          <div className="aegis-label">AEGIS · EVENTS</div>
          <div className="aegis-title">Events</div>
          <p style={{ fontSize:13, color:'#52525b', marginTop:4 }}>{upcoming.length} upcoming</p>
        </div>
        <div style={{ marginRight:-4, marginTop:-8 }}>
          <NeuralSphere size={110} state="idle"/>
        </div>
      </div>

      {/* Next event countdown */}
      {nextEvent && countdown && (
        <div style={{ padding:'14px 16px 0' }}>
          <div className="aegis-card" style={{ background:'linear-gradient(135deg,rgba(110,80,190,0.15),#111118)', border:'1px solid rgba(110,80,190,0.25)', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{
              width:48, height:48, borderRadius:14, flexShrink:0,
              background:'rgba(110,80,190,0.20)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:24,
            }}>
              {TYPE_CFG[nextEvent.type]?.emoji||'📅'}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:11, color:'#52525b', margin:'0 0 3px', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.10em' }}>NEXT EVENT</p>
              <p style={{ fontSize:15, fontWeight:600, color:'#f1f5f9', margin:'0 0 2px' }}>{nextEvent.title}</p>
              <p style={{ fontSize:12, color:'#a78bfa', margin:0 }}>{countdown}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs + Add */}
      <div style={{ display:'flex', gap:8, padding:'14px 16px 0', alignItems:'center' }}>
        {['upcoming','past'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex:1, padding:'9px 0', borderRadius:999, cursor:'pointer',
            background: filter===f ? '#6e50be' : '#111118',
            color: filter===f ? 'white' : '#71717a', fontSize:13, fontWeight:500,
            border: filter===f ? 'none' : '1px solid rgba(255,255,255,0.06)',
            fontFamily:"'Inter',sans-serif", textTransform:'capitalize',
          }}>{f}</button>
        ))}
        <button onClick={() => setShowForm(v=>!v)} style={{
          padding:'9px 14px', borderRadius:999, border:'none', cursor:'pointer',
          background:'linear-gradient(135deg,#6e50be,#5b3fa8)',
          color:'white', display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:600,
          boxShadow:'0 0 16px rgba(110,80,190,0.30)', fontFamily:"'Inter',sans-serif",
        }}>
          <Plus size={15}/> Add
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ padding:'12px 16px 0' }}>
          <div className="aegis-card" style={{ border:'1px solid rgba(110,80,190,0.20)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div className="aegis-label">NEW EVENT</div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                <X size={16} color="#52525b"/>
              </button>
            </div>
            <input className="aegis-input" placeholder="Event title *" value={form.title}
              onChange={e => setForm({...form,title:e.target.value})} style={{ marginBottom:10 }}/>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <input type="date" className="aegis-input" value={form.date}
                onChange={e => setForm({...form,date:e.target.value})}/>
              <input type="time" className="aegis-input" value={form.time}
                onChange={e => setForm({...form,time:e.target.value})}/>
            </div>
            <select className="aegis-input" value={form.type}
              onChange={e => setForm({...form,type:e.target.value})} style={{ marginBottom:10 }}>
              {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
            <input className="aegis-input" placeholder="Location (optional)" value={form.location}
              onChange={e => setForm({...form,location:e.target.value})} style={{ marginBottom:10 }}/>
            <textarea className="aegis-input" placeholder="Description (optional)" rows={2}
              value={form.description} onChange={e => setForm({...form,description:e.target.value})}
              style={{ marginBottom:14 }}/>
            <button onClick={handleCreate} disabled={submitting} className="aegis-btn"
              style={{ opacity:submitting?0.6:1 }}>
              {submitting ? 'Creating…' : 'Create Event'}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ padding:'12px 16px 24px' }}>
        {loading.events ? <SkeletonList count={4}/> :
         displayed.length === 0 ? (
          <div className="aegis-card" style={{ textAlign:'center', padding:'40px 20px' }}>
            <CalendarDays size={36} color="#52525b" style={{ margin:'0 auto 12px' }}/>
            <p style={{ color:'#52525b', fontSize:13 }}>No {filter} events</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {displayed.map(ev => {
              const tc = TYPE_CFG[ev.type] || TYPE_CFG.Other;
              const expanded = expandedId === ev.id;
              return (
                <div key={ev.id} className="aegis-card" style={{ border:`1px solid ${tc.color}18` }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{
                      width:44, height:44, borderRadius:12, flexShrink:0,
                      background:`${tc.color}18`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22,
                    }}>{tc.emoji}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:500, fontSize:15, color:'#f1f5f9', margin:'0 0 4px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {ev.title}
                      </p>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:11, color:'#52525b', display:'flex', alignItems:'center', gap:3 }}>
                          <CalendarDays size={10}/> {ev.date}
                        </span>
                        {ev.time && (
                          <span style={{ fontSize:11, color:'#52525b', display:'flex', alignItems:'center', gap:3 }}>
                            <Clock size={10}/> {ev.time}
                          </span>
                        )}
                        {ev.location && (
                          <span style={{ fontSize:11, color:'#52525b', display:'flex', alignItems:'center', gap:3 }}>
                            <MapPin size={10}/> {ev.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => setExpandedId(expanded?null:ev.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                        {expanded ? <ChevronUp size={16} color="#52525b"/> : <ChevronDown size={16} color="#52525b"/>}
                      </button>
                      <button onClick={() => handleDelete(ev)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                        <Trash2 size={16} color="#52525b"/>
                      </button>
                    </div>
                  </div>
                  {expanded && ev.description && (
                    <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ fontSize:13, color:'#a1a1aa', lineHeight:1.5 }}>{ev.description}</p>
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
        <div key={i} className="shimmer-skeleton" style={{ height:74 }}/>
      ))}
    </div>
  );
}

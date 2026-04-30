import React, { useState } from 'react';
import { useData } from '../context/DataContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { Plus, Target, Trash2, CheckCircle2, ChevronDown, ChevronUp, X, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';

const safeFormat = (date, fmt) => {
  try {
    if (!date) return '';
    const d = date?.toDate ? date.toDate() : typeof date === 'string' ? parseISO(date) : new Date(date);
    return format(d, fmt);
  } catch { return ''; }
};

const CATEGORIES = ['Health','Career','Learning','Finance','Relationships','Personal','Other'];

const CAT_COLOR = {
  Health:'#34d399', Career:'#6366f1', Learning:'#a78bfa',
  Finance:'#fbbf24', Relationships:'#f472b6', Personal:'#60a5fa', Other:'#71717a',
};
const PRIORITY_COLOR = { high:'#f87171', medium:'#fbbf24', low:'#34d399' };

export default function Goals() {
  const { goals, loading, addItem, updateItem, removeItem } = useData();
  const [showForm,    setShowForm]    = useState(false);
  const [filter,      setFilter]      = useState('active');
  const [expandedId,  setExpandedId]  = useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [form, setForm] = useState({ title:'', description:'', category:'Personal', targetDate:'', priority:'medium' });

  const filtered = goals.filter(g =>
    filter === 'active' ? g.status !== 'completed' :
    filter === 'completed' ? g.status === 'completed' : true
  );

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Goal title required'); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post('/goals', { ...form, progress: 0, status: 'active' });
      addItem('goals', data.data);
      toast.success('Goal created!');
      setForm({ title:'', description:'', category:'Personal', targetDate:'', priority:'medium' });
      setShowForm(false);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleProgress = async (goal, val) => {
    updateItem('goals', goal.id, { progress: val });
    try { await api.patch(`/goals/${goal.id}`, { progress: val }); }
    catch { updateItem('goals', goal.id, { progress: goal.progress }); toast.error('Failed'); }
  };

  const handleToggleComplete = async (goal) => {
    const ns = goal.status === 'completed' ? 'active' : 'completed';
    updateItem('goals', goal.id, { status: ns });
    try {
      await api.patch(`/goals/${goal.id}`, { status: ns, progress: ns === 'completed' ? 100 : goal.progress });
      toast.success(ns === 'completed' ? '🎉 Goal completed!' : 'Goal reactivated');
    } catch { updateItem('goals', goal.id, { status: goal.status }); toast.error('Failed'); }
  };

  const handleDelete = async (goal) => {
    if (!window.confirm('Delete this goal?')) return;
    removeItem('goals', goal.id);
    try { await api.delete(`/goals/${goal.id}`); toast.success('Goal deleted'); }
    catch { addItem('goals', goal); toast.error('Failed'); }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 20px 0' }}>
        <div>
          <div className="aegis-label">AEGIS · GOALS</div>
          <div className="aegis-title">Goals</div>
          <p style={{ fontSize:13, color:'#52525b', marginTop:4 }}>{goals.filter(g=>g.status!=='completed').length} active</p>
        </div>
        <div style={{ marginRight:-4, marginTop:-8 }}>
          <NeuralSphere size={110} state="idle" />
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, padding:'16px 16px 0' }}>
        {['active','completed','all'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            flex:1, padding:'9px 0', borderRadius:999, border:'none', cursor:'pointer',
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
          <Plus size={15}/> New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ padding:'12px 16px 0' }}>
          <div className="aegis-card" style={{ border:'1px solid rgba(110,80,190,0.25)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div className="aegis-label">NEW GOAL</div>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer' }}>
                <X size={16} color="#52525b"/>
              </button>
            </div>
            <input className="aegis-input" placeholder="Goal title *" value={form.title}
              onChange={e => setForm({...form, title:e.target.value})} style={{ marginBottom:10 }} />
            <textarea className="aegis-input" placeholder="Description (optional)" rows={2}
              value={form.description} onChange={e => setForm({...form, description:e.target.value})}
              style={{ marginBottom:10 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <select className="aegis-input" value={form.category}
                onChange={e => setForm({...form, category:e.target.value})}>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="aegis-input" value={form.priority}
                onChange={e => setForm({...form, priority:e.target.value})}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <input type="date" className="aegis-input" value={form.targetDate}
              onChange={e => setForm({...form, targetDate:e.target.value})} style={{ marginBottom:14 }} />
            <button onClick={handleCreate} disabled={submitting} className="aegis-btn"
              style={{ opacity:submitting?0.6:1 }}>
              {submitting ? 'Creating…' : 'Create Goal'}
            </button>
          </div>
        </div>
      )}

      {/* Goals list */}
      <div style={{ padding:'12px 16px 24px' }}>
        {loading.goals ? <SkeletonList count={4} /> :
         filtered.length === 0 ? (
          <div className="aegis-card" style={{ textAlign:'center', padding:'40px 20px' }}>
            <Target size={36} color="#52525b" style={{ margin:'0 auto 12px' }}/>
            <p style={{ color:'#52525b', fontSize:13 }}>No {filter} goals found</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {filtered.map(goal => {
              const catColor  = CAT_COLOR[goal.category] || '#71717a';
              const priColor  = PRIORITY_COLOR[goal.priority] || '#71717a';
              const isExpanded = expandedId === goal.id;
              return (
                <div key={goal.id} className="aegis-card" style={{ opacity: goal.status==='completed' ? 0.6 : 1 }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <button onClick={() => handleToggleComplete(goal)} style={{ background:'none', border:'none', cursor:'pointer', marginTop:2, flexShrink:0 }}>
                      <CheckCircle2 size={20} color={goal.status==='completed' ? '#34d399' : '#27272a'} />
                    </button>
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:500, fontSize:15, color: goal.status==='completed' ? '#52525b' : '#f1f5f9',
                        textDecoration: goal.status==='completed' ? 'line-through' : 'none', margin:'0 0 6px',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {goal.title}
                      </p>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontSize:11, background:`${catColor}18`, color:catColor,
                          border:`1px solid ${catColor}30`, borderRadius:999, padding:'2px 8px' }}>
                          {goal.category}
                        </span>
                        <span style={{ fontSize:11, color:priColor, fontWeight:600 }}>{goal.priority}</span>
                        {goal.targetDate && (
                          <span style={{ fontSize:11, color:'#52525b', display:'flex', alignItems:'center', gap:3 }}>
                            <Calendar size={10}/> {safeFormat(goal.targetDate,'MMM d')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:4 }}>
                      <button onClick={() => setExpandedId(isExpanded ? null : goal.id)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                        {isExpanded ? <ChevronUp size={16} color="#52525b"/> : <ChevronDown size={16} color="#52525b"/>}
                      </button>
                      <button onClick={() => handleDelete(goal)}
                        style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                        <Trash2 size={16} color="#52525b"/>
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div style={{ marginTop:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:11, color:'#52525b' }}>Progress</span>
                      <span style={{ fontSize:11, fontWeight:700, color:'#a78bfa' }}>{goal.progress||0}%</span>
                    </div>
                    <div style={{ height:4, background:'#18181f', borderRadius:999, overflow:'hidden' }}>
                      <div style={{
                        height:'100%', width:`${goal.progress||0}%`, borderRadius:999,
                        background:'linear-gradient(90deg,#6e50be,#34d399)',
                        transition:'width 0.5s ease',
                      }}/>
                    </div>
                  </div>

                  {isExpanded && (
                    <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                      {goal.description && (
                        <p style={{ fontSize:13, color:'#a1a1aa', marginBottom:12, lineHeight:1.5 }}>{goal.description}</p>
                      )}
                      <p style={{ fontSize:11, color:'#52525b', marginBottom:6, fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.10em' }}>UPDATE PROGRESS</p>
                      <input type="range" min="0" max="100" step="5"
                        value={goal.progress||0}
                        onChange={e => handleProgress(goal, parseInt(e.target.value))}
                        style={{ width:'100%', accentColor:'#6e50be' }}
                      />
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
        <div key={i} className="shimmer-skeleton" style={{ height:90 }}/>
      ))}
    </div>
  );
}

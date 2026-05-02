import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext.jsx';
import api from '../api/apiClient.js';
import toast from 'react-hot-toast';
import { Plus, CheckCircle2, Circle, Trash2, ChevronLeft, ChevronRight, Clock, X } from 'lucide-react';
import { format, addDays, subDays, isToday, parseISO, isSameDay } from 'date-fns';
import NeuralSphere from '../components/NeuralSphere.jsx';

export default function Schedule() {
  const { schedule, loading, addItem, updateItem, removeItem } = useData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm,     setShowForm]     = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [form, setForm] = useState({ title:'', time:'', priority:'medium', notes:'' });

  const dayTasks = useMemo(() =>
    schedule.filter(t => {
      try { return isSameDay(parseISO(t.date || t.scheduledDate), selectedDate); } catch { return false; }
    }).sort((a,b) => (a.time||'').localeCompare(b.time||'')),
  [schedule, selectedDate]);

  const completedCount = dayTasks.filter(t => t.completed).length;

  const handleCreate = async () => {
    if (!form.title.trim()) { toast.error('Task title required'); return; }
    setSubmitting(true);
    try {
      const payload = { ...form, date: format(selectedDate,'yyyy-MM-dd'), completed:false };
      const { data } = await api.post('/schedule', payload);
      addItem('schedule', data.data);
      toast.success('Task added!');
      setForm({ title:'', time:'', priority:'medium', notes:'' });
      setShowForm(false);
    } catch (err) { toast.error(err.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  const handleToggle = async (task) => {
    const nc = !task.completed;
    updateItem('schedule', task.id, { completed:nc });
    try { await api.patch(`/schedule/${task.id}`, { completed:nc }); }
    catch { updateItem('schedule', task.id, { completed:task.completed }); toast.error('Failed'); }
  };

  const handleDelete = async (task) => {
    removeItem('schedule', task.id);
    try { await api.delete(`/schedule/${task.id}`); toast.success('Task removed'); }
    catch { addItem('schedule', task); toast.error('Failed'); }
  };

  const PRIORITY = {
    high:   { color:'#f87171', emoji:'🔴' },
    medium: { color:'#fbbf24', emoji:'🟡' },
    low:    { color:'#34d399', emoji:'🟢' },
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'24px 20px 0' }}>
        <div>
          <div className="aegis-label">AEGIS · OPS</div>
          <div className="aegis-title">Schedule</div>
          <p style={{ fontSize:13, color:'#52525b', marginTop:4 }}>{completedCount}/{dayTasks.length} complete</p>
        </div>
        <div style={{ marginRight:-4, marginTop:-8 }}>
          <NeuralSphere size={110} state="idle" />
        </div>
      </div>

      {/* Date navigator */}
      <div style={{ padding:'16px 16px 0' }}>
        <div className="aegis-card" style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px' }}>
          <button onClick={() => setSelectedDate(d => subDays(d,1))}
            style={{ background:'none', border:'none', cursor:'pointer', padding:8 }}>
            <ChevronLeft size={20} color="#52525b"/>
          </button>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontWeight:600, fontSize:16, color:'#f1f5f9', margin:0 }}>{format(selectedDate,'EEEE')}</p>
            <p style={{ fontSize:12, color:'#52525b', margin:'2px 0 0' }}>{format(selectedDate,'MMMM d, yyyy')}</p>
            {isToday(selectedDate) && (
              <span style={{ fontSize:10, background:'rgba(110,80,190,0.15)', color:'#a78bfa',
                border:'1px solid rgba(110,80,190,0.30)', borderRadius:999, padding:'2px 8px',
                fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.08em' }}>TODAY</span>
            )}
          </div>
          <button onClick={() => setSelectedDate(d => addDays(d,1))}
            style={{ background:'none', border:'none', cursor:'pointer', padding:8 }}>
            <ChevronRight size={20} color="#52525b"/>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {dayTasks.length > 0 && (
        <div style={{ padding:'10px 16px 0' }}>
          <div style={{ height:4, background:'#111118', borderRadius:999, overflow:'hidden' }}>
            <div style={{
              height:'100%', borderRadius:999, transition:'width 0.5s ease',
              width:`${(completedCount/dayTasks.length)*100}%`,
              background:'linear-gradient(90deg,#6e50be,#34d399)',
            }}/>
          </div>
        </div>
      )}

      {/* Add task button */}
      <div style={{ padding:'12px 16px 0' }}>
        <button onClick={() => setShowForm(v=>!v)} style={{
          width:'100%', padding:'13px 0', borderRadius:14, cursor:'pointer',
          background: showForm ? '#111118' : 'linear-gradient(135deg,#6e50be,#5b3fa8)',
          color:'white', fontWeight:600, fontSize:14,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          border: showForm ? '1px solid rgba(255,255,255,0.08)' : 'none',
          boxShadow: showForm ? 'none' : '0 0 20px rgba(110,80,190,0.30)',
          fontFamily:"'Inter',sans-serif",
        }}>
          {showForm ? <><X size={16}/> Cancel</> : <><Plus size={16}/> Add Task</>}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ padding:'10px 16px 0' }}>
          <div className="aegis-card" style={{ border:'1px solid rgba(110,80,190,0.20)' }}>
            <div className="aegis-label" style={{ marginBottom:14 }}>NEW TASK — {format(selectedDate,'MMM d').toUpperCase()}</div>
            <input className="aegis-input" placeholder="Task title *" value={form.title}
              onChange={e => setForm({...form, title:e.target.value})} style={{ marginBottom:10 }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <input type="time" className="aegis-input" value={form.time}
                onChange={e => setForm({...form, time:e.target.value})} />
              <select className="aegis-input" value={form.priority}
                onChange={e => setForm({...form, priority:e.target.value})}>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
            <textarea className="aegis-input" placeholder="Notes (optional)" rows={2}
              value={form.notes} onChange={e => setForm({...form, notes:e.target.value})}
              style={{ marginBottom:14 }} />
            <button onClick={handleCreate} disabled={submitting} className="aegis-btn"
              style={{ opacity:submitting?0.6:1 }}>
              {submitting ? 'Adding…' : 'Add Task'}
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div style={{ padding:'12px 16px 24px' }}>
        {loading.schedule ? <SkeletonList count={4}/> :
         dayTasks.length === 0 ? (
          <div className="aegis-card" style={{ textAlign:'center', padding:'40px 20px' }}>
            <CheckCircle2 size={36} color="#52525b" style={{ margin:'0 auto 12px' }}/>
            <p style={{ color:'#52525b', fontSize:13, margin:'0 0 16px' }}>No tasks for this day</p>
            <button onClick={() => setShowForm(true)} style={{
              background:'none', border:'1px solid rgba(110,80,190,0.30)',
              color:'#a78bfa', fontSize:13, borderRadius:999, padding:'8px 16px', cursor:'pointer',
              fontFamily:"'Inter',sans-serif",
            }}>Add a task →</button>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {dayTasks.map(task => {
              const pc = PRIORITY[task.priority] || PRIORITY.medium;
              return (
                <div key={task.id} className="aegis-card" style={{
                  display:'flex', alignItems:'flex-start', gap:12,
                  opacity: task.completed ? 0.5 : 1, padding:'14px 16px',
                }}>
                  <button onClick={() => handleToggle(task)} style={{ background:'none', border:'none', cursor:'pointer', marginTop:2, flexShrink:0 }}>
                    {task.completed
                      ? <CheckCircle2 size={20} color="#34d399"/>
                      : <Circle size={20} color="#27272a"/>
                    }
                  </button>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:15, fontWeight:500, margin:'0 0 5px',
                      color: task.completed ? '#52525b' : '#f1f5f9',
                      textDecoration: task.completed ? 'line-through' : 'none' }}>
                      {task.title}
                    </p>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      {task.time && (
                        <span style={{ fontSize:11, color:'#52525b', display:'flex', alignItems:'center', gap:3 }}>
                          <Clock size={10}/> {task.time}
                        </span>
                      )}
                      <span style={{ fontSize:11, color:pc.color }}>{pc.emoji} {task.priority}</span>
                    </div>
                    {task.notes && <p style={{ fontSize:12, color:'#52525b', marginTop:4 }}>{task.notes}</p>}
                  </div>
                  <button onClick={() => handleDelete(task)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}>
                    <Trash2 size={16} color="#52525b"/>
                  </button>
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

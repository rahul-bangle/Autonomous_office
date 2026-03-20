import React, { useState } from 'react';

function LeftPanel({ agents = [], onOpenModal, onEditAgent, onRemoveAgent, onMeeting, meetingActive = false }) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});

  const startEdit = (agent) => {
    setEditingId(agent.id);
    setEditForm({
      name:  agent.name,
      role:  agent.role,
      goal:  agent.desc,
      skills: (agent.skills || []).join(', '),
      tools:  (agent.tools  || []).join(', '),
    });
  };

  const saveEdit = (id) => {
    onEditAgent?.(id, {
      name:  editForm.name.trim(),
      role:  editForm.role.trim(),
      desc:  editForm.goal.trim(),
      skills: editForm.skills.split(',').map(s => s.trim()).filter(Boolean),
      tools:  editForm.tools.split(',').map(t => t.trim()).filter(Boolean),
    });
    setEditingId(null);
  };

  const priorityMeta = (p) => ({
    Critical: { icon: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
    High:     { icon: '🟠', color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
    Medium:   { icon: '🟡', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
    Low:      { icon: '🔵', color: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
  }[p] || { icon: '⚪', color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' });

  const inputStyle = {
    width: '100%', padding: '4px 6px', marginBottom: '4px', borderRadius: '4px',
    border: '1px solid #334155', backgroundColor: '#0f172a', color: '#f8fafc',
    fontSize: '11px', boxSizing: 'border-box',
  };

  return (
    <div style={{
      width: '280px', flexShrink: 0, backgroundColor: 'var(--bg-panel)',
      display: 'flex', flexDirection: 'column', padding: '16px',
      borderLeft: '1px solid var(--border-color)', overflowY: 'auto'
    }} className="custom-scrollbar">

      {/* ── Top buttons ── */}
      <button onClick={onOpenModal} style={{
        backgroundColor: 'var(--primary)', color: '#0d0d0d', fontWeight: 'bold',
        padding: '12px', borderRadius: '6px', marginBottom: '8px',
        cursor: 'pointer', border: 'none', fontSize: '14px'
      }}>
        + Create Agent
      </button>

      <button onClick={onMeeting} style={{
        backgroundColor: meetingActive ? '#7f1d1d' : '#1e1e1e',
        color: meetingActive ? '#fca5a5' : 'var(--text-main)',
        padding: '12px', borderRadius: '6px', marginBottom: '20px',
        border: `1px solid ${meetingActive ? '#ef444466' : 'var(--border-color)'}`,
        fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
      }}>
        {meetingActive ? '🔚 End Meeting' : '👥 Call a Meeting'}
      </button>

      {/* ── Agent cards ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {agents.map(agent => {
          const pm    = priorityMeta(agent.priority);
          const isEditing = editingId === agent.id;

          return (
            <div key={agent.id} style={{
              backgroundColor: 'var(--bg-card)', border: `1px solid ${pm.color}44`,
              borderRadius: '6px', padding: '12px', transition: 'border-color 0.2s',
            }}>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    backgroundColor: (meetingActive ? '#ef4444' : {
                      idle: '#22c55e',
                      moving: '#3b82f6',
                      working: '#eab308'
                    }[agent.status] || '#22c55e'),
                    boxShadow: `0 0 6px ${(meetingActive ? '#ef4444' : {
                      idle: '#22c55e',
                      moving: '#3b82f6',
                      working: '#eab308'
                    }[agent.status] || '#22c55e')}aa`
                  }} title={meetingActive ? 'meeting' : (agent.status || 'idle')} />
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px' }}>{agent.name}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    backgroundColor: pm.bg, color: pm.color,
                    border: `1px solid ${pm.color}55`, padding: '2px 6px',
                    borderRadius: '10px', fontSize: '10px', fontWeight: 'bold'
                  }}>{pm.icon} {agent.priority || 'Medium'}</span>

                  {/* Edit button */}
                  <button onClick={() => isEditing ? setEditingId(null) : startEdit(agent)}
                    title={isEditing ? 'Cancel edit' : 'Edit agent'}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: '13px', padding: '1px 3px', borderRadius: '3px',
                      color: isEditing ? '#60a5fa' : '#94a3b8',
                      backgroundColor: isEditing ? 'rgba(96,165,250,0.15)' : 'transparent',
                    }}>✏️</button>

                  {/* Remove button (hidden for CEO) */}
                  {agent.role.toLowerCase() !== 'executive' && (
                    <button onClick={() => { if (window.confirm(`Remove ${agent.name}?`)) onRemoveAgent?.(agent.id); }}
                      title="Remove agent"
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '13px', padding: '1px 3px', borderRadius: '3px',
                        color: '#94a3b8',
                      }}>🗑</button>
                  )}
                </div>
              </div>

              {/* Zone tag */}
              {agent.zone && (
                <div style={{ marginBottom: '6px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', backgroundColor: '#1e293b', border: '1px solid #334155', padding: '1px 7px', borderRadius: '8px' }}>
                    📍 {agent.zone}
                  </span>
                </div>
              )}

              {/* Inline edit form */}
              {isEditing ? (
                <div style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '4px', fontWeight: 'bold' }}>EDIT</div>
                  {[['name','Name'],['role','Role'],['goal','Goal']].map(([k, label]) => (
                    <input key={k} placeholder={label} value={editForm[k] || ''}
                      onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))}
                      style={inputStyle} />
                  ))}
                  <input placeholder="Skills (comma-separated)" value={editForm.skills || ''}
                    onChange={e => setEditForm(f => ({ ...f, skills: e.target.value }))}
                    style={inputStyle} />
                  <input placeholder="Tools (comma-separated)" value={editForm.tools || ''}
                    onChange={e => setEditForm(f => ({ ...f, tools: e.target.value }))}
                    style={inputStyle} />
                  <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                    <button onClick={() => saveEdit(agent.id)} style={{
                      flex: 1, padding: '5px', borderRadius: '4px', border: 'none',
                      backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
                    }}>Save</button>
                    <button onClick={() => setEditingId(null)} style={{
                      flex: 1, padding: '5px', borderRadius: '4px', border: '1px solid #334155',
                      backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer', fontSize: '11px'
                    }}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '12px', marginBottom: '10px' }}>{agent.desc}</div>
              )}

              {/* Skills & Tools */}
              {!isEditing && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 'bold' }}>SKILLS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {(agent.skills || []).map(s => (
                        <span key={s} style={{ backgroundColor: 'rgba(34,197,94,0.2)', color: 'var(--primary)', padding: '2px 7px', borderRadius: '12px', fontSize: '10px', border: '1px solid rgba(34,197,94,0.4)' }}>🟢 {s}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '3px', fontWeight: 'bold' }}>TOOLS</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px' }}>
                      {(agent.tools || []).map(t => (
                        <span key={t} style={{ backgroundColor: 'rgba(168,85,247,0.2)', color: 'var(--accent)', padding: '2px 7px', borderRadius: '12px', fontSize: '10px', border: '1px solid rgba(168,85,247,0.4)' }}>🟣 {t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

export default LeftPanel;

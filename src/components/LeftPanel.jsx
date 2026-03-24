import React, { useState } from 'react';
import { 
  Home, 
  Users, 
  BarChart3, 
  Calendar, 
  ListTodo, 
  Archive, 
  Settings,
  Plus,
  Users2,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Trash2
} from 'lucide-react';
import Roadmap from './Roadmap';
import Tasks from './Tasks';
import LiveFeed from './LiveFeed';
import ProjectVelocity from './ProjectVelocity';

function LeftPanel({ 
  agents = [], 
  onOpenModal, 
  onEditAgent, 
  onRemoveAgent, 
  onMeeting, 
  meetingActive = false,
  tasks = [],
  milestones = [],
  events = [],
  onUpdateTask,
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse
}) {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm]   = useState({});

  const navItems = [
    { id: 'home', icon: Home, label: 'Command Center' },
    { id: 'office', icon: Users, label: 'Team Office' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics' },
    { id: 'roadmap', icon: Calendar, label: 'Roadmap' },
    { id: 'tasks', icon: ListTodo, label: 'Tasks' },
    { id: 'backlog', icon: Archive, label: 'Backlog' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  // ... (keep startEdit, saveEdit, priorityMeta, inputStyle)

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
    <div className="glass-card" style={{
      width: isCollapsed ? '70px' : '280px', height: '100%', display: 'flex', border: 'none', borderRadius: '0',
      borderRight: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden', 
      transition: 'width 0.3s ease', backgroundColor: '#000'
    }}>
      {/* ── Navigation Rail ── */}
      <div style={{
        width: '70px', backgroundColor: 'rgba(255,255,255,0.02)', 
        display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0',
        gap: '20px', borderRight: '1px solid rgba(255,255,255,0.05)', flexShrink: 0
      }}>
        {navItems.map(item => (
          <button 
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={item.label}
            style={{
              background: 'none', color: activeTab === item.id ? 'var(--primary)' : 'rgba(255,255,255,0.4)',
              cursor: 'pointer', transition: 'all 0.2s', padding: '8px', borderRadius: '12px',
              backgroundColor: activeTab === item.id ? 'rgba(34,197,94,0.1)' : 'transparent'
            }}
          >
            <item.icon size={24} />
          </button>
        ))}
      </div>

      {/* ── Subpanel Content ── */}
      {!isCollapsed && (
        <div className="custom-scrollbar" style={{ flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: 'transparent' }}>
          <h2 style={{ fontSize: '14px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '20px', color: 'rgba(255,255,255,0.5)' }}>
            {navItems.find(n => n.id === activeTab)?.label}
          </h2>

          {activeTab === 'home' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ProjectVelocity tasks={tasks} />
              <LiveFeed events={events} />
            </div>
          )}

          {activeTab === 'office' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {agents.map(agent => (
                    <div key={agent.id} className="glass-card" style={{ padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: agent.color }} />
                          <span style={{ fontWeight: '600', fontSize: '13px' }}>{agent.name}</span>
                       </div>
                       <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{agent.role}</div>
                    </div>
                  ))}
               </div>

              <button onClick={onMeeting} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                backgroundColor: 'rgba(34,197,94,0.1)', color: 'var(--primary)', border: '1px solid rgba(34,197,94,0.2)',
                padding: '10px', borderRadius: '12px', cursor: 'pointer', fontSize: '12px', fontWeight: '600'
              }}>
                <Plus size={16} /> New Agent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sidebar Footer */}
      <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
         <button onClick={onToggleCollapse} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
            padding: '8px', borderRadius: '4px', cursor: 'pointer', color: 'rgba(255,255,255,0.3)',
            backgroundColor: 'transparent', border: 'none'
         }}>
           {isCollapsed ? <ChevronRight size={18} /> : <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><ChevronLeft size={18} /> <span style={{ fontSize: '12px' }}>Collapse Menu</span></div>}
         </button>
      </div>
    </div>
  );
}

export default LeftPanel;

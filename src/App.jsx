import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import OfficeCanvas from './components/OfficeCanvas';
import OfficeCanvas3D from './components/OfficeCanvas3D';
import LeftPanel from './components/LeftPanel';
import AgentChat from './components/AgentChat';
import CreateAgentModal from './components/CreateAgentModal';
import Roadmap from './components/Roadmap';
import Tasks from './components/Tasks';
import bus from './EventBus';

import { ROOMS, PRIORITY_ORDER } from './constants';

const initialAgents = [
  { id: '1', name: 'Scout', role: 'Researcher', desc: 'Internet khangaalo, latest data laao, sources verify karo', color: '#ff6b6b', priority: 'High', zone: 'workspace', skills: ['Research', 'Web Search'], tools: ['Browser'] },
  { id: '2', name: 'Strategist', role: 'Planner', desc: 'Scout ka data dekho, best plan/approach decide karo', color: '#4ecdc4', priority: 'High', zone: 'workspace', skills: ['Planning', 'Analysis'], tools: ['Whiteboard'] },
  { id: '3', name: 'Scribe', role: 'Writer', desc: 'Strategist ka plan lo, user ke liye crystal clear output likho', color: '#ffe66d', priority: 'Medium', zone: 'workspace', skills: ['Copywriting', 'Documentation'], tools: ['Text Editor'] },
  { id: '4', name: 'Critic', role: 'Reviewer', desc: 'Scribe ka output dekho, holes dhundho, improve karo', color: '#a78bfa', priority: 'High', zone: 'workspace', skills: ['Quality Assurance', 'Logic validation'], tools: ['Linter'] },
  { id: '5', name: 'Chief', role: 'Executive', desc: 'Poori chain ka final output lo, executive summary do, decision suggest karo', color: '#fb923c', priority: 'Critical', zone: 'ceoCabin', skills: ['Leadership', 'Decision Making'], tools: ['Dashboard'] },
];

function App() {
  const [agents, setAgents]         = useState(initialAgents);
  const [availableSkills, setAvailableSkills] = useState([
    'Research', 'Strategy', 'Planning', 'Analysis', 'Execution', 'Coding', 
    'Web Search', 'Copywriting', 'Documentation', 'Quality Assurance', 'Leadership'
  ]);
  const [dbLoaded, setDbLoaded]     = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [meetingMode, setMeetingMode] = useState(false);
  const [activeTab, setActiveTab]     = useState('office');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showHints, setShowHints]   = useState(false);
  const [showDebug, setShowDebug]   = useState(false);
  const [toasts, setToasts]         = useState([]);
  const [events, setEvents]         = useState([
    { agent: 'System', text: 'Origin Command Online', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: '#10b981' },
    { agent: 'Strategist', text: 'Phase 2: Project Intelligence active', time: '01:50 AM', color: '#f59e0b' }
  ]);

  // ── Phase 2: Native Task & Roadmap State ───────────────────────────
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('vo_tasks');
    return saved ? JSON.parse(saved) : [
      { id: 't1', title: 'Implement Roadmap UI', status: 'Done', priority: 'High', assignee: 'Scout' },
      { id: 't2', title: 'Neuralize Supabase Backend', status: 'Done', priority: 'Critical', assignee: 'Strategist' },
      { id: 't3', title: 'Contextual Intelligence', status: 'In Progress', priority: 'Medium', assignee: 'Scout' },
      { id: 't4', title: 'Auto-Reporting Module', status: 'To Do', priority: 'Low', assignee: 'Unassigned' },
    ];
  });

  const [milestones, setMilestones] = useState(() => {
    const saved = localStorage.getItem('vo_milestones');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Phase 1: Dashboard Shell', status: 'completed', date: 'Mar 2026', items: ['Glassmorphism UI', 'Supabase Neutralization', 'Agent Edit Form'] },
      { id: 2, title: 'Phase 2: Project Intelligence', status: 'active', date: 'Current', items: ['Native Roadmap', 'Internal Kanban Board', 'Contextual Intelligence'] },
      { id: 3, title: 'Phase 3: Multi-Agent Workflows', status: 'upcoming', date: 'Apr 2026', items: ['Assembly Pipeline v2', 'Conflict Resolution', 'Auto-Reporting'] }
    ];
  });

  useEffect(() => {
    localStorage.setItem('vo_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('vo_milestones', JSON.stringify(milestones));
  }, [milestones]);

  const addToast = (message) => { // Assuming addToast is defined elsewhere or needs to be added
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, message }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  const handleUpdateTask = (taskId, newStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const task = tasks.find(t => t.id === taskId);
    addToast(`Task "${task.title}" moved to ${newStatus}`);
    
    // Add to Live Feed
    setEvents(prev => [{
      agent: task.assignee !== 'Unassigned' ? task.assignee : 'System',
      text: `Moved "${task.title}" to ${newStatus}`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      color: task.assignee === 'Scout' ? '#3b82f6' : task.assignee === 'Strategist' ? '#f59e0b' : '#64748b'
    }, ...prev].slice(0, 20));
  };
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [isEditMode, setIsEditMode]   = useState(false);
  const [view3D, setView3D]           = useState(true);
  
  // ── LOAD AGENTS FROM SUPABASE ────────────────────────────────────────────────
  useEffect(() => {
    async function loadAgents() {
      const { data, error } = await supabase.from('vo_agents').select('*');
      if (error) {
        console.error('[App] Failed to load agents from Supabase:', error);
      } else if (data && data.length > 0) {
        setAgents(data.map(a => ({ ...a, desc: a.desc || '', isNew: false })));
      }
      setDbLoaded(true);
    }
    loadAgents();
  }, []);

  // ── SAVE AGENTS TO SUPABASE ──────────────────────────────────────────────────
  useEffect(() => {
    if (!dbLoaded) return;
    async function saveAgents() {
      try {
        // Upsert all. Then optionally delete ones removed. For now, simple upsert.
        const { error } = await supabase.from('vo_agents').upsert(
          agents.map(a => ({
            id: String(a.id), name: a.name, role: a.role, "desc": a.desc,
            color: a.color, priority: a.priority, zone: a.zone, 
            skills: a.skills || [], tools: a.tools || []
          }))
        );
        if (error) throw error;
      } catch (err) {
        console.warn('[App] Failed to save agents to Supabase:', err);
      }
    }
    saveAgents();
  }, [agents, dbLoaded]);

  // ── TIME-OF-DAY TINT ────────────────────────────────────────────────────────
  // Computed once on mount from system clock; 0=morning, 1=midday, 2=afternoon, 3=night
  const todTint = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return { label: 'morning', overlay: 'rgba(255,200,120,0.10)' }; // warm
    if (h < 17) return { label: 'midday', overlay: 'rgba(220,235,255,0.06)' }; // neutral cool
    if (h < 20) return { label: 'afternoon', overlay: 'rgba(255,140,40,0.12)' }; // amber
    return { label: 'night', overlay: 'rgba(10,20,60,0.22)' }; // dark blue
  }, []);

  // Ref to hold in-flight task animation timeouts so they can be cancelled
  const taskTimersRef = React.useRef([]);

  useEffect(() => {
    // Fetch dynamic skills with fallback to local state
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => { if (data.skills) setAvailableSkills(data.skills); })
      .catch(err => console.warn("[App] Using local skill fallbacks:", err));

    fetch('http://localhost:8000/api/layout')
      .then(res => res.json())
      .then(data => { 
        if (data && typeof data === 'object' && Object.keys(data).length > 0) {
          setLayoutConfig(data); 
        }
      })
      .catch(err => console.error("Error fetching layout:", err));

    // ── task.started: stagger agents through MOVING → WORKING before backend returns
    const unsubStart = bus.on('task.started', ({ agentSequence = [] }) => {
      // Cancel any leftover timers from a previous run
      taskTimersRef.current.forEach(clearTimeout);
      taskTimersRef.current = [];

      agentSequence.forEach((agInfo, i) => {
        // Phase 1: MOVING (staggered by 3s per agent)
        const t1 = setTimeout(() => {
          setAgents(prev => prev.map(a => {
            if (String(a.id) !== String(agInfo.id)) return a;
            return { ...a, status: 'moving', targetZone: agInfo.targetZone || 'library' };
          }));
        }, i * 3000);

        // Phase 2: WORKING (1.5s after MOVING starts)
        const t2 = setTimeout(() => {
          setAgents(prev => prev.map(a => {
            if (String(a.id) !== String(agInfo.id)) return a;
            return { ...a, status: 'working' };
          }));
        }, i * 3000 + 1500);

        taskTimersRef.current.push(t1, t2);
      });
    });

    // ── task.assigned: crew run complete — reset agents + show toast
    const unsubDone = bus.on('task.assigned', ({ agents: ags = [] }) => {
      taskTimersRef.current.forEach(clearTimeout);
      taskTimersRef.current = [];
      setAgents(prev => prev.map(a => ({ ...a, status: 'idle', targetZone: undefined })));
      // Toast per completed agent
      ags.forEach(agInfo => {
        const name = agInfo.agentId || agInfo.name || 'Agent';
        const id   = Date.now() + Math.random();
        setToasts(t => [...t, { id, message: `${name} finished task ✅` }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
      });
      // Fallback toast if no agents in payload
      if (ags.length === 0) {
        const id = Date.now();
        setToasts(t => [...t, { id, message: 'Task complete ✅' }]);
        setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
      }
    });

    return () => { unsubStart(); unsubDone(); };
  }, []);

  // Auto-collapse sidebar on Home tab for clean focus
  useEffect(() => {
    if (activeTab === 'home') {
      setIsSidebarCollapsed(true);
    }
  }, [activeTab]);

  // ── POLL CEO STATUS ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!dbLoaded) return;
    const interval = setInterval(() => {
      fetch('http://localhost:8000/api/ceo/status')
        .then(res => res.json())
        .then(data => {
          setAgents(prev => {
            const ceoIndex = prev.findIndex(a => a.role && a.role.toLowerCase() === 'executive');
            if (ceoIndex === -1) return prev;
            if (prev[ceoIndex].status !== data.status && ['running', 'stopped'].includes(data.status)) {
               const next = [...prev];
               next[ceoIndex] = { ...next[ceoIndex], status: data.status };
               return next;
            }
            return prev;
          });
        })
        .catch(err => console.debug("CEO status poll error:", err));
    }, 3000);
    return () => clearInterval(interval);
  }, [dbLoaded]);

  // ── MEETING TOGGLE ──────────────────────────────────────────────────────────
  const toggleMeeting = () => {
    const next = !meetingMode;
    setMeetingMode(next);
    bus.emit(next ? 'meeting.start' : 'meeting.end', {});
  };

  // ── KEYBOARD SHORTCUTS ──────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      switch (e.key) {
        case 'm': case 'M': toggleMeeting(); break;
        case 'n': case 'N': setIsModalOpen(true); break;
        case 'Escape': setIsModalOpen(false); setShowHints(false); setShowDebug(false); break;
        case '`': case '~': setShowDebug(d => !d); break;
        case '?': setShowHints(h => !h); break;
        default: break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meetingMode]);

  // ── EDIT AGENT ──────────────────────────────────────────────────────────────
  const handleEditAgent = (id, updates) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
    bus.emit('agent.updated', { agentId: id, updates });
  };

  // ── REMOVE AGENT ────────────────────────────────────────────────────────────
  const handleRemoveAgent = (id) => {
    const agentToRemove = agents.find(a => a.id === id);
    if (agentToRemove?.role?.toLowerCase() === 'executive') {
      console.warn("Cannot remove the CEO.");
      return;
    }
    setAgents(prev => prev.filter(a => a.id !== id));
    bus.emit('agent.removed', { agentId: id });
  };

  const handleCreateAgent = (newAgentData) => {
    // ── RULE 1: Role Conflict Detection ───────────────────────────────────────
    // If another agent already has the same role, rename with "II" and assign a different zone.
    const roleConflict = agents.some(a => a.role.toLowerCase() === newAgentData.role.toLowerCase());
    let resolvedName = newAgentData.name;
    let resolvedZone = newAgentData.zone || 'workspace';

    if (roleConflict) {
      // Append II if not already appended
      if (!resolvedName.endsWith(' II')) resolvedName = `${resolvedName} II`;
      // Rotate to a different zone than the conflicting agent's zone
      const conflictingAgent = agents.find(a => a.role.toLowerCase() === newAgentData.role.toLowerCase());
      const allZones = Object.keys(ROOMS);
      const otherZones = allZones.filter(z => z !== (conflictingAgent?.zone || 'workspace'));
      resolvedZone = otherZones[Math.floor(Math.random() * otherZones.length)] || 'breakroom';
      console.info(`[RoleConflict] Role "${newAgentData.role}" already exists → renamed to "${resolvedName}", assigned zone: ${resolvedZone}`);
    }

    const newAgent = {
      id: Date.now(),
      name: resolvedName,
      role: newAgentData.role,
      desc: newAgentData.goal || 'No goal specified.',
      color: newAgentData.avatarColor,
      priority: newAgentData.priority || 'Medium',
      zone: resolvedZone,
      skills: newAgentData.skills.length > 0 ? newAgentData.skills : ['General'],
      tools: newAgentData.tools.length > 0 ? newAgentData.tools : ['None'],
      isNew: true, // FLAG FOR RECEPTION SPAWN
    };

    setAgents(prev => {
      const next = [...prev, newAgent];
      bus.emit('agent.added', { agent: newAgent });
      return next;
    });
    setIsModalOpen(false);
  };

  // ── RULE 2: Priority-sorted agent list for canvas ──────────────────────────
  // High/Critical agents appear first in the list → claim seats + move first.
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const pa = PRIORITY_ORDER[a.priority] ?? 2;
      const pb = PRIORITY_ORDER[b.priority] ?? 2;
      return pa - pb;
    });
  }, [agents]);

  const saveLayout = (config) => {
    setLayoutConfig(config);
    fetch('http://localhost:8000/api/layout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    }).then(() => {
      const toastId = Date.now();
      setToasts(t => [...t, { id: toastId, message: 'Layout saved! 💾' }]);
      setTimeout(() => setToasts(t => t.filter(x => x.id !== toastId)), 3000);
    }).catch(err => console.error('Layout save failed:', err));
  };

  return (
    <div className="app-container" style={{ 
      backgroundColor: 'var(--bg-kailash-main)',
      height: '100vh', display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative'
    }}>
      <Header onOpenModal={() => setIsModalOpen(true)} meetingActive={meetingMode} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel
          agents={agents}
          onOpenModal={() => setIsModalOpen(true)}
          onEditAgent={handleEditAgent}
          onRemoveAgent={handleRemoveAgent}
          onMeeting={() => setMeetingMode(!meetingMode)}
          meetingActive={meetingMode}
          tasks={tasks}
          milestones={milestones}
          events={events}
          onUpdateTask={handleUpdateTask}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        <div style={{ 
          display: 'flex', 
          flex: 1, 
          position: 'relative', 
          overflow: 'hidden',
          backgroundColor: '#000', // Deep black background for main area
        }}>
          {activeTab === 'home' && (
            <OfficeCanvas 
              agents={agents} 
              onMeeting={meetingMode}
              ceoConfig={{ name: 'Rahul', color: '#d4af37', skin: '#fde8c8', shoe: '#1a0a00', emoji: '👑' }}
              layoutConfig={layoutConfig}
            />
          )}

          {activeTab === 'office' && (
            <div style={{ flex: 1, position: 'relative', display: 'flex' }}>
              <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 100, display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setView3D(!view3D)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: view3D ? 'rgba(59,130,246,0.2)' : 'rgba(30,41,59,0.4)',
                    color: '#fff', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer',
                    backdropFilter: 'blur(8px)', boxShadow: view3D ? '0 0 15px rgba(59,130,246,0.3)' : 'none'
                  }}
                >
                  {view3D ? '🚀 3D ACTIVE' : '🗺️ 2D VIEW'}
                </button>
              </div>
              {view3D ? (
                <OfficeCanvas3D agents={agents} onMeeting={meetingMode} />
              ) : (
                <AgentChat agents={agents} fullWidth />
              )}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Tasks & Projects</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Manage and track all team tasks</p>
              </div>
              <Tasks tasks={tasks} onUpdateTask={handleUpdateTask} fullPage />
            </div>
          )}

          {activeTab === 'roadmap' && (
            <div style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
              <div style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>Project Roadmap</h1>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px' }}>Strategic timeline and milestones</p>
              </div>
              <Roadmap milestones={milestones} fullPage />
            </div>
          )}

          {/* Fallback for other tabs */}
          {!['office', 'tasks', 'roadmap'].includes(activeTab) && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)' }}>
              Module "{activeTab.toUpperCase()}" implementation in progress...
            </div>
          )}
        </div>
      </div>

      <CreateAgentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAgentCreate={handleCreateAgent}
        availableSkills={availableSkills}
      />

      {/* ── HINTS OVERLAY (? key) ─────────────────────────────────────────── */}
      {showHints && (
        <div onClick={() => setShowHints(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#1e293b', border: '1px solid #334155', borderRadius: '12px',
            padding: '28px 36px', color: '#f8fafc', minWidth: '320px'
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '16px', color: '#7dd3fc' }}>⌨️ Keyboard Shortcuts</div>
            {[
              ['M', 'Toggle Meeting Mode'],
              ['N', 'Open New Agent Form'],
              ['Esc', 'Close modals / overlays'],
              ['~', 'Toggle Debug Overlay'],
              ['?', 'Show this Hints panel'],
            ].map(([key, desc]) => (
              <div key={key} style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '14px' }}>
                <kbd style={{
                  background: '#0f172a', border: '1px solid #475569', borderRadius: '4px',
                  padding: '2px 10px', fontFamily: 'monospace', color: '#fbbf24', minWidth: '36px', textAlign: 'center'
                }}>{key}</kbd>
                <span style={{ color: '#cbd5e1' }}>{desc}</span>
              </div>
            ))}
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#64748b' }}>Click anywhere to close</div>
          </div>
        </div>
      )}

      {/* ── DEBUG OVERLAY (~ key) ─────────────────────────────────────────── */}
      {showDebug && (
        <div style={{
          position: 'fixed', bottom: '12px', right: '12px', zIndex: 1999,
          background: 'rgba(0,0,0,0.85)', border: '1px solid #334155', borderRadius: '8px',
          padding: '12px 16px', color: '#4ade80', fontFamily: 'monospace', fontSize: '12px',
          maxWidth: '360px', lineHeight: '1.6'
        }}>
          <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '6px' }}>🛠 DEBUG</div>
          <div>Agents: {agents.length} | Meeting: {meetingMode ? 'ON' : 'OFF'}</div>
          <div>Time-of-day: <span style={{ color: '#7dd3fc' }}>{todTint.label}</span></div>
          <div>Zones: {[...new Set(agents.map(a => a.zone))].join(', ')}</div>
          <div>Priorities: {agents.map(a => `${a.name}=${a.priority}`).join(' | ')}</div>
          <div style={{ marginTop: '6px', color: '#64748b' }}>Press ~ to close</div>
        </div>
      )}
      {/* ── TOAST STACK (bottom-right) ───────────────────────────────────────── */}
      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {toasts.map(t => (
            <div key={t.id} style={{
              background: '#1e293b', border: '1px solid #334155', borderRadius: '8px',
              padding: '10px 16px', color: '#f8fafc', fontSize: '13px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              animation: 'slideInRight 0.25s ease',
            }}>{t.message}</div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

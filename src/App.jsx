import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import OfficeCanvas from './components/OfficeCanvas';
import LeftPanel from './components/LeftPanel';
import AgentChat from './components/AgentChat';
import CreateAgentModal from './components/CreateAgentModal';
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
  const [dbLoaded, setDbLoaded]     = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [meetingMode, setMeetingMode] = useState(false);
  const [showHints, setShowHints]   = useState(false);
  const [showDebug, setShowDebug]   = useState(false);
  const [toasts, setToasts]         = useState([]);
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [isEditMode, setIsEditMode]   = useState(false);
  
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
    fetch('http://localhost:8000/api/skills')
      .then(res => res.json())
      .then(data => { if (data.skills) setAvailableSkills(data.skills); })
      .catch(err => console.error("Error fetching skills:", err));

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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--bg-main)' }}>
      <Header onMeeting={toggleMeeting}
                onToggleDebug={() => setShowDebug(!showDebug)}
                showDebug={showDebug}
                onToggleEdit={() => setIsEditMode(!isEditMode)}
                isEditMode={isEditMode}
        />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AgentChat agents={agents} />
        <div style={{ display: 'flex', flex: 2, position: 'relative', overflow: 'hidden' }}>
            <OfficeCanvas
              agents={sortedAgents}
              onMeeting={meetingMode}
              todTint={todTint.overlay}
              debugMode={showDebug}
              layoutConfig={layoutConfig}
              isEditMode={isEditMode}
              onSaveLayout={saveLayout}
            />
</div>
        <LeftPanel
          agents={sortedAgents}
          onOpenModal={() => setIsModalOpen(true)}
          onEditAgent={handleEditAgent}
          onRemoveAgent={handleRemoveAgent}
          onMeeting={toggleMeeting}
          meetingActive={meetingMode}
        />
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

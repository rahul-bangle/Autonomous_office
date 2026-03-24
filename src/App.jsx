import React, { useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from './supabaseClient';
import Header from './components/Header';
import OfficeCanvas from './components/OfficeCanvas';
import LeftPanel from './components/LeftPanel';
import CreateAgentModal from './components/CreateAgentModal';
import Tasks from './components/Tasks';
import IntelPanel from './components/IntelPanel';
import ResearchPanel from './components/ResearchPanel';
import CompetePanel from './components/CompetePanel';
import IdeasPanel from './components/IdeasPanel';
import PRDsPanel from './components/PRDsPanel';
import ConnectPanel from './components/ConnectPanel';
import SettingsPanel from './components/SettingsPanel';
import bus from './EventBus';
import { ROOMS } from './constants';
import { API_BASE, safeJsonFetch } from './utils/api';
import {
  CONNECTIONS,
  DEFAULT_MODEL,
  DEFAULT_SKILLS,
  IDEA_ITEMS,
  PM_AGENTS,
  PM_INTEL,
  PM_TASKS,
  PRD_ITEMS,
  mergeIntelItems,
  normalizeAgent,
  normalizeIntelItem,
  normalizeTask,
  safeParse,
  sortAgents,
} from './pmSeed';

function App() {
  const [agents, setAgents] = useState(PM_AGENTS.map(normalizeAgent));
  const [availableSkills, setAvailableSkills] = useState(DEFAULT_SKILLS);
  const [tasks, setTasks] = useState(PM_TASKS.map(normalizeTask));
  const [intelItems, setIntelItems] = useState(PM_INTEL.map(normalizeIntelItem));
  const [connections, setConnections] = useState(CONNECTIONS);
  const [ideaItems, setIdeaItems] = useState(() => safeParse('vo_pm_ideas', IDEA_ITEMS));
  const [competeEntries, setCompeteEntries] = useState(() => safeParse('vo_pm_compete', []));
  const [prdItems] = useState(() => safeParse('vo_pm_prds', PRD_ITEMS));
  const [layoutConfig, setLayoutConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [meetingMode, setMeetingMode] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);
  const [isRefreshingIntel, setIsRefreshingIntel] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [events, setEvents] = useState([
    { agent: 'System', text: 'PM Edition shell online.', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), color: '#10b981' },
    { agent: 'Chief', text: 'Milestone 1 focuses on Office, Intel, Tasks, and Settings.', time: 'Now', color: '#f59e0b' },
  ]);
  const [agentsLoaded, setAgentsLoaded] = useState(false);
  const [tasksLoaded, setTasksLoaded] = useState(false);
  const [intelLoaded, setIntelLoaded] = useState(false);
  const taskTimersRef = useRef([]);

  const sortedAgents = useMemo(() => sortAgents(agents), [agents]);

  const todTint = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { label: 'morning', overlay: 'rgba(255,200,120,0.10)' };
    if (hour < 17) return { label: 'midday', overlay: 'rgba(220,235,255,0.06)' };
    if (hour < 20) return { label: 'afternoon', overlay: 'rgba(255,140,40,0.12)' };
    return { label: 'night', overlay: 'rgba(10,20,60,0.22)' };
  }, []);

  const addToast = (message) => {
    const id = Date.now() + Math.random();
    setToasts((previous) => [...previous, { id, message }]);
    setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id));
    }, 2800);
  };

  const logEvent = (agent, text, color = '#64748b') => {
    setEvents((previous) => [
      {
        agent,
        text,
        color,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...previous,
    ].slice(0, 24));
  };

  const pulseAgent = (agentId, status = 'working', targetZone = 'workspace') => {
    setAgents((previous) => previous.map((agent) => (
      String(agent.id) === String(agentId) ? { ...agent, status, targetZone } : agent
    )));

    const timer = setTimeout(() => {
      setAgents((previous) => previous.map((agent) => (
        String(agent.id) === String(agentId) ? { ...agent, status: 'idle', targetZone: undefined } : agent
      )));
    }, 2400);

    taskTimersRef.current.push(timer);
  };

  useEffect(() => {
    localStorage.setItem('vo_pm_ideas', JSON.stringify(ideaItems));
  }, [ideaItems]);

  useEffect(() => {
    localStorage.setItem('vo_pm_compete', JSON.stringify(competeEntries));
  }, [competeEntries]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialState() {
      const [skillsResponse, layoutResponse, connectionsResponse, agentsResponse, tasksResponse, intelResponse] = await Promise.all([
        safeJsonFetch('/api/skills'),
        safeJsonFetch('/api/layout'),
        safeJsonFetch('/api/connections'),
        supabase.from('vo_agents').select('*'),
        supabase.from('vo_tasks').select('*'),
        supabase.from('vo_intel_items').select('*'),
      ]);

      if (cancelled) return;

      if (skillsResponse?.skills?.length) setAvailableSkills(skillsResponse.skills);
      if (layoutResponse && Object.keys(layoutResponse).length > 0) setLayoutConfig(layoutResponse);
      if (Array.isArray(connectionsResponse?.connections) && connectionsResponse.connections.length > 0) {
        setConnections(connectionsResponse.connections);
      }

      if (Array.isArray(agentsResponse?.data) && agentsResponse.data.length > 0) {
        setAgents(agentsResponse.data.map(normalizeAgent));
      }
      setAgentsLoaded(true);

      if (Array.isArray(tasksResponse?.data) && tasksResponse.data.length > 0) {
        setTasks(tasksResponse.data.map(normalizeTask));
      }
      setTasksLoaded(true);

      if (Array.isArray(intelResponse?.data) && intelResponse.data.length > 0) {
        setIntelItems(intelResponse.data.map(normalizeIntelItem));
      } else {
        const intelPayload = await safeJsonFetch('/api/intel');
        if (!cancelled && Array.isArray(intelPayload?.items) && intelPayload.items.length > 0) {
          setIntelItems(intelPayload.items.map(normalizeIntelItem));
        }
      }
      setIntelLoaded(true);
    }

    loadInitialState();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!agentsLoaded) return;
    supabase.from('vo_agents').upsert(agents.map((agent) => ({
      ...agent,
      id: String(agent.id),
      created_at: agent.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))).catch(() => {});
  }, [agents, agentsLoaded]);

  useEffect(() => {
    if (!tasksLoaded) return;
    supabase.from('vo_tasks').upsert(tasks.map((task) => ({
      ...task,
      id: String(task.id),
      created_at: task.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }))).catch(() => {});
  }, [tasks, tasksLoaded]);

  useEffect(() => {
    if (!intelLoaded) return;
    supabase.from('vo_intel_items').upsert(intelItems.map((item) => ({
      ...item,
      id: String(item.id),
    }))).catch(() => {});
  }, [intelItems, intelLoaded]);

  useEffect(() => () => taskTimersRef.current.forEach(clearTimeout), []);

  useEffect(() => {
    const unsubStart = bus.on('task.started', ({ agentSequence = [] }) => {
      taskTimersRef.current.forEach(clearTimeout);
      taskTimersRef.current = [];

      agentSequence.forEach((agentInfo, index) => {
        const moveTimer = setTimeout(() => {
          setAgents((previous) => previous.map((agent) => (
            String(agent.id) === String(agentInfo.id)
              ? { ...agent, status: 'moving', targetZone: agentInfo.targetZone || 'workspace' }
              : agent
          )));
        }, index * 2200);

        const workTimer = setTimeout(() => {
          setAgents((previous) => previous.map((agent) => (
            String(agent.id) === String(agentInfo.id) ? { ...agent, status: 'working' } : agent
          )));
        }, index * 2200 + 1200);

        taskTimersRef.current.push(moveTimer, workTimer);
      });
    });

    const unsubDone = bus.on('task.assigned', ({ agents: completedAgents = [] }) => {
      taskTimersRef.current.forEach(clearTimeout);
      taskTimersRef.current = [];
      setAgents((previous) => previous.map((agent) => ({ ...agent, status: 'idle', targetZone: undefined })));
      if (completedAgents.length > 0) {
        completedAgents.forEach((agentInfo) => addToast(`${agentInfo.name || agentInfo.agentId || 'Agent'} finished task`));
      } else {
        addToast('Research run complete');
      }
    });

    return () => {
      unsubStart();
      unsubDone();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await safeJsonFetch('/api/ceo/status');
      if (!response?.status) return;
      setAgents((previous) => previous.map((agent) => (
        agent.role?.toLowerCase() === 'chief pm' || agent.role?.toLowerCase() === 'executive'
          ? { ...agent, status: response.status }
          : agent
      )));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKey = (event) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName)) return;
      if (event.key === 'm' || event.key === 'M') toggleMeeting();
      if (event.key === 'n' || event.key === 'N') openCreateAgent();
      if (event.key === 'Escape') {
        setIsModalOpen(false);
        setEditingAgent(null);
        setShowHints(false);
        setShowDebug(false);
      }
      if (event.key === '`' || event.key === '~') setShowDebug((previous) => !previous);
      if (event.key === '?') setShowHints((previous) => !previous);
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [meetingMode]);

  const toggleMeeting = () => {
    const nextMode = !meetingMode;
    setMeetingMode(nextMode);
    bus.emit(nextMode ? 'meeting.start' : 'meeting.end', {});
  };

  const openCreateAgent = () => {
    setEditingAgent(null);
    setIsModalOpen(true);
  };

  const openEditAgent = (agent) => {
    setEditingAgent(agent);
    setIsModalOpen(true);
  };

  const handleSaveAgent = (agentData) => {
    const roleConflict = agents.some((agent) => (
      String(agent.id) !== String(agentData.id) &&
      agent.role.toLowerCase() === agentData.role.toLowerCase()
    ));

    let resolvedName = agentData.name.trim();
    let resolvedZone = agentData.zone || 'workspace';

    if (roleConflict && !agentData.id && !resolvedName.endsWith(' II')) {
      resolvedName = `${resolvedName} II`;
      const conflictingAgent = agents.find((agent) => agent.role.toLowerCase() === agentData.role.toLowerCase());
      const zonePool = Object.keys(ROOMS).filter((zone) => zone !== (conflictingAgent?.zone || 'workspace'));
      resolvedZone = zonePool[0] || 'breakroom';
    }

    const nextAgent = normalizeAgent({
      id: agentData.id || `agent-${Date.now()}`,
      name: resolvedName,
      role: agentData.role.trim(),
      goal: agentData.goal || agentData.desc || '',
      desc: agentData.goal || agentData.desc || '',
      color: agentData.avatarColor,
      priority: agentData.priority || 'Medium',
      zone: resolvedZone,
      skills: agentData.skills?.length ? agentData.skills : ['Research'],
      tools: agentData.tools?.length ? agentData.tools : ['Workspace'],
      provider: agentData.provider || 'groq',
      model: agentData.model || DEFAULT_MODEL,
      system_prompt: agentData.systemPrompt || '',
      is_active: agentData.isActive !== false,
      is_seeded: Boolean(agentData.is_seeded),
      created_at: agentData.id ? editingAgent?.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    setAgents((previous) => {
      const exists = previous.some((agent) => String(agent.id) === String(nextAgent.id));
      if (exists) return previous.map((agent) => (String(agent.id) === String(nextAgent.id) ? nextAgent : agent));
      bus.emit('agent.added', { agent: nextAgent });
      return [...previous, nextAgent];
    });

    logEvent('Chief', `${nextAgent.name} ${agentData.id ? 'updated' : 'added'} in Settings`, '#86efac');
    addToast(agentData.id ? 'Agent updated' : 'Agent created');
    setIsModalOpen(false);
    setEditingAgent(null);
  };

  const handleRemoveAgent = (agentId) => {
    const target = agents.find((agent) => String(agent.id) === String(agentId));
    if (!target || target.role?.toLowerCase() === 'executive') return;
    setAgents((previous) => previous.filter((agent) => String(agent.id) !== String(agentId)));
    bus.emit('agent.removed', { agentId });
    logEvent('Chief', `${target.name} removed from PM roster`, '#fda4af');
    addToast('Agent removed');
  };

  const handleToggleAgentActive = (agentId) => {
    setAgents((previous) => previous.map((agent) => (
      String(agent.id) === String(agentId)
        ? { ...agent, is_active: agent.is_active === false, updated_at: new Date().toISOString() }
        : agent
    )));
  };

  const handleUpdateTask = (taskId, newStatus) => {
    let currentTask = null;
    setTasks((previous) => previous.map((task) => {
      if (String(task.id) !== String(taskId)) return task;
      currentTask = task;
      return { ...task, status: newStatus, updated_at: new Date().toISOString() };
    }));

    if (!currentTask) return;
    pulseAgent(currentTask.assignee_agent_id, 'working', currentTask.module === 'intel' ? 'library' : 'workspace');
    const owner = agents.find((agent) => String(agent.id) === String(currentTask.assignee_agent_id))?.name || 'System';
    logEvent(owner, `Moved "${currentTask.title}" to ${newStatus}`, '#93c5fd');
    addToast(`Task "${currentTask.title}" moved to ${newStatus}`);
  };

  const handleUpdateIntelStatus = (intelId, nextStatus) => {
    let intelTitle = 'Intel item';
    setIntelItems((previous) => previous.map((item) => {
      if (String(item.id) !== String(intelId)) return item;
      intelTitle = item.title;
      return { ...item, status: nextStatus };
    }));
    logEvent('Scout', `${intelTitle} marked ${nextStatus}`, '#86efac');
  };

  const handleRefreshIntel = async () => {
    setIsRefreshingIntel(true);
    pulseAgent('scout', 'working', 'library');
    const response = await safeJsonFetch('/api/intel/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (Array.isArray(response?.items) && response.items.length > 0) {
      setIntelItems((previous) => mergeIntelItems(previous, response.items.map(normalizeIntelItem)));
      logEvent('Scout', `Intel refresh completed with ${response.items.length} fresh signals`, '#86efac');
      addToast('Intel refreshed');
    } else {
      addToast('Intel refresh unavailable');
    }

    setIsRefreshingIntel(false);
  };

  const handleAddCompeteEntry = (target) => {
    setCompeteEntries((previous) => [
      { id: `compete-${Date.now()}`, target, status: 'queued', created_at: new Date().toISOString() },
      ...previous,
    ]);
    logEvent('Strategist', `Queued competitor teardown for ${target}`, '#fbbf24');
  };

  const handleAddIdea = ({ title, hypothesis }) => {
    setIdeaItems((previous) => [
      { id: `idea-${Date.now()}`, title, hypothesis, stage: 'raw' },
      ...previous,
    ]);
    logEvent('Chief', `Added idea "${title}"`, '#93c5fd');
  };

  const handleAdvanceIdea = (ideaId) => {
    const stages = ['raw', 'exploring', 'validated', 'archived'];
    setIdeaItems((previous) => previous.map((idea) => {
      if (idea.id !== ideaId) return idea;
      const currentIndex = stages.indexOf(idea.stage);
      return { ...idea, stage: stages[Math.min(currentIndex + 1, stages.length - 1)] };
    }));
  };

  const saveLayout = async (config) => {
    setLayoutConfig(config);
    try {
      await fetch(`${API_BASE}/api/layout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      addToast('Layout saved');
    } catch {
      addToast('Layout saved locally');
    }
  };

  const renderMainContent = () => {
    if (activeTab === 'home') {
      return (
        <OfficeCanvas
          agents={sortedAgents}
          onMeeting={meetingMode}
          layoutConfig={layoutConfig}
          todTint={todTint.overlay}
          debugMode={showDebug}
          isEditMode={isEditMode}
          onSaveLayout={saveLayout}
          ceoConfig={{ name: 'Rahul', color: '#d4af37', skin: '#fde8c8', shoe: '#1a0a00', emoji: '👑' }}
        />
      );
    }
    if (activeTab === 'analytics') {
      return <IntelPanel items={intelItems} agents={agents} isRefreshing={isRefreshingIntel} onRefresh={handleRefreshIntel} onUpdateStatus={handleUpdateIntelStatus} />;
    }
    if (activeTab === 'tasks') {
      const taskStats = {
        total: tasks.length,
        inProgress: tasks.filter((task) => task.status === 'In Progress').length,
        done: tasks.filter((task) => task.status === 'Done').length,
        critical: tasks.filter((task) => task.priority === 'Critical').length,
      };

      return (
        <div style={{ flex: 1, padding: '28px 30px', overflowY: 'auto', background: '#05080d' }} className="custom-scrollbar">
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '11px', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Execution board</div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Tasks</h1>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
              PM execution board backed by Supabase when configured and local fallback storage otherwise.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
            {[
              ['Total tasks', taskStats.total, '#c4b5fd'],
              ['In progress', taskStats.inProgress, '#93c5fd'],
              ['Completed', taskStats.done, '#86efac'],
              ['Critical', taskStats.critical, '#fda4af'],
            ].map(([label, value, color]) => (
              <div key={label} className="glass-card" style={{ padding: '16px', borderRadius: '18px', background: 'rgba(15,23,42,0.72)' }}>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
                <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
              </div>
            ))}
          </div>
          <Tasks tasks={tasks} agents={agents} onUpdateTask={handleUpdateTask} fullPage />
        </div>
      );
    }
    if (activeTab === 'office') return <ResearchPanel agents={agents.filter((agent) => agent.is_active !== false)} events={events} />;
    if (activeTab === 'compete') return <CompetePanel entries={competeEntries} onAddEntry={handleAddCompeteEntry} />;
    if (activeTab === 'backlog') return <IdeasPanel ideas={ideaItems} onAddIdea={handleAddIdea} onAdvanceIdea={handleAdvanceIdea} />;
    if (activeTab === 'roadmap') return <PRDsPanel items={prdItems} />;
    if (activeTab === 'connect') return <ConnectPanel connections={connections} />;
    if (activeTab === 'settings') {
      return <SettingsPanel agents={agents} onOpenCreate={openCreateAgent} onOpenEdit={openEditAgent} onRemoveAgent={handleRemoveAgent} onToggleActive={handleToggleAgentActive} />;
    }
    return null;
  };

  return (
    <div className="app-container" style={{ backgroundColor: 'var(--bg-kailash-main)', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <Header activeTab={activeTab} onMeeting={toggleMeeting} onToggleEdit={() => setIsEditMode((previous) => !previous)} isEditMode={isEditMode} />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LeftPanel
          agents={agents}
          tasks={tasks}
          intelItems={intelItems}
          events={events}
          connections={connections}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((previous) => !previous)}
        />
        <div style={{ display: 'flex', flex: 1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #04070c 0%, #07111b 100%)' }}>
          {renderMainContent()}
        </div>
      </div>

      <CreateAgentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAgent(null);
        }}
        onAgentCreate={handleSaveAgent}
        availableSkills={availableSkills}
        initialAgent={editingAgent}
      />

      {showHints && (
        <div onClick={() => setShowHints(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '28px 36px', color: '#f8fafc', minWidth: '320px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '16px', color: '#7dd3fc' }}>⌨ Keyboard Shortcuts</div>
            {[
              ['M', 'Toggle Meeting Mode'],
              ['N', 'Open Agent Settings'],
              ['Esc', 'Close modals / overlays'],
              ['~', 'Toggle Debug Overlay'],
              ['?', 'Show this Hints panel'],
            ].map(([key, description]) => (
              <div key={key} style={{ display: 'flex', gap: '16px', marginBottom: '10px', fontSize: '14px' }}>
                <kbd style={{ background: '#0f172a', border: '1px solid #475569', borderRadius: '4px', padding: '2px 10px', fontFamily: 'monospace', color: '#fbbf24', minWidth: '36px', textAlign: 'center' }}>{key}</kbd>
                <span style={{ color: '#cbd5e1' }}>{description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showDebug && (
        <div style={{ position: 'fixed', bottom: '12px', right: '12px', zIndex: 1999, background: 'rgba(0,0,0,0.85)', border: '1px solid #334155', borderRadius: '8px', padding: '12px 16px', color: '#4ade80', fontFamily: 'monospace', fontSize: '12px', maxWidth: '360px', lineHeight: '1.6' }}>
          <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '6px' }}>DEBUG</div>
          <div>Agents: {agents.length} | Meeting: {meetingMode ? 'ON' : 'OFF'}</div>
          <div>Time-of-day: <span style={{ color: '#7dd3fc' }}>{todTint.label}</span></div>
          <div>Intel items: {intelItems.length}</div>
          <div>Connections: {connections.length}</div>
        </div>
      )}

      {toasts.length > 0 && (
        <div style={{ position: 'fixed', bottom: '16px', right: '16px', zIndex: 3000, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {toasts.map((toast) => (
            <div key={toast.id} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '10px 16px', color: '#f8fafc', fontSize: '13px', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', animation: 'slideInRight 0.25s ease' }}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;

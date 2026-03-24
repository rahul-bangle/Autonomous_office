import React from 'react';
import {
  Archive,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Home,
  ListTodo,
  Plug,
  Search,
  Settings,
  Users,
  Zap,
} from 'lucide-react';
import LiveFeed from './LiveFeed';
import ProjectVelocity from './ProjectVelocity';
import { NAV_ITEMS } from '../navConfig';

const ICONS = {
  Archive,
  BarChart3,
  Calendar,
  Home,
  ListTodo,
  Plug,
  Search,
  Settings,
  Users,
};

const statusTone = (status) => {
  if (status === 'connected') return '#86efac';
  if (status === 'needs_setup') return '#fbbf24';
  return '#fda4af';
};

function LeftPanel({
  agents = [],
  tasks = [],
  intelItems = [],
  events = [],
  connections = [],
  activeTab,
  setActiveTab,
  isCollapsed,
  onToggleCollapse,
}) {
  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const activeAgents = agents.filter((agent) => agent.is_active !== false);
  const actionableIntel = intelItems.filter((item) => item.status === 'actionable').length;
  const connectedCount = connections.filter((connection) => connection.status === 'connected').length;
  const inProgressTasks = tasks.filter((task) => task.status === 'In Progress').length;
  const newIntel = intelItems.filter((item) => item.status === 'new').length;

  const renderPanel = () => {
    if (activeTab === 'home') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}>
              {[
                ['Agents', activeAgents.length, '#86efac'],
                ['In motion', inProgressTasks, '#93c5fd'],
                ['Fresh intel', newIntel, '#fbbf24'],
                ['Connected', connectedCount, '#c4b5fd'],
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '12px',
                    background: 'rgba(15,23,42,0.78)',
                    border: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
          <ProjectVelocity tasks={tasks} />
          <div className="glass-card" style={{ padding: '14px', borderRadius: '16px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '10px' }}>Team snapshot</div>
            {activeAgents.slice(0, 5).map((agent) => (
              <div key={agent.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', fontSize: '12px' }}>
                <div>
                  <div>{agent.name}</div>
                  <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', marginTop: '2px' }}>{agent.role}</div>
                </div>
                <span style={{ color: agent.status === 'working' ? '#86efac' : 'rgba(255,255,255,0.45)', fontSize: '11px', textTransform: 'capitalize' }}>
                  {agent.status || 'idle'}
                </span>
              </div>
            ))}
          </div>
          <div className="glass-card" style={{ borderRadius: '16px', overflow: 'hidden' }}>
            <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase' }}>
              Live activity
            </div>
            <div style={{ height: '260px' }}>
              <LiveFeed events={events} />
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'analytics') {
      return (
        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            ['Signals', intelItems.length],
            ['Actionable', actionableIntel],
            ['Agents', activeAgents.length],
          ].map(([label, value]) => (
            <div key={label} className="glass-card" style={{ padding: '14px', borderRadius: '14px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
              <div style={{ fontSize: '22px', fontWeight: '800' }}>{value}</div>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'tasks') {
      return (
        <div className="glass-card" style={{ padding: '14px', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '10px' }}>Execution pulse</div>
          {['To Do', 'In Progress', 'Done'].map((column) => (
            <div key={column} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '12px' }}>
              <span>{column}</span>
              <span style={{ color: '#93c5fd' }}>{tasks.filter((task) => task.status === column).length}</span>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'settings') {
      return (
        <div className="glass-card" style={{ padding: '14px', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '10px' }}>Agent control</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.58)', lineHeight: '1.6' }}>
            Create, edit, pause, or remove PM agents from Settings. Chief stays protected.
          </div>
        </div>
      );
    }

    if (activeTab === 'connect') {
      return (
        <div className="glass-card" style={{ padding: '14px', borderRadius: '14px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '10px' }}>Infra status</div>
          <div style={{ fontSize: '26px', fontWeight: '800', marginBottom: '12px' }}>{connectedCount}</div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {connections.slice(0, 4).map((connection) => (
              <div key={connection.key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                <span>{connection.label}</span>
                <span style={{ color: statusTone(connection.status), textTransform: 'capitalize' }}>{connection.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="glass-card" style={{ padding: '14px', borderRadius: '14px' }}>
        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', marginBottom: '10px' }}>
          {activeItem.label}
        </div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.58)', lineHeight: '1.6' }}>{activeItem.summary}</div>
      </div>
    );
  };

  return (
    <div
      className="glass-card"
      style={{
        width: isCollapsed ? '88px' : '320px',
        height: '100%',
        display: 'flex',
        border: 'none',
        borderRadius: '0',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        background: 'linear-gradient(180deg, #0b1018 0%, #0a0f16 100%)',
      }}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: isCollapsed ? '18px 10px 12px' : '18px 16px 12px' }}>
        <div className="custom-scrollbar" style={{ overflowY: 'auto', paddingRight: isCollapsed ? 0 : '2px' }}>
          <div style={{ marginBottom: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
                  color: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                }}
              >
                O
              </div>
              {!isCollapsed && (
                <div>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>Origin Command</div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.32)' }}>PM operating system</div>
                </div>
              )}
            </div>
            <div style={{ border: '1px solid rgba(34,197,94,0.12)', borderRadius: '14px', padding: isCollapsed ? '10px 8px' : '10px 12px', background: 'rgba(15,23,42,0.78)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: isCollapsed ? 0 : '4px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.45)' }} />
                {!isCollapsed && <span style={{ fontSize: '12px', color: '#86efac', fontWeight: '700' }}>Agent network online</span>}
              </div>
              {!isCollapsed && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)' }}>Groq pipeline active · PM team synced</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '6px', marginBottom: '18px' }}>
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.icon];
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={item.label}
                  style={{
                    background: isActive ? 'linear-gradient(90deg, rgba(37,99,235,0.22) 0%, rgba(37,99,235,0.10) 100%)' : 'transparent',
                    color: isActive ? '#dbeafe' : 'rgba(255,255,255,0.72)',
                    cursor: 'pointer',
                    padding: isCollapsed ? '10px 0' : '11px 12px',
                    borderRadius: '12px',
                    border: isActive ? '1px solid rgba(59,130,246,0.35)' : '1px solid transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    gap: '10px',
                    width: '100%',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={18} />
                    {!isCollapsed && <span style={{ fontSize: '13px', fontWeight: isActive ? '700' : '500' }}>{item.label}</span>}
                  </div>
                  {!isCollapsed && isActive && <Zap size={14} color="#60a5fa" />}
                </button>
              );
            })}
          </div>

          {!isCollapsed && (
            <div style={{ marginBottom: '18px' }}>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                Active surface
              </div>
              <div className="glass-card" style={{ padding: '14px', borderRadius: '16px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>{activeItem.label}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.52)', lineHeight: '1.6' }}>{activeItem.summary}</div>
              </div>
            </div>
          )}

          {!isCollapsed && renderPanel()}
        </div>

        <div style={{ display: 'grid', gap: '10px', marginTop: '12px' }}>
          {!isCollapsed && (
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>Rahul Chityal</div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)' }}>Chief operator</div>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '8px',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.4)',
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LeftPanel;

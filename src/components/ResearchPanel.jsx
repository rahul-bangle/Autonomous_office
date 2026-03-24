import React from 'react';
import AgentChat from './AgentChat';

function ResearchPanel({ agents = [], events = [] }) {
  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', background: '#05080d' }}>
      <div
        style={{
          width: '320px',
          padding: '24px',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          overflowY: 'auto',
          background: 'rgba(8,11,17,0.96)',
        }}
        className="custom-scrollbar"
      >
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#86efac', marginBottom: '8px' }}>
            Research Workbench
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Agent Research</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: '1.6' }}>
            Send research prompts to the PM team, inspect live agent responses, and use the chat log as the working scratchpad.
          </p>
        </div>

        <div style={{ display: 'grid', gap: '12px' }}>
          <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '6px' }}>Available agents</div>
            <div style={{ fontSize: '28px', fontWeight: '800' }}>{agents.filter((agent) => agent.is_active !== false).length}</div>
          </div>

          <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '10px' }}>Suggested prompts</div>
            {[
              'Summarize the latest PM tooling moves this week.',
              'Compare Linear vs Jira for startup PM teams.',
              'Find AI workflow patterns for product discovery.',
            ].map((prompt) => (
              <div key={prompt} style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginBottom: '8px', lineHeight: '1.5' }}>
                {prompt}
              </div>
            ))}
          </div>

          <div className="glass-card" style={{ padding: '16px', borderRadius: '16px' }}>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginBottom: '10px' }}>Recent system events</div>
            {events.slice(0, 4).map((event, index) => (
              <div key={`${event.time}-${index}`} style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', color: '#93c5fd' }}>{event.agent}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: '1.5' }}>{event.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, background: 'linear-gradient(180deg, #05080d 0%, #071019 100%)' }}>
        <AgentChat />
      </div>
    </div>
  );
}

export default ResearchPanel;

import React from 'react';

function SettingsPanel({ agents = [], onOpenCreate, onOpenEdit, onRemoveAgent, onToggleActive }) {
  return (
    <div style={{ flex: 1, padding: '28px 30px', overflowY: 'auto', background: '#05080d' }} className="custom-scrollbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Team design</div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Agent Settings</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', maxWidth: '720px' }}>
            CEO-controlled PM team configuration. Seeded agents remain editable, and Chief stays protected from deletion.
          </p>
        </div>

        <button
          onClick={onOpenCreate}
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            background: 'rgba(34,197,94,0.14)',
            color: '#86efac',
            fontWeight: '700',
          }}
        >
          Add Agent
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          ['Active agents', agents.filter((agent) => agent.is_active !== false).length, '#86efac'],
          ['Seeded roles', agents.filter((agent) => agent.is_seeded).length, '#93c5fd'],
          ['Paused', agents.filter((agent) => agent.is_active === false).length, '#fbbf24'],
          ['Model family', 'Groq', '#c4b5fd'],
        ].map(([label, value, color]) => (
          <div key={label} className="glass-card" style={{ padding: '16px', borderRadius: '18px', background: 'rgba(15,23,42,0.72)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: '14px' }}>
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: agent.color }} />
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>{agent.name}</div>
                  {agent.is_seeded && (
                    <div style={{ fontSize: '10px', color: '#93c5fd', textTransform: 'uppercase' }}>Seeded</div>
                  )}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '8px' }}>
                  {agent.role} • {agent.provider || 'groq'} / {agent.model}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.6' }}>
                  {agent.desc || agent.goal || 'No goal configured.'}
                </div>
              </div>

              <div style={{ fontSize: '11px', color: agent.is_active === false ? '#fbbf24' : '#86efac', textTransform: 'uppercase' }}>
                {agent.is_active === false ? 'Paused' : 'Active'}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {(agent.skills || []).map((skill) => (
                <span key={skill} style={{ padding: '4px 8px', borderRadius: '999px', backgroundColor: 'rgba(59,130,246,0.12)', color: '#93c5fd', fontSize: '11px' }}>
                  {skill}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <button
                onClick={() => onOpenEdit?.(agent)}
                style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(59,130,246,0.14)', color: '#93c5fd', fontSize: '12px' }}
              >
                Edit
              </button>
              <button
                onClick={() => onToggleActive?.(agent.id)}
                style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.65)', fontSize: '12px' }}
              >
                {agent.is_active === false ? 'Activate' : 'Pause'}
              </button>
              {agent.role?.toLowerCase() !== 'executive' && (
                <button
                  onClick={() => onRemoveAgent?.(agent.id)}
                  style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(239,68,68,0.14)', color: '#fda4af', fontSize: '12px' }}
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SettingsPanel;

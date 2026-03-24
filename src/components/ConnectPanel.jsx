import React from 'react';

function ConnectPanel({ connections = [] }) {
  const connected = connections.filter((connection) => connection.status === 'connected').length;
  const setupNeeded = connections.filter((connection) => connection.status === 'needs_setup').length;

  return (
    <div style={{ flex: 1, padding: '28px 30px', overflowY: 'auto', background: '#05080d' }} className="custom-scrollbar">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Integration readiness</div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Connections</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
          Infrastructure readiness for the PM Edition stack. Supabase reflects actual configured state. Everything else stays lightweight for milestone 1.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          ['Connected', connected, '#86efac'],
          ['Need setup', setupNeeded, '#fbbf24'],
          ['Total services', connections.length, '#93c5fd'],
        ].map(([label, value, color]) => (
          <div key={label} className="glass-card" style={{ padding: '16px', borderRadius: '18px', background: 'rgba(15,23,42,0.72)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {connections.map((connection) => (
          <div key={connection.key} className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', gap: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{connection.label}</div>
              <div
                style={{
                  fontSize: '10px',
                  textTransform: 'uppercase',
                  color: connection.status === 'connected' ? '#86efac' : connection.status === 'needs_setup' ? '#fbbf24' : '#f87171',
                }}
              >
                {connection.status.replace('_', ' ')}
              </div>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '13px', lineHeight: '1.6', marginBottom: '10px' }}>
              {connection.description}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px' }}>
              {connection.last_checked_at ? `Checked ${connection.last_checked_at}` : 'No check recorded'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ConnectPanel;

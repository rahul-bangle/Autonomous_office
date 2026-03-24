import React from 'react';

function PRDsPanel({ items = [] }) {
  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }} className="custom-scrollbar">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>PRD Workspace</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
          Structured product requirement drafts, status tracking, and handoff-ready planning docs.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Milestone 1 scope
        </div>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.7' }}>
          Use this module as the structured PRD inventory for now. Full PRD generation will layer on top of Ideas and Research in the next milestone.
        </div>
      </div>

      <div style={{ display: 'grid', gap: '14px' }}>
        {items.map((item) => (
          <div key={item.id} className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700' }}>{item.title}</div>
              <div style={{ color: '#86efac', fontSize: '11px', textTransform: 'uppercase' }}>{item.status}</div>
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.6', marginBottom: '12px' }}>
              {item.summary}
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
              Owner: {item.owner} • Updated {item.updated_at}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PRDsPanel;

import React, { useState } from 'react';

function CompetePanel({ entries = [], onAddEntry }) {
  const [draft, setDraft] = useState('');

  const handleAdd = () => {
    if (!draft.trim()) return;
    onAddEntry?.(draft.trim());
    setDraft('');
  };

  return (
    <div style={{ flex: 1, padding: '28px 30px', overflowY: 'auto', background: '#05080d' }} className="custom-scrollbar">
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Strategic diagnostics</div>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Competitive Teardown</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', maxWidth: '720px' }}>
          Queue competitor URLs or product names, keep a running analysis list, and prepare the matrix view for deeper teardown workflows.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        {[
          ['Queued', entries.length, '#93c5fd'],
          ['Ready for review', entries.filter((entry) => entry.status === 'review').length, '#fbbf24'],
          ['Signals extracted', entries.filter((entry) => entry.status === 'complete').length, '#86efac'],
        ].map(([label, value, color]) => (
          <div key={label} className="glass-card" style={{ padding: '16px', borderRadius: '18px', background: 'rgba(15,23,42,0.72)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '28px', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Enter competitor URL or product name"
            style={{
              flex: 1,
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#fff',
            }}
          />
          <button
            onClick={handleAdd}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(34,197,94,0.14)',
              color: '#86efac',
              fontWeight: '700',
            }}
          >
            Queue
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Analysis queue
          </div>
          {entries.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>No competitor teardowns queued yet.</div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{entry.target}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>
                  {entry.status} • queued {new Date(entry.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="glass-card" style={{ padding: '18px', borderRadius: '16px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Comparison matrix
          </div>
          <div style={{ display: 'grid', gap: '10px' }}>
            {[
              ['Pricing', 'Pending'],
              ['Positioning', 'Pending'],
              ['Differentiators', 'Pending'],
              ['PM Takeaways', 'Pending'],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>
                <span>{label}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompetePanel;

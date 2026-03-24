import React, { useMemo, useState } from 'react';

const CATEGORY_FILTERS = ['All', 'Competitors', 'Market', 'Customer Signal', 'Tech/AI'];
const STATUS_FILTERS = ['all', 'new', 'reviewed', 'actionable', 'archived'];

function IntelPanel({ items = [], agents = [], isRefreshing = false, onRefresh, onUpdateStatus }) {
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('all');

  const filteredItems = useMemo(() => items.filter((item) => {
    const categoryMatch = category === 'All' || item.category === category;
    const statusMatch = status === 'all' || item.status === status;
    return categoryMatch && statusMatch;
  }), [category, items, status]);

  const stats = useMemo(() => ({
    total: items.length,
    actionable: items.filter((item) => item.status === 'actionable').length,
    fresh: items.filter((item) => item.status === 'new').length,
    competitor: items.filter((item) => item.category === 'Competitors').length,
  }), [items]);

  const resolveAgent = (agentId) => {
    const match = agents.find((agent) => String(agent.id) === String(agentId));
    return match?.name || 'Scout';
  };

  return (
    <div style={{ flex: 1, padding: '28px 30px', overflowY: 'auto', background: '#05080d' }} className="custom-scrollbar">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', color: '#86efac', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>PM signal layer</div>
          <h1 style={{ fontSize: '30px', fontWeight: '800', marginBottom: '8px' }}>Market Intel</h1>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', maxWidth: '720px' }}>
            Daily competitor updates, market movements, and customer signal tracking for PM decisions.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="glass-card"
          style={{
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(34,197,94,0.18)',
            background: isRefreshing ? 'rgba(255,255,255,0.05)' : 'rgba(34,197,94,0.12)',
            color: isRefreshing ? 'rgba(255,255,255,0.45)' : '#86efac',
            fontSize: '12px',
            fontWeight: '700',
          }}
        >
          {isRefreshing ? 'Refreshing…' : 'Refresh Intel'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          ['Signals tracked', stats.total, '#c4b5fd'],
          ['Actionable now', stats.actionable, '#86efac'],
          ['Fresh today', stats.fresh, '#fbbf24'],
          ['Competitor moves', stats.competitor, '#93c5fd'],
        ].map(([label, value, color]) => (
          <div key={label} className="glass-card" style={{ padding: '18px', borderRadius: '18px', background: 'rgba(15,23,42,0.72)' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontSize: '30px', fontWeight: '800', color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {CATEGORY_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setCategory(filter)}
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              background: category === filter ? 'rgba(59,130,246,0.16)' : 'rgba(255,255,255,0.04)',
              color: category === filter ? '#93c5fd' : 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '12px',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter}
            onClick={() => setStatus(filter)}
            style={{
              padding: '8px 12px',
              borderRadius: '999px',
              background: status === filter ? 'rgba(34,197,94,0.14)' : 'rgba(255,255,255,0.04)',
              color: status === filter ? '#86efac' : 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '12px',
              textTransform: 'capitalize',
            }}
          >
            {filter}
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px', color: 'rgba(255,255,255,0.4)' }}>
          No intel items match the current filters.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {filteredItems.map((item) => (
            <div key={item.id} className="glass-card" style={{ padding: '18px', borderRadius: '18px', background: 'rgba(12,18,28,0.86)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '999px', backgroundColor: 'rgba(59,130,246,0.14)', color: '#93c5fd', fontSize: '11px' }}>{item.category}</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px' }}>{item.source_name || 'Web'}</span>
                    <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', textTransform: 'capitalize' }}>{item.status}</span>
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>{item.title}</div>
                  <div style={{ color: 'rgba(255,255,255,0.58)', fontSize: '13px', lineHeight: '1.6', maxWidth: '780px' }}>{item.summary}</div>
                </div>

                <div style={{ minWidth: '170px' }}>
                  <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '11px', marginBottom: '8px', textTransform: 'uppercase' }}>Signal metadata</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Agent: {resolveAgent(item.captured_by_agent_id)}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginBottom: '6px' }}>Confidence: {item.confidence || 0}%</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{item.captured_at ? new Date(item.captured_at).toLocaleString() : 'Captured now'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.38)' }}>
                  {item.source_url ? item.source_url.replace(/^https?:\/\//, '') : 'Local seed'}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => onUpdateStatus?.(item.id, 'reviewed')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '999px',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'rgba(255,255,255,0.7)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      fontSize: '12px',
                    }}
                  >
                    Mark Reviewed
                  </button>
                  <button
                    onClick={() => onUpdateStatus?.(item.id, 'actionable')}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '999px',
                      background: 'rgba(34,197,94,0.12)',
                      color: '#86efac',
                      border: '1px solid rgba(34,197,94,0.18)',
                      fontSize: '12px',
                    }}
                  >
                    Mark Actionable
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default IntelPanel;

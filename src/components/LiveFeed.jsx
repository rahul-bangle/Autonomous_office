import React from 'react';

const LiveFeed = ({ events = [] }) => {
  return (
    <div className="custom-scrollbar" style={{ 
      display: 'flex', flexDirection: 'column', gap: '8px', 
      padding: '10px', height: '100%', overflowY: 'auto' 
    }}>
      {events.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px', textAlign: 'center', marginTop: '20px' }}>
          Initializing event stream...
        </div>
      ) : (
        events.map((e, idx) => (
          <div key={idx} className="glass-card" style={{ 
            padding: '8px 12px', fontSize: '12px', borderLeft: `2px solid ${e.color || 'var(--primary)'}`,
            backgroundColor: 'rgba(255,255,255,0.02)', animation: 'slideIn 0.3s ease-out'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
              <span style={{ fontWeight: 'bold', color: 'rgba(255,255,255,0.7)' }}>{e.agent}</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{e.time}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', lineHeight: '1.4' }}>{e.text}</div>
          </div>
        ))
      )}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default LiveFeed;

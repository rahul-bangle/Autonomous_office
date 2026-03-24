import React from 'react';

const Roadmap = ({ milestones = [], fullPage = false }) => {
  return (
    <div className="custom-scrollbar" style={{ 
      padding: fullPage ? '40px' : '10px', 
      color: '#fff',
      display: fullPage ? 'flex' : 'block',
      justifyContent: 'center'
    }}>
      <div style={{ 
        display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative',
        maxWidth: fullPage ? '800px' : 'none',
        width: '100%'
      }}>
        {/* Vertical Line */}
        <div style={{
          position: 'absolute', left: '15px', top: '10px', bottom: '10px',
          width: '2px', background: 'rgba(255,255,255,0.1)'
        }} />

        {milestones.map((m, idx) => (
          <div key={m.id} style={{ position: 'relative', paddingLeft: '40px' }}>
            {/* Dot */}
            <div style={{
              position: 'absolute', left: '10px', top: '5px',
              width: '12px', height: '12px', borderRadius: '50%',
              backgroundColor: m.status === 'completed' ? 'var(--primary)' : 
                               m.status === 'active' ? '#eab308' : '#334155',
              boxShadow: m.status === 'active' ? '0 0 10px #eab30866' : 'none',
              zIndex: 1
            }} />

            <div style={{ marginBottom: '4px', fontSize: '10px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {m.date}
            </div>
            <div style={{ fontWeight: 'bold', fontSize: '15px', marginBottom: '8px', color: m.status === 'upcoming' ? 'rgba(255,255,255,0.4)' : '#fff' }}>
              {m.title}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {m.items.map((item, i) => (
                <div key={i} style={{ 
                  fontSize: '12px', color: m.status === 'upcoming' ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.6)',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}>
                  <div style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Roadmap;

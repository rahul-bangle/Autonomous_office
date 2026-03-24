import React from 'react';

const ProjectVelocity = ({ tasks = [] }) => {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const inProgress = tasks.filter(t => t.status === 'In Progress').length;
  const percentage = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="glass-card" style={{ padding: '15px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Project Velocity
        </span>
        <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--primary)', textShadow: '0 0 10px rgba(59, 130, 246, 0.5)' }}>
          {percentage}%
        </span>
      </div>

      <div style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', marginBottom: '15px' }}>
        <div style={{ 
          height: '100%', width: `${percentage}%`, 
          background: 'linear-gradient(90deg, var(--primary), #60a5fa)', 
          boxShadow: '0 0 8px var(--primary)',
          transition: 'width 1s cubic-bezier(0.22, 1, 0.36, 1)' 
        }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>Done</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{done}</div>
        </div>
        <div style={{ textAlign: 'center', padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '2px' }}>Active</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#eab308' }}>{inProgress}</div>
        </div>
      </div>
    </div>
  );
};

export default ProjectVelocity;

import React, { useState } from 'react';

const Tasks = ({ tasks = [], onUpdateTask, fullPage = false }) => {
  const columns = ['To Do', 'In Progress', 'Done'];

  const getPriorityColor = (p) => {
    if (p === 'Critical') return '#ef4444';
    if (p === 'High') return '#f97316';
    if (p === 'Medium') return '#eab308';
    return '#64748b';
  };

  const cycleStatus = (task) => {
    const currentIndex = columns.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % columns.length;
    onUpdateTask?.(task.id, columns[nextIndex]);
  };

  return (
    <div className="custom-scrollbar" style={{ 
      display: 'grid', 
      gridTemplateColumns: fullPage ? 'repeat(3, 1fr)' : '1fr', 
      gap: '24px', 
      color: '#fff',
      height: fullPage ? 'calc(100vh - 200px)' : 'auto'
    }}>
      {columns.map(col => (
        <div key={col} style={{ 
          display: 'flex', flexDirection: 'column', gap: '15px',
          backgroundColor: fullPage ? 'rgba(255,255,255,0.01)' : 'transparent',
          padding: fullPage ? '15px' : '0',
          borderRadius: '12px'
        }}>
          <div style={{ 
            fontSize: '12px', fontWeight: 'bold', color: 'rgba(255,255,255,0.3)', 
            marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '1px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: fullPage ? '1px solid rgba(255,255,255,0.05)' : 'none',
            paddingBottom: fullPage ? '10px' : '0'
          }}>
            <span>{col}</span>
            <span style={{ backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '10px', fontSize: '10px' }}>
              {tasks.filter(t => t.status === col).length}
            </span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>
            {tasks.filter(t => t.status === col).map(task => (
              <div 
                key={task.id} 
                className="glass-card" 
                onClick={() => cycleStatus(task)}
                style={{ 
                  padding: '16px', borderRadius: '12px', borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                  backgroundColor: 'rgba(255,255,255,0.03)', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '8px', color: '#fff' }}>{task.title}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: getPriorityColor(task.priority) }} />
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{task.assignee}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: getPriorityColor(task.priority), fontWeight: '900', textTransform: 'uppercase' }}>
                    {task.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Tasks;

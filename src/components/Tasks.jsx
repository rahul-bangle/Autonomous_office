import React from 'react';

const Tasks = ({ tasks = [], agents = [], onUpdateTask, fullPage = false }) => {
  const columns = ['To Do', 'In Progress', 'Done'];

  const getPriorityColor = (priority) => {
    if (priority === 'Critical') return '#ef4444';
    if (priority === 'High') return '#f97316';
    if (priority === 'Medium') return '#eab308';
    return '#64748b';
  };

  const cycleStatus = (task) => {
    const currentIndex = columns.indexOf(task.status);
    const nextIndex = (currentIndex + 1) % columns.length;
    onUpdateTask?.(task.id, columns[nextIndex]);
  };

  const resolveAssignee = (task) => {
    if (!task.assignee_agent_id || task.assignee_agent_id === 'unassigned') return 'Unassigned';
    return agents.find((agent) => String(agent.id) === String(task.assignee_agent_id))?.name || 'Unassigned';
  };

  return (
    <div
      className="custom-scrollbar"
      style={{
        display: 'grid',
        gridTemplateColumns: fullPage ? 'repeat(3, 1fr)' : '1fr',
        gap: '24px',
        color: '#fff',
        height: fullPage ? 'calc(100vh - 230px)' : 'auto',
      }}
    >
      {columns.map((column) => (
        <div
          key={column}
          className="glass-card"
          style={{
            padding: '18px',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '260px',
            background: 'rgba(10,14,22,0.86)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{column}</h3>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', padding: '4px 8px', borderRadius: '999px', background: 'rgba(255,255,255,0.05)' }}>
              {tasks.filter((task) => task.status === column).length}
            </span>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            {tasks.filter((task) => task.status === column).map((task) => (
              <button
                key={task.id}
                onClick={() => cycleStatus(task)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '14px',
                  padding: '14px',
                  textAlign: 'left',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', lineHeight: '1.5' }}>{task.title}</div>
                  <span style={{ fontSize: '11px', color: getPriorityColor(task.priority), textTransform: 'uppercase' }}>{task.priority}</span>
                </div>

                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', lineHeight: '1.6', marginBottom: '10px' }}>
                  {task.description || 'No description yet.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                  <span>{resolveAssignee(task)}</span>
                  <span>{task.module || 'general'}</span>
                </div>
              </button>
            ))}

            {tasks.filter((task) => task.status === column).length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '12px' }}>No tasks in this column.</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Tasks;

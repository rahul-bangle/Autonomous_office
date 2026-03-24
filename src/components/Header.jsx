import React from 'react';

function Header({ onMeeting, onToggleDebug, showDebug, onToggleEdit, isEditMode }) {
  const btnStyle = {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #444',
    backgroundColor: '#1a1a1a',
    color: '#ccc',
    fontSize: '11px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: 'bold',
  };

  return (
    <header className="glass-header" style={{
      height: '60px', flexShrink: 0, 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 24px', position: 'relative', zIndex: 100,
      borderBottom: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>O</div>
        <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>ORIGIN <span style={{ color: 'var(--primary)', fontWeight: '400' }}>COMMAND</span></h1>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={onMeeting} className="glass-card" style={{ 
          padding: '6px 16px', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
          color: '#60a5fa', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer'
        }}>
          Meeting
        </button>
        <button onClick={onToggleEdit} className="glass-card" style={{ 
          padding: '6px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: isEditMode ? 'var(--primary)' : '#fff', fontSize: '12px', fontWeight: 'bold', borderRadius: '6px', cursor: 'pointer'
        }}>
          {isEditMode ? 'Save Layout' : 'Edit Layout'}
        </button>
        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff5f56' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#27c93f' }} />
        </div>
      </div>
    </header>
  );
}

export default Header;

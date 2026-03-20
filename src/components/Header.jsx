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
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#0d0d0d',
      borderBottom: '1px solid #222',
      padding: '8px 20px',
      userSelect: 'none',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#fff', fontSize: '16px', fontWeight: 'bold', letterSpacing: '1px' }}>OFFICE OS</span>
          <span style={{ color: '#555', fontSize: '9px', fontWeight: 'bold' }}>SYSTEM CONTROL v2.1</span>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
          <button onClick={onMeeting} style={{ ...btnStyle, borderColor: '#3b82f6', color: '#60a5fa' }}>
            👥 Meeting
          </button>
          <button onClick={onToggleEdit} style={{ 
            ...btnStyle, 
            borderColor: isEditMode ? '#ef4444' : '#10b981',
            color: isEditMode ? '#f87171' : '#34d399',
            backgroundColor: isEditMode ? 'rgba(239,68,68,0.1)' : 'transparent'
          }}>
            {isEditMode ? '💾 Save Layout' : '🛠 Edit Layout'}
          </button>
          <button onClick={onToggleDebug} style={{ 
            ...btnStyle, 
            borderColor: showDebug ? '#fbbf24' : '#444',
            color: showDebug ? '#fbbf24' : '#888'
          }}>
            {showDebug ? '🔍 Debug ON' : '🔍 Debug OFF'}
          </button>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ff5f56', boxShadow: '0 0 5px #ff5f5680' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ffbd2e', boxShadow: '0 0 5px #ffbd2e80' }} />
        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#27c93f', boxShadow: '0 0 5px #27c93f80' }} />
      </div>
    </div>
  );
}

export default Header;

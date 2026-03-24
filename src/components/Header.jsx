import React from 'react';
import { NAV_ITEMS } from '../navConfig';

function Header({ activeTab = 'home', onMeeting, onToggleEdit, isEditMode }) {
  const activeItem = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];
  const isOfficeTab = activeTab === 'home';

  return (
    <header
      className="glass-header"
      style={{
        height: '68px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'relative',
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'linear-gradient(180deg, rgba(8,11,17,0.96) 0%, rgba(8,11,17,0.88) 100%)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #fde68a 0%, #f59e0b 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#111827',
            fontWeight: '800',
          }}
        >
          O
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.5px', color: '#fff' }}>
            ORIGIN <span style={{ color: '#f8c15c', fontWeight: '500' }}>COMMAND</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '2px' }}>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.34)', textTransform: 'uppercase', letterSpacing: '1px' }}>
              PM Edition
            </span>
            <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'rgba(255,255,255,0.18)' }} />
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{activeItem.label}</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ textAlign: 'right', marginRight: '8px' }}>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Current surface
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{activeItem.summary}</div>
        </div>
        {isOfficeTab && (
          <button
            onClick={onMeeting}
            className="glass-card"
            style={{
              padding: '7px 16px',
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.24)',
              color: '#93c5fd',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Meeting
          </button>
        )}
        {isOfficeTab && (
          <button
            onClick={onToggleEdit}
            className="glass-card"
            style={{
              padding: '7px 16px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: isEditMode ? '#86efac' : '#fff',
              fontSize: '12px',
              fontWeight: '700',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            {isEditMode ? 'Save Layout' : 'Edit Layout'}
          </button>
        )}
        <div style={{ display: 'flex', gap: '6px', marginLeft: '12px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
        </div>
      </div>
    </header>
  );
}

export default Header;

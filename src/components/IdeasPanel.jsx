import React, { useState } from 'react';

const STAGES = ['raw', 'exploring', 'validated', 'archived'];

function IdeasPanel({ ideas = [], onAddIdea, onAdvanceIdea }) {
  const [title, setTitle] = useState('');
  const [hypothesis, setHypothesis] = useState('');

  const handleSubmit = () => {
    if (!title.trim()) return;
    onAddIdea?.({
      title: title.trim(),
      hypothesis: hypothesis.trim(),
    });
    setTitle('');
    setHypothesis('');
  };

  return (
    <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }} className="custom-scrollbar">
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '8px' }}>Idea Pipeline</h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px' }}>
          Capture rough PM ideas, move them through exploration, and keep the validation queue visible.
        </p>
      </div>

      <div className="glass-card" style={{ padding: '18px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px' }}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Idea title"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#fff',
            }}
          />
          <input
            value={hypothesis}
            onChange={(event) => setHypothesis(event.target.value)}
            placeholder="Core hypothesis"
            style={{
              backgroundColor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              padding: '12px 14px',
              color: '#fff',
            }}
          />
          <button
            onClick={handleSubmit}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              background: 'rgba(34,197,94,0.14)',
              color: '#86efac',
              fontWeight: '700',
            }}
          >
            Add idea
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '16px' }}>
        {STAGES.map((stage) => (
          <div key={stage} className="glass-card" style={{ padding: '16px', borderRadius: '16px', minHeight: '280px' }}>
            <div style={{ fontSize: '12px', color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
              {stage}
            </div>
            {ideas.filter((idea) => idea.stage === stage).map((idea) => (
              <div key={idea.id} style={{ padding: '12px', borderRadius: '12px', backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: '10px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>{idea.title}</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: '1.5', marginBottom: '10px' }}>
                  {idea.hypothesis || 'No hypothesis captured yet.'}
                </div>
                <button
                  onClick={() => onAdvanceIdea?.(idea.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: 'rgba(59,130,246,0.14)',
                    color: '#93c5fd',
                    fontSize: '11px',
                  }}
                >
                  Advance
                </button>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default IdeasPanel;

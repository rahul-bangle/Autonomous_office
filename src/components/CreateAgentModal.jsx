import React, { useState } from 'react';

function CreateAgentModal({ isOpen, onClose, onAgentCreate, availableSkills = [] }) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [goal, setGoal] = useState('');
  const [backstory, setBackstory] = useState('');
  const [personality, setPersonality] = useState('Formal');
  const [skills, setSkills] = useState([]);
  const [tools, setTools] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [toolInput, setToolInput] = useState('');
  const [avatarColor, setAvatarColor] = useState('#3b82f6'); // Default blue
  const [priority, setPriority] = useState('Medium');

  if (!isOpen) return null;

  const presetColors = ['#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

  const handleAddSkill = (e) => {
    if (e.key === 'Enter' && skillInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleAddTool = (e) => {
    if (e.key === 'Enter' && toolInput.trim()) {
      e.preventDefault();
      if (!tools.includes(toolInput.trim())) setTools([...tools, toolInput.trim()]);
      setToolInput('');
    }
  };

  const handleRemoveTool = (toolToRemove) => {
    setTools(tools.filter(t => t !== toolToRemove));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !role) return; // Basic validation
    
    onAgentCreate({
      name,
      role,
      goal,
      backstory,
      personality,
      skills,
      tools,
      avatarColor,
      priority
    });
    
    // Reset form after submit
    setName(''); setRole(''); setGoal(''); setBackstory('');
    setPersonality('Formal'); setSkills([]); setTools([]); 
    setSkillInput(''); setToolInput(''); setAvatarColor('#3b82f6'); setPriority('Medium');
  };

  return (
    <div 
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
    >
      <div 
        style={{
          width: '500px', maxHeight: '90vh',
          backgroundColor: '#1e293b',
          borderRadius: '12px',
          border: '1px solid #334155',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 'bold' }}>Create New Agent</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}>&times;</button>
        </div>

        {/* Form Body */}
        <div style={{ padding: '24px', overflowY: 'auto' }} className="custom-scrollbar">
          
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Agent Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Code Reviewer Bot" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Role <span style={{ color: '#ef4444' }}>*</span></label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} style={inputStyle} placeholder="e.g. Senior Backend Engineer" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Goal</label>
            <textarea value={goal} onChange={e => setGoal(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} rows={2} placeholder="What is this agent's primary objective?" />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Backstory</label>
            <textarea value={backstory} onChange={e => setBackstory(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} rows={3} placeholder="Give them a persona or history to guide their responses." />
          </div>

          <div style={{ marginBottom: '16px', display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Personality / Tone</label>
              <select value={personality} onChange={e => setPersonality(e.target.value)} style={inputStyle}>
                <option>Formal</option>
                <option>Casual</option>
                <option>Technical</option>
                <option>Creative</option>
                <option>Aggressive</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Avatar Color</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', height: '40px' }}>
                {presetColors.map(color => (
                  <div 
                    key={color}
                    onClick={() => setAvatarColor(color)}
                    style={{
                      width: '24px', height: '24px', borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                      border: avatarColor === color ? '2px solid #fff' : '2px solid transparent',
                      boxShadow: avatarColor === color ? '0 0 0 1px #3b82f6' : 'none'
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Skills */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Skills</label>
            
            {/* Dynamic System Skills */}
            {availableSkills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                {availableSkills.map(s => (
                  <button 
                    key={s.id}
                    onClick={(e) => {
                      e.preventDefault();
                      if (skills.includes(s.name)) handleRemoveSkill(s.name);
                      else setSkills([...skills, s.name]);
                    }}
                    title={s.description}
                    style={{
                      background: skills.includes(s.name) ? 'rgba(34, 197, 94, 0.2)' : '#334155',
                      color: skills.includes(s.name) ? '#22c55e' : '#94a3b8',
                      border: `1px solid ${skills.includes(s.name) ? 'rgba(34, 197, 94, 0.4)' : '#475569'}`,
                      padding: '6px 12px', borderRadius: '16px', fontSize: '13px', cursor: 'pointer',
                      fontWeight: skills.includes(s.name) ? 'bold' : 'normal',
                      transition: 'all 0.2s'
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Custom Skills Input */}
            <label style={{...labelStyle, fontSize: '11px', marginTop: '8px' }}>Custom Skills (Press Enter)</label>
            <div style={{ ...inputStyle, minHeight: '40px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {skills.map(skill => (
                <span key={skill} onClick={() => handleRemoveSkill(skill)} style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(34, 197, 94, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {skill} &times;
                </span>
              ))}
              <input 
                type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyDown={handleAddSkill}
                style={{ flex: 1, minWidth: '80px', background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '14px' }} 
                placeholder={skills.length === 0 ? "e.g. Python, React..." : ""}
              />
            </div>
          </div>

          {/* Tools */}
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>Tools (Press Enter to add)</label>
            <div style={{ ...inputStyle, minHeight: '40px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
              {tools.map(tool => (
                <span key={tool} onClick={() => handleRemoveTool(tool)} style={{ backgroundColor: 'rgba(168, 85, 247, 0.2)', color: '#a855f7', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', border: '1px solid rgba(168, 85, 247, 0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {tool} &times;
                </span>
              ))}
              <input 
                type="text" value={toolInput} onChange={e => setToolInput(e.target.value)} onKeyDown={handleAddTool}
                style={{ flex: 1, minWidth: '80px', background: 'transparent', border: 'none', color: '#f8fafc', outline: 'none', fontSize: '14px' }} 
                placeholder={tools.length === 0 ? "e.g. GitHub, Jira..." : ""}
              />
            </div>
          </div>

          {/* Priority */}
          <div style={{ marginBottom: '16px' }}>
             <label style={labelStyle}>Priority Level</label>
             <div style={{ display: 'flex', gap: '8px' }}>
               {['Low', 'Medium', 'High'].map(level => (
                 <button
                   key={level}
                   onClick={() => setPriority(level)}
                   style={{
                     flex: 1, padding: '8px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                     backgroundColor: priority === level ? '#334155' : 'transparent',
                     color: priority === level ? '#fff' : '#94a3b8',
                     border: `1px solid ${priority === level ? '#64748b' : '#334155'}`,
                   }}
                 >
                   {level}
                 </button>
               ))}
             </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end', gap: '12px', backgroundColor: '#0f172a' }}>
          <button 
            onClick={onClose}
            style={{ padding: '10px 20px', borderRadius: '6px', backgroundColor: 'transparent', color: '#cbd5e1', border: '1px solid #475569', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            disabled={!name || !role}
            style={{ 
              padding: '10px 20px', borderRadius: '6px', backgroundColor: (!name || !role) ? '#475569' : 'var(--primary)', 
              color: '#0d0d0d', border: 'none', cursor: (!name || !role) ? 'not-allowed' : 'pointer', fontWeight: 'bold' 
            }}
          >
            Create Agent
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: '#94a3b8',
  fontSize: '13px',
  fontWeight: 'bold',
  marginBottom: '6px'
};

const inputStyle = {
  width: '100%',
  backgroundColor: '#0f172a',
  border: '1px solid #475569',
  borderRadius: '6px',
  padding: '10px 12px',
  color: '#f8fafc',
  fontSize: '14px',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s'
};

export default CreateAgentModal;

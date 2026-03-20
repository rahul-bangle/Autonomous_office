import React, { useState, useEffect, useRef } from 'react';
import bus from '../EventBus';
import { supabase } from '../supabaseClient';

// ── Strip any ReAct leftovers that slip through backend ───────────────────────
function stripReact(text) {
  return String(text || '')
    .replace(/(THOUGHT|ACTION|RESULT|DECISION)\s*:\s*/gi, '')
    .split('\n').filter(l => l.trim()).join('\n').trim();
}

// ── Assign a consistent color per agent name ──────────────────────────────────
const AGENT_COLORS = ['#4ecdc4', '#a78bfa', '#fb923c', '#34d399', '#f472b6', '#60a5fa'];
const colorCache = {};
function agentColor(name, agents) {
  if (colorCache[name]) return colorCache[name];
  const idx = agents.findIndex(a => a.name === name);
  const color = AGENT_COLORS[(idx >= 0 ? idx : Object.keys(colorCache).length) % AGENT_COLORS.length];
  colorCache[name] = color;
  return color;
}

const WS_URL = 'ws://127.0.0.1:8000/ws';

function AgentChat({ agents = [] }) {
  const [messages, setMessages] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [inputValue, setInputValue]   = useState('');
  const [isLoading, setIsLoading]     = useState(false);
  const [wsStatus, setWsStatus]       = useState('connecting'); // connecting | connected | disconnected
  const bottomRef  = useRef(null);
  const wsRef            = useRef(null);
  const pendingMsg       = useRef(null); // store last user msg for bus emit after WS done
  const hasDisconnected  = useRef(false); // prevent reconnect spam messages

  // ── LOAD CHAT HISTORY FROM SUPABASE ─────────────────────────────────────────
  useEffect(() => {
    async function loadChat() {
      const { data, error } = await supabase
        .from('vo_chat_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50); // get last 50 messages
      
      if (!error && data) {
        setMessages([
          { id: 'sys-1', type: 'system', sender: 'System', color: '#94a3b8', text: 'Backend initialized. Ready for queries.' },
          ...data.map(m => ({
            id: m.id, type: m.msg_type === 'user' ? 'user' : 'final',
            sender: m.sender, color: m.color || '#fff', text: m.text, tokens: m.tokens
          }))
        ]);
      }
      setDbLoaded(true);
    }
    loadChat();
  }, []);

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── WebSocket — connect on mount, auto-reconnect ─────────────────────────────
  useEffect(() => {
    let reconnectTimer = null;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      setWsStatus('connecting');

      ws.onopen = () => {
        setWsStatus('connected');
        hasDisconnected.current = false; // reset — show disconnect msg next time
        setMessages(prev => [...prev, {
          id: Date.now(), type: 'system', sender: 'System',
          color: '#22c55e', text: '🔌 WebSocket connected — real-time mode active.'
        }]);
      };

      ws.onclose = () => {
        setWsStatus('disconnected');
        setIsLoading(false);
        // Show disconnect message only ONCE — not on every retry
        if (!hasDisconnected.current) {
          hasDisconnected.current = true;
          setMessages(prev => [...prev, {
            id: Date.now(), type: 'system', sender: 'System',
            color: '#f59e0b', text: '⚠️ WS disconnected — reconnecting…'
          }]);
        }
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // onclose fires after onerror — handled there
        setWsStatus('disconnected');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // Agent started working — show "thinking" placeholder
          if (data.type === 'agent_start') {
            setMessages(prev => [...prev, {
              id: `start-${data.agent}`, type: 'thinking',
              sender: data.agent, color: agentColor(data.agent, agents),
              text: '...'
            }]);
            
            if (data.location) {
               bus.emit('agent.pipeline_move', {
                  agentName: data.agent,
                  location: data.location
               });
            }
          }

          // Real-time chunk streaming
          if (data.type === 'stream_chunk') {
            setMessages(prev => prev.map(m => {
              if (m.sender === data.agent && m.type === 'thought') {
                return { ...m, text: m.text + data.delta };
              }
              return m;
            }));
          }

          // Initial empty message or final message wrapper
          if (data.type === 'agent_message') {
            const color = data.final ? '#facc15' : agentColor(data.agent, agents);
            const msgType = data.final ? 'final' : 'thought';

            setMessages(prev => {
              // Remove the thinking placeholder for this agent
              const filtered = prev.filter(m => m.id !== `start-${data.agent}`);
              
              // If it's a final message, also remove the streaming 'thought' message 
              if (data.final) {
                 const msgId = crypto.randomUUID();
                 const withoutThought = filtered.filter(m => !(m.sender === data.agent && m.type === 'thought'));
                 
                 // Persist final message to Supabase asynchronously
                 supabase.from('vo_chat_messages').insert({
                   id: msgId, sender: data.agent, msg_type: 'agent', color, text: data.text, tokens: data.tokens || 0
                 }).then(({ error }) => { if (error) console.error('DB Insert Error:', error); });

                 return [...withoutThought, {
                   id: msgId,
                   type: msgType,
                   sender: data.agent,
                   color,
                   text: data.text,
                   tokens: data.tokens || 0,
                 }];
              }

              // It's the start of streaming (streaming=True)
              return [...filtered, {
                id: crypto.randomUUID(),
                type: msgType,
                sender: data.agent,
                color,
                text: data.text || '',
                tokens: data.tokens || 0,
              }];
            });
          }

          // All agents done
          if (data.type === 'done') {
            setIsLoading(false);
            if (pendingMsg.current) {
              bus.emit('task.assigned', {
                userMessage: pendingMsg.current,
                agents: data.assigned_to ? data.assigned_to.map(n => ({ name: n, role: n })) : [],
                result: null,
                totalTokens: data.total_tokens || 0,
              });
              pendingMsg.current = null;
            }
          }

          // Error from backend
          if (data.type === 'error') {
            setIsLoading(false);
            setMessages(prev => [...prev, {
              id: Date.now(), type: 'error', sender: 'System',
              color: '#ef4444', text: `Error: ${data.text}`
            }]);
            bus.emit('task.assigned', { userMessage: '', agents: [], result: null, totalTokens: 0 });
          }

        } catch (e) {
          console.error('WS parse error:', e);
        }
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      wsRef.current?.close();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── EventBus listeners ───────────────────────────────────────────────────────
  useEffect(() => {
    const unsubStart = bus.on('meeting.start', () =>
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'system', sender: 'System',
        color: '#3b82f6', text: '📢 Meeting started — all agents moving to meeting room.'
      }])
    );
    const unsubEnd = bus.on('meeting.end', () =>
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'system', sender: 'System',
        color: '#94a3b8', text: '✅ Meeting ended — agents returning to workstations.'
      }])
    );
    const unsubAdded = bus.on('agent.added', ({ agent }) =>
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'system', sender: 'System',
        color: '#22c55e', text: `🤖 ${agent.name} (${agent.role}) joined the office.`
      }])
    );
    const unsubWatercooler = bus.on('agent.watercooler_chat', ({ agents: chatAgents }) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'system', sender: 'System',
        color: '#fbbf24', text: `☕ ${chatAgents[0].name} and ${chatAgents[1].name} met at the watercooler.`
      }]);
      wsRef.current.send(JSON.stringify({
        type: 'watercooler',
        agents: chatAgents.map(a => ({
          name: a.name, role: a.role, goal: a.desc || a.goal || ''
        }))
      }));
    });
    return () => { unsubStart(); unsubEnd(); unsubAdded(); unsubWatercooler(); };
  }, []);

  // ── Send message via WebSocket ────────────────────────────────────────────────
  const handleSend = () => {
    if (!inputValue.trim() || isLoading) return;
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setMessages(prev => [...prev, {
        id: Date.now(), type: 'error', sender: 'System',
        color: '#ef4444', text: 'WebSocket not connected. Wait for reconnect…'
      }]);
      return;
    }

    const newId = crypto.randomUUID();
    const userMsg = {
      id: newId, type: 'user',
      sender: 'You', color: '#fff', text: inputValue
    };
    
    // Save user message to Supabase
    supabase.from('vo_chat_messages').insert({
      id: newId, sender: 'You', msg_type: 'user', color: '#fff', text: inputValue, tokens: 0
    }).then(({ error }) => { if (error) console.error('DB Insert Error:', error); });

    setMessages(prev => [...prev, userMsg]);
    pendingMsg.current = inputValue;
    setInputValue('');
    setIsLoading(true);

    bus.emit('task.started', {
      userMessage: userMsg.text,
      agentSequence: agents.map((a, i) => ({
        id: a.id, name: a.name, role: a.role,
        targetZone: i === 0 ? 'library' : 'workspace',
      })),
    });

    wsRef.current.send(JSON.stringify({
      message: userMsg.text,
      agents: agents.map(a => ({
        id: a.id, name: a.name, role: a.role, goal: a.desc || a.goal || ''
      }))
    }));
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSend(); };

  // ── WS status dot color ───────────────────────────────────────────────────────
  const statusColor = {
    connected:    'var(--primary)',
    connecting:   '#f59e0b',
    disconnected: '#ef4444',
  }[wsStatus];

  // ── RENDER ONE MESSAGE ────────────────────────────────────────────────────────
  function renderMessage(msg) {
    const text = stripReact(msg.text);

    if (msg.type === 'system' || msg.type === 'error') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: '8px', opacity: msg.type === 'error' ? 1 : 0.7 }}>
          <span style={{ color: msg.color, fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>[{msg.sender}]:</span>
          <span style={{ color: '#ccc', wordBreak: 'break-word', fontSize: '12px' }}>{text}</span>
        </div>
      );
    }

    if (msg.type === 'user') {
      return (
        <div key={msg.id} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <span style={{
            background: '#1e293b', border: '1px solid #334155',
            borderRadius: '8px', padding: '8px 12px',
            color: '#fff', fontSize: '13px', maxWidth: '85%', wordBreak: 'break-word'
          }}>{text}</span>
        </div>
      );
    }

    // "Thinking" placeholder — pulsing dots
    if (msg.type === 'thinking') {
      return (
        <div key={msg.id} style={{ borderLeft: `2px solid ${msg.color}`, paddingLeft: '10px', opacity: 0.5 }}>
          <div style={{ fontSize: '10px', color: msg.color, fontWeight: 'bold', marginBottom: '2px' }}>
            💭 {msg.sender}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', letterSpacing: '3px' }}>
            ···
          </div>
        </div>
      );
    }

    if (msg.type === 'thought') {
      return (
        <div key={msg.id} style={{ borderLeft: `2px solid ${msg.color}`, paddingLeft: '10px', opacity: 0.65 }}>
          <div style={{ fontSize: '10px', color: msg.color, fontWeight: 'bold', marginBottom: '2px', letterSpacing: '0.05em' }}>
            💭 {msg.sender}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.4', wordBreak: 'break-word' }}>
            {text}
          </div>
        </div>
      );
    }

    if (msg.type === 'final') {
      return (
        <div key={msg.id} style={{
          background: 'linear-gradient(135deg, #1a1200 0%, #0d0d0d 100%)',
          border: `1px solid ${msg.color}`,
          borderRadius: '8px', padding: '12px 14px', marginTop: '4px',
        }}>
          <div style={{
            fontSize: '10px', color: msg.color, fontWeight: 'bold',
            marginBottom: '6px', letterSpacing: '0.08em',
            display: 'flex', gap: '6px', alignItems: 'center'
          }}>
            <span>⭐</span>
            <span>{msg.sender}</span>
            <span style={{ opacity: 0.5, fontWeight: 'normal' }}>— Final Reply</span>
            {msg.tokens > 0 && (
              <span style={{ marginLeft: 'auto', opacity: 0.4, fontSize: '9px' }}>{msg.tokens}t</span>
            )}
          </div>
          <div style={{ fontSize: '13px', color: '#fff', lineHeight: '1.6', wordBreak: 'break-word' }}>
            {text}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} style={{ display: 'flex', gap: '8px' }}>
        <span style={{ color: msg.color, fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>[{msg.sender}]:</span>
        <span style={{ color: '#ccc', wordBreak: 'break-word' }}>{text}</span>
      </div>
    );
  }

  // ── MAIN RENDER ───────────────────────────────────────────────────────────────
  return (
    <div style={{
      width: '280px', flexShrink: 0,
      backgroundColor: 'var(--bg-chat)',
      display: 'flex', flexDirection: 'column',
      borderRight: '1px solid var(--border-color)'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
        display: 'flex', alignItems: 'center', gap: '8px'
      }}>
        <h2 style={{ fontSize: '16px', color: '#fff', fontWeight: 'normal' }}>Agent Chat</h2>
        {/* WS status dot */}
        <div style={{
          width: '8px', height: '8px', borderRadius: '50%',
          backgroundColor: statusColor,
          animation: wsStatus === 'connecting' ? 'blink 1.5s infinite' : isLoading ? 'blink 1.5s infinite' : 'none'
        }} />
        {isLoading && (
          <span style={{ fontSize: '10px', color: '#f59e0b', marginLeft: 'auto' }}>working…</span>
        )}
        {wsStatus === 'disconnected' && !isLoading && (
          <span style={{ fontSize: '10px', color: '#ef4444', marginLeft: 'auto' }}>offline</span>
        )}
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, padding: '16px', overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: '10px'
      }} className="custom-scrollbar">
        {messages.map(msg => renderMessage(msg))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px', borderTop: '1px solid var(--border-color)',
        display: 'flex', gap: '8px'
      }}>
        <input
          type="text"
          placeholder={
            wsStatus !== 'connected' ? 'Connecting…' :
            isLoading ? 'Agents working…' : 'Type a message…'
          }
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading || wsStatus !== 'connected'}
          style={{
            flex: 1, minWidth: 0,
            backgroundColor: '#111', border: '1px solid var(--border-color)',
            borderRadius: '6px', padding: '10px 14px',
            color: '#fff', fontFamily: 'monospace', outline: 'none',
            opacity: (isLoading || wsStatus !== 'connected') ? 0.5 : 1
          }}
        />
        <button
          onClick={handleSend}
          disabled={isLoading || wsStatus !== 'connected'}
          style={{
            backgroundColor: (isLoading || wsStatus !== 'connected') ? '#475569' : 'var(--primary)',
            color: '#0d0d0d', fontWeight: 'bold',
            padding: '0 20px', borderRadius: '6px',
            cursor: (isLoading || wsStatus !== 'connected') ? 'not-allowed' : 'pointer',
            border: 'none'
          }}
        >Send</button>
      </div>
    </div>
  );
}

export default AgentChat;
import { useEffect, useRef, useState } from 'react';
import { ROOMS } from '../constants';
import bus from '../EventBus';

// ─── UTILS ────────────────────────────────────────────────────────────────────
import {
  ROOM_REGISTRY, DESK_REGISTRY, PLANT_REGISTRY, FURNITURE_REGISTRY,
  ZONE_TO_ROOM, getRoomBounds, getCeoHome,
  getZoneBounds, randomInZone, getMeetingSpots, getQueuePos, getRoleSpawn,
  getAffordanceBounds,
} from '../utils/officeLayout';

import {
  P, drawAgent, drawBubble, drawStaticBackground, 
  drawCoffeeMachine, drawWhiteboard, drawServerRack,
} from '../utils/officeDrawing';

import {
  GRID_SIZE, generateGrid, findAStarPath,
  canMove, canEnterRoom, canSit,
  COLLISION_MIN, resolveCollisions,
  _roomOccupancy, _deskOwners, _registerOccupancy,
} from '../utils/officePath';

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
// [FIX-M3] Added ceoConfig prop — CEO name, colors, emoji are now dynamic
export default function OfficeCanvas({
  agents = [], onMeeting = false,
  rooms = ROOMS, todTint = '',
  debugMode = false,
  layoutConfig = null,
  isEditMode = false,
  onSaveLayout = () => {},
  ceoConfig = { name:'Rahul', color:'#d4af37', skin:'#fde8c8', shoe:'#1a0a00', emoji:'👑' },
}) {
  const canvasRef      = useRef(null);
  const bgCanvasRef    = useRef(null);
  const [overlay, setOverlay] = useState(null); // 'whiteboard' | 'server' | null

  const stateRef       = useRef({
    agents:[], ceo:null, meeting:false, rafId:null, geo:null, queuedAgents:[],
    desks:    { ...DESK_REGISTRY },
    plants:   { ...PLANT_REGISTRY },
    furniture:{ ...FURNITURE_REGISTRY },
    affordances: { serverBroken: false, whiteboardUsed: false },
  });
  const bgReadyRef     = useRef(false);
  const lastTickRef    = useRef(0);
  const todTintRef     = useRef(todTint);
  const keysRef        = useRef(new Set());
  const ceoSpeedRef    = useRef(3);
  const debugModeRef   = useRef(debugMode);
  const layoutConfigRef= useRef(layoutConfig);
  const isEditModeRef  = useRef(isEditMode);
  const onSaveLayoutRef= useRef(onSaveLayout);
  const ceoConfigRef   = useRef(ceoConfig);    // [FIX-M3]
  const gridRef        = useRef(null);

  // ── Stable key — MUST be declared before any useEffect that uses it ──────
  const agentsKey = agents.map(a =>
    `${a.id||a.name}-${a.status||''}-${a.priority||''}-${a.zone||''}-${a.targetZone||''}`
  ).join('|');

  // ── Ref sync effects ─────────────────────────────────────────────────────
  useEffect(() => { todTintRef.current     = todTint;     }, [todTint]);
  useEffect(() => { debugModeRef.current   = debugMode;   }, [debugMode]);   // [FIX-C3]
  useEffect(() => { layoutConfigRef.current= layoutConfig;}, [layoutConfig]);
  useEffect(() => { isEditModeRef.current  = isEditMode;  }, [isEditMode]);
  useEffect(() => { onSaveLayoutRef.current= onSaveLayout;}, [onSaveLayout]);
  useEffect(() => { ceoConfigRef.current   = ceoConfig;   }, [ceoConfig]);   // [FIX-M3]

  // ── DRAW STATIC BG — reactive to layoutConfig ────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!bgCanvasRef.current) {
      bgCanvasRef.current = document.createElement('canvas');
      bgCanvasRef.current.width  = canvas.width;
      bgCanvasRef.current.height = canvas.height;
    }
    const bg    = bgCanvasRef.current;
    const bgCtx = bg.getContext('2d');
    bgCtx.imageSmoothingEnabled = false;

    if (layoutConfig && layoutConfig.desks)     stateRef.current.desks     = { ...layoutConfig.desks     };
    if (layoutConfig && layoutConfig.plants)    stateRef.current.plants    = { ...layoutConfig.plants    };
    if (layoutConfig && layoutConfig.furniture) stateRef.current.furniture = { ...layoutConfig.furniture };

    const geo = drawStaticBackground(bgCtx, bg.width, bg.height, layoutConfig, stateRef.current.meeting);
    stateRef.current.geo = geo;
    bgReadyRef.current = true;

    gridRef.current = generateGrid(canvas.width, canvas.height, layoutConfig);

    const { tcx, tcy, trx, try_ } = geo;
    stateRef.current._meetingSpots    = getMeetingSpots(tcx, tcy, trx, try_);
    stateRef.current._ceoMeetingSpot  = { tx:tcx+trx-10, ty:tcy-10 };
  }, [layoutConfig]);

  // [FIX-#7] Restore canvas dimensions from saved layoutConfig on mount/change
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !layoutConfig) return;
    if (layoutConfig.canvasWidth && layoutConfig.canvasHeight) {
      canvas.width  = layoutConfig.canvasWidth;
      canvas.height = layoutConfig.canvasHeight;
      if (bgCanvasRef.current) {
        bgCanvasRef.current.width  = layoutConfig.canvasWidth;
        bgCanvasRef.current.height = layoutConfig.canvasHeight;
        const bgCtx = bgCanvasRef.current.getContext('2d');
        bgCtx.imageSmoothingEnabled = false;
        const geo = drawStaticBackground(bgCtx, layoutConfig.canvasWidth, layoutConfig.canvasHeight, layoutConfig);
        stateRef.current.geo = geo;
        gridRef.current = generateGrid(layoutConfig.canvasWidth, layoutConfig.canvasHeight, layoutConfig);
        const { tcx, tcy, trx, try_ } = geo;
        stateRef.current._meetingSpots   = getMeetingSpots(tcx, tcy, trx, try_);
        stateRef.current._ceoMeetingSpot = { tx: tcx + trx - 10, ty: tcy - 10 };
      }
    }
  }, [layoutConfig]);

  // [FIX-#12] Recalculate home positions when layout changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width, H = canvas.height;
    const allAgents = stateRef.current.agents || [];
    allAgents.forEach(ag => {
      if (ag.deskId && stateRef.current.desks?.[ag.deskId]) {
        const d = stateRef.current.desks[ag.deskId];
        ag.homeX = d.x + 26;
        ag.homeY = d.y + 28;
        if (ag.status === 'idle' && !stateRef.current.meeting) {
          ag.tx = ag.homeX; ag.ty = ag.homeY;
          ag._lastTx = null; ag._lastTy = null; ag._path = [];
        }
      }
    });
    // Also update CEO home
    if (stateRef.current.ceo) {
      const ceoHome = getCeoHome(W, H, layoutConfig);
      stateRef.current.ceo.homeX = ceoHome.x;
      stateRef.current.ceo.homeY = ceoHome.y;
    }
  }, [layoutConfig]);

  // ── CEO INIT + ANIMATION LOOP (runs once) ────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // [FIX-M2] Reset module-level singletons on mount to avoid HMR ghost data
    Object.keys(_deskOwners).forEach(k => delete _deskOwners[k]);
    Object.keys(_roomOccupancy).forEach(k => _roomOccupancy[k].clear());

    // [FIX-H3] Dynamic CEO home — reacts to canvas size, not hardcoded
    const ceoHome = getCeoHome(canvas.width, canvas.height, layoutConfigRef.current);
    stateRef.current.ceo = {
      x:ceoHome.x, y:ceoHome.y,
      tx:ceoHome.x, ty:ceoHome.y,
      homeX:ceoHome.x, homeY:ceoHome.y,
    };

    const TARGET_FPS = 20;
    const FRAME_MS   = 1000 / TARGET_FPS;

    function loop(timestamp) {
      if (timestamp - lastTickRef.current < FRAME_MS) {
        stateRef.current.rafId = requestAnimationFrame(loop);
        return;
      }
      lastTickRef.current = timestamp;

      const ctx = canvas.getContext('2d');
      const W = canvas.width, H = canvas.height;
      const MARGIN = 8;

      if (bgReadyRef.current && bgCanvasRef.current) {
        ctx.drawImage(bgCanvasRef.current, 0, 0);
      } else {
        ctx.clearRect(0, 0, W, H);
      }

      if (todTintRef.current) {
        ctx.fillStyle = todTintRef.current;
        ctx.fillRect(0, 0, W, H);
      }

      const tick = timestamp * 0.04;
      const allAgents = stateRef.current.agents;

      allAgents.forEach((ag) => {
        // [FIX-H2] NaN guard at TOP — before any math, every frame
        if (!Number.isFinite(ag.x))  ag.x  = ag.homeX || 250;
        if (!Number.isFinite(ag.y))  ag.y  = ag.homeY || 250;
        if (!Number.isFinite(ag.tx)) ag.tx = ag.homeX || 250;
        if (!Number.isFinite(ag.ty)) ag.ty = ag.homeY || 250;

        // A* path recalculation — only when target actually changed
        if (ag._lastTx !== ag.tx || ag._lastTy !== ag.ty) {
          if (gridRef.current) {
            ag._path = findAStarPath({x:ag.x,y:ag.y}, {x:ag.tx,y:ag.ty}, gridRef.current);
          }
          ag._lastTx = ag.tx;
          ag._lastTy = ag.ty;
        }

        // A* path following
        if (ag._path && ag._path.length > 0) {
          const next = ag._path[0];
          const dx = next.x - ag.x, dy = next.y - ag.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 5) { ag._path.shift(); }
          else { ag.x += (dx/dist)*2.5; ag.y += (dy/dist)*2.5; }
        } else {
          ag.x += (ag.tx - ag.x) * 0.05;
          ag.y += (ag.ty - ag.y) * 0.05;
        }

        // Emit agent.moved once on settle
        const settled = Math.abs(ag.x-ag.tx) < 4 && Math.abs(ag.y-ag.ty) < 4;
        if (settled && !ag._movedEmitted) {
          bus.emit('agent.moved', { agentId:ag.id||ag.name, x:Math.floor(ag.tx), y:Math.floor(ag.ty), zone:ag.zone });
          ag._movedEmitted = true;
        } else if (!settled) {
          ag._movedEmitted = false;
        }

        const atDesk = Math.abs(ag.x - ag.homeX) < 8 && Math.abs(ag.y - ag.homeY) < 8;
        const bob = (ag.status === 'idle' || atDesk) ? 0 : Math.sin(tick + ag.phase) * 2.5;
        drawAgent(ctx, Math.floor(ag.x), Math.floor(ag.y), ag.color, ag.skin, ag.shoe, bob);

        const s = (ag.status||'').toLowerCase();
        const emoji = atDesk ? '💻'
                    : s==='moving' ? '🚶' : s==='working' ? '⚙️'
                    : s.includes('search') ? '🔍' : s.includes('writ') ? '📝' : '💤';
        drawBubble(ctx, Math.floor(ag.x), Math.floor(ag.y), emoji, ag.name);
      });

      // Desk nameplates
      Object.entries(stateRef.current.desks || {}).forEach(([id, d]) => {
        const ownerId = _deskOwners[id];
        let ownerName = id==='reception-desk' ? 'Reception' : id==='ceo-desk' ? 'CEO' : `Desk ${id.split('-')[1]}`;
        if (ownerId) {
          const agent = allAgents.find(a => String(a.id||a.name) === ownerId);
          if (agent) ownerName = agent.name;
        }
        ctx.save();
        ctx.fillStyle = 'rgba(15,23,42,0.8)';
        const nw = ownerName.length * 5 + 10;
        ctx.fillRect(d.x+36-nw/2, d.y-12, nw, 10);
        ctx.strokeStyle = ownerId ? '#fbbf24' : '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(d.x+36-nw/2, d.y-12, nw, 10);
        ctx.fillStyle = ownerId ? '#f8fafc' : '#94a3b8';
        ctx.font = '7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(ownerName, d.x+36, d.y-4);
        ctx.restore();
      });

      // Draw Affordances
      const bC = getAffordanceBounds('coffee', W, H, layoutConfigRef.current);
      const bW = getAffordanceBounds('whiteboard', W, H, layoutConfigRef.current);
      const bS = getAffordanceBounds('server', W, H, layoutConfigRef.current);
      drawCoffeeMachine(ctx, bC.x, bC.y);
      drawWhiteboard(ctx, bW.x, bW.y, bW.w, bW.h, stateRef.current.affordances.whiteboardUsed);
      drawServerRack(ctx, bS.x, bS.y, stateRef.current.affordances.serverBroken, tick);

      // [FIX-H1] resolveCollisions now pushes x/y not tx/ty — no A* thrash
      resolveCollisions(allAgents, stateRef.current.meeting);

      // Boundary clamp — applied AFTER collision push so x/y stays in canvas
      const boundAll = [...allAgents, ...(stateRef.current.queuedAgents || [])];
      boundAll.forEach(ag => {
        ag.tx = Math.max(MARGIN, Math.min(W-MARGIN, ag.tx));
        ag.ty = Math.max(MARGIN, Math.min(H-MARGIN, ag.ty));
        if (ag.x < MARGIN)   ag.x = MARGIN;
        if (ag.x > W-MARGIN) ag.x = W-MARGIN;
        if (ag.y < MARGIN)   ag.y = MARGIN;
        if (ag.y > H-MARGIN) ag.y = H-MARGIN;
      });

      // Queued agents
      const queued = stateRef.current.queuedAgents || [];
      queued.forEach((ag, qi) => {
        // [FIX-H2] NaN guard for queued agents too
        if (!Number.isFinite(ag.x))  ag.x  = ag.homeX || 250;
        if (!Number.isFinite(ag.y))  ag.y  = ag.homeY || 250;
        ag.x += (ag.tx - ag.x) * 0.08;
        ag.y += (ag.ty - ag.y) * 0.08;
        const bob = ag.status === 'idle' ? 0 : Math.sin(tick + ag.phase) * 2.5;
        drawAgent(ctx, Math.floor(ag.x), Math.floor(ag.y), ag.color, ag.skin, ag.shoe, bob);
        const pulse = 0.6 + 0.4 * Math.abs(Math.sin(tick * 0.5));
        ctx.globalAlpha = pulse;
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.rect(Math.floor(ag.x)-2, Math.floor(ag.y)-28, 28, 12);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#000';
        ctx.font = 'bold 7px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Q${qi+1}`, Math.floor(ag.x)+12, Math.floor(ag.y)-19);
      });

      // CEO movement + draw
      const ceo = stateRef.current.ceo;
      if (ceo) {
        const speed = ceoSpeedRef.current;
        const keys  = keysRef.current;
        const cfg   = ceoConfigRef.current; // [FIX-M3]

        if (keys.size > 0) {
          if (keys.has('w')||keys.has('ArrowUp'))    ceo.y -= speed;
          if (keys.has('s')||keys.has('ArrowDown'))  ceo.y += speed;
          if (keys.has('a')||keys.has('ArrowLeft'))  ceo.x -= speed;
          if (keys.has('d')||keys.has('ArrowRight')) ceo.x += speed;
          ceo.x  = Math.max(MARGIN, Math.min(W-MARGIN, ceo.x));
          ceo.y  = Math.max(MARGIN, Math.min(H-MARGIN, ceo.y));
          ceo.tx = ceo.x; ceo.ty = ceo.y;
        } else if (ceo._moving) {
          const dx = ceo.tx - ceo.x, dy = ceo.ty - ceo.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (dist < 4) { ceo.x = ceo.tx; ceo.y = ceo.ty; ceo._moving = false; }
          else { ceo.x += (dx/dist)*speed; ceo.y += (dy/dist)*speed; }
        }

        // CEO boundary clamp
        ceo.tx = Math.max(MARGIN, Math.min(W-MARGIN, ceo.tx));
        ceo.ty = Math.max(MARGIN, Math.min(H-MARGIN, ceo.ty));
        if (ceo.x < MARGIN) ceo.x = MARGIN; if (ceo.x > W-MARGIN) ceo.x = W-MARGIN;
        if (ceo.y < MARGIN) ceo.y = MARGIN; if (ceo.y > H-MARGIN) ceo.y = H-MARGIN;

        const ceoBob = keys.size > 0 || ceo._moving ? Math.sin(tick * 0.85) * 2 : 0;
        // [FIX-M3] CEO appearance from ceoConfig prop — no hardcoded strings
        drawAgent(ctx, Math.floor(ceo.x), Math.floor(ceo.y), cfg.color, cfg.skin, cfg.shoe, ceoBob);
        drawBubble(ctx, Math.floor(ceo.x), Math.floor(ceo.y), cfg.emoji, cfg.name);
      }

      // ── DEBUG OVERLAY (~ key) ───────────────────────────────────────────
      // [FIX-C3] debugModeRef now syncs with prop — toggle actually works
      if (debugModeRef.current) {
        const DEBUG_ZONES = [
          { key:'CEO_CABIN',       color:'#f59e0b' },
          { key:'MAIN_OFFICE',     color:'#3b82f6' },
          { key:'LIBRARY_SECTION', color:'#22c55e' },
          { key:'MEETING_ROOM',    color:'#a855f7' },
          { key:'RECEPTION',       color:'#ec4899' },
        ];
        DEBUG_ZONES.forEach(({ key, color }) => {
          const b = getRoomBounds(key, W, H);
          ctx.save();
          ctx.strokeStyle = color; ctx.lineWidth = 2;
          ctx.setLineDash([5,3]); ctx.globalAlpha = 0.7;
          ctx.strokeRect(b.x+1, b.y+1, b.w-2, b.h-2);
          ctx.font = 'bold 9px monospace'; ctx.fillStyle = color; ctx.globalAlpha = 0.9;
          ctx.fillText(key, b.x+4, b.y+11);
          ctx.restore();
        });

        const debugAgents = [...stateRef.current.agents, ...(stateRef.current.queuedAgents||[])];
        debugAgents.forEach(ag => {
          const ax = Math.floor(ag.x), ay = Math.floor(ag.y);
          ctx.save();
          ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 1;
          ctx.globalAlpha = 0.45; ctx.setLineDash([3,3]);
          ctx.beginPath(); ctx.arc(ax, ay, COLLISION_MIN/2, 0, Math.PI*2); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1;
          ctx.font = '9px monospace'; ctx.fillStyle = '#00ffcc'; ctx.textAlign = 'center';
          ctx.fillText(`${ag.status||'idle'}${ag.targetZone?' → '+ag.targetZone:''}`, ax, ay-36);
          ctx.restore();
        });

        if (ceo) {
          ctx.save();
          ctx.strokeStyle = '#fbbf24'; ctx.lineWidth = 1;
          ctx.setLineDash([3,3]); ctx.globalAlpha = 0.5;
          ctx.beginPath(); ctx.arc(Math.floor(ceo.x), Math.floor(ceo.y), COLLISION_MIN/2, 0, Math.PI*2); ctx.stroke();
          ctx.setLineDash([]); ctx.globalAlpha = 1;
          ctx.font = '9px monospace'; ctx.fillStyle = '#fbbf24'; ctx.textAlign = 'center';
          ctx.fillText('CEO • locked', Math.floor(ceo.x), Math.floor(ceo.y)-36);
          ctx.restore();
        }
      }

      // ── EDIT MODE VISUALS ──────────────────────────────────────────────
      if (isEditModeRef.current) {
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(W-12, H-12, 12, 12);
        ctx.strokeStyle = '#ffffff'; ctx.strokeRect(W-12, H-12, 12, 12);
        ctx.fillStyle = '#fff'; ctx.font = '8px sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('⤡', W-6, H-3);

        const dAg = stateRef.current.draggedAgent;
        if (dAg) {
          const bob = dAg.status === 'idle' ? 0 : Math.sin(tick + dAg.phase) * 2.5;
          drawAgent(ctx, Math.floor(dAg.x), Math.floor(dAg.y), dAg.color, dAg.skin, dAg.shoe, bob);
          drawBubble(ctx, Math.floor(dAg.x), Math.floor(dAg.y), '✋', dAg.name);
        }
      }

      stateRef.current.rafId = requestAnimationFrame(loop);
    }

    stateRef.current.rafId = requestAnimationFrame(loop);
    return () => { if (stateRef.current.rafId) cancelAnimationFrame(stateRef.current.rafId); };
  }, []);

  // ── [FIX-M1] bus.on('agent.removed') INSIDE component with cleanup ────────
  useEffect(() => {
    const handler = ({ agentId }) => {
      const sId = String(agentId);
      // [FIX-#10] Also clean _roomOccupancy — removed agents were leaking occupancy counts
      Object.keys(_deskOwners).forEach(did => {
        if (_deskOwners[did] === sId) delete _deskOwners[did];
      });
      for (const occ of Object.values(_roomOccupancy)) occ.delete(sId);
    };
    bus.on('agent.removed', handler);
    return () => bus.off('agent.removed', handler);
  }, []);

  // ── PIPELINE MOVEMENT ──────────────────────────────────────────────────────
  useEffect(() => {
    const handler = ({ agentName, location }) => {
      const ag = stateRef.current.agents.find(a => String(a.name) === String(agentName));
      if (!ag) return;
      
      const W = canvasRef.current?.width || 900;
      const H = canvasRef.current?.height || 540;
      
      if (location === 'WHITEBOARD') {
        const bW = getAffordanceBounds('whiteboard', W, H, layoutConfigRef.current);
        ag.tx = bW.x + bW.w / 2 + (Math.random()*40-20);
        ag.ty = bW.y + bW.h + 20;
      } else if (location === 'MEETING') {
        const spots = stateRef.current._meetingSpots || [];
        if (spots.length > 0) {
            const spot = spots[Math.floor(Math.random() * spots.length)];
            ag.tx = spot.x;
            ag.ty = spot.y;
        } else {
            ag.tx = W / 2 + (Math.random()*40-20);
            ag.ty = H / 2 + (Math.random()*40-20);
        }
      } else if (location === 'DESK') {
        ag.tx = ag.homeX || W/2;
        ag.ty = ag.homeY || H/2;
      }
      
      ag.status = 'working';
    };
    bus.on('agent.pipeline_move', handler);
    return () => bus.off('agent.pipeline_move', handler);
  }, []);

  // ── EDIT MODE MOUSE CONTROL ────────────────────────────────────────────────
  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;

    const getPos = (e) => {
      const rect = cv.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (cv.width  / rect.width),
        y: (e.clientY - rect.top)  * (cv.height / rect.height),
      };
    };

    const handleMouseDown = (e) => {
      const { x, y } = getPos(e);
      const W = cv.width, H = cv.height;

      // Affordance clicks
      const bW = getAffordanceBounds('whiteboard', W, H, layoutConfigRef.current);
      if (x >= bW.x && x <= bW.x + bW.w && y >= bW.y && y <= bW.y + bW.h) {
        setOverlay('whiteboard');
        return;
      }

      if (!isEditModeRef.current) return;

      if (x >= W-12 && x <= W && y >= H-12 && y <= H) {
        stateRef.current.isResizing  = true;
        stateRef.current.resizeStart = { x, y, w:W, h:H };
        return;
      }
      const ags = stateRef.current.agents || [];
      for (let i = ags.length-1; i >= 0; i--) {
        const ag = ags[i];
        if (x >= ag.x-15 && x <= ag.x+15 && y >= ag.y-40 && y <= ag.y+5) {
          stateRef.current.draggedAgent = ag; return;
        }
      }
      for (const [id, d] of Object.entries(stateRef.current.desks || {})) {
        if (x >= d.x && x <= d.x+72 && y >= d.y && y <= d.y+44) {
          stateRef.current.draggedFurniture = { type:'desks', id, ox:x-d.x, oy:y-d.y }; return;
        }
      }
      for (const [id, p] of Object.entries(stateRef.current.plants || {})) {
        if (x >= p.x-5 && x <= p.x+25 && y >= p.y-5 && y <= p.y+35) {
          stateRef.current.draggedFurniture = { type:'plants', id, ox:x-p.x, oy:y-p.y }; return;
        }
      }
      for (const [id, f] of Object.entries(stateRef.current.furniture || {})) {
        if (x >= f.x && x <= f.x+(f.w||120) && y >= f.y && y <= f.y+(f.h||54)) {
          stateRef.current.draggedFurniture = { type:'furniture', id, ox:x-f.x, oy:y-f.y }; return;
        }
      }
    };

    const handleMouseMove = (e) => {
      if (!isEditModeRef.current) return;
      const { x, y } = getPos(e);

      if (stateRef.current.isResizing) {
        const start = stateRef.current.resizeStart;
        const newW = Math.max(600, Math.min(1400, start.w + (x - start.x)));
        const newH = Math.max(400, Math.min(800,  start.h + (y - start.y)));
        cv.width  = newW;
        cv.height = newH;
        if (bgCanvasRef.current) {
          bgCanvasRef.current.width  = newW;
          bgCanvasRef.current.height = newH;
          const bgCtx = bgCanvasRef.current.getContext('2d');
          bgCtx.imageSmoothingEnabled = false;
          const geo = drawStaticBackground(bgCtx, newW, newH, {
            ...(layoutConfigRef.current || {}),
            desks:     stateRef.current.desks,
            plants:    stateRef.current.plants,
            furniture: stateRef.current.furniture,
          }, stateRef.current.meeting);
          stateRef.current.geo = geo;
          gridRef.current = generateGrid(newW, newH, layoutConfigRef.current);
          const { tcx, tcy, trx, try_ } = geo;
          stateRef.current._meetingSpots = getMeetingSpots(tcx, tcy, trx, try_);
        }
      } else if (stateRef.current.draggedAgent) {
        const ag = stateRef.current.draggedAgent;
        ag.x = x; ag.y = y; ag.tx = x; ag.ty = y; ag._path = [];
      } else if (stateRef.current.draggedFurniture) {
        const df  = stateRef.current.draggedFurniture;
        const reg = stateRef.current[df.type];
        if (reg && reg[df.id]) {
          reg[df.id].x = x - df.ox;
          reg[df.id].y = y - df.oy;
          if (bgCanvasRef.current) {
            const bgCtx = bgCanvasRef.current.getContext('2d');
            bgCtx.imageSmoothingEnabled = false;
            drawStaticBackground(bgCtx, cv.width, cv.height, {
              ...(layoutConfigRef.current || {}),
              desks:     stateRef.current.desks,
              plants:    stateRef.current.plants,
              furniture: stateRef.current.furniture,
            });
          }
        }
      }
    };

    const handleMouseUp = () => {
      if (!isEditModeRef.current) return;

      if (stateRef.current.isResizing) {
        stateRef.current.isResizing = false;
        onSaveLayoutRef.current?.({
          canvasWidth:cv.width, canvasHeight:cv.height,
          desks:stateRef.current.desks, plants:stateRef.current.plants, furniture:stateRef.current.furniture,
        });
      } else if (stateRef.current.draggedAgent) {
        const ag = stateRef.current.draggedAgent;
        ag.homeX = ag.x; ag.homeY = ag.y;
        stateRef.current.draggedAgent = null;
        bus.emit('agent.moved', { agentId:ag.id||ag.name, x:Math.floor(ag.x), y:Math.floor(ag.y), zone:ag.zone });
      } else if (stateRef.current.draggedFurniture) {
        const df = stateRef.current.draggedFurniture;
        stateRef.current.draggedFurniture = null;
        if (df.type === 'desks' && stateRef.current.desks) {
          const d = stateRef.current.desks[df.id];
          if (d) {
            (stateRef.current.agents || []).forEach(ag => {
              if (ag.deskId === df.id) {
                ag.homeX = d.x+26; ag.homeY = d.y+28;
                ag.tx = ag.homeX;  ag.ty = ag.homeY; ag._path = [];
              }
            });
          }
        }
        onSaveLayoutRef.current?.({
          canvasWidth:cv.width, canvasHeight:cv.height,
          desks:stateRef.current.desks, plants:stateRef.current.plants, furniture:stateRef.current.furniture,
        });
      }
    };

    cv.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup',   handleMouseUp);
    return () => {
      cv.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup',   handleMouseUp);
    };
  }, []);

  // ── CEO KEYBOARD CONTROL (WASD / Arrow keys) ──────────────────────────────
  useEffect(() => {
    const VALID = ['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    const onDown = (e) => {
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (VALID.includes(e.key)) { e.preventDefault(); keysRef.current.add(e.key); }
    };
    const onUp   = (e) => { keysRef.current.delete(e.key); };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown', onDown); window.removeEventListener('keyup', onUp); };
  }, []);

  // ── AUTONOMOUS WATERCOOLER ──────────────────────────────────────────────────
  useEffect(() => {
    let lastChatTime = 0;
    const interval = setInterval(() => {
      if (Date.now() - lastChatTime < 60000) return; // Cooldown 60s
      
      const W = canvasRef.current?.width || 900;
      const H = canvasRef.current?.height || 540;
      const bC = getAffordanceBounds('coffee', W, H, layoutConfigRef.current);
      
      const atCoffee = (stateRef.current.agents || []).filter(ag => {
        if (ag.status !== 'idle' && !ag._headingToCoffee) return false;
        const dx = ag.x - (bC.x + bC.w/2);
        const dy = ag.y - (bC.y + bC.h/2);
        return Math.sqrt(dx*dx + dy*dy) < 60; // Within 60px
      });

      if (atCoffee.length >= 2) {
        lastChatTime = Date.now();
        // Force them to idle and stop roaming temporarily
        atCoffee[0]._isRoaming = false;
        atCoffee[1]._isRoaming = false;
        atCoffee[0].status = 'chatting';
        atCoffee[1].status = 'chatting';
        
        bus.emit('agent.watercooler_chat', {
          agents: [atCoffee[0], atCoffee[1]]
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── ROAMING SCHEDULE ──────────────────────────────────────────────────────
  useEffect(() => {
    const MAX_ROAMING     = 1;
    const PROXIMITY_DIST  = 80;
    const PROXIMITY_LIMIT = 1;
    const roamTimers      = [];

    function pickRoamTarget(ag, W = 900, H = 540) {
      // 30% chance to go to the coffee machine if idle
      if (Math.random() < 0.3) {
        ag._headingToCoffee = true;
        const bC = getAffordanceBounds('coffee', W, H, layoutConfigRef.current);
        return { x: bC.x + bC.w/2 + (Math.random()*20-10), y: bC.y + bC.h + 10 + (Math.random()*10) };
      }
      
      ag._headingToCoffee = false;
      const zone = ag.targetZone || ag.zone || 'workspace';
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = randomInZone(zone, W, H, ag);
        const nearby = (stateRef.current.agents || []).filter(other => {
          if (String(other.id) === String(ag.id)) return false;
          const dx = other.x - candidate.x, dy = other.y - candidate.y;
          return Math.sqrt(dx*dx + dy*dy) < PROXIMITY_DIST;
        }).length;
        if (nearby < PROXIMITY_LIMIT) return candidate;
      }
      return randomInZone(ag.zone || 'workspace', W, H, ag);
    }

    function scheduleRoam(ag, delay) {
      const t = setTimeout(() => {
        const state   = stateRef.current;
        const agId    = String(ag.id || ag.name);
        const activeAg = (state.agents || []).find(a => String(a.id || a.name) === agId);
        if (!activeAg) return;
        const roaming = (state.agents || []).filter(a => a._isRoaming).length;
        if (!state.meeting && activeAg.status === 'idle' && roaming < MAX_ROAMING) {
          activeAg._isRoaming = true;
          const cv     = canvasRef.current;
          const target = pickRoamTarget(activeAg, cv ? cv.width : 900, cv ? cv.height : 540);
          activeAg.tx  = target.x;
          activeAg.ty  = target.y;
          const ret = setTimeout(() => {
            const curr = (stateRef.current.agents || []).find(a => String(a.id || a.name) === agId);
            if (!curr) return;
            curr._isRoaming = false;
            if (curr.homeX && !stateRef.current.meeting) { curr.tx = curr.homeX; curr.ty = curr.homeY; }
            scheduleRoam(curr, 20000 + Math.random() * 15000); // wapas baithne ke baad 20-35 sec
          }, 3000 + Math.random() * 2000);
          roamTimers.push(ret);
        } else {
          scheduleRoam(activeAg, 20000 + Math.random() * 15000);
        }
      }, delay);
      roamTimers.push(t);
    }

    (stateRef.current.agents || []).forEach((ag, i) => {
      scheduleRoam(ag, i * 15000 + 60000 + Math.random() * 30000); // 60-90 sec pehle roam
    });

    return () => roamTimers.forEach(clearTimeout);
  }, [agentsKey]);

  // ── MEETING ANIMATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const state = stateRef.current;
    state.meeting = onMeeting;

    // Redraw static bg so meeting room glow toggles
    bgReadyRef.current = false;
    const bgCtxM = bgCanvasRef.current?.getContext('2d');
    if (bgCtxM) {
      const canvasM = canvasRef.current;
      const geoM = drawStaticBackground(bgCtxM, canvasM.width, canvasM.height,
        layoutConfigRef.current, onMeeting);
      stateRef.current.geo = geoM;
      bgReadyRef.current = true;
    }

    if (onMeeting) {
      setTimeout(() => {
        if (!stateRef.current.meeting) return;
        const ceo    = stateRef.current.ceo;
        if (!ceo) return;
        const canvas = canvasRef.current;
        const W = canvas ? canvas.width  : 900;
        const H = canvas ? canvas.height : 540;
        const bMeet  = getRoomBounds('MEETING_ROOM', W, H, layoutConfigRef.current);
        const tcx    = bMeet.x + bMeet.w / 2;
        const tcy    = bMeet.y + bMeet.h * 0.58;
        const trx    = bMeet.w * 0.35;
        const try_   = bMeet.h * 0.2;
        ceo._lastTx  = null; ceo._lastTy = null; ceo._path = [];
        ceo.tx       = Math.floor(tcx + trx * 1.1);
        ceo.ty       = Math.floor(tcy - try_ * 0.5);
        ceo._moving  = true;
      }, 50);

      const spots = state._meetingSpots || [];
      for (const occ of Object.values(_roomOccupancy)) occ.clear();

      const allForMeeting = [...(state.agents || []), ...(state.queuedAgents || [])];
      state.agents       = allForMeeting;
      state.queuedAgents = [];

      allForMeeting.forEach((ag, i) => {
        ag._overCapacity = false;
        ag._isRoaming    = false;
        ag._lastTx       = null;
        ag._lastTy       = null;
        ag._path         = [];
        if (ag._meetingTimeout) clearTimeout(ag._meetingTimeout);

        ag._meetingTimeout = setTimeout(() => {
          if (!stateRef.current.meeting) return;
          const agId = String(ag.id || ag.name);
          const activeAg = stateRef.current.agents.find(a => String(a.id || a.name) === agId)
                        || (stateRef.current.queuedAgents || []).find(a => String(a.id || a.name) === agId);
          if (!activeAg) return;

          if (i < spots.length) {
            activeAg.tx = spots[i].tx;
            activeAg.ty = spots[i].ty;
          } else {
            const cv      = canvasRef.current;
            const fW      = cv ? cv.width  : 900;
            const fH      = cv ? cv.height : 540;
            const mBounds = getRoomBounds('MEETING_ROOM', fW, fH, layoutConfigRef.current);
            activeAg.tx   = mBounds.x + 20 + ((i - spots.length) % 3) * 40;
            activeAg.ty   = mBounds.y + mBounds.h - 30;
          }
          activeAg._inMeeting = true;
          _roomOccupancy['MEETING_ROOM'].add(String(activeAg.id || activeAg.name));
        }, i * 500 + 200);
      });

    } else {
      const allAgents    = [...(state.agents || []), ...(state.queuedAgents || [])];
      state.agents       = allAgents;
      state.queuedAgents = [];

      const canvas = canvasRef.current;
      const W = canvas ? canvas.width  : 900;
      const H = canvas ? canvas.height : 540;

      allAgents.forEach((ag) => {
        if (ag._meetingTimeout) clearTimeout(ag._meetingTimeout);
        ag._inMeeting  = false;
        ag._queueIndex = undefined;
        _roomOccupancy['MEETING_ROOM'].delete(String(ag.id || ag.name));
        if (ag.homeX) {
          ag.tx = ag.homeX;
          ag.ty = ag.homeY;
          ag._lastTx = null;
          ag._lastTy = null;
          ag._path = [];
          ag._inMeeting = false;
          _registerOccupancy(ag, ag.homeX, ag.homeY, W, H, layoutConfigRef.current);
        } else {
          const idx = allAgents.indexOf(ag);
          const fallX = 190 + (idx % 3) * 150;
          const fallY = 150 + Math.floor(idx / 3) * 160;
          ag.tx = fallX; ag.ty = fallY;
          _registerOccupancy(ag, fallX, fallY, W, H, layoutConfigRef.current);
        }
      });

      if (state.ceo) {
        const ceoHome     = getCeoHome(W, H, layoutConfigRef.current);
        state.ceo.tx      = state.ceo.homeX || ceoHome.x;
        state.ceo.ty      = state.ceo.homeY || ceoHome.y;
        state.ceo._moving = true;
      }
    }

    return () => {
      state.agents.forEach(ag => { if (ag._meetingTimeout) clearTimeout(ag._meetingTimeout); });
    };
  }, [onMeeting]);

  // ── AGENT UPDATES ─────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const W = canvas ? canvas.width  : 900;
    const H = canvas ? canvas.height : 540;

    const existingMap = {};
    (stateRef.current.agents || []).forEach(ag => { existingMap[String(ag.id || ag.name)] = { ...ag }; });

    const zoneCounts = {};
    const newQueued  = [];

    const resolvedAgents = agents.map((ag, i) => {
      const agName  = ag.name || ag.role || `Agent ${i+1}`;
      const agId    = String(ag.id || agName);
      const existing = existingMap[agId];
      const agZone = ag.zone || 'workspace';

      const roomKey = ZONE_TO_ROOM[agZone] || 'MAIN_OFFICE';
      const cap     = ROOM_REGISTRY[roomKey]?.maxCapacity
                   ?? rooms[agZone]?.maxCapacity
                   ?? 8;

      zoneCounts[agZone] = (zoneCounts[agZone] || 0) + 1;
      let overCapacity   = zoneCounts[agZone] > cap;

      // Seat reservation
      let deskId = existing?.deskId;
      const sId  = agId;
      if (!deskId || (existing && existing.zone !== agZone)) {
        if (deskId) delete _deskOwners[deskId];
        const possibleDesks = ROOM_REGISTRY[roomKey]?.desks || [];
        deskId = possibleDesks.find(did => !_deskOwners[did] || _deskOwners[did] === sId);
        if (deskId) _deskOwners[deskId] = sId;
      }

      let randomTx, randomTy;
      if (deskId && deskId !== 'ceo-desk' && stateRef.current.desks?.[deskId]) {
        const d   = stateRef.current.desks[deskId];
        randomTx  = d.x + 26;
        randomTy  = d.y + 28;  // desk ke andar baithe dikhein
      } else if (deskId === 'ceo-desk') {
        const ceo = getRoomBounds('CEO_CABIN', W, H, layoutConfigRef.current);
        randomTx = ceo.x + ceo.w + 20;
        randomTy = ceo.y + 65;
      } else {
        const spawn = getRoleSpawn(ag.role, W, H);
        randomTx    = spawn.x;
        randomTy    = spawn.y;
      }

      if (stateRef.current.meeting) overCapacity = false;

      let finalTx = randomTx, finalTy = randomTy, queueIndex;
      if (overCapacity) {
        const qIdx = zoneCounts[agZone] - cap - 1;
        const qp   = getQueuePos(qIdx, W, H, layoutConfigRef.current);
        finalTx    = qp.x; finalTy = qp.y; queueIndex = qIdx;
      }

      const currentStatus = ag.status || 'idle';
      const targetZone    = ag.targetZone;
      let statusTx = null, statusTy = null;

      if ((currentStatus === 'moving' || currentStatus === 'working') && targetZone) {
        if (currentStatus === 'moving') {
          const taskPos = randomInZone(targetZone, W, H, ag);
          statusTx = taskPos.x; statusTy = taskPos.y;
        } else if (currentStatus === 'working' && existing?._taskX != null) {
          statusTx = existing._taskX; statusTy = existing._taskY;
        } else {
          const taskPos = randomInZone(targetZone, W, H, ag);
          statusTx = taskPos.x; statusTy = taskPos.y;
        }
      } else if (currentStatus === 'idle' && existing &&
                 (existing.status === 'moving' || existing.status === 'working')) {
        statusTx = randomTx; statusTy = randomTy;
      }

      const newAg = {
        ...existing,
        name:      agName,
        status:    currentStatus,
        color:     existing ? existing.color : P.agentColors[i % P.agentColors.length],
        skin:      existing ? existing.skin  : P.skins[i % P.skins.length],
        shoe:      existing ? existing.shoe  : P.shoes[i % P.shoes.length],
        homeX:     randomTx, homeY: randomTy,
        phase:     existing ? existing.phase : i * 1.1,
        priority:  ag.priority || 'Medium',
        zone:      agZone,
        deskId,
        targetZone: targetZone || undefined,
        _taskX:    currentStatus === 'moving' ? statusTx : (existing?._taskX ?? null),
        _taskY:    currentStatus === 'moving' ? statusTy : (existing?._taskY ?? null),
        _queueIndex:  overCapacity ? queueIndex : undefined,
        _overCapacity: overCapacity,
      };

      if (statusTx != null && !stateRef.current.meeting) {
        if (canMove(newAg, { x:statusTx, y:statusTy }, W, H)) {
          newAg.tx = statusTx; newAg.ty = statusTy;
          _registerOccupancy(newAg, statusTx, statusTy, W, H, layoutConfigRef.current);
        }
      }

      if (!existing) {
        if (ag.isNew) {
          // New agent: Spawn at RECEPTION door and walk in
          const reception = getRoomBounds('RECEPTION', W, H, layoutConfigRef.current);
          const spawnX = reception.x ? reception.x + 40 : W / 2;
          const spawnY = H - 30;
          newAg.x = spawnX; newAg.y = spawnY; newAg.tx = spawnX; newAg.ty = spawnY;
          
          setTimeout(() => {
            const latest = stateRef.current;
            const curr   = latest.agents.find(a => String(a.id || a.name) === agId)
                        || (latest.queuedAgents || []).find(a => String(a.id || a.name) === agId);
            if (!curr) return;
            if (latest.meeting) {
              const spot = (latest._meetingSpots || [])[i % 6];
              if (spot) {
                curr.tx = spot.tx; curr.ty = spot.ty;
                _registerOccupancy(curr, spot.tx, spot.ty, W, H, layoutConfigRef.current);
              }
            } else {
              curr.tx = finalTx; curr.ty = finalTy;
              _registerOccupancy(curr, finalTx, finalTy, W, H, layoutConfigRef.current);
            }
          }, 100);
        } else {
          // Loaded agent: Spawn directly at their desk
          newAg.x = finalTx; newAg.y = finalTy; newAg.tx = finalTx; newAg.ty = finalTy;
          _registerOccupancy(newAg, finalTx, finalTy, W, H, layoutConfigRef.current);
        }
      } else {
        if (stateRef.current.meeting && existing._inMeeting) {
          newAg.tx = existing.tx; newAg.ty = existing.ty; newAg._inMeeting = true;
        } else if (overCapacity && !stateRef.current.meeting) {
          newAg.tx = finalTx; newAg.ty = finalTy;
        } else if (!overCapacity) {
          _registerOccupancy(newAg, newAg.homeX, newAg.homeY, W, H, layoutConfigRef.current);
        }
      }

      if (overCapacity) newQueued.push(newAg);
      return newAg;
    });

    if (stateRef.current.meeting) {
      stateRef.current.agents = resolvedAgents.map(ag => {
        const ex = stateRef.current.agents.find(a => String(a.id || a.name) === String(ag.id || ag.name));
        return (ex?._inMeeting) ? { ...ag, tx:ex.tx, ty:ex.ty, _inMeeting:true } : ag;
      });
      stateRef.current.queuedAgents = [];
    } else {
      stateRef.current.agents       = resolvedAgents.filter(a => !a._overCapacity);
      stateRef.current.queuedAgents = newQueued;
    }

    // Set whiteboard flag depending on team activity
    stateRef.current.affordances.whiteboardUsed = stateRef.current.agents.some(a => a.status === 'working');

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentsKey]);

  // ── SERVER BREAK EVENT ─────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // Small chance to break the server to avoid it happening too much, but frequent enough to notice
      if (Math.random() < 0.4) {
        stateRef.current.affordances.serverBroken = true;
        // Broadcast event or find an IT agent
        const allAgs = stateRef.current.agents || [];
        const dev = allAgs.find(a => (a.role||'').toLowerCase().includes('dev')) || allAgs[0];
        if (dev) {
          const cv = canvasRef.current;
          const bS = getAffordanceBounds('server', cv?.width || 900, cv?.height || 540, layoutConfigRef.current);
          dev.tx = bS.x - 20;
          dev.ty = bS.y + bS.h / 2;
          
          setTimeout(() => {
            if (stateRef.current.affordances.serverBroken) {
              stateRef.current.affordances.serverBroken = false;
              if (dev.homeX && !stateRef.current.meeting) { dev.tx = dev.homeX; dev.ty = dev.homeY; }
            }
          }, 8000);
        }
      }
    }, 45000); // Check every 45s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-full text-left" style={{ cursor: isEditMode ? 'default' : 'pointer' }}>
      <canvas ref={canvasRef} width={900} height={540} style={{
        width:'100%', height:'100%', imageRendering:'pixelated',
        display:'block', borderRadius:6, border:'3px solid #1f2937',
        boxShadow:'0 0 40px rgba(0,0,0,0.7)',
      }} />

      {/* OVERLAYS */}
      {overlay === 'whiteboard' && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-slate-800 border-2 border-slate-600 rounded-lg p-5 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[400px] z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><span className="text-2xl">📝</span> Whiteboard Strategy</h3>
            <button onClick={() => setOverlay(null)} className="text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded p-4 min-h-[120px] max-h-[250px] overflow-y-auto text-slate-300 font-mono text-sm shadow-inner">
             {agents.some(a => a.status === 'working') ? (
               <ul className="list-disc pl-4 space-y-2">
                 {agents.filter(a => a.status === 'working').map((ag, i) => (
                   <li key={i}><span className="text-blue-400">{ag.name}</span>: {ag.task || 'Working on current sprint'}</li>
                 ))}
               </ul>
             ) : (
               <div className="text-slate-500 italic flex items-center justify-center h-full">The whiteboard is currently empty.</div>
             )}
          </div>
        </div>
      )}
    </div>
  );
}
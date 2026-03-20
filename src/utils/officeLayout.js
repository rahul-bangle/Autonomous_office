import { ROOMS } from '../constants';

// ─── ROOM REGISTRY ────────────────────────────────────────────────────────────
export const ROOM_REGISTRY = {
  CEO_CABIN:       { label:'CEO Cabin',             x:10,   y:null, width:160,  height:170, maxCapacity:2, zone:'ceoCabin',    desks:['ceo-desk'],                                        allowedPriorities:['Critical','High','Medium','Low'] },
  MAIN_OFFICE:     { label:'Main Office',           x:175,  y:22,   width:null, height:null,maxCapacity:8, zone:'workspace',   desks:['desk-1','desk-2','desk-3','desk-4','desk-5','desk-6'], allowedPriorities:['Critical','High','Medium','Low'] },
  LIBRARY_SECTION: { label:'Library Section',       x:30,   y:22,   width:140,  height:70,  maxCapacity:2, zone:'library',     desks:[],                                                  allowedPriorities:['Critical','High','Medium','Low'] },
  MEETING_ROOM:    { label:'Meeting Room',          x:null, y:null, width:null, height:null,maxCapacity:6, zone:'meetingRoom', desks:[],                                                  allowedPriorities:['Critical','High','Medium','Low'] },
  RECEPTION:       { label:'Reception / Break Room',x:null, y:0,    width:null, height:null,maxCapacity:4, zone:'breakroom',   desks:['reception-desk'],                                  allowedPriorities:['Critical','High','Medium','Low'] },
};

// ─── DESK / PLANT / FURNITURE REGISTRIES ─────────────────────────────────────
export const DESK_REGISTRY = {
  'desk-1':        { x:185, y:80,  label:'Desk 1'    },
  'desk-2':        { x:185, y:210, label:'Desk 2'    },
  'desk-3':        { x:185, y:340, label:'Desk 3'    },
  'desk-4':        { x:425, y:80,  label:'Desk 4'    },
  'desk-5':        { x:425, y:210, label:'Desk 5'    },
  'desk-6':        { x:425, y:340, label:'Desk 6'    },
  'ceo-desk':      { x:25,  y:472, label:'CEO Desk'  },
  'reception-desk':{ x:535, y:85,  label:'Reception' },
};
export const PLANT_REGISTRY     = { 'plant-1':     { x:185, y:122               } };
export const FURNITURE_REGISTRY = { 'bookshelf-1': { x:40,  y:26, w:120, h:54  } };

// ─── ZONE MAPPING ─────────────────────────────────────────────────────────────
export const ZONE_TO_ROOM = {
  ceoCabin:'CEO_CABIN', workspace:'MAIN_OFFICE', library:'LIBRARY_SECTION',
  meetingRoom:'MEETING_ROOM', breakroom:'RECEPTION',
};

// ─── ROOM BOUNDS (runtime-resolved) ──────────────────────────────────────────
export function getRoomBounds(roomKey, W, H, layoutConfig = null) {
  if (layoutConfig && layoutConfig[roomKey]) return layoutConfig[roomKey];
  const sX = Math.floor(W * 0.58);
  const sY = Math.floor(H * 0.44);
  switch (roomKey) {
    case 'CEO_CABIN':        return { x:10,  y:H-185, w:160,      h:170     };
    case 'MAIN_OFFICE':      return { x:175, y:22,    w:sX-175,   h:H-22   };
    case 'LIBRARY_SECTION':  return { x:30,  y:22,    w:140,      h:70     };
    case 'MEETING_ROOM':     return { x:sX,  y:sY,    w:W-sX,     h:H-sY  };
    case 'RECEPTION':        return { x:sX,  y:0,     w:W-sX,     h:sY    };
    default:                 return { x:0,   y:0,     w:W,        h:H     };
  }
}

// [FIX-H3] Dynamic CEO home — no more hardcoded pixels, recalculates on resize
export function getCeoHome(W, H, config = null) {
  const b = getRoomBounds('CEO_CABIN', W, H, config);
  return { x: Math.floor(b.x + b.w * 0.5), y: Math.floor(b.y + b.h * 0.6) };
}

// ─── ZONE UTILS ───────────────────────────────────────────────────────────────
export function getZoneBounds(zone, W, H, config = null) {
  const b = getRoomBounds(ZONE_TO_ROOM[zone] || 'MAIN_OFFICE', W, H, config);
  return { minX:b.x+5, maxX:b.x+b.w-30, minY:b.y+10, maxY:b.y+b.h-30 };
}

export function getAffordanceBounds(type, W, H, config = null) {
  const bMeet = getRoomBounds('MEETING_ROOM', W, H, config);
  const bRecep = getRoomBounds('RECEPTION', W, H, config);
  const bWork = getRoomBounds('MAIN_OFFICE', W, H, config);
  
  if (type === 'coffee') return { x: bRecep.x + bRecep.w - 50, y: bRecep.y + 16, w: 24, h: 32 };
  if (type === 'whiteboard') return { x: bMeet.x + bMeet.w / 2 - 40, y: bMeet.y + 12, w: 80, h: 36 };
  if (type === 'server') return { x: bWork.x + bWork.w - 42, y: bWork.y + 16, w: 32, h: 64 };
  return { x: 0, y: 0, w: 0, h: 0 };
}

export function randomInZone(zone, W, H, agent = {}, config = null) {
  const b = getZoneBounds(zone, W, H, config);
  let x, y, tries = 0;
  do {
    x = b.minX + Math.random() * (b.maxX - b.minX);
    y = b.minY + Math.random() * (b.maxY - b.minY);
    tries++;
  } while (tries < 10);
  return { x:Math.floor(x), y:Math.floor(y) };
}

export function getQueuePos(index, W, H, config = null) {
  const b = getRoomBounds('MEETING_ROOM', W, H, config);
  return { x:b.x-30, y:b.y+10+index*48 };
}

export function getMeetingSpots(tcx, tcy, trx, try_) {
  // Rectangular table — chairs along top, bottom, left, right
  // trx = half-width of table, try_ = half-height of table
  const tw = trx * 2, th = try_ * 2;
  const x = tcx - trx, y = tcy - try_;
  const laptopCount = Math.max(2, Math.floor(tw / 36));
  const chairSpacing = tw / (laptopCount + 1);

  const spots = [];
  // Top row chairs (facing down → agent sits above table)
  for (let i = 0; i < laptopCount && spots.length < 10; i++) {
    spots.push({ tx: Math.floor(x + chairSpacing * (i + 1)), ty: Math.floor(y - 16) });
  }
  // Bottom row chairs (facing up → agent sits below table)
  for (let i = 0; i < laptopCount && spots.length < 10; i++) {
    spots.push({ tx: Math.floor(x + chairSpacing * (i + 1)), ty: Math.floor(y + th + 14) });
  }
  // Left chair
  if (spots.length < 10) spots.push({ tx: Math.floor(x - 16), ty: Math.floor(tcy) });
  // Right chair
  if (spots.length < 10) spots.push({ tx: Math.floor(x + tw + 14), ty: Math.floor(tcy) });

  return spots;
}

export function getRoleSpawn(role, W, H) {
  const base = getRoomBounds('MAIN_OFFICE', W, H);
  return {
    x: base.x + 40 + Math.random() * (base.w - 80),
    y: base.y + 40 + Math.random() * (base.h - 80),
  };
}

// Re-export ROOMS for convenience
export { ROOMS };

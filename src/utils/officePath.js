import { ROOM_REGISTRY, getRoomBounds } from './officeLayout';

// ─── A* PATHFINDING ───────────────────────────────────────────────────────────
export const GRID_SIZE = 25;

export function generateGrid(W, H, config) {
  const cols = Math.ceil(W / GRID_SIZE);
  const rows = Math.ceil(H / GRID_SIZE);
  const grid = Array(rows).fill().map(() => Array(cols).fill(0));

  const splitX = getRoomBounds('MEETING_ROOM', W, H, config).x;
  const splitY = getRoomBounds('MEETING_ROOM', W, H, config).y;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const gx = c * GRID_SIZE + GRID_SIZE/2;
      const gy = r * GRID_SIZE + GRID_SIZE/2;
      let blocked = false;
      let insideAny = false;

      for (const rk of Object.keys(ROOM_REGISTRY)) {
        const b = getRoomBounds(rk, W, H, config);
        if (gx >= b.x && gx <= b.x + b.w && gy >= b.y && gy <= b.y + b.h) {
          insideAny = true;
          if (gy < b.y + 24) blocked = true;
        }
      }

      if (!insideAny) blocked = true;

      // Full CEO cabin block
      const ceoBounds = getRoomBounds('CEO_CABIN', W, H, config);
      if (gx >= ceoBounds.x && gx <= ceoBounds.x + ceoBounds.w &&
          gy >= ceoBounds.y && gy <= ceoBounds.y + ceoBounds.h) {
        blocked = true;
      }
      // CEO cabin door hole — right wall exit
      if (gx >= ceoBounds.x + ceoBounds.w - 30 && gx <= ceoBounds.x + ceoBounds.w + 30 &&
          gy >= ceoBounds.y + 40 && gy <= ceoBounds.y + 100) {
        blocked = false;
      }

      // Vertical divider at splitX
      if (Math.abs(gx - splitX) < 15) {
        blocked = true;
        // Widen doors significantly so agents don't clip the edges
        if (gy >= 40 && gy <= 128) blocked = false;                    // Door 1 (Main Office)
        if (gy >= splitY + 20 && gy <= splitY + 112) blocked = false;  // Door 2 (Meeting Room)
      }

      // Horizontal divider at splitY (Main Office / Meeting Room boundary)
      if (Math.abs(gy - splitY) < 15 && gx >= splitX) {
        blocked = true;
        // The top door for the Meeting Room is between splitX + 20 and splitX + 120
        if (gx >= splitX + 20 && gx <= splitX + 120) blocked = false;
      }

      if (blocked) grid[r][c] = 1;
    }
  }
  return grid;
}

export function findAStarPath(start, end, grid) {
  const rows = grid.length;
  const cols = grid[0].length;
  const startNode = { x: Math.floor(start.x/GRID_SIZE), y: Math.floor(start.y/GRID_SIZE) };
  const endNode   = { x: Math.floor(end.x/GRID_SIZE),   y: Math.floor(end.y/GRID_SIZE)   };

  if (startNode.x < 0 || startNode.x >= cols || startNode.y < 0 || startNode.y >= rows) return [];
  if (endNode.x < 0 || endNode.x >= cols || endNode.y < 0 || endNode.y >= rows) return [];
  if (grid[endNode.y]?.[endNode.x] === 1) {
    endNode.x -= 1;
    if (endNode.x < 0 || grid[endNode.y]?.[endNode.x] === 1) return [];
  }

  const openSet = [startNode];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  const key = (n) => `${n.x},${n.y}`;

  gScore.set(key(startNode), 0);
  fScore.set(key(startNode), Math.abs(startNode.x - endNode.x) + Math.abs(startNode.y - endNode.y));

  while (openSet.length > 0) {
    let current = openSet.reduce((a, b) => (fScore.get(key(a))||Infinity) < (fScore.get(key(b))||Infinity) ? a : b);
    if (current.x === endNode.x && current.y === endNode.y) {
      const path = [];
      while (current) {
        path.push({ x: current.x * GRID_SIZE + GRID_SIZE/2, y: current.y * GRID_SIZE + GRID_SIZE/2 });
        current = cameFrom.get(key(current));
      }
      return path.reverse();
    }

    openSet.splice(openSet.indexOf(current), 1);
    const neighbors = [
      {x:current.x+1,y:current.y},{x:current.x-1,y:current.y},
      {x:current.x,y:current.y+1},{x:current.x,y:current.y-1}
    ];

    for (const neighbor of neighbors) {
      if (neighbor.x < 0 || neighbor.x >= cols || neighbor.y < 0 || neighbor.y >= rows) continue;
      if (grid[neighbor.y][neighbor.x] === 1) continue;
      const tentativeG = (gScore.get(key(current))||0) + 1;
      if (tentativeG < (gScore.get(key(neighbor)) ?? Infinity)) {
        cameFrom.set(key(neighbor), current);
        gScore.set(key(neighbor), tentativeG);
        fScore.set(key(neighbor), tentativeG + Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.y - endNode.y));
        if (!openSet.find(n => n.x === neighbor.x && n.y === neighbor.y)) openSet.push(neighbor);
      }
    }
  }
  return [];
}

// ─── ROOM OCCUPANCY (module-level singleton — reset on mount) ─────────────────
export const _roomOccupancy = {};
for (const k of Object.keys(ROOM_REGISTRY)) _roomOccupancy[k] = new Set();

// ─── CONSTRAINTS ENGINE ───────────────────────────────────────────────────────
export function canMove(agent, targetPosition, W = 900, H = 540) {
  // [FIX-#15] Actually check if position is within any valid room bounds
  for (const roomKey of Object.keys(ROOM_REGISTRY)) {
    if (roomKey === 'CEO_CABIN') continue; // agents cannot target CEO cabin
    const b = getRoomBounds(roomKey, W, H);
    if (targetPosition.x >= b.x && targetPosition.x <= b.x + b.w &&
        targetPosition.y >= b.y && targetPosition.y <= b.y + b.h) {
      return true;
    }
  }
  return false;
}

export function canEnterRoom(agent, roomName, W = 900, H = 540) {
  const def = ROOM_REGISTRY[roomName];
  if (!def) return { allowed:false, reason:`Unknown room: ${roomName}` };
  const agentPriority = agent.priority || 'Medium';
  if (!def.allowedPriorities.includes(agentPriority))
    return { allowed:false, reason:`Priority ${agentPriority} not allowed in ${def.label}` };
  const occ = _roomOccupancy[roomName];
  const agentId = String(agent.id || agent.name);
  if (occ.has(agentId) || occ.size < def.maxCapacity)
    return { allowed:true, reason:'ok' };
  return { allowed:false, reason:`${def.label} at capacity (${occ.size}/${def.maxCapacity})` };
}

// [FIX-M1] Desk owners — module level (reset inside component on mount)
export const _deskOwners = {};

export function canSit(agent, deskId) {
  const agentId = String(agent.id || agent.name);
  const owner = _deskOwners[deskId];
  if (!owner || owner === agentId) {
    _deskOwners[deskId] = agentId;
    return { allowed:true, reason:'ok' };
  }
  return { allowed:false, reason:`Desk ${deskId} already claimed by ${owner}` };
}

// [FIX-H5] All _registerOccupancy callers MUST pass W, H, config
export function _registerOccupancy(agent, tx, ty, W = 900, H = 540, config = null) {
  const agentId = String(agent.id || agent.name);
  for (const occ of Object.values(_roomOccupancy)) occ.delete(agentId);
  for (const [roomKey] of Object.entries(ROOM_REGISTRY)) {
    const b = getRoomBounds(roomKey, W, H, config);
    if (tx >= b.x && tx <= b.x + b.w && ty >= b.y && ty <= b.y + b.h) {
      _roomOccupancy[roomKey].add(agentId);
      break;
    }
  }
}

// ─── COLLISION PREVENTION ────────────────────────────────────────────────────
export const COLLISION_MIN = 40;

// [FIX-H1] Push x/y (visual position) NOT tx/ty (target).
export function resolveCollisions(agents, isMeeting = false) {
  if (isMeeting) return;
  const n = agents.length;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const a = agents[i], b = agents[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < COLLISION_MIN && dist > 0) {
        const overlap = (COLLISION_MIN - dist) / 2;
        const nx = dx / dist;
        const ny = dy / dist;
        // Push visual position only — target (tx,ty) stays untouched
        a.x -= nx * overlap * 0.5;
        a.y -= ny * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.y += ny * overlap * 0.5;
      }
    }
  }
}

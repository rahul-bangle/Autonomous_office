import { useEffect, useRef } from 'react';
import { ROOMS } from '../constants';
import bus from '../EventBus';

// ─── PALETTE ──────────────────────────────────────────────────────────────────
const P = {
  wsFloor:'#c8975a', wsFloorAlt:'#bf8e52',
  brFloor:'#e8d5a8', brFloorAlt:'#dfc89a',
  mrFloor:'#1e2d42', mrFloorAlt:'#1a2839',
  wallTop:'#8b7355', wallSide:'#6b5840', wallDark:'#4a3d2a', divider:'#0d1117',
  deskTop:'#a0693a', deskFront:'#7a4f2a',
  monBody:'#1e293b', monScreen:'#22d3ee',
  kbd:'#cbd5e1', mug:'#f8fafc',
  shelfWood:'#7c4f1e', shelfDark:'#4a2f0e', shelfBoard:'#3d2008',
  books:['#ef4444','#3b82f6','#22c55e','#f59e0b','#8b5cf6','#ec4899','#06b6d4','#f97316','#a3e635','#e879f9'],
  chairSeat:'#2563eb', chairBack:'#1d4ed8', chairLeg:'#374151',
  mtOuter:'#3d2008', mtTop:'#7c5028', mtEdge:'#9b6a38',
  couchBody:'#4b5563', couchBack:'#1f2937', couchCush:'#6b7280',
  coffeeMach:'#111827', coffeeLed:'#a855f7',
  cooler:'#e2e8f0', coolerTank:'#38bdf8',
  pot:'#c87941', potDark:'#8b5e2e',
  leaf1:'#22c55e', leaf2:'#16a34a', leaf3:'#15803d',
  skins:['#e8b896','#c68642','#f1c27d','#8d5524','#e0ac69','#ffdbac'],
  shoes:['#2d1a0e','#1a1a2e','#3b1f0a','#0a1628','#2a1500','#1c1c1c'],
  agentColors:['#ff6b6b','#4ecdc4','#ffe66d','#a78bfa','#fb923c','#34d399'],
  outline:'#111111',
  projScreen:'#e8edf2',
};

// ─── DRAW HELPERS ─────────────────────────────────────────────────────────────
function px(ctx,x,y,w,h,color){ctx.fillStyle=color;ctx.fillRect(Math.floor(x),Math.floor(y),Math.floor(w),Math.floor(h));}

function drawFloor(ctx,x,y,w,h,c1,c2,ts=20){
  for(let ty=0;ty<h;ty+=ts)for(let tx=0;tx<w;tx+=ts){
    ctx.fillStyle=((Math.floor(tx/ts)+Math.floor(ty/ts))%2)?c2:c1;
    ctx.fillRect(x+tx,y+ty,Math.min(ts,w-tx),Math.min(ts,h-ty));
  }
}

function drawWallStrip(ctx,x,y,w,h){
  px(ctx,x,y,w,h*0.6,P.wallTop);
  px(ctx,x,y+h*0.6,w,h*0.4,P.wallSide);
  px(ctx,x,y+h-3,w,3,P.wallDark);
}

function drawBookshelf(ctx,x,y,w,h){
  px(ctx,x,y,w,h,P.shelfDark);
  const rowH=Math.floor((h-4)/3);
  for(let r=0;r<3;r++){
    const ry=y+2+r*rowH;
    px(ctx,x,ry+rowH-3,w,3,P.shelfBoard);
    let bx=x+2;
    [6,8,5,7,6,5,8,6,5,7].forEach((bw,i)=>{
      if(bx+bw>x+w-2)return;
      const bh=rowH-6;
      px(ctx,bx,ry+2,bw,bh,P.books[(r*4+i)%P.books.length]);
      px(ctx,bx,ry+2,1,bh,'rgba(255,255,255,0.3)');
      bx+=bw+2;
    });
  }
  ctx.strokeStyle=P.shelfWood;ctx.lineWidth=3;
  ctx.strokeRect(x+1,y+1,w-2,h-2);
}

function drawDesk(ctx,x,y,w=72,h=44){
  px(ctx,x+4,y+4,w,h,'rgba(0,0,0,0.3)');
  px(ctx,x,y,w,h,P.deskTop);
  px(ctx,x,y+h-8,w,8,P.deskFront);
  px(ctx,x+2,y+2,w-4,3,'rgba(255,220,140,0.25)');
  px(ctx,x,y,w,1,P.outline);px(ctx,x,y,1,h,P.outline);
  px(ctx,x+w-1,y,1,h,P.outline);px(ctx,x,y+h-1,w,1,P.outline);
  const mx=x+w/2-16,my=y+4;
  px(ctx,mx,my,32,22,P.monBody);
  px(ctx,mx+2,my+2,28,16,P.monScreen);
  for(let sl=0;sl<16;sl+=3)px(ctx,mx+2,my+2+sl,28,1,'rgba(0,0,0,0.15)');
  px(ctx,mx+2,my+2,28,4,'rgba(255,255,255,0.2)');
  px(ctx,mx+14,my+22,4,5,'#374151');px(ctx,mx+10,my+26,12,3,'#374151');
  px(ctx,mx,my+28,32,8,P.kbd);px(ctx,mx+1,my+29,30,6,'#e2e8f0');
  for(let kr=0;kr<3;kr++)for(let kc=0;kc<8;kc++)px(ctx,mx+2+kc*4,my+29+kr*2,3,1,'#94a3b8');
  px(ctx,x+6,y+8,10,10,P.mug);px(ctx,x+7,y+9,8,8,'#f0f0f0');
  px(ctx,x+16,y+11,3,5,P.mug);
}

function drawChair(ctx,x,y,facing='down'){
  const W=20,H=20;
  px(ctx,x+2,y+2,W,H,'rgba(0,0,0,0.2)');
  if(facing==='down'){px(ctx,x,y+6,W,H-6,P.chairSeat);px(ctx,x,y,W,8,P.chairBack);px(ctx,x+2,y+1,W-4,4,'#3b82f6');px(ctx,x+2,y+H-3,4,3,P.chairLeg);px(ctx,x+W-6,y+H-3,4,3,P.chairLeg);}
  else if(facing==='up'){px(ctx,x,y,W,H-6,P.chairSeat);px(ctx,x,y+H-8,W,8,P.chairBack);px(ctx,x+2,y+H-7,W-4,4,'#3b82f6');px(ctx,x+2,y+2,4,3,P.chairLeg);px(ctx,x+W-6,y+2,4,3,P.chairLeg);}
  else if(facing==='right'){px(ctx,x,y,W-6,H,P.chairSeat);px(ctx,x+W-8,y,8,H,P.chairBack);px(ctx,x+W-7,y+2,4,H-4,'#3b82f6');px(ctx,x+2,y+2,3,4,P.chairLeg);px(ctx,x+2,y+H-6,3,4,P.chairLeg);}
  else if(facing==='left'){px(ctx,x+6,y,W-6,H,P.chairSeat);px(ctx,x,y,8,H,P.chairBack);px(ctx,x+1,y+2,4,H-4,'#3b82f6');px(ctx,x+W-5,y+2,3,4,P.chairLeg);px(ctx,x+W-5,y+H-6,3,4,P.chairLeg);}
}

function drawPlant(ctx,x,y){
  px(ctx,x+4,y+18,14,12,P.pot);px(ctx,x+5,y+19,12,10,'#d4894a');px(ctx,x+3,y+17,16,3,P.potDark);
  [[4,4,14],[2,6,18],[0,10,22],[2,14,18],[4,16,14],[6,6,10],[4,8,14],[6,10,12],[8,6,10]].forEach(([lx,ly,lw])=>px(ctx,x+lx,y+ly,lw,3,P.leaf1));
  px(ctx,x+6,y+8,10,8,P.leaf2);px(ctx,x+8,y+10,6,4,P.leaf3);
  px(ctx,x+3,y+4,1,14,P.outline);px(ctx,x+18,y+4,1,14,P.outline);
}

// ─── CEO CABIN — [FIX-M3] accepts ceoName param, no more hardcoded 'RAHUL' ──
function drawCEOCabin(ctx,x,y,w,h,ceoName='CEO'){
  for(let ty=0;ty<h;ty+=18)for(let tx=0;tx<w;tx+=18){
    ctx.fillStyle=((Math.floor(tx/18)+Math.floor(ty/18))%2)?'#1a1a2e':'#16213e';
    ctx.fillRect(x+tx,y+ty,Math.min(18,w-tx),Math.min(18,h-ty));
  }
  ctx.strokeStyle='#d4af37';ctx.lineWidth=3;ctx.strokeRect(x+2,y+2,w-4,h-4);
  ctx.lineWidth=1;ctx.strokeStyle='#b8960c';ctx.strokeRect(x+5,y+5,w-10,h-10);
  ctx.fillStyle='#d4af37';ctx.font='bold 8px monospace';ctx.textAlign='center';
  ctx.fillText('C  E  O',x+w/2,y+16);
  const dx=x+10,dy=y+22;
  px(ctx,dx,dy,95,52,'#2d1810');px(ctx,dx+2,dy+2,91,48,'#3d2215');
  px(ctx,dx+2,dy+2,91,5,'#d4af37');
  px(ctx,dx,dy,95,1,'#d4af37');px(ctx,dx,dy,1,52,'#d4af37');px(ctx,dx+94,dy,1,52,'#d4af37');
  px(ctx,dx+70,dy+28,22,48,'#2d1810');px(ctx,dx+72,dy+30,18,44,'#3d2215');
  px(ctx,dx+70,dy+28,1,48,'#d4af37');px(ctx,dx+91,dy+28,1,48,'#d4af37');
  px(ctx,dx+6,dy+7,42,28,'#0d1117');px(ctx,dx+8,dy+9,38,22,'#00d4ff');
  for(let ci=0;ci<4;ci++){const ch=6+ci*3;px(ctx,dx+10+ci*8,dy+9+22-ch,6,ch,['#22c55e','#3b82f6','#f59e0b','#ef4444'][ci]);}
  px(ctx,dx+8,dy+9,38,3,'rgba(255,255,255,0.15)');
  px(ctx,dx+24,dy+35,10,4,'#d4af37');px(ctx,dx+20,dy+38,18,3,'#d4af37');
  px(ctx,dx+6,dy+42,42,8,'#1e293b');px(ctx,dx+7,dy+43,40,6,'#334155');
  px(ctx,dx+58,dy+8,14,16,'#d4af37');px(ctx,dx+59,dy+9,12,14,'#1a0a00');
  [0,3,6,9].forEach((pi,i)=>px(ctx,dx+60+pi,dy+9,2,12,['#ef4444','#3b82f6','#22c55e','#f59e0b'][i]));
  px(ctx,dx+74,dy+32,12,14,'#d4af37');px(ctx,dx+76,dy+34,8,8,'#b8960c');
  px(ctx,dx+75,dy+44,10,2,'#d4af37');px(ctx,dx+73,dy+46,14,3,'#d4af37');
  px(ctx,dx+8,dy+46,50,6,'#d4af37');px(ctx,dx+9,dy+47,48,4,'#1a0a00');
  ctx.fillStyle='#d4af37';ctx.font='bold 4px monospace';ctx.textAlign='center';
  // [FIX-M3] Dynamic CEO name on desk plate
  ctx.fillText(`${ceoName.toUpperCase()}  —  CEO`,dx+33,dy+51);
  const cx2=dx+22,cy2=dy+58;
  px(ctx,cx2,cy2,40,5,'#d4af37');
  px(ctx,cx2+2,cy2+5,36,16,'#1a1a2e');
  px(ctx,cx2+4,cy2+7,32,12,'#2d2d4e');
  px(ctx,cx2,cy2+21,40,14,'#1a1a2e');
  px(ctx,cx2+2,cy2+23,36,10,'#2d2d4e');
  px(ctx,cx2-5,cy2+5,6,22,'#d4af37');
  px(ctx,cx2+39,cy2+5,6,22,'#d4af37');
  [0,12,24,36].forEach(wi=>px(ctx,cx2+wi,cy2+35,8,4,'#374151'));
}

// ─── AGENT SPRITE ─────────────────────────────────────────────────────────────
function drawAgent(ctx,x,y,color,skin,shoe,bobOffset=0){
  const by=Math.floor(bobOffset);
  ctx.fillStyle='rgba(0,0,0,0.25)';ctx.beginPath();
  ctx.ellipse(x+11,y+37+by,9,3,0,0,Math.PI*2);ctx.fill();
  px(ctx,x+2,y+32+by,7,4,shoe);px(ctx,x+13,y+32+by,7,4,shoe);
  px(ctx,x+1,y+31+by,8,2,P.outline);px(ctx,x+12,y+31+by,8,2,P.outline);
  px(ctx,x+3,y+32+by,2,1,'rgba(255,255,255,0.4)');px(ctx,x+14,y+32+by,2,1,'rgba(255,255,255,0.4)');
  px(ctx,x+3,y+24+by,6,9,'#374151');px(ctx,x+13,y+24+by,6,9,'#374151');
  px(ctx,x+3,y+24+by,2,9,'#1f2937');px(ctx,x+17,y+24+by,2,9,'#1f2937');
  px(ctx,x+9,y+24+by,4,2,P.outline);
  px(ctx,x+1,y+13+by,20,12,color);
  px(ctx,x+1,y+13+by,2,12,'rgba(0,0,0,0.2)');px(ctx,x+19,y+13+by,2,12,'rgba(0,0,0,0.2)');
  px(ctx,x+8,y+22+by,6,3,'#f8fafc');px(ctx,x+1,y+23+by,20,2,'#1f2937');
  px(ctx,x-2,y+14+by,4,9,color);px(ctx,x+20,y+14+by,4,9,color);
  px(ctx,x-2,y+21+by,5,5,skin);px(ctx,x+19,y+21+by,5,5,skin);
  px(ctx,x+9,y+10+by,4,4,skin);
  px(ctx,x+1,y-2+by,20,13,skin);
  px(ctx,x,y-3+by,22,1,P.outline);px(ctx,x,y-3+by,1,15,P.outline);
  px(ctx,x+21,y-3+by,1,15,P.outline);px(ctx,x+1,y+11+by,20,1,P.outline);
  px(ctx,x+2,y+5+by,4,3,'rgba(255,150,150,0.5)');px(ctx,x+16,y+5+by,4,3,'rgba(255,150,150,0.5)');
  px(ctx,x+1,y-2+by,20,5,color);px(ctx,x,y+by,2,10,color);px(ctx,x+20,y+by,2,10,color);
  px(ctx,x+4,y-1+by,5,2,'rgba(255,255,255,0.3)');
  px(ctx,x+4,y+2+by,6,5,'#fff');px(ctx,x+12,y+2+by,6,5,'#fff');
  px(ctx,x+5,y+3+by,4,4,color==='#ffe66d'?'#1e6b3a':'#1a5cb5');
  px(ctx,x+13,y+3+by,4,4,color==='#ffe66d'?'#1e6b3a':'#1a5cb5');
  px(ctx,x+6,y+4+by,2,3,'#111');px(ctx,x+14,y+4+by,2,3,'#111');
  px(ctx,x+5,y+3+by,2,2,'#fff');px(ctx,x+13,y+3+by,2,2,'#fff');
  px(ctx,x+8,y+5+by,1,1,'#fff');px(ctx,x+16,y+5+by,1,1,'#fff');
  px(ctx,x+4,y+2+by,6,1,P.outline);px(ctx,x+12,y+2+by,6,1,P.outline);
  px(ctx,x+4,y+1+by,5,1,P.outline);px(ctx,x+12,y+1+by,5,1,P.outline);
  px(ctx,x+10,y+7+by,2,1,'rgba(180,100,60,0.6)');
  px(ctx,x+7,y+8+by,8,1,'#c0825a');px(ctx,x+6,y+9+by,2,1,'#c0825a');px(ctx,x+14,y+9+by,2,1,'#c0825a');
}

function drawBubble(ctx,x,y,emoji,name){
  ctx.fillStyle='rgba(10,10,20,0.85)';
  const nw=name.length*6+10;
  ctx.fillRect(x+11-nw/2,y+40,nw,13);
  ctx.fillStyle='#ffffff';ctx.font='bold 8px monospace';ctx.textAlign='center';
  ctx.fillText(name,x+11,y+50);
  ctx.fillStyle='rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.rect(x+2,y-20,20,16);
  ctx.fill();
  ctx.strokeStyle='#e5e7eb';ctx.lineWidth=1;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,0.95)';ctx.beginPath();
  ctx.moveTo(x+9,y-4);ctx.lineTo(x+13,y-4);ctx.lineTo(x+11,y-1);ctx.fill();
  ctx.font='9px serif';ctx.fillText(emoji,x+12,y-6);
}

// ─── A* PATHFINDING ───────────────────────────────────────────────────────────
const GRID_SIZE = 25;

function generateGrid(W, H, config) {
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

      // Full CEO cabin block — === was a float comparison bug, never matched
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

function findAStarPath(start, end, grid) {
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

// ─── ROOM REGISTRY ────────────────────────────────────────────────────────────
const ROOM_REGISTRY = {
  CEO_CABIN:       { label:'CEO Cabin',             x:10,   y:null, width:160,  height:170, maxCapacity:2, zone:'ceoCabin',    desks:['ceo-desk'],                                        allowedPriorities:['Critical','High','Medium','Low'] },
  MAIN_OFFICE:     { label:'Main Office',           x:175,  y:22,   width:null, height:null,maxCapacity:8, zone:'workspace',   desks:['desk-1','desk-2','desk-3','desk-4','desk-5','desk-6'], allowedPriorities:['Critical','High','Medium','Low'] },
  LIBRARY_SECTION: { label:'Library Section',       x:30,   y:22,   width:140,  height:70,  maxCapacity:2, zone:'library',     desks:[],                                                  allowedPriorities:['Critical','High','Medium','Low'] },
  MEETING_ROOM:    { label:'Meeting Room',          x:null, y:null, width:null, height:null,maxCapacity:6, zone:'meetingRoom', desks:[],                                                  allowedPriorities:['Critical','High','Medium','Low'] },
  RECEPTION:       { label:'Reception / Break Room',x:null, y:0,    width:null, height:null,maxCapacity:4, zone:'breakroom',   desks:['reception-desk'],                                  allowedPriorities:['Critical','High','Medium','Low'] },
};

// ─── DESK / PLANT / FURNITURE REGISTRIES ─────────────────────────────────────
const DESK_REGISTRY = {
  'desk-1':        { x:185, y:80,  label:'Desk 1'    },
  'desk-2':        { x:185, y:210, label:'Desk 2'    },
  'desk-3':        { x:185, y:340, label:'Desk 3'    },
  'desk-4':        { x:425, y:80,  label:'Desk 4'    },
  'desk-5':        { x:425, y:210, label:'Desk 5'    },
  'desk-6':        { x:425, y:340, label:'Desk 6'    },
  'ceo-desk':      { x:25,  y:472, label:'CEO Desk'  },
  'reception-desk':{ x:535, y:85,  label:'Reception' },
};
const PLANT_REGISTRY     = { 'plant-1':     { x:185, y:122               } };
const FURNITURE_REGISTRY = { 'bookshelf-1': { x:40,  y:26, w:120, h:54  } };

// ─── ROOM BOUNDS (runtime-resolved) ──────────────────────────────────────────
function getRoomBounds(roomKey, W, H, layoutConfig = null) {
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
function getCeoHome(W, H, config = null) {
  const b = getRoomBounds('CEO_CABIN', W, H, config);
  return { x: Math.floor(b.x + b.w * 0.5), y: Math.floor(b.y + b.h * 0.6) };
}

const ZONE_TO_ROOM = {
  ceoCabin:'CEO_CABIN', workspace:'MAIN_OFFICE', library:'LIBRARY_SECTION',
  meetingRoom:'MEETING_ROOM', breakroom:'RECEPTION',
};

// ─── ROOM OCCUPANCY (module-level singleton — reset on mount) ─────────────────
const _roomOccupancy = {};
for (const k of Object.keys(ROOM_REGISTRY)) _roomOccupancy[k] = new Set();

// ─── CONSTRAINTS ENGINE ───────────────────────────────────────────────────────
function canMove(agent, targetPosition, W = 900, H = 540) {
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

function canEnterRoom(agent, roomName, W = 900, H = 540) {
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
const _deskOwners = {};

function canSit(agent, deskId) {
  const agentId = String(agent.id || agent.name);
  const owner = _deskOwners[deskId];
  if (!owner || owner === agentId) {
    _deskOwners[deskId] = agentId;
    return { allowed:true, reason:'ok' };
  }
  return { allowed:false, reason:`Desk ${deskId} already claimed by ${owner}` };
}

// [FIX-H5] All _registerOccupancy callers MUST pass W, H, config
function _registerOccupancy(agent, tx, ty, W = 900, H = 540, config = null) {
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

// ─── ZONE UTILS ───────────────────────────────────────────────────────────────
function getZoneBounds(zone, W, H, config = null) {
  const b = getRoomBounds(ZONE_TO_ROOM[zone] || 'MAIN_OFFICE', W, H, config);
  return { minX:b.x+5, maxX:b.x+b.w-30, minY:b.y+10, maxY:b.y+b.h-30 };
}

function randomInZone(zone, W, H, agent = {}, config = null) {
  const b = getZoneBounds(zone, W, H, config);
  let x, y, tries = 0;
  do {
    x = b.minX + Math.random() * (b.maxX - b.minX);
    y = b.minY + Math.random() * (b.maxY - b.minY);
    tries++;
  } while (!canMove(agent, { x, y }, W, H) && tries < 10);
  return { x:Math.floor(x), y:Math.floor(y) };
}

function getQueuePos(index, W, H, config = null) {
  const b = getRoomBounds('MEETING_ROOM', W, H, config);
  return { x:b.x-30, y:b.y+10+index*48 };
}

function getMeetingSpots(tcx, tcy, trx, try_) {
  const spots = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const rawTx = Math.floor(tcx + Math.cos(angle) * (trx + 18));
    const rawTy = Math.floor(tcy + Math.sin(angle) * (try_ + 18));
    spots.push({
      tx: Math.floor(rawTx / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2,
      ty: Math.floor(rawTy / GRID_SIZE) * GRID_SIZE + GRID_SIZE/2,
    });
  }
  return spots;
}

function getRoleSpawn(role, W, H) {
  const base = getRoomBounds('MAIN_OFFICE', W, H);
  return {
    x: base.x + 40 + Math.random() * (base.w - 80),
    y: base.y + 40 + Math.random() * (base.h - 80),
  };
}

// ─── DRAW STATIC BACKGROUND ───────────────────────────────────────────────────
// [BONUS-2] Removed unused bWork and bLib variables
function drawStaticBackground(ctx, W, H, config = null) {
  ctx.clearRect(0,0,W,H);

  const roomsToDraw = ['MAIN_OFFICE','RECEPTION','MEETING_ROOM','CEO_CABIN','LIBRARY_SECTION'];
  roomsToDraw.forEach(rk => {
    const b = getRoomBounds(rk, W, H, config);
    let floor, floorAlt;
    if (rk === 'MAIN_OFFICE')      { floor = P.wsFloor; floorAlt = P.wsFloorAlt; }
    else if (rk === 'RECEPTION')   { floor = P.brFloor; floorAlt = P.brFloorAlt; }
    else if (rk === 'MEETING_ROOM'){ floor = P.mrFloor; floorAlt = P.mrFloorAlt; }
    else                           { floor = P.wsFloor; floorAlt = P.wsFloorAlt; }
    drawFloor(ctx, b.x, b.y, b.w, b.h, floor, floorAlt, 24);
    drawWallStrip(ctx, b.x, b.y, b.w, 24);
  });

  const bMeet  = getRoomBounds('MEETING_ROOM', W, H, config);
  const bCEO   = getRoomBounds('CEO_CABIN',    W, H, config);
  const bRecep = getRoomBounds('RECEPTION',    W, H, config);

  // Divider
  px(ctx, bMeet.x-2, 0, 4, H, P.divider);

  // ── VISUAL DOORS ─────────────────────────────────────────────────────────
  const door1Y = 60;
  px(ctx, bMeet.x-4, door1Y, 8, 48, P.wsFloor);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
  ctx.strokeRect(bMeet.x-3, door1Y, 6, 48);
  px(ctx, bMeet.x-1, door1Y+2, 2, 44, '#8B4513');

  const door2Y = bMeet.y + 40;
  px(ctx, bMeet.x-4, door2Y, 8, 52, P.wsFloor);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
  ctx.strokeRect(bMeet.x-3, door2Y, 6, 52);
  px(ctx, bMeet.x-1, door2Y+2, 2, 48, '#8B4513');

  const door3Y = bCEO.y + 50;
  px(ctx, bCEO.x+bCEO.w-4, door3Y, 8, 36, '#1a1a2e');
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
  ctx.strokeRect(bCEO.x+bCEO.w-3, door3Y, 6, 36);
  px(ctx, bCEO.x+bCEO.w-1, door3Y+2, 2, 32, '#5c3317');

  [[bMeet.x-2, door1Y+24],[bMeet.x-2, door2Y+26],[bCEO.x+bCEO.w-1, door3Y+18]].forEach(([hx,hy])=>{
    ctx.fillStyle='#d4af37'; ctx.beginPath(); ctx.arc(hx, hy, 2, 0, Math.PI*2); ctx.fill();
  });

  // Furniture from registries / config
  const furn   = (config && config.furniture) || FURNITURE_REGISTRY;
  const plants = (config && config.plants)    || PLANT_REGISTRY;
  const desks  = (config && config.desks)     || DESK_REGISTRY;

  Object.values(furn   || {}).forEach(f => { if (f.w && f.h) drawBookshelf(ctx, f.x, f.y, f.w, f.h); });
  Object.values(plants || {}).forEach(p => { if (p && p.x !== undefined) drawPlant(ctx, p.x, p.y); });
  Object.entries(desks || {}).forEach(([, d]) => { drawDesk(ctx, d.x, d.y); drawChair(ctx, d.x+26, d.y+50, 'down'); });

  // CEO Cabin — [FIX-M3] no name passed here, cabin label uses default 'CEO'
  drawCEOCabin(ctx, bCEO.x, bCEO.y, bCEO.w, bCEO.h);
  px(ctx, bCEO.x+bCEO.w, bCEO.y+55, 4, 32, '#d4af37');

  // Meeting table
  const tcx  = bMeet.x + bMeet.w / 2;
  const tcy  = bMeet.y + bMeet.h * 0.58;
  const trx  = bMeet.w * 0.35;
  const try_ = bMeet.h * 0.2;
  ctx.fillStyle='rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(tcx+5,tcy+8,trx+2,try_+2,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle=P.mtTop;           ctx.beginPath(); ctx.ellipse(tcx,  tcy,  trx,  try_,  0,0,Math.PI*2); ctx.fill();
  [-40,0,40].forEach(o => drawChair(ctx, tcx+o, tcy+try_+6, 'up'));

  // Reception desk
  drawDesk(ctx,  bRecep.x+20, bRecep.y+80);
  drawChair(ctx, bRecep.x+46, bRecep.y+130, 'down');

  return { splitX:bMeet.x, splitY:bMeet.y, tcx, tcy, trx, try_ };
}

// ─── COLLISION PREVENTION ────────────────────────────────────────────────────
const COLLISION_MIN = 40;

// [FIX-H1] Push x/y (visual position) NOT tx/ty (target).
//   Pushing tx/ty was thrashing A* every frame — path recalculated for any
//   two nearby agents on EVERY tick, murdering performance on i3 + HDD.
function resolveCollisions(agents, isMeeting = false) {
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
  const stateRef       = useRef({
    agents:[], ceo:null, meeting:false, rafId:null, geo:null, queuedAgents:[],
    desks:    { ...DESK_REGISTRY },
    plants:   { ...PLANT_REGISTRY },
    furniture:{ ...FURNITURE_REGISTRY },
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
  // (C1 was already fixed in previous version — kept here for clarity)
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

    const geo = drawStaticBackground(bgCtx, bg.width, bg.height, layoutConfig);
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
        ag.homeY = d.y + 42;
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

        const bob = ag.status === 'idle' ? 0 : Math.sin(tick + ag.phase) * 2.5;
        drawAgent(ctx, Math.floor(ag.x), Math.floor(ag.y), ag.color, ag.skin, ag.shoe, bob);

        const s = (ag.status||'').toLowerCase();
        const emoji = s==='moving' ? '🚶' : s==='working' ? '⚙️'
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
  //   Was at module level — caused duplicate listeners on every HMR hot-reload
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
      if (!isEditModeRef.current) return;
      const { x, y } = getPos(e);
      const W = cv.width, H = cv.height;

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
          // [BONUS-6] Safe spread — works even when layoutConfigRef is null
          const geo = drawStaticBackground(bgCtx, newW, newH, {
            ...(layoutConfigRef.current || {}),
            desks:     stateRef.current.desks,
            plants:    stateRef.current.plants,
            furniture: stateRef.current.furniture,
          });
          stateRef.current.geo = geo;
          gridRef.current = generateGrid(newW, newH, layoutConfigRef.current);
          // [BONUS-5] Recalculate meeting spots for new canvas size
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
        // [FIX-C2] window.EventBus doesn't exist — use imported bus singleton
        bus.emit('agent.moved', { agentId:ag.id||ag.name, x:Math.floor(ag.x), y:Math.floor(ag.y), zone:ag.zone });
      } else if (stateRef.current.draggedFurniture) {
        const df = stateRef.current.draggedFurniture;
        stateRef.current.draggedFurniture = null;
        if (df.type === 'desks' && stateRef.current.desks) {
          const d = stateRef.current.desks[df.id];
          if (d) {
            (stateRef.current.agents || []).forEach(ag => {
              if (ag.deskId === df.id) {
                ag.homeX = d.x+26; ag.homeY = d.y+42;
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

  // ── ROAMING SCHEDULE ──────────────────────────────────────────────────────
  useEffect(() => {
    const MAX_ROAMING     = 1;   // 3 → 1 — ek waqt mein sirf 1 agent roam kare
    const PROXIMITY_DIST  = 80;
    const PROXIMITY_LIMIT = 1;
    const roamTimers      = [];

    function pickRoamTarget(ag, W = 900, H = 540) {
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
            scheduleRoam(curr, 8000 + Math.random() * 7000);
          }, 3000 + Math.random() * 2000);
          roamTimers.push(ret);
        } else {
          scheduleRoam(activeAg, 8000 + Math.random() * 7000);
        }
      }, delay);
      roamTimers.push(t);
    }

    (stateRef.current.agents || []).forEach((ag, i) => {
      scheduleRoam(ag, i * 8000 + 30000 + Math.random() * 20000);  // 30-50 sec wait
    });

    return () => roamTimers.forEach(clearTimeout);
  }, [agentsKey]);

  // ── MEETING ANIMATION ─────────────────────────────────────────────────────
  useEffect(() => {
    const state = stateRef.current;
    state.meeting = onMeeting;
    // [FIX-H4] Removed dead splitX/splitY destructure — these were declared but never used

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
            // [BONUS-3] Use actual canvas dims, not hardcoded 900/540
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
          // Force path recalculate — stale path clear karo
          ag._lastTx = null;
          ag._lastTy = null;
          ag._path = [];
          ag._inMeeting = false;
          // [FIX-H5] Pass W, H, config — correct room detection after resize
          _registerOccupancy(ag, ag.homeX, ag.homeY, W, H, layoutConfigRef.current);
        } else {
          const idx = allAgents.indexOf(ag);
          // Alag alag positions — ek dusre se 150px gap
          const fallX = 190 + (idx % 3) * 150;
          const fallY = 150 + Math.floor(idx / 3) * 160;
          ag.tx = fallX; ag.ty = fallY;
          _registerOccupancy(ag, fallX, fallY, W, H, layoutConfigRef.current);
        }
      });

      if (state.ceo) {
        // [FIX-H3] Dynamic CEO home — getCeoHome not hardcoded CEO_HOME const
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
      // [FIX-#6] Allow ceoCabin zone for agents that are designated there (e.g. Chief)
      const agZone = ag.zone || 'workspace';

      // Use ROOM_REGISTRY as single source of truth for capacity
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
        randomTy  = d.y + 42;
      } else if (deskId === 'ceo-desk') {
        const ceo = getRoomBounds('CEO_CABIN', W, H, layoutConfigRef.current);
        randomTx = ceo.x + ceo.w + 20;
        randomTy = ceo.y + 65;
      } else {
        const spawn = getRoleSpawn(ag.role, W, H);
        randomTx    = spawn.x;
        randomTy    = spawn.y;
      }

      // [FIX-H4] Removed dead splitX/splitY computed from geo — never used here

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
          // [FIX-H5] Pass W, H, config everywhere
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentsKey]);

  return (
    <canvas ref={canvasRef} width={900} height={540} style={{
      width:'100%', height:'100%', imageRendering:'pixelated',
      display:'block', borderRadius:6, border:'3px solid #1f2937',
      boxShadow:'0 0 40px rgba(0,0,0,0.7)',
    }} />
  );
}
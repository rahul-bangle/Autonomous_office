import {
  getRoomBounds,
  DESK_REGISTRY, PLANT_REGISTRY, FURNITURE_REGISTRY,
} from './officeLayout';

// ─── PALETTE ──────────────────────────────────────────────────────────────────
export const P = {
  wsFloor: '#c8975a', wsFloorAlt: '#bf8e52',
  brFloor: '#e8d5a8', brFloorAlt: '#dfc89a',
  mrFloor: '#1e2d42', mrFloorAlt: '#1a2839',
  wallTop: '#8b7355', wallSide: '#6b5840', wallDark: '#4a3d2a', divider: '#0d1117',
  deskTop: '#a0693a', deskFront: '#7a4f2a',
  monBody: '#1e293b', monScreen: '#22d3ee',
  kbd: '#cbd5e1', mug: '#f8fafc',
  shelfWood: '#7c4f1e', shelfDark: '#4a2f0e', shelfBoard: '#3d2008',
  books: ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#a3e635', '#e879f9'],
  chairSeat: '#2563eb', chairBack: '#1d4ed8', chairLeg: '#374151',
  mtOuter: '#3d2008', mtTop: '#7c5028', mtEdge: '#9b6a38',
  couchBody: '#4b5563', couchBack: '#1f2937', couchCush: '#6b7280',
  coffeeMach: '#111827', coffeeLed: '#a855f7',
  cooler: '#e2e8f0', coolerTank: '#38bdf8',
  pot: '#c87941', potDark: '#8b5e2e',
  leaf1: '#22c55e', leaf2: '#16a34a', leaf3: '#15803d',
  skins: ['#e8b896', '#c68642', '#f1c27d', '#8d5524', '#e0ac69', '#ffdbac'],
  shoes: ['#2d1a0e', '#1a1a2e', '#3b1f0a', '#0a1628', '#2a1500', '#1c1c1c'],
  agentColors: ['#ff6b6b', '#4ecdc4', '#ffe66d', '#a78bfa', '#fb923c', '#34d399'],
  outline: '#111111',
  projScreen: '#e8edf2',
};

// ─── DRAW HELPERS ─────────────────────────────────────────────────────────────
export function px(ctx, x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h)); }

export function drawFloor(ctx, x, y, w, h, c1, c2, ts = 20) {
  for (let ty = 0; ty < h; ty += ts)for (let tx = 0; tx < w; tx += ts) {
    ctx.fillStyle = ((Math.floor(tx / ts) + Math.floor(ty / ts)) % 2) ? c2 : c1;
    ctx.fillRect(x + tx, y + ty, Math.min(ts, w - tx), Math.min(ts, h - ty));
  }
}

export function drawWallStrip(ctx, x, y, w, h) {
  px(ctx, x, y, w, h * 0.6, P.wallTop);
  px(ctx, x, y + h * 0.6, w, h * 0.4, P.wallSide);
  px(ctx, x, y + h - 3, w, 3, P.wallDark);
}

export function drawBookshelf(ctx, x, y, w, h) {
  px(ctx, x, y, w, h, P.shelfDark);
  const rowH = Math.floor((h - 4) / 3);
  for (let r = 0; r < 3; r++) {
    const ry = y + 2 + r * rowH;
    px(ctx, x, ry + rowH - 3, w, 3, P.shelfBoard);
    let bx = x + 2;
    [6, 8, 5, 7, 6, 5, 8, 6, 5, 7].forEach((bw, i) => {
      if (bx + bw > x + w - 2) return;
      const bh = rowH - 6;
      px(ctx, bx, ry + 2, bw, bh, P.books[(r * 4 + i) % P.books.length]);
      px(ctx, bx, ry + 2, 1, bh, 'rgba(255,255,255,0.3)');
      bx += bw + 2;
    });
  }
  ctx.strokeStyle = P.shelfWood; ctx.lineWidth = 3;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
}

export function drawDesk(ctx, x, y, w = 72, h = 44) {
  px(ctx, x + 4, y + 4, w, h, 'rgba(0,0,0,0.3)');
  px(ctx, x, y, w, h, P.deskTop);
  px(ctx, x, y + h - 8, w, 8, P.deskFront);
  px(ctx, x + 2, y + 2, w - 4, 3, 'rgba(255,220,140,0.25)');
  px(ctx, x, y, w, 1, P.outline); px(ctx, x, y, 1, h, P.outline);
  px(ctx, x + w - 1, y, 1, h, P.outline); px(ctx, x, y + h - 1, w, 1, P.outline);
  const mx = x + w / 2 - 16, my = y + 4;
  px(ctx, mx, my, 32, 22, P.monBody);
  px(ctx, mx + 2, my + 2, 28, 16, P.monScreen);
  for (let sl = 0; sl < 16; sl += 3)px(ctx, mx + 2, my + 2 + sl, 28, 1, 'rgba(0,0,0,0.15)');
  px(ctx, mx + 2, my + 2, 28, 4, 'rgba(255,255,255,0.2)');
  px(ctx, mx + 14, my + 22, 4, 5, '#374151'); px(ctx, mx + 10, my + 26, 12, 3, '#374151');
  px(ctx, mx, my + 28, 32, 8, P.kbd); px(ctx, mx + 1, my + 29, 30, 6, '#e2e8f0');
  for (let kr = 0; kr < 3; kr++)for (let kc = 0; kc < 8; kc++)px(ctx, mx + 2 + kc * 4, my + 29 + kr * 2, 3, 1, '#94a3b8');
  px(ctx, x + 6, y + 8, 10, 10, P.mug); px(ctx, x + 7, y + 9, 8, 8, '#f0f0f0');
  px(ctx, x + 16, y + 11, 3, 5, P.mug);
}

export function drawChair(ctx, x, y, facing = 'down') {
  const W = 20, H = 20;
  px(ctx, x + 2, y + 2, W, H, 'rgba(0,0,0,0.2)');
  if (facing === 'down') { px(ctx, x, y + 6, W, H - 6, P.chairSeat); px(ctx, x, y, W, 8, P.chairBack); px(ctx, x + 2, y + 1, W - 4, 4, '#3b82f6'); px(ctx, x + 2, y + H - 3, 4, 3, P.chairLeg); px(ctx, x + W - 6, y + H - 3, 4, 3, P.chairLeg); }
  else if (facing === 'up') { px(ctx, x, y, W, H - 6, P.chairSeat); px(ctx, x, y + H - 8, W, 8, P.chairBack); px(ctx, x + 2, y + H - 7, W - 4, 4, '#3b82f6'); px(ctx, x + 2, y + 2, 4, 3, P.chairLeg); px(ctx, x + W - 6, y + 2, 4, 3, P.chairLeg); }
  else if (facing === 'right') { px(ctx, x, y, W - 6, H, P.chairSeat); px(ctx, x + W - 8, y, 8, H, P.chairBack); px(ctx, x + W - 7, y + 2, 4, H - 4, '#3b82f6'); px(ctx, x + 2, y + 2, 3, 4, P.chairLeg); px(ctx, x + 2, y + H - 6, 3, 4, P.chairLeg); }
  else if (facing === 'left') { px(ctx, x + 6, y, W - 6, H, P.chairSeat); px(ctx, x, y, 8, H, P.chairBack); px(ctx, x + 1, y + 2, 4, H - 4, '#3b82f6'); px(ctx, x + W - 5, y + 2, 3, 4, P.chairLeg); px(ctx, x + W - 5, y + H - 6, 3, 4, P.chairLeg); }
}

export function drawPlant(ctx, x, y) {
  px(ctx, x + 4, y + 18, 14, 12, P.pot); px(ctx, x + 5, y + 19, 12, 10, '#d4894a'); px(ctx, x + 3, y + 17, 16, 3, P.potDark);
  [[4, 4, 14], [2, 6, 18], [0, 10, 22], [2, 14, 18], [4, 16, 14], [6, 6, 10], [4, 8, 14], [6, 10, 12], [8, 6, 10]].forEach(([lx, ly, lw]) => px(ctx, x + lx, y + ly, lw, 3, P.leaf1));
  px(ctx, x + 6, y + 8, 10, 8, P.leaf2); px(ctx, x + 8, y + 10, 6, 4, P.leaf3);
  px(ctx, x + 3, y + 4, 1, 14, P.outline); px(ctx, x + 18, y + 4, 1, 14, P.outline);
}

// ─── LAPTOP (for conference table) ───────────────────────────────────────────
function drawLaptop(ctx, x, y, screenColor = '#00d4ff') {
  // Base
  px(ctx, x, y + 8, 20, 3, '#1e293b');
  px(ctx, x + 1, y + 9, 18, 1, '#334155');
  // Screen (slightly open/angled)
  px(ctx, x + 2, y, 16, 9, '#0f172a');
  px(ctx, x + 3, y + 1, 14, 7, screenColor);
  px(ctx, x + 3, y + 1, 14, 2, 'rgba(255,255,255,0.15)');
  // Hinge
  px(ctx, x + 2, y + 8, 16, 2, '#374151');
}

// ─── CONFERENCE TABLE (rectangular, with laptops) ────────────────────────────
export function drawConferenceTable(ctx, cx, cy, tw, th) {
  const x = cx - tw / 2, y = cy - th / 2;

  // Shadow
  px(ctx, x + 6, y + 6, tw, th, 'rgba(0,0,0,0.35)');

  // Table surface — dark walnut
  px(ctx, x, y, tw, th, '#3d2008');
  px(ctx, x + 2, y + 2, tw - 4, th - 4, '#4a2810');

  // Surface shine
  px(ctx, x + 4, y + 3, tw - 8, 4, 'rgba(255,200,100,0.12)');

  // Table edge highlight
  px(ctx, x, y, tw, 2, '#6b3a12');
  px(ctx, x, y, 2, th, '#6b3a12');
  px(ctx, x + tw - 2, y, 2, th, '#2d1506');
  px(ctx, x, y + th - 2, tw, 2, '#2d1506');

  // Center runner (cloth strip)
  px(ctx, x + 8, y + th / 2 - 4, tw - 16, 8, '#1e3a5f');
  px(ctx, x + 8, y + th / 2 - 4, tw - 16, 1, '#2d5a8e');

  // Laptops — top side (facing down toward viewer)
  const laptopCount = Math.floor(tw / 36);
  const laptopSpacing = (tw - 16) / laptopCount;
  for (let i = 0; i < laptopCount; i++) {
    const lx = x + 8 + i * laptopSpacing;
    // Top row laptops
    drawLaptop(ctx, lx, y + 4, '#00d4ff');
    // Bottom row laptops
    drawLaptop(ctx, lx, y + th - 18, '#22c55e');
  }

  // Water glasses on table
  [0.25, 0.5, 0.75].forEach(t => {
    const gx = x + tw * t - 2;
    px(ctx, gx, y + th / 2 - 5, 4, 8, 'rgba(180,220,255,0.7)');
    px(ctx, gx, y + th / 2 - 5, 4, 2, 'rgba(255,255,255,0.5)');
  });

  // Chairs — top side (facing down)
  const chairSpacing = tw / (laptopCount + 1);
  for (let i = 0; i < laptopCount; i++) {
    drawChair(ctx, x + chairSpacing * (i + 1) - 10, y - 26, 'down');
  }
  // Chairs — bottom side (facing up)
  for (let i = 0; i < laptopCount; i++) {
    drawChair(ctx, x + chairSpacing * (i + 1) - 10, y + th + 4, 'up');
  }
  // Chairs — left side
  drawChair(ctx, x - 26, cy - 10, 'right');
  // Chairs — right side
  drawChair(ctx, x + tw + 4, cy - 10, 'left');
}

// ─── RECEPTION COUNTER ────────────────────────────────────────────────────────
export function drawReceptionCounter(ctx, x, y, w) {
  const h = 36;

  // Counter shadow
  px(ctx, x + 4, y + 4, w, h, 'rgba(0,0,0,0.3)');

  // Counter body — L-shaped wooden counter
  px(ctx, x, y, w, h, '#7a4f2a');  // main body
  px(ctx, x + 2, y + 2, w - 4, h - 4, '#8b5e35');  // lighter top
  px(ctx, x, y, w, 3, '#a07040');  // top edge highlight
  px(ctx, x, y, 2, h, '#a07040');  // left edge highlight
  px(ctx, x + w - 2, y, 2, h, '#5a3820');  // right shadow

  // Counter top surface details
  px(ctx, x + 6, y + 6, 20, 2, 'rgba(255,200,100,0.2)'); // shine

  // Computer monitor on counter
  const mx = x + w - 50;
  px(ctx, mx, y - 20, 28, 18, '#1e293b');   // monitor body
  px(ctx, mx + 2, y - 18, 24, 14, '#00d4ff');   // screen
  px(ctx, mx + 2, y - 18, 24, 4, 'rgba(255,255,255,0.2)'); // screen shine
  px(ctx, mx + 12, y - 2, 4, 4, '#374151');   // stand
  px(ctx, mx + 8, y + 2, 12, 2, '#374151');   // stand base

  // Reception bell / nameplate
  px(ctx, x + 8, y + 6, 18, 10, '#d4af37');   // bell/nameplate gold
  px(ctx, x + 9, y + 7, 16, 8, '#b8960c');
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 5px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RECEPTION', x + w / 2, y + 14);

  // Flower vase on counter
  px(ctx, x + w - 80, y - 8, 8, 12, '#e87070');  // vase
  px(ctx, x + w - 78, y - 14, 4, 8, '#22c55e'); // stem
  px(ctx, x + w - 81, y - 16, 6, 4, '#f472b6'); // flower

  // Small plant
  drawPlant(ctx, x + 4, y - 22);
}

// ─── CEO CABIN ────────────────────────────────────────────────────────────────
export function drawCEOCabin(ctx, x, y, w, h, ceoName = 'CEO') {
  for (let ty = 0; ty < h; ty += 18)for (let tx = 0; tx < w; tx += 18) {
    ctx.fillStyle = ((Math.floor(tx / 18) + Math.floor(ty / 18)) % 2) ? '#1a1a2e' : '#16213e';
    ctx.fillRect(x + tx, y + ty, Math.min(18, w - tx), Math.min(18, h - ty));
  }
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 3; ctx.strokeRect(x + 2, y + 2, w - 4, h - 4);
  ctx.lineWidth = 1; ctx.strokeStyle = '#b8960c'; ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  ctx.fillStyle = '#d4af37'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
  ctx.fillText('C  E  O', x + w / 2, y + 16);
  const dx = x + 10, dy = y + 22;
  px(ctx, dx, dy, 95, 52, '#2d1810'); px(ctx, dx + 2, dy + 2, 91, 48, '#3d2215');
  px(ctx, dx + 2, dy + 2, 91, 5, '#d4af37');
  px(ctx, dx, dy, 95, 1, '#d4af37'); px(ctx, dx, dy, 1, 52, '#d4af37'); px(ctx, dx + 94, dy, 1, 52, '#d4af37');
  px(ctx, dx + 70, dy + 28, 22, 48, '#2d1810'); px(ctx, dx + 72, dy + 30, 18, 44, '#3d2215');
  px(ctx, dx + 70, dy + 28, 1, 48, '#d4af37'); px(ctx, dx + 91, dy + 28, 1, 48, '#d4af37');
  px(ctx, dx + 6, dy + 7, 42, 28, '#0d1117'); px(ctx, dx + 8, dy + 9, 38, 22, '#00d4ff');
  for (let ci = 0; ci < 4; ci++) { const ch = 6 + ci * 3; px(ctx, dx + 10 + ci * 8, dy + 9 + 22 - ch, 6, ch, ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444'][ci]); }
  px(ctx, dx + 8, dy + 9, 38, 3, 'rgba(255,255,255,0.15)');
  px(ctx, dx + 24, dy + 35, 10, 4, '#d4af37'); px(ctx, dx + 20, dy + 38, 18, 3, '#d4af37');
  px(ctx, dx + 6, dy + 42, 42, 8, '#1e293b'); px(ctx, dx + 7, dy + 43, 40, 6, '#334155');
  px(ctx, dx + 58, dy + 8, 14, 16, '#d4af37'); px(ctx, dx + 59, dy + 9, 12, 14, '#1a0a00');
  [0, 3, 6, 9].forEach((pi, i) => px(ctx, dx + 60 + pi, dy + 9, 2, 12, ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b'][i]));
  px(ctx, dx + 74, dy + 32, 12, 14, '#d4af37'); px(ctx, dx + 76, dy + 34, 8, 8, '#b8960c');
  px(ctx, dx + 75, dy + 44, 10, 2, '#d4af37'); px(ctx, dx + 73, dy + 46, 14, 3, '#d4af37');
  px(ctx, dx + 8, dy + 46, 50, 6, '#d4af37'); px(ctx, dx + 9, dy + 47, 48, 4, '#1a0a00');
  ctx.fillStyle = '#d4af37'; ctx.font = 'bold 4px monospace'; ctx.textAlign = 'center';
  ctx.fillText(`${ceoName.toUpperCase()}  —  CEO`, dx + 33, dy + 51);
  const cx2 = dx + 22, cy2 = dy + 58;
  px(ctx, cx2, cy2, 40, 5, '#d4af37');
  px(ctx, cx2 + 2, cy2 + 5, 36, 16, '#1a1a2e');
  px(ctx, cx2 + 4, cy2 + 7, 32, 12, '#2d2d4e');
  px(ctx, cx2, cy2 + 21, 40, 14, '#1a1a2e');
  px(ctx, cx2 + 2, cy2 + 23, 36, 10, '#2d2d4e');
  px(ctx, cx2 - 5, cy2 + 5, 6, 22, '#d4af37');
  px(ctx, cx2 + 39, cy2 + 5, 6, 22, '#d4af37');
  [0, 12, 24, 36].forEach(wi => px(ctx, cx2 + wi, cy2 + 35, 8, 4, '#374151'));
}

// ─── AGENT SPRITE ─────────────────────────────────────────────────────────────
export function drawAgent(ctx, x, y, color, skin, shoe, bobOffset = 0) {
  const by = Math.floor(bobOffset);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath();
  ctx.ellipse(x + 11, y + 37 + by, 9, 3, 0, 0, Math.PI * 2); ctx.fill();
  px(ctx, x + 2, y + 32 + by, 7, 4, shoe); px(ctx, x + 13, y + 32 + by, 7, 4, shoe);
  px(ctx, x + 1, y + 31 + by, 8, 2, P.outline); px(ctx, x + 12, y + 31 + by, 8, 2, P.outline);
  px(ctx, x + 3, y + 32 + by, 2, 1, 'rgba(255,255,255,0.4)'); px(ctx, x + 14, y + 32 + by, 2, 1, 'rgba(255,255,255,0.4)');
  px(ctx, x + 3, y + 24 + by, 6, 9, '#374151'); px(ctx, x + 13, y + 24 + by, 6, 9, '#374151');
  px(ctx, x + 3, y + 24 + by, 2, 9, '#1f2937'); px(ctx, x + 17, y + 24 + by, 2, 9, '#1f2937');
  px(ctx, x + 9, y + 24 + by, 4, 2, P.outline);
  px(ctx, x + 1, y + 13 + by, 20, 12, color);
  px(ctx, x + 1, y + 13 + by, 2, 12, 'rgba(0,0,0,0.2)'); px(ctx, x + 19, y + 13 + by, 2, 12, 'rgba(0,0,0,0.2)');
  px(ctx, x + 8, y + 22 + by, 6, 3, '#f8fafc'); px(ctx, x + 1, y + 23 + by, 20, 2, '#1f2937');
  px(ctx, x - 2, y + 14 + by, 4, 9, color); px(ctx, x + 20, y + 14 + by, 4, 9, color);
  px(ctx, x - 2, y + 21 + by, 5, 5, skin); px(ctx, x + 19, y + 21 + by, 5, 5, skin);
  px(ctx, x + 9, y + 10 + by, 4, 4, skin);
  px(ctx, x + 1, y - 2 + by, 20, 13, skin);
  px(ctx, x, y - 3 + by, 22, 1, P.outline); px(ctx, x, y - 3 + by, 1, 15, P.outline);
  px(ctx, x + 21, y - 3 + by, 1, 15, P.outline); px(ctx, x + 1, y + 11 + by, 20, 1, P.outline);
  px(ctx, x + 2, y + 5 + by, 4, 3, 'rgba(255,150,150,0.5)'); px(ctx, x + 16, y + 5 + by, 4, 3, 'rgba(255,150,150,0.5)');
  px(ctx, x + 1, y - 2 + by, 20, 5, color); px(ctx, x, y + by, 2, 10, color); px(ctx, x + 20, y + by, 2, 10, color);
  px(ctx, x + 4, y - 1 + by, 5, 2, 'rgba(255,255,255,0.3)');
  px(ctx, x + 4, y + 2 + by, 6, 5, '#fff'); px(ctx, x + 12, y + 2 + by, 6, 5, '#fff');
  px(ctx, x + 5, y + 3 + by, 4, 4, color === '#ffe66d' ? '#1e6b3a' : '#1a5cb5');
  px(ctx, x + 13, y + 3 + by, 4, 4, color === '#ffe66d' ? '#1e6b3a' : '#1a5cb5');
  px(ctx, x + 6, y + 4 + by, 2, 3, '#111'); px(ctx, x + 14, y + 4 + by, 2, 3, '#111');
  px(ctx, x + 5, y + 3 + by, 2, 2, '#fff'); px(ctx, x + 13, y + 3 + by, 2, 2, '#fff');
  px(ctx, x + 8, y + 5 + by, 1, 1, '#fff'); px(ctx, x + 16, y + 5 + by, 1, 1, '#fff');
  px(ctx, x + 4, y + 2 + by, 6, 1, P.outline); px(ctx, x + 12, y + 2 + by, 6, 1, P.outline);
  px(ctx, x + 4, y + 1 + by, 5, 1, P.outline); px(ctx, x + 12, y + 1 + by, 5, 1, P.outline);
  px(ctx, x + 10, y + 7 + by, 2, 1, 'rgba(180,100,60,0.6)');
  px(ctx, x + 7, y + 8 + by, 8, 1, '#c0825a'); px(ctx, x + 6, y + 9 + by, 2, 1, '#c0825a'); px(ctx, x + 14, y + 9 + by, 2, 1, '#c0825a');
}

// ─── LADY RECEPTIONIST (static, always at counter) ───────────────────────────
export function drawReceptionist(ctx, x, y) {
  // Same as drawAgent but with pink color + longer hair detail
  const color = '#f472b6'; // pink outfit
  const skin = '#f1c27d';
  const shoe = '#1a1a2e';
  const by = 0;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath();
  ctx.ellipse(x + 11, y + 37, 9, 3, 0, 0, Math.PI * 2); ctx.fill();

  // Shoes + legs
  px(ctx, x + 2, y + 32, 7, 4, shoe); px(ctx, x + 13, y + 32, 7, 4, shoe);
  px(ctx, x + 1, y + 31, 8, 2, P.outline); px(ctx, x + 12, y + 31, 8, 2, P.outline);
  px(ctx, x + 3, y + 24, 6, 9, '#4b5563'); px(ctx, x + 13, y + 24, 6, 9, '#4b5563');

  // Body — pink
  px(ctx, x + 1, y + 13, 20, 12, color);
  px(ctx, x + 1, y + 13, 2, 12, 'rgba(0,0,0,0.2)'); px(ctx, x + 19, y + 13, 2, 12, 'rgba(0,0,0,0.2)');
  px(ctx, x + 8, y + 22, 6, 3, '#f8fafc'); px(ctx, x + 1, y + 23, 20, 2, '#1f2937');

  // Arms
  px(ctx, x - 2, y + 14, 4, 9, color); px(ctx, x + 20, y + 14, 4, 9, color);
  px(ctx, x - 2, y + 21, 5, 5, skin); px(ctx, x + 19, y + 21, 5, 5, skin);

  // Head
  px(ctx, x + 9, y + 10, 4, 4, skin);
  px(ctx, x + 1, y - 2, 20, 13, skin);
  px(ctx, x, y - 3, 22, 1, P.outline); px(ctx, x, y - 3, 1, 15, P.outline);
  px(ctx, x + 21, y - 3, 1, 15, P.outline); px(ctx, x + 1, y + 11, 20, 1, P.outline);

  // Hair — longer, darker (lady)
  px(ctx, x + 1, y - 2, 20, 5, '#3d1a00');  // hair top
  px(ctx, x, y + by, 2, 10, '#3d1a00');   // left hair
  px(ctx, x + 20, y, 2, 10, '#3d1a00');   // right hair
  px(ctx, x + 1, y + 8, 4, 6, '#3d1a00');   // left long hair
  px(ctx, x + 17, y + 8, 4, 6, '#3d1a00');  // right long hair
  px(ctx, x + 4, y - 1, 5, 2, 'rgba(180,120,60,0.5)'); // hair shine

  // Eyes
  px(ctx, x + 4, y + 2, 6, 5, '#fff'); px(ctx, x + 12, y + 2, 6, 5, '#fff');
  px(ctx, x + 5, y + 3, 4, 4, '#1a5cb5');
  px(ctx, x + 6, y + 4, 2, 3, '#111'); px(ctx, x + 14, y + 4, 2, 3, '#111');
  px(ctx, x + 5, y + 3, 2, 2, '#fff'); px(ctx, x + 13, y + 3, 2, 2, '#fff');

  // Headset (receptionist detail)
  px(ctx, x + 1, y + 2, 3, 6, '#374151');   // headband left
  px(ctx, x + 18, y + 2, 3, 6, '#374151');  // headband right
  px(ctx, x + 1, y + 5, 2, 3, '#f59e0b');   // earpiece left
  px(ctx, x + 19, y + 5, 2, 3, '#f59e0b');  // earpiece right
  // mic boom
  px(ctx, x + 19, y + 7, 6, 1, '#374151');
  px(ctx, x + 25, y + 6, 2, 3, '#f59e0b');

  // Name bubble
  ctx.fillStyle = 'rgba(10,10,20,0.85)';
  ctx.fillRect(x + 2, y + 40, 40, 13);
  ctx.fillStyle = '#f472b6'; ctx.font = 'bold 7px monospace'; ctx.textAlign = 'center';
  ctx.fillText('Reception', x + 22, y + 50);
}

export function drawBubble(ctx, x, y, emoji, name) {
  ctx.fillStyle = 'rgba(10,10,20,0.85)';
  const nw = name.length * 6 + 10;
  ctx.fillRect(x + 11 - nw / 2, y + 40, nw, 13);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
  ctx.fillText(name, x + 11, y + 50);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  ctx.rect(x + 2, y - 20, 20, 16);
  ctx.fill();
  ctx.strokeStyle = '#e5e7eb'; ctx.lineWidth = 1; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.beginPath();
  ctx.moveTo(x + 9, y - 4); ctx.lineTo(x + 13, y - 4); ctx.lineTo(x + 11, y - 1); ctx.fill();
  ctx.font = '9px serif'; ctx.fillText(emoji, x + 12, y - 6);
}

// ─── AFFORDANCES (Environment Objects) ─────────────────────────────────────────
export function drawCoffeeMachine(ctx, x, y) {
  px(ctx, x, y, 24, 32, '#111827');
  px(ctx, x+2, y+2, 20, 8, '#374151');
  px(ctx, x+4, y+12, 16, 12, '#1f2937'); // brew area
  px(ctx, x+8, y+14, 8, 2, '#9ca3af'); // spout
  px(ctx, x+6, y+20, 12, 12, '#38bdf8'); // water tank
  px(ctx, x+8, y+28, 8, 4, '#1e3a8a'); // drip tray
  px(ctx, x+4, y+4, 2, 2, '#22c55e');
  px(ctx, x+8, y+4, 2, 2, '#ef4444');
}

export function drawWhiteboard(ctx, x, y, w = 80, h = 36, isBeingUsed = false) {
  px(ctx, x-2, y-2, w+4, h+4, '#334155'); // frame shadow
  px(ctx, x-1, y-1, w+2, h+2, '#94a3b8'); // frame
  px(ctx, x, y, w, h, '#f8fafc'); // board surface
  px(ctx, x, y+h, w, 3, '#64748b'); // marker tray
  px(ctx, x+10, y+h, 8, 2, '#ef4444');
  px(ctx, x+20, y+h, 8, 2, '#3b82f6');
  
  if (isBeingUsed) {
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x+10, y+10); ctx.lineTo(x+30, y+8); ctx.lineTo(x+15, y+20); ctx.stroke();
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(x+40, y+15); ctx.lineTo(x+60, y+18); ctx.lineTo(x+50, y+28); ctx.stroke();
  }
}

export function drawServerRack(ctx, x, y, isBroken = false, tick = 0) {
  const w = 32, h = 64;
  px(ctx, x, y, w, h, '#0f172a');
  px(ctx, x+2, y+2, w-4, h-4, '#1e293b');
  
  for (let sy = y+4; sy < y+h-6; sy += 8) {
    px(ctx, x+4, sy, w-8, 6, '#334155');
    if (isBroken && Math.sin(tick + sy) > 0) {
      px(ctx, x+6, sy+2, 2, 2, '#ef4444'); 
      px(ctx, x+10, sy+2, 2, 2, '#ef4444');
    } else {
      px(ctx, x+6, sy+2, 2, 2, '#22c55e');
      px(ctx, x+10, sy+2, 2, 2, Math.sin(tick*0.5 + sy) > 0 ? '#3b82f6' : '#22c55e');
    }
  }

  if (isBroken && Math.sin(tick*2) > 0) {
    px(ctx, x-4, y-8, 40, 10, 'rgba(239,68,68,0.2)');
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 10px monospace';
    ctx.fillText('⚡', x+w/2 - 4, y-2);
  }
}

// ─── DRAW STATIC BACKGROUND ───────────────────────────────────────────────────
// isMeeting flag → meeting room gets warm glow + lit effect
export function drawStaticBackground(ctx, W, H, config = null, isMeeting = false) {
  ctx.clearRect(0, 0, W, H);

  const roomsToDraw = ['MAIN_OFFICE', 'RECEPTION', 'MEETING_ROOM', 'CEO_CABIN', 'LIBRARY_SECTION'];
  roomsToDraw.forEach(rk => {
    const b = getRoomBounds(rk, W, H, config);
    let floor, floorAlt;
    if (rk === 'MAIN_OFFICE') { floor = P.wsFloor; floorAlt = P.wsFloorAlt; }
    else if (rk === 'RECEPTION') { floor = P.brFloor; floorAlt = P.brFloorAlt; }
    else if (rk === 'MEETING_ROOM') { floor = P.mrFloor; floorAlt = P.mrFloorAlt; }
    else { floor = P.wsFloor; floorAlt = P.wsFloorAlt; }
    drawFloor(ctx, b.x, b.y, b.w, b.h, floor, floorAlt, 24);
    drawWallStrip(ctx, b.x, b.y, b.w, 24);
  });

  const bMeet = getRoomBounds('MEETING_ROOM', W, H, config);
  const bCEO = getRoomBounds('CEO_CABIN', W, H, config);
  const bRecep = getRoomBounds('RECEPTION', W, H, config);

  // ── MEETING ROOM GLOW when meeting active ────────────────────────────────
  if (isMeeting) {
    // Warm amber light overlay
    ctx.save();
    const grad = ctx.createRadialGradient(
      bMeet.x + bMeet.w / 2, bMeet.y + bMeet.h / 2, 10,
      bMeet.x + bMeet.w / 2, bMeet.y + bMeet.h / 2, Math.max(bMeet.w, bMeet.h) * 0.7
    );
    grad.addColorStop(0, 'rgba(255,200,80,0.18)');
    grad.addColorStop(0.6, 'rgba(255,160,40,0.08)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(bMeet.x, bMeet.y, bMeet.w, bMeet.h);

    // Border glow
    ctx.strokeStyle = 'rgba(255,200,80,0.4)';
    ctx.lineWidth = 3;
    ctx.strokeRect(bMeet.x + 1, bMeet.y + 1, bMeet.w - 2, bMeet.h - 2);
    ctx.restore();

    // "IN MEETING" label top of room
    ctx.save();
    ctx.fillStyle = 'rgba(255,200,80,0.9)';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('● IN MEETING', bMeet.x + bMeet.w / 2, bMeet.y + 20);
    ctx.restore();
    // Dim all NON-meeting rooms so focus stays on meeting room
    const dimRooms = ['MAIN_OFFICE', 'CEO_CABIN', 'LIBRARY_SECTION', 'RECEPTION'];
    dimRooms.forEach(rk => {
      const b = getRoomBounds(rk, W, H, config);
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.restore();
    });
  }

  // Divider
  px(ctx, bMeet.x - 2, 0, 4, H, P.divider);

  // ── VISUAL DOORS ─────────────────────────────────────────────────────────
  const door1Y = 60;
  px(ctx, bMeet.x - 4, door1Y, 8, 48, P.wsFloor);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
  ctx.strokeRect(bMeet.x - 3, door1Y, 6, 48);
  px(ctx, bMeet.x - 1, door1Y + 2, 2, 44, '#8B4513');

  const door2Y = bMeet.y + 40;
  px(ctx, bMeet.x - 4, door2Y, 8, 52, P.wsFloor);
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
  ctx.strokeRect(bMeet.x - 3, door2Y, 6, 52);
  px(ctx, bMeet.x - 1, door2Y + 2, 2, 48, '#8B4513');

  const door3Y = bCEO.y + 50;
  px(ctx, bCEO.x + bCEO.w - 4, door3Y, 8, 36, '#1a1a2e');
  ctx.strokeStyle = '#d4af37'; ctx.lineWidth = 2;
  ctx.strokeRect(bCEO.x + bCEO.w - 3, door3Y, 6, 36);
  px(ctx, bCEO.x + bCEO.w - 1, door3Y + 2, 2, 32, '#5c3317');

  [[bMeet.x - 2, door1Y + 24], [bMeet.x - 2, door2Y + 26], [bCEO.x + bCEO.w - 1, door3Y + 18]].forEach(([hx, hy]) => {
    ctx.fillStyle = '#d4af37'; ctx.beginPath(); ctx.arc(hx, hy, 2, 0, Math.PI * 2); ctx.fill();
  });

  // ── FURNITURE ─────────────────────────────────────────────────────────────
  const furn = (config && config.furniture) || FURNITURE_REGISTRY;
  const plants = (config && config.plants) || PLANT_REGISTRY;
  const desks = (config && config.desks) || DESK_REGISTRY;

  Object.values(furn || {}).forEach(f => { if (f.w && f.h) drawBookshelf(ctx, f.x, f.y, f.w, f.h); });
  Object.values(plants || {}).forEach(p => { if (p && p.x !== undefined) drawPlant(ctx, p.x, p.y); });

  // Draw desks EXCEPT reception-desk (we handle it separately below)
  Object.entries(desks || {}).forEach(([id, d]) => {
    if (id === 'reception-desk') return;
    drawDesk(ctx, d.x, d.y);
    drawChair(ctx, d.x + 26, d.y + 50, 'down');
  });

  // CEO Cabin
  drawCEOCabin(ctx, bCEO.x, bCEO.y, bCEO.w, bCEO.h);
  px(ctx, bCEO.x + bCEO.w, bCEO.y + 55, 4, 32, '#d4af37');

  // ── CONFERENCE TABLE (replaces old ellipse) ───────────────────────────────
  const tcx = bMeet.x + bMeet.w / 2;
  const tcy = bMeet.y + bMeet.h * 0.55;
  const tw = bMeet.w * 0.72;
  const th = bMeet.h * 0.32;
  drawConferenceTable(ctx, tcx, tcy, tw, th);

  // Plants in meeting room corners
  drawPlant(ctx, bMeet.x + 6, bMeet.y + bMeet.h - 38);
  drawPlant(ctx, bMeet.x + bMeet.w - 30, bMeet.y + bMeet.h - 38);

  // ── RECEPTION — organized counter + lady receptionist ────────────────────
  const rcx = bRecep.x + 16;
  const rcy = bRecep.y + bRecep.h * 0.55;
  drawReceptionCounter(ctx, rcx, rcy, bRecep.w - 32);

  // Lady receptionist behind counter
  drawReceptionist(ctx, rcx + 20, rcy - 55);

  // Waiting area chairs in reception
  const waitY = bRecep.y + 28;
  [0, 1, 2].forEach(i => {
    drawChair(ctx, bRecep.x + 20 + i * 30, waitY, 'down');
  });

  // Small coffee table in waiting area
  px(ctx, bRecep.x + 20, waitY + 26, 72, 14, '#5a3820');
  px(ctx, bRecep.x + 22, waitY + 27, 68, 10, '#7a5030');

  // trx / try_ kept for backward compat — callers use these for meeting spots
  const trx = tw / 2;
  const try_ = th / 2;

  return { splitX: bMeet.x, splitY: bMeet.y, tcx, tcy, trx, try_ };
}
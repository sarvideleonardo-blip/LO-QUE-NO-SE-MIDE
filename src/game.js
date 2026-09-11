const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');

const ui = {
  tools: [...document.querySelectorAll('.tool')],
  selectedTool: document.querySelector('#selected-tool'),
  saved: document.querySelector('#saved-count'),
  alive: document.querySelector('#alive-count'),
  timer: document.querySelector('#timer'),
  target: document.querySelector('#target-count'),
  restart: document.querySelector('#restart'),
};

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PIXEL = 3;
const TERRAIN_W = Math.ceil(WIDTH / PIXEL);
const TERRAIN_H = Math.ceil(HEIGHT / PIXEL);
const TOTAL_ZOMBIES = 14;
const TARGET_SAVED = 8;
const SPAWN_INTERVAL = 1500;
const GRAVITY = 0.115;
const LOW_GRAVITY_CAP = 3.2;
const SAFE_FALL_SPEED = 2.05;

const toolNames = {
  walker: 'Caminante',
  blocker: 'Bloqueador',
  builder: 'Constructor',
  digger: 'Excavador',
  floater: 'Flotador',
};

const state = {
  selectedTool: 'walker',
  zombies: [],
  terrain: createTerrain(),
  spawnTimer: 0,
  spawned: 0,
  saved: 0,
  lost: 0,
  elapsed: 0,
  gameOver: false,
  message: '',
};

ui.target.textContent = TARGET_SAVED;

ui.tools.forEach((button) => {
  button.addEventListener('click', () => {
    state.selectedTool = button.dataset.tool;
    ui.tools.forEach((tool) => tool.classList.toggle('active', tool === button));
    ui.selectedTool.textContent = toolNames[state.selectedTool];
  });
});

ui.restart.addEventListener('click', resetGame);
canvas.addEventListener('click', assignTool);

let previous = performance.now();
requestAnimationFrame(loop);

function createTerrain() {
  const terrain = new Uint8Array(TERRAIN_W * TERRAIN_H);

  for (let x = 0; x < TERRAIN_W; x += 1) {
    const worldX = x * PIXEL;
    const ridge = 386 + Math.sin(worldX * 0.015) * 24 + Math.sin(worldX * 0.043) * 9;
    const plateau = worldX > 92 && worldX < 222 ? 335 : 0;
    const portalRamp = worldX > 760 ? -44 : 0;
    const height = Math.floor((ridge - plateau + portalRamp) / PIXEL);

    for (let y = height; y < TERRAIN_H; y += 1) {
      terrain[y * TERRAIN_W + x] = 1;
    }
  }

  carveCircle(terrain, 430, 354, 54);
  carveCircle(terrain, 598, 373, 39);
  addSolidRect(terrain, 0, 420, WIDTH, 120);
  addSolidRect(terrain, 112, 336, 94, 18);
  addSolidRect(terrain, 800, 311, 94, 24);
  return terrain;
}

function resetGame() {
  state.zombies = [];
  state.terrain = createTerrain();
  state.spawnTimer = 0;
  state.spawned = 0;
  state.saved = 0;
  state.lost = 0;
  state.elapsed = 0;
  state.gameOver = false;
  state.message = '';
  previous = performance.now();
}

function loop(now) {
  const dt = Math.min((now - previous) / 16.6667, 3);
  previous = now;

  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function update(dt) {
  if (!state.gameOver) {
    state.elapsed += dt / 60;
    state.spawnTimer += dt * 16.6667;

    if (state.spawned < TOTAL_ZOMBIES && state.spawnTimer >= SPAWN_INTERVAL) {
      state.spawnTimer = 0;
      spawnZombie();
    }

    if (state.spawned === 0) spawnZombie();

    state.zombies.forEach((zombie) => updateZombie(zombie, dt));
    state.zombies = state.zombies.filter((zombie) => zombie.active);
    checkOutcome();
  }

  ui.saved.textContent = state.saved;
  ui.alive.textContent = state.zombies.length;
  ui.timer.textContent = formatTime(state.elapsed);
}

function spawnZombie() {
  state.spawned += 1;
  state.zombies.push({
    id: state.spawned,
    x: 138,
    y: 292,
    vx: 0.62,
    vy: 0,
    dir: 1,
    role: 'walker',
    active: true,
    onGround: false,
    buildSteps: 0,
    buildCooldown: 0,
    fallPeak: 0,
    blink: Math.random() * Math.PI * 2,
  });
}

function updateZombie(zombie, dt) {
  zombie.blink += dt * 0.08;

  if (zombie.role === 'blocker') {
    zombie.vx = 0;
    zombie.vy += GRAVITY * dt;
    moveVertical(zombie, dt);
    repelWalkers(zombie);
    return;
  }

  if (zombie.role === 'builder') buildBridge(zombie, dt);
  if (zombie.role === 'digger') digBelow(zombie);

  const desiredSpeed = zombie.role === 'digger' ? 0.35 : 0.68;
  zombie.vx = zombie.dir * desiredSpeed;
  zombie.vy += GRAVITY * dt;

  if (zombie.role === 'floater' && zombie.vy > 1.1) zombie.vy = 1.1;
  if (zombie.vy > LOW_GRAVITY_CAP) zombie.vy = LOW_GRAVITY_CAP;

  moveHorizontal(zombie, dt);
  moveVertical(zombie, dt);

  if (zombie.y > HEIGHT + 24) loseZombie(zombie);
  if (zombie.x > 826 && zombie.x < 884 && zombie.y > 250 && zombie.y < 338) saveZombie(zombie);
}

function moveHorizontal(zombie, dt) {
  const nextX = zombie.x + zombie.vx * dt;
  const footY = zombie.y + 15;
  const headY = zombie.y - 13;
  const frontX = nextX + zombie.dir * 8;

  if (isSolid(frontX, footY) || isSolid(frontX, zombie.y) || isSolid(frontX, headY)) {
    zombie.dir *= -1;
    zombie.vx = 0;
    return;
  }

  zombie.x = nextX;
}

function moveVertical(zombie, dt) {
  const previousVy = zombie.vy;
  let nextY = zombie.y + zombie.vy * dt;
  const falling = zombie.vy > 0;

  if (falling && (isSolid(zombie.x - 5, nextY + 16) || isSolid(zombie.x + 5, nextY + 16))) {
    while (!isSolid(zombie.x, zombie.y + 16) && zombie.y < HEIGHT) zombie.y += 1;
    zombie.y = Math.floor(zombie.y);
    zombie.onGround = true;

    if (previousVy > SAFE_FALL_SPEED && zombie.role !== 'floater') {
      zombie.dir *= -1;
      zombie.role = 'walker';
      zombie.vy = -1.35;
    } else {
      zombie.vy = 0;
    }
    return;
  }

  if (!falling && (isSolid(zombie.x - 5, nextY - 15) || isSolid(zombie.x + 5, nextY - 15))) {
    zombie.vy = 0;
    return;
  }

  zombie.y = nextY;
  zombie.onGround = false;
}

function buildBridge(zombie, dt) {
  zombie.buildCooldown -= dt;
  if (zombie.buildSteps >= 14) {
    zombie.role = 'walker';
    return;
  }

  if (zombie.buildCooldown <= 0 && zombie.onGround) {
    const bx = zombie.x + zombie.dir * (14 + zombie.buildSteps * 3);
    const by = zombie.y + 18 - zombie.buildSteps * 2.1;
    addSolidRect(state.terrain, bx, by, 20, 8);
    zombie.buildSteps += 1;
    zombie.buildCooldown = 7;
  }
}

function digBelow(zombie) {
  if (!zombie.onGround) return;
  carveCircle(state.terrain, zombie.x, zombie.y + 18, 13);
  carveCircle(state.terrain, zombie.x + zombie.dir * 8, zombie.y + 13, 10);
}

function repelWalkers(blocker) {
  state.zombies.forEach((other) => {
    if (other === blocker || !other.active || other.role === 'blocker') return;
    const close = Math.abs(other.x - blocker.x) < 22 && Math.abs(other.y - blocker.y) < 28;
    if (close) other.dir = other.x < blocker.x ? -1 : 1;
  });
}

function assignTool(event) {
  if (state.gameOver) return;
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
  const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
  const zombie = [...state.zombies]
    .reverse()
    .find((candidate) => Math.hypot(candidate.x - x, candidate.y - y) < 24);

  if (!zombie) return;

  zombie.role = state.selectedTool;
  zombie.buildSteps = 0;
  zombie.buildCooldown = 0;

  if (state.selectedTool === 'walker') zombie.vx = zombie.dir * 0.68;
  if (state.selectedTool === 'floater') zombie.vy = Math.min(zombie.vy, 0.9);
}

function saveZombie(zombie) {
  zombie.active = false;
  state.saved += 1;
}

function loseZombie(zombie) {
  zombie.active = false;
  state.lost += 1;
}

function checkOutcome() {
  if (state.saved >= TARGET_SAVED) {
    state.gameOver = true;
    state.message = '¡Misión cumplida! La horda lunar alcanzó el portal.';
  } else if (state.spawned >= TOTAL_ZOMBIES && state.zombies.length === 0) {
    state.gameOver = true;
    state.message = 'Misión fallida: faltaron zombies por rescatar.';
  }
}

function draw() {
  drawSky();
  drawTerrain();
  drawStructures();
  state.zombies.forEach(drawZombie);
  drawOverlay();
}

function drawSky() {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#080b1f');
  gradient.addColorStop(0.58, '#11183a');
  gradient.addColorStop(1, '#1c1f34');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  for (let i = 0; i < 80; i += 1) {
    const x = (i * 113) % WIDTH;
    const y = (i * 67) % 260;
    ctx.fillRect(x, y, i % 4 === 0 ? 2 : 1, i % 5 === 0 ? 2 : 1);
  }

  ctx.beginPath();
  ctx.arc(742, 100, 52, 0, Math.PI * 2);
  ctx.fillStyle = '#d7e3ff';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(724, 88, 12, 0, Math.PI * 2);
  ctx.arc(768, 118, 9, 0, Math.PI * 2);
  ctx.arc(746, 132, 7, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(70, 82, 120, 0.26)';
  ctx.fill();
}

function drawTerrain() {
  for (let y = 0; y < TERRAIN_H; y += 1) {
    for (let x = 0; x < TERRAIN_W; x += 1) {
      if (!state.terrain[y * TERRAIN_W + x]) continue;
      const worldY = y * PIXEL;
      ctx.fillStyle = worldY < 380 ? '#69708d' : '#464b62';
      ctx.fillRect(x * PIXEL, worldY, PIXEL, PIXEL);
    }
  }

  ctx.fillStyle = 'rgba(124, 255, 203, 0.12)';
  ctx.fillRect(0, 420, WIDTH, 2);
}

function drawStructures() {
  ctx.fillStyle = '#1b203f';
  ctx.fillRect(96, 258, 72, 82);
  ctx.fillStyle = '#7cffcb';
  ctx.fillRect(118, 278, 28, 20);
  ctx.fillStyle = '#ccd6ff';
  ctx.fillText('ESCLUSA', 104, 252);

  const pulse = 0.55 + Math.sin(state.elapsed * 4) * 0.2;
  ctx.save();
  ctx.globalAlpha = pulse;
  ctx.fillStyle = '#7cffcb';
  ctx.beginPath();
  ctx.ellipse(858, 284, 34, 62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.strokeStyle = '#d7ffee';
  ctx.lineWidth = 5;
  ctx.strokeRect(822, 220, 72, 126);
  ctx.fillStyle = '#ccd6ff';
  ctx.fillText('PORTAL', 834, 208);
}

function drawZombie(zombie) {
  ctx.save();
  ctx.translate(zombie.x, zombie.y);

  if (zombie.role === 'blocker') {
    ctx.fillStyle = 'rgba(255, 209, 102, 0.28)';
    ctx.fillRect(-18, -10, 36, 25);
  }

  if (zombie.role === 'floater') {
    ctx.strokeStyle = '#ffd166';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -24, 17, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(0, -11);
    ctx.stroke();
  }

  ctx.fillStyle = '#8cff72';
  ctx.beginPath();
  ctx.arc(0, -11, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#5dd15f';
  ctx.fillRect(-8, -4, 16, 22);

  ctx.fillStyle = '#151823';
  ctx.fillRect(zombie.dir > 0 ? 2 : -6, -13, 3, 3);
  ctx.fillStyle = '#bf7cff';
  ctx.fillRect(-7, 4, 14, 4);

  const step = Math.sin(zombie.blink) * 4;
  ctx.strokeStyle = '#8cff72';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-5, 18);
  ctx.lineTo(-8, 27 + step);
  ctx.moveTo(5, 18);
  ctx.lineTo(8, 27 - step);
  ctx.moveTo(-7, 3);
  ctx.lineTo(-14, 10 - step);
  ctx.moveTo(7, 3);
  ctx.lineTo(14, 10 + step);
  ctx.stroke();

  if (zombie.role === 'digger') {
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(zombie.dir * 10, 8, 16 * zombie.dir, 4);
  }

  ctx.restore();
}

function drawOverlay() {
  if (!state.gameOver) return;
  ctx.fillStyle = 'rgba(8, 9, 20, 0.72)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#f5f7ff';
  ctx.textAlign = 'center';
  ctx.font = '700 42px system-ui, sans-serif';
  ctx.fillText(state.message, WIDTH / 2, HEIGHT / 2 - 12);
  ctx.font = '500 20px system-ui, sans-serif';
  ctx.fillStyle = '#aeb6d9';
  ctx.fillText('Pulsa Reiniciar para intentar otra ruta.', WIDTH / 2, HEIGHT / 2 + 28);
  ctx.textAlign = 'left';
}

function isSolid(x, y) {
  const tx = Math.floor(x / PIXEL);
  const ty = Math.floor(y / PIXEL);
  if (tx < 0 || tx >= TERRAIN_W || ty < 0) return false;
  if (ty >= TERRAIN_H) return true;
  return state.terrain[ty * TERRAIN_W + tx] === 1;
}

function carveCircle(terrain, cx, cy, radius) {
  const minX = Math.max(0, Math.floor((cx - radius) / PIXEL));
  const maxX = Math.min(TERRAIN_W - 1, Math.ceil((cx + radius) / PIXEL));
  const minY = Math.max(0, Math.floor((cy - radius) / PIXEL));
  const maxY = Math.min(TERRAIN_H - 1, Math.ceil((cy + radius) / PIXEL));

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const dx = x * PIXEL - cx;
      const dy = y * PIXEL - cy;
      if (dx * dx + dy * dy <= radius * radius) terrain[y * TERRAIN_W + x] = 0;
    }
  }
}

function addSolidRect(terrain, x, y, width, height) {
  const minX = Math.max(0, Math.floor(x / PIXEL));
  const maxX = Math.min(TERRAIN_W - 1, Math.ceil((x + width) / PIXEL));
  const minY = Math.max(0, Math.floor(y / PIXEL));
  const maxY = Math.min(TERRAIN_H - 1, Math.ceil((y + height) / PIXEL));

  for (let ty = minY; ty <= maxY; ty += 1) {
    for (let tx = minX; tx <= maxX; tx += 1) {
      terrain[ty * TERRAIN_W + tx] = 1;
    }
  }
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${secs}`;
}

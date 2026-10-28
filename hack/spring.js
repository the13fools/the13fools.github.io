// These are the two knobs. Change one, then Run preview.
const stiffness = 22;   // stronger spring → faster oscillation
const damping = 1.3;    // larger damping → settles sooner

const canvas = document.querySelector('#spring');
const ctx = canvas.getContext('2d');
const readout = document.querySelector('#readout');
let x = 0.30, velocity = 0, dragging = false, previous = 0;

function move(event) {
  const box = canvas.getBoundingClientRect();
  x = Math.max(-0.35, Math.min(0.35, (event.clientX - box.left) / box.width - 0.58));
  velocity = 0;
}
canvas.addEventListener('pointerdown', event => {
  dragging = true;
  canvas.setPointerCapture(event.pointerId);
  move(event);
});
canvas.addEventListener('pointermove', event => { if (dragging) move(event); });
for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  canvas.addEventListener(name, () => { dragging = false; });
}
canvas.addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    x = Math.max(-0.35, Math.min(0.35, x + (event.key === 'ArrowRight' ? 0.08 : -0.08)));
    velocity = 0;
  }
});
function draw(now) {
  const dt = previous ? Math.min((now - previous) / 1000, 0.035) : 0;
  previous = now;
  // Semi-implicit Euler: update velocity, then position.
  // Small substeps keep the starter spring stable after a slow frame.
  if (!dragging) for (let i = 0; i < 4; i++) {
    velocity += (-stiffness * x - damping * velocity) * dt / 4;
    x += velocity * dt / 4;
  }
  const box = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, box.width, box.height);
  const left = 30, right = box.width * (0.58 + x), y = box.height * 0.48;
  ctx.strokeStyle = '#242047'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(left, y - 45); ctx.lineTo(left, y + 45); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(left, y);
  for (let i = 1; i < 25; i++) ctx.lineTo(left + (right - left - 22) * i / 24, y + (i === 24 ? 0 : (i % 2 ? -12 : 12)));
  ctx.lineTo(right, y); ctx.stroke();
  ctx.beginPath(); ctx.arc(right, y, 21, 0, Math.PI * 2);
  ctx.fillStyle = '#ff8fc3'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#242047'; ctx.font = '12px monospace';
  ctx.fillText(dragging ? 'LET GO!' : 'pull me ↔', 20, box.height - 25);
  readout.textContent = `displacement ${x.toFixed(3)} · stiffness ${stiffness} · damping ${damping}`;
  requestAnimationFrame(draw);
}
requestAnimationFrame(draw);
console.log('One spring. Two editable knobs.');

import { coneChartPoint } from "./cone-geometry.js";

function initCone() {
  const original = document.getElementById("cone-original");
  const resolved = document.getElementById("cone-resolved");
  if (!original || !resolved) return;
  const uInput = document.getElementById("cone-u");
  const thetaInput = document.getElementById("cone-theta");
  const viewInput = document.getElementById("cone-view");
  let yaw = 28 * Math.PI / 180, pitch = -0.3;
  let drag = null;

  function draw(canvas, isResolved, selected) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
    const W = rect.width, H = rect.height;
    const style = getComputedStyle(document.documentElement);
    const color = name => style.getPropertyValue(name).trim();
    ctx.fillStyle = color("--surface");
    ctx.fillRect(0, 0, W, H);
    const project = ([x, y, z]) => {
      // The third chart coordinate is vertical on the page.
      const a = x * Math.cos(yaw) - y * Math.sin(yaw);
      const b = x * Math.sin(yaw) + y * Math.cos(yaw);
      const vertical = z * Math.cos(pitch) - b * Math.sin(pitch);
      const depth = z * Math.sin(pitch) + b * Math.cos(pitch);
      const scale = Math.min(W, H) * 0.28;
      return [W / 2 + scale * a, H / 2 - scale * vertical, depth];
    };
    const point = (u, theta) => {
      const p = coneChartPoint(u, theta);
      return project(isResolved ? p.resolved : p.original);
    };
    const path = pts => {
      ctx.beginPath();
      pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    };
    const quads = [], rows = 32, columns = 64;
    for (let i = 0; i < rows; i++) {
      const u0 = -1.2 + 2.4 * i / rows, u1 = -1.2 + 2.4 * (i + 1) / rows;
      for (let j = 0; j < columns; j++) {
        const t0 = 2 * Math.PI * j / columns, t1 = 2 * Math.PI * (j + 1) / columns;
        const pts = [point(u0, t0), point(u1, t0), point(u1, t1), point(u0, t1)];
        quads.push({ pts, depth: pts.reduce((n, p) => n + p[2], 0) / 4, theta: (t0 + t1) / 2 });
      }
    }
    quads.sort((a, b) => a.depth - b.depth);
    for (const q of quads) {
      path(q.pts); ctx.closePath();
      const light = 48 + 12 * Math.cos(q.theta + yaw - 0.8);
      ctx.fillStyle = `hsl(${isResolved ? 263 : 211} 42% ${light}%)`;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.16)";
      ctx.lineWidth = 0.5; ctx.stroke();
    }
    // The exceptional fiber and the selected direction are intentionally drawn
    // as overlays so the entire circle remains legible through the surface.
    if (isResolved) {
      path(Array.from({ length: 129 }, (_, j) => point(0, 2 * Math.PI * j / 128)));
      ctx.strokeStyle = color("--blow"); ctx.lineWidth = 4; ctx.stroke();
    }
    path([point(-1.2, selected.theta), point(1.2, selected.theta)]);
    ctx.strokeStyle = color("--cold"); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
    const dot = point(selected.u, selected.theta);
    ctx.beginPath(); ctx.arc(dot[0], dot[1], 6, 0, 2 * Math.PI);
    ctx.fillStyle = color("--cold"); ctx.fill();
    ctx.strokeStyle = color("--surface"); ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "12px system-ui, sans-serif";
    ctx.fillStyle = color("--muted");
    ctx.fillText(isResolved ? "u (vertical) · v, w (horizontal)" : "Z (vertical) · X, Y (horizontal)", 12, H - 12);
  }

  function update() {
    const u = Number(uInput.value), degrees = Number(thetaInput.value), theta = degrees * Math.PI / 180;
    document.getElementById("cone-u-out").textContent = u.toFixed(2);
    document.getElementById("cone-theta-out").textContent = `${degrees}°`;
    document.getElementById("cone-view-out").textContent = `${viewInput.value}°`;
    const { resolved: r, original: p } = coneChartPoint(u, theta);
    const fmt = a => a.map(x => (Math.abs(x) < 0.0005 ? 0 : x).toFixed(2)).join(", ");
    document.getElementById("cone-point").textContent =
      `(v, w, u) = (${fmt(r)}) → (X, Y, Z) = (${fmt(p)}). ` +
      (u === 0 ? "On the exceptional circle: every direction maps to the apex." : "Away from the exceptional circle: v = X/Z and w = Y/Z recover the direction.");
    draw(original, false, { u, theta });
    draw(resolved, true, { u, theta });
  }
  for (const input of [uInput, thetaInput]) input.addEventListener("input", update);
  viewInput.addEventListener("input", () => { yaw = Number(viewInput.value) * Math.PI / 180; update(); });
  document.getElementById("cone-exceptional").addEventListener("click", () => { uInput.value = "0"; update(); });
  document.getElementById("cone-reset").addEventListener("click", () => {
    uInput.value = "0.6"; thetaInput.value = "45"; viewInput.value = "28";
    yaw = 28 * Math.PI / 180; pitch = -0.3; update();
  });
  for (const canvas of [original, resolved]) {
    canvas.addEventListener("pointerdown", e => {
      drag = { x: e.clientX, y: e.clientY, pointer: e.pointerId, canvas };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", e => {
      if (!drag || drag.canvas !== canvas || drag.pointer !== e.pointerId) return;
      yaw += (e.clientX - drag.x) * 0.008;
      yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
      pitch = Math.max(-1.2, Math.min(1.2, pitch + (e.clientY - drag.y) * 0.008));
      drag.x = e.clientX; drag.y = e.clientY;
      viewInput.value = String(Math.round(yaw * 180 / Math.PI)); update();
    });
    for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(event, () => { drag = null; });
  }
  new ResizeObserver(update).observe(original.parentElement);
  new ResizeObserver(update).observe(resolved.parentElement);
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", update);
  update();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initCone);
else initCone();

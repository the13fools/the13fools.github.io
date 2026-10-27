import { CUSP_CHARTS,HARD_CUSP_CHARTS } from "./resolution-geometry.js";
(() => {
  "use strict";
  const { isOn } = window.__E;
  const { $, E, C, rgb, mix, css, clamp, isDark, cvs, sup, fmt, T, seg, hsv, frame, pathD, ring, modPi, dirRGB, dirCol, arrow } = window.__E;

  // ============================================================ tiny 3D view
  function View(canvas, build) {
    if (!canvas) { this.c = null; return; }
    this.c = canvas; this.ctx = canvas.getContext("2d"); this.build = build; this.yaw = -0.6; this.pitch = 0.5;
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, yaw: this.yaw, pitch: this.pitch }; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointermove", (e) => { if (!drag) return; this.yaw = drag.yaw + (e.clientX - drag.x) * 0.01; this.pitch = clamp(drag.pitch + (e.clientY - drag.y) * 0.01, -1.3, 1.45); this.draw(); });
    const end = () => { drag = null; }; canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", end);
    canvas.addEventListener("keydown", (e) => { const k = { ArrowLeft: [-0.12, 0], ArrowRight: [0.12, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] }[e.key]; if (!k) return; e.preventDefault(); this.yaw += k[0]; this.pitch = clamp(this.pitch + k[1], -1.3, 1.45); this.draw(); });
  }
  View.prototype.draw = function () {
    if (!this.c) return;
    const { ctx, W, H, d } = cvs(this.c), sc = this.build();
    ctx.clearRect(0, 0, W, H);
    const S = Math.min(W, H) / (2 * sc.radius) * (W > H ? 1.15 : 1), cy = Math.cos(this.yaw), sy = Math.sin(this.yaw), cp = Math.cos(this.pitch), sp = Math.sin(this.pitch);
    const P = (p) => { const x1 = p[0] * cy - p[1] * sy, y1 = p[0] * sy + p[1] * cy, z1 = p[2], y2 = y1 * cp - z1 * sp, z2 = y1 * sp + z1 * cp; return [W / 2 + x1 * S, H / 2 + 0.06 * H - z2 * S, y2]; };
    const items = [];
    for (const l of sc.lines) { const a = P(l.a), b = P(l.b); items.push({ k: 0, d: (a[2] + b[2]) / 2 + (l.top ? -50 : 0), a, b, l }); }
    for (const q of sc.points || []) { const a = P(q.p); items.push({ k: 1, d: a[2] - 0.02 + (q.top ? -50 : 0), a, q }); }
    for (const q of sc.quads || []) { const pp = q.pts.map(P); items.push({ k: 2, d: pp.reduce((s, v) => s + v[2], 0) / pp.length, pp, q }); }
    items.sort((p, q) => q.d - p.d);
    ctx.lineCap = "round";
    for (const it of items) {
      if (it.k === 0) { const l = it.l; ctx.globalAlpha = l.alpha == null ? 1 : l.alpha; ctx.strokeStyle = l.col; ctx.lineWidth = (l.w || 1.5) * d; ctx.setLineDash(l.dash ? l.dash.map((v) => v * d) : []); ctx.beginPath(); ctx.moveTo(it.a[0], it.a[1]); ctx.lineTo(it.b[0], it.b[1]); ctx.stroke(); ctx.setLineDash([]); }
      else if (it.k === 2) { const q = it.q; ctx.globalAlpha = q.alpha == null ? 1 : q.alpha; ctx.fillStyle = q.col; ctx.beginPath(); it.pp.forEach((v, i) => (i ? ctx.lineTo(v[0], v[1]) : ctx.moveTo(v[0], v[1]))); ctx.closePath(); ctx.fill(); if (q.edge) { ctx.strokeStyle = q.edge; ctx.lineWidth = 0.6 * d; ctx.stroke(); } }
      else { const q = it.q; ctx.globalAlpha = 1; ctx.fillStyle = q.col; ctx.beginPath(); ctx.arc(it.a[0], it.a[1], (q.r || 4) * d, 0, 2 * Math.PI); ctx.fill(); if (q.ring) { ctx.strokeStyle = q.ring; ctx.lineWidth = 2 * d; ctx.stroke(); } }
    }
    ctx.globalAlpha = 1;
    (sc.labels || []).forEach((L) => { const a = P(L.p); ctx.font = `600 ${12.5 * d}px "Schibsted Grotesk", sans-serif`; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.surface; ctx.strokeText(L.s, a[0] + 8 * d, a[1] - 6 * d); ctx.fillStyle = L.col; ctx.fillText(L.s, a[0] + 8 * d, a[1] - 6 * d); });
  };

  // ============================================================ Figure 7: lift a curve
  const F7 = { c: "cross", b: "h" };
  function f7branches(c) {
    const out = [];
    if (c === "cross") [1, -1].forEach((sg) => { const b = []; for (let i = 0; i <= 160; i++) { const x = -1.1 + 2.2 * i / 160; b.push({ x, y: sg * x, tx: 1, ty: sg }); } out.push(b); });
    else if (c === "cusp") { const b = []; for (let i = 0; i <= 240; i++) { const s = -1.05 + 2.1 * i / 240; b.push({ x: s * s, y: s * s * s, tx: 2 * s, ty: 3 * s * s, s }); } out.push(b); }
    else [1, -1].forEach((sg) => { const b = []; for (let i = 0; i <= 160; i++) { const x = -1.1 + 2.2 * i / 160; b.push({ x, y: sg * x * x, tx: 1, ty: sg * 2 * x }); } out.push(b); });
    return out;
  }
  function f7angle(p, b, c) {
    if (b === "n") { if (c === "cusp") return Math.atan(1.5 * p.s); return Math.atan2(p.ty, p.tx); }
    if (Math.hypot(p.x, p.y) < 1e-9) return null;
    if (c === "cusp") return Math.atan(p.s); // y/x = s, continuous through the tip
    return modPi(Math.atan2(p.y, p.x));
  }
  const HZ = 0.95;
  function f7build() {
    const lines = [], points = [], labels = [], R = 1.25;
    const sq = [[-R, -R], [R, -R], [R, R], [-R, R]];
    sq.forEach((c, i) => { const d = sq[(i + 1) % 4]; lines.push({ a: [c[0], c[1], 0], b: [d[0], d[1], 0], col: C.rule, w: 1 }); });
    lines.push({ a: [-R, 0, 0], b: [R, 0, 0], col: C.rule, w: 1, alpha: 0.7 }); lines.push({ a: [0, -R, 0], b: [0, R, 0], col: C.rule, w: 1, alpha: 0.7 });
    // the direction field being recorded, drawn on the floor
    const gf = { cross: (x, y) => [-2 * x, 2 * y], cusp: (x, y) => [-3 * x * x, 2 * y], tan: (x, y) => [-4 * x ** 3, 2 * y] }[F7.c];
    for (let i = 0; i < 11; i++) for (let j = 0; j < 11; j++) {
      const x = -1.1 + 2.2 * (i + 0.5) / 11, y = -1.1 + 2.2 * (j + 0.5) / 11; let ang;
      if (F7.b === "h") ang = Math.atan2(y, x); else { const g = gf(x, y); if (Math.hypot(g[0], g[1]) < 1e-6) continue; ang = Math.atan2(g[0], -g[1]); }
      const L = 0.075, dx = L * Math.cos(ang), dy = L * Math.sin(ang);
      lines.push({ a: [x - dx, y - dy, 0], b: [x + dx, y + dy, 0], col: dirCol(ang), w: 1.8, alpha: 0.6 });
    }
    for (const br of f7branches(F7.c)) {
      let prev = null;
      for (const p of br) {
        const a = f7angle(p, F7.b, F7.c);
        if (a === null) { prev = null; continue; }
        const cur = { flat: [p.x, p.y, 0], up: [p.x, p.y, HZ * a / (Math.PI / 2)], col: dirCol(a) };
        if (prev) { lines.push({ a: prev.flat, b: cur.flat, col: C.muted, w: 2, alpha: 0.75 }); lines.push({ a: prev.up, b: cur.up, col: prev.col, w: 3.6 }); }
        prev = cur;
      }
      if (prev) labels.push({ p: prev.up, s: `${Math.round(prev.up[2] / HZ * 90)}°`.replace("-", "−"), col: prev.col });
    }
    if (F7.b === "h") {
      lines.push({ a: [0, 0, -HZ], b: [0, 0, HZ], col: C.blow, w: 4.5, alpha: 0.9 });
      labels.push({ p: [0, 0, HZ], s: "E: all directions at the center", col: C.blow });
    } else lines.push({ a: [0, 0, -HZ], b: [0, 0, HZ], col: C.steel, w: 1, dash: [4, 4], alpha: 0.7 });
    points.push({ p: [0, 0, 0], col: C.bad, r: 4.5 });
    if (F7.c === "cusp" && F7.b === "h") points.push({ p: [0, 0, 0], col: C.surface, r: 7, ring: C.bad, top: true });
    if (F7.c === "tan") points.push({ p: [0, 0, 0], col: C.surface, r: 7, ring: C.bad, top: true });
    labels.push({ p: [R, -R, 0], s: "the plane (x, y)", col: C.muted });
    const msg = {
      cross: { h: "Directions from the center: +45° and −45°. <b>Separated.</b>", n: "Tangent directions: +45° and −45°. <b>Separated.</b>" },
      cusp: { h: "One smooth curve, but it <b>touches E</b> (red ring) instead of crossing it: more steps needed.", n: "Tangent slope 3τ/2 changes smoothly through the tip: <b>one smooth curve</b>." },
      tan: { h: "Both curves point horizontally at the center: <b>they still meet</b> (red ring), now crossing at an angle.", n: "Slopes ±2x are both 0 at the center: <b>they still meet</b> (red ring), now crossing at an angle." },
    }[F7.c][F7.b];
    $("#f7-tag").innerHTML = msg;
    return { radius: 1.55, lines, points, labels };
  }
  const v7 = new View($("#f7"), f7build);
  seg("#f7-c", (v) => { F7.c = v; v7.draw(); });
  seg("#f7-b", (v) => { F7.b = v; v7.draw(); });

  // ============================================================ chart pictures (Figures 8 and 10)
  const line = (x0, y0, x1, y1) => [[x0, y0], [x1, y1]];
  const vline = (x, lab) => ({ pts: line(x, -9, x, 9), lab, lx: x, ly: null });
  const hline = (y, lab) => ({ pts: line(-9, y, 9, y), lab, lx: null, ly: y });
  const par = (f, a, b) => { const p = []; for (let i = 0; i <= 160; i++) { const s = a + (b - a) * i / 160; p.push(f(s)); } return p; };
  const CH = {
    cross: [
      { h: "Start: the plane (x, y)", xr: [-1.1, 1.1], yr: [-1.1, 1.1], xl: "x", yl: "y", cv: [line(-2, -2, 2, 2), line(-2, 2, 2, -2)], ex: [], bad: [[0, 0]], good: [],
        alg: "f = y² − x² = (y − x)(y + x)<br>order 2 at the origin: <b>singular</b>", cap: "Two lines through one point. Blow up that point." },
      { h: "After one blowup: chart y = x·t", xr: [-1.1, 1.1], yr: [-1.7, 1.7], xl: "x", yl: "t = y/x", cv: [line(-2, 1, 2, 1), line(-2, -1, 2, -1)], ex: [vline(0, "E")], bad: [], good: [[0, 1], [0, -1]],
        alg: "substitute y = x·t:<br>(xt)² − x² = <b>x²</b>·(t² − 1)<br>x² : the exceptional curve E, counted twice<br>t² − 1 : the strict transform, t = ±1", cap: "Done in one step. The lines become t = 1 and t = −1, which cross E at different points, cleanly." },
    ],
    cusp: [
      { h: "Start: the plane (x, y)", xr: [-0.35, 1.25], yr: [-1.1, 1.1], xl: "x", yl: "y", cv: [par((s) => [s * s, s * s * s], -1.1, 1.1)], ex: [], bad: [[0, 0]], good: [],
        alg: "f = y² − x³<br>order 2 at the origin: <b>singular</b>", cap: "One branch with a spike at the origin. Blow up the origin." },
      { h: "Blowup 1: chart y = x·t", xr: [-0.35, 1.25], yr: [-1.2, 1.2], xl: "x", yl: "t = y/x", cv: [par((s) => [s * s, s], -1.2, 1.2)], ex: [vline(0, "E₁")], bad: [[0, 0]], good: [],
        alg: "substitute y = x·t:<br>(xt)² − x³ = <b>x²</b>·(t² − x)<br>strict transform: x = t², <b>smooth</b><br>but tangent to E₁ at the origin", cap: "The curve is now smooth, but it touches E₁ instead of crossing it. Not normal crossings yet." },
      { h: "Blowup 2: chart x = t·s", xr: [-1.1, 1.1], yr: [-1.1, 1.1], xl: "t", yl: "s = x/t", cv: [line(-2, -2, 2, 2)], ex: [vline(0, "E₂"), hline(0, "E₁")], bad: [[0, 0]], good: [],
        alg: "substitute x = t·s:<br>x²(t² − x) = t²s²·(t² − ts)<br>= <b>t³ s²</b>·(t − s)<br>E₂: t = 0, E₁: s = 0, curve: s = t", cap: "Each pair now crosses at an angle, but all three pass through one point. Still not normal crossings." },
      { h: "Blowup 3: chart s = t·w", xr: [-1.1, 1.1], yr: [-0.75, 1.75], xl: "t", yl: "w = s/t", cv: [line(-2, 1, 2, 1)], ex: [vline(0, "E₃"), hline(0, "E₁")], bad: [], good: [[0, 0], [0, 1]],
        alg: "substitute s = t·w:<br>t³s²(t − s) = t³·t²w²·(t − tw)<br>= <b>t⁶ w²</b>·(1 − w)<br>E₃: t = 0, E₁: w = 0, curve: w = 1<br>(E₂ is at w = ∞, in the other chart)", cap: "Normal crossings. At most two curves meet at any point, crossing like coordinate axes, and the whole function is a monomial t⁶w² times 1 − w, which doesn't vanish near E₃ except where the curve crosses it." },
    ],
    tan: [
      { h: "Start: the plane (x, y)", xr: [-1.1, 1.1], yr: [-1.1, 1.1], xl: "x", yl: "y", cv: [par((x) => [x, x * x], -1.2, 1.2), par((x) => [x, -x * x], -1.2, 1.2)], ex: [], bad: [[0, 0]], good: [],
        alg: "f = y² − x⁴ = (y − x²)(y + x²)<br>order 2 at the origin: <b>singular</b>", cap: "Two curves touching at the origin, with the same tangent line." },
      { h: "Blowup 1: chart y = x·t", xr: [-1.1, 1.1], yr: [-1.1, 1.1], xl: "x", yl: "t = y/x", cv: [line(-2, -2, 2, 2), line(-2, 2, 2, -2)], ex: [vline(0, "E₁")], bad: [[0, 0]], good: [],
        alg: "substitute y = x·t:<br>(xt)² − x⁴ = <b>x²</b>·(t² − x²)<br>strict transform: t = ±x, <b>still singular</b>", cap: "The curves no longer touch: they cross at an angle. But they cross each other at a point of E₁, so three curves meet there." },
      { h: "Blowup 2: chart t = x·w", xr: [-1.1, 1.1], yr: [-1.7, 1.7], xl: "x", yl: "w = t/x", cv: [line(-2, 1, 2, 1), line(-2, -1, 2, -1)], ex: [vline(0, "E₂")], bad: [], good: [[0, 1], [0, -1]],
        alg: "substitute t = x·w:<br>x²(x²w² − x²) = <b>x⁴</b>·(w² − 1)<br>E₂: x = 0, curves: w = ±1<br>(E₁ is in the other chart)", cap: "Normal crossings: each curve crosses E₂ cleanly at its own point." },
    ],
  };
  // a harder example for the loop: y² = x⁵ turns into a cusp again after one blowup
  CH.c5 = [
    { h: "Start: the plane (x, y)", xr: [-0.35, 1.25], yr: [-1.1, 1.1], xl: "x", yl: "y", cvc: [[par((s) => [s * s, s ** 5], 0, 1.05), "hot", "upper half"], [par((s) => [s * s, s ** 5], -1.05, 0), "cold", "lower half"]], ex: [], bad: [[0, 0]], good: [] },
    { h: "Blowup 1: chart y = x·t", xr: [-0.35, 1.25], yr: [-1.2, 1.2], xl: "x", yl: "t = y/x", cvc: [[par((s) => [s * s, s ** 3], 0, 1.05), "hot", ""], [par((s) => [s * s, s ** 3], -1.05, 0), "cold", ""]], ex: [vline(0, "E₁")], bad: [[0, 0]], good: [] },
    { h: "Blowup 2: chart t = x·u", xr: [-0.35, 1.25], yr: [-1.2, 1.2], xl: "x", yl: "u = t/x", cvc: [[par((s) => [s * s, s], 0, 1.1), "hot", "x = u²"], [par((s) => [s * s, s], -1.1, 0), "cold", ""]], ex: [vline(0, "E₂")], bad: [[0, 0]], good: [] },
    { h: "Blowup 3: chart x = u·s", xr: [-1.1, 1.1], yr: [-1.1, 1.1], xl: "u", yl: "s = x/u", cvc: [[line(0, 0, 2, 2), "hot", "s = u"], [line(-2, -2, 0, 0), "cold", ""]], ex: [vline(0, "E₃"), hline(0, "E₂")], bad: [[0, 0]], good: [] },
    { h: "Blowup 4: chart s = u·w", xr: [-1.1, 1.1], yr: [-0.75, 1.75], xl: "u", yl: "w = s/u", cvc: [[line(0, 1, 2, 1), "hot", "w = 1"], [line(-2, 1, 0, 1), "cold", ""]], ex: [vline(0, "E₄"), hline(0, "E₂")], bad: [], good: [[0, 0], [0, 1]] },
  ];
  ["y² − x⁵", "x²·(t² − x³)", "x⁴·(u² − x)", "u⁵s⁴·(u − s)", "u¹⁰w⁴·(1 − w)"].forEach((f, i) => { CH.c5[i].fn = f; });
  // each branch keeps its color through every chart: orange is one branch, blue the other
  const CB = {
    cross: [[[line(-2, -2, 2, 2), "hot", "y = x"], [line(-2, 2, 2, -2), "cold", "y = −x"]], [[line(-2, 1, 2, 1), "hot", "t = 1"], [line(-2, -1, 2, -1), "cold", "t = −1"]]],
    cusp: [[[par((s) => [s * s, s * s * s], 0, 1.1), "hot", "upper half"], [par((s) => [s * s, s * s * s], -1.1, 0), "cold", "lower half"]],
      [[par((s) => [s * s, s], 0, 1.2), "hot", "x = t²"], [par((s) => [s * s, s], -1.2, 0), "cold", ""]],
      [[line(0, 0, 2, 2), "hot", "s = t"], [line(-2, -2, 0, 0), "cold", ""]],
      [[line(0, 1, 2, 1), "hot", "w = 1"], [line(-2, 1, 0, 1), "cold", ""]]],
    tan: [[[par((x) => [x, x * x], -1.2, 1.2), "hot", "y = x²"], [par((x) => [x, -x * x], -1.2, 1.2), "cold", "y = −x²"]],
      [[line(-2, -2, 2, 2), "hot", "t = x"], [line(-2, 2, 2, -2), "cold", "t = −x"]],
      [[line(-2, 1, 2, 1), "hot", "w = 1"], [line(-2, -1, 2, -1), "cold", "w = −1"]]],
  };
  Object.keys(CB).forEach((k) => CB[k].forEach((c, i) => { CH[k][i].cvc = c; }));
  CH.cross[1].yl = "t = y/x, the slope"; CH.cusp[1].yl = "t = y/x, the slope"; CH.tan[1].yl = "t = y/x, the slope"; CH.tan[2].yl = "w = t/x, slope of t";
  const FN = { cross: ["y² − x²", "x²·(t² − 1)"], cusp: ["y² − x³", "x²·(t² − x)", "t³s²·(t − s)", "t⁶w²·(1 − w)"], tan: ["y² − x⁴", "x²·(t² − x²)", "x⁴·(w² − 1)"] };
  Object.keys(FN).forEach((k) => FN[k].forEach((f, i) => { CH[k][i].fn = f; }));
  function drawChart(svg, S, extra = []) {
    const F = frame(svg, { W: 340, H: 300, l: 36, r: 10, t: 10, b: 40, xr: S.xr, yr: S.yr, xt: [[0, "0"], [1, "1"]].filter(([v]) => v >= S.xr[0] && v <= S.xr[1]), yt: [[-1, "−1"], [0, "0"], [1, "1"]].filter(([v]) => v >= S.yr[0] && v <= S.yr[1]), xlab: S.xl });
    T(svg, F.x1 - 6, F.y0 + 15, S.yl, C.ink, { at: { "text-anchor": "end" } });
    S.ex.forEach((e) => { E("path", { d: pathD(e.pts, F.X, F.Y), stroke: C.blow, "stroke-width": 4, fill: "none", opacity: 0.9 }, F.g); });
    if (S.cvc) S.cvc.forEach(([c, col, lab]) => {
      E("path", { d: pathD(c, F.X, F.Y), stroke: C[col], "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, F.g);
      if (lab) { const dense = []; for (let j = 0; j + 1 < c.length; j++) { const p0 = c[j], p1 = c[j + 1]; if (!p0 || !p1) continue; for (let q = 0; q < 40; q++) dense.push([p0[0] + (p1[0] - p0[0]) * q / 40, p0[1] + (p1[1] - p0[1]) * q / 40]); }
        const dy = (S.yr[1] - S.yr[0]), vis2 = dense.filter((p) => p[0] > S.xr[0] + 0.05 * (S.xr[1] - S.xr[0]) && p[0] < S.xr[1] - 0.04 * (S.xr[1] - S.xr[0]) && p[1] > S.yr[0] + 0.1 * dy && p[1] < S.yr[1] - 0.16 * dy); vis2.sort((p, q2) => p[0] - q2[0]); const q = vis2[Math.floor(0.8 * (vis2.length - 1))]; if (q) T(svg, F.X(q[0]) - 4, F.Y(q[1]) + (q[1] >= 0 ? -8 : 16), lab, C[col], { at: { "text-anchor": "end" }, st: ";font-weight:700" }); }
    });
    else S.cv.forEach((c) => E("path", { d: pathD(c, F.X, F.Y), stroke: C.hot, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, F.g));
    S.ex.forEach((e) => { if (e.lx != null) T(svg, F.X(e.lx) + 7, F.y1 - 8, e.lab, C.blow, { st: ";font-weight:700" }); else T(svg, F.x1 - 8, F.Y(e.ly) + 16, e.lab, C.blow, { at: { "text-anchor": "end" }, st: ";font-weight:700" }); });
    extra.forEach(([p, lab]) => { E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 9, fill: "none", stroke: C.blow, "stroke-width": 3 }, svg); T(svg, F.X(p[0]) - 12, F.Y(p[1]) - 12, lab, C.blow, { at: { "text-anchor": "end" }, st: ";font-weight:600" }); });
    S.bad.forEach((p) => ring(svg, F.X(p[0]), F.Y(p[1]), 10));
    S.good.forEach((p) => E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 5, fill: C.good, stroke: C.surface, "stroke-width": 2 }, svg));
    return F;
  }

  // ============================================================ Figure 3: the ladder, crossing / touching / cusp side by side
  const LAD = { s: 0, m: "h" };
  const LAD_COLS = [["lad-x", "cross", "Crossing"], ["lad-t", "tan", "Touching"], ["lad-k", "cusp", "Cusp"]];
  const LAD_TXT = {
    cross: ["branches y = x and y = −x<br>first coefficients a₁ = <b>+1</b> and <b>−1</b>: different", "y = x·t gives t = y/x = <b>±1</b> on E<br>two different points: <b>separated</b>"],
    tan: ["branches y = x² and y = −x²<br>a₁ = <b>0</b> for both: same direction", "y = x·t gives t = y/x = <b>±x</b><br>both reach t = 0, now with slopes ±1: <b>touching became crossing</b>", "t = x·w gives w = t/x = <b>±1</b><br>a₂ = ±1 differ: <b>separated</b>"],
    cusp: ["y = ±x<sup>3/2</sup>: one branch with a fractional exponent<br>not a power series in x", "y = x·t gives t = ±x<sup>1/2</sup>, i.e. <b>x = t²</b><br>smooth now, but <b>tangent to E₁</b>", "x = t·s turns the curve into s = t<br>it crosses E₁ and E₂, but <b>all three meet</b> at one point", "s = t·w turns the curve into w = 1<br>at most two curves at any point: <b>normal crossings</b>"],
  };
  const NSH = {
    cross: [CH.cross[0], { h: "", xr: [-1.1, 1.1], yr: [-1.7, 1.7], xl: "x", yl: "p = dy/dx, own slope", cvc: [[line(-2, 1, 2, 1), "hot", "p = 1"], [line(-2, -1, 2, -1), "cold", "p = −1"]], ex: [], bad: [], good: [], fn: "lift by slope" }],
    tan: [CH.tan[0], { h: "", xr: [-1.1, 1.1], yr: [-2.4, 2.4], xl: "x", yl: "p = dy/dx, own slope", cvc: [[line(-2, -4, 2, 4), "hot", "p = 2x"], [line(-2, 4, 2, -4), "cold", "p = −2x"]], ex: [], bad: [[0, 0]], good: [], fn: "lift by slope" },
      { h: "", xr: [-1.1, 1.1], yr: [-2.8, 2.8], xl: "x", yl: "q = dp/dx", cvc: [[line(-2, 2, 2, 2), "hot", "q = 2"], [line(-2, -2, 2, -2), "cold", "q = −2"]], ex: [], bad: [], good: [], fn: "lift again" }],
    cusp: [CH.cusp[0], { h: "", xr: [-0.35, 1.25], yr: [-1.7, 1.7], xl: "x", yl: "p = dy/dx, own slope", cvc: [[par((p) => [4 * p * p / 9, p], 0, 1.7), "hot", "x = 4p²/9"], [par((p) => [4 * p * p / 9, p], -1.7, 0), "cold", ""]], ex: [], bad: [], good: [], fn: "lift by slope" }],
  };
  const NSH_TXT = {
    cross: [LAD_TXT.cross[0], "record each point's own slope: p = <b>+1</b> and <b>−1</b><br><b>separated</b>, and no center was chosen"],
    tan: [LAD_TXT.tan[0], "own slopes p = <b>±2x</b>: both 0 at the origin, so they still meet,<br>now crossing: <b>touching became crossing</b>", "record the slope again, q = dp/dx = <b>±2</b><br><b>separated</b>"],
    cusp: [LAD_TXT.cusp[0], "own slope p = 3τ/2 at (τ², τ³), so <b>x = 4p²/9</b><br>a <b>smooth</b> curve in one step, faster than Hironaka's three"],
  };
  function figLadder() { if (!$("#lad-x")) return;
    for (const [id, k, name] of LAD_COLS) {
      const seq = LAD.m === "h" ? CH[k] : NSH[k], txt = LAD.m === "h" ? LAD_TXT[k] : NSH_TXT[k];
      const last = seq.length - 1, i = Math.min(LAD.s, last), S = seq[i];
      const stage = i === 0 ? "start" : LAD.m === "h" ? `after ${i} blowup${i > 1 ? "s" : ""}` : `after ${i} Nash step${i > 1 ? "s" : ""}`;
      $("#" + id + "-h").innerHTML = `${name} <span>· ${stage}${LAD.s > last ? " (done)" : ""}${LAD.m === "h" ? " · f = " + S.fn : ""}</span>`;
      drawChart($("#" + id), S);
      $("#" + id + "-alg").innerHTML = txt[i];
    }
  }
  seg("#lad-m", (v) => { LAD.m = v; figLadder(); });
  seg("#lad-s", (v) => { LAD.s = +v; figLadder(); });

  // ============================================================ Figure 4: weighted blowup with chosen weights
  const F9 = { c: "cusp", a: 2, b: 3 };
  const K9 = { cusp: 3, tan: 4, cross: 2 };
  const supN = (n) => (n === 1 ? "" : sup(n));
  function fig9() { if (!$("#f9-np")) return;
    const k = K9[F9.c], a = F9.a, b = F9.b, py = 2 * b, px = k * a, m = Math.min(py, px);
    // Newton polygon
    const svg = $("#f9-np");
    const F = frame(svg, { W: 340, H: 300, l: 36, r: 12, t: 12, b: 42, xr: [0, 5], yr: [0, 4], xt: [0, 1, 2, 3, 4, 5].map((v) => [v, String(v)]), yt: [0, 1, 2, 3, 4].map((v) => [v, String(v)]), xlab: "power of x", ylab: "power of y" });
    E("path", { d: pathD([[0, 9], [0, 2], [k, 0], [9, 0], [9, 9]], F.X, F.Y) + "Z", fill: C.blow, "fill-opacity": 0.12 }, F.g);
    E("line", { x1: F.X(0), y1: F.Y(2), x2: F.X(k), y2: F.Y(0), stroke: C.blow, "stroke-width": 2, "stroke-dasharray": "5 4" }, F.g);
    // weight line a·i + b·j = m
    const wl = []; for (let i = -1; i <= 6; i += 0.05) wl.push([i, (m - a * i) / b]);
    E("path", { d: pathD(wl, F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.6 }, F.g);
    const mono = [[0, 2, "y²", py], [k, 0, `x${sup(k)}`, px]];
    mono.forEach(([i, j, lab, p]) => {
      const on = p === m;
      E("circle", { cx: F.X(i), cy: F.Y(j), r: 6, fill: C.ink }, svg);
      if (on) E("circle", { cx: F.X(i), cy: F.Y(j), r: 11, fill: "none", stroke: C.hot, "stroke-width": 2.4 }, svg);
      T(svg, F.X(i) + 12, F.Y(j) - 10, `${lab} → u${sup(p)}`, on ? C.hot : C.muted, { st: ";font-weight:600" });
    });
    T(svg, F.x1 - 6, F.y0 + 40, `orange: your weight line ${a}·i + ${b}·j = ${m}`, C.hot, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    T(svg, F.x1 - 6, F.y0 + 56, "ringed: the terms that survive at u = 0", C.hot, { at: { "text-anchor": "end" } });
    T(svg, F.x1 - 6, F.y0 + 72, "dashed: the polygon's edge", C.blow, { at: { "text-anchor": "end" } });
    // algebra
    let strict, verdict, cls;
    if (py === px) { strict = "v² − 1"; verdict = "Both monomials survive. At u = 0 the curve is v = ±1, crossing E cleanly at two points: <b>resolved in one step</b>."; cls = "good"; }
    else if (py < px) { strict = `v² − u${supN(px - py)}`; verdict = `Only v² survives at u = 0, so the curve meets E only at v = 0, ${px - py === 1 ? "tangent to E" : "and is still singular there"}: <b>not resolved</b>; the weight of y is too small.`; cls = "bad"; }
    else { strict = `u${supN(py - px)}·v² − 1`; verdict = "At u = 0 the equation reads −1 = 0, so the curve never meets E in this chart: it runs off to v → ∞. <b>Not useful</b>; the weight of y is too large."; cls = "bad"; }
    $("#f9-alg").innerHTML = `f = y² − x${sup(k)}<br>substitute x = u${supN(a)}, y = u${supN(b)}·v:<br>y² → u${sup(py)}·v²,&nbsp;&nbsp; x${sup(k)} → u${sup(px)}<br>f = u${sup(py)}v² − u${sup(px)} = <b>u${sup(m)}</b>·(${strict})<br><span style="font-family:var(--f-display)">${verdict}</span>`;
    // chart picture of the strict transform
    const e = px - py, cv = [];
    const branch = (sg) => { const p = []; for (let i = -200; i <= 200; i++) { const u = 1.15 * i / 200; if (Math.abs(u) < 1e-6 && e < 0) { p.push(null); continue; } const base = Math.abs(e) % 2 === 1 && u < 0 ? NaN : Math.pow(Math.abs(u), e / 2); p.push(isFinite(base) ? [u, sg * base] : null); } return p; };
    if (e === 0) { cv.push([line(-2, 1, 2, 1), "hot", "v = 1"], [line(-2, -1, 2, -1), "cold", "v = −1"]); } else { cv.push([branch(1), "hot", ""], [branch(-1), "cold", ""]); }
    const S = { xr: [-1.15, 1.15], yr: [-2, 2], xl: "u", yl: "v", cvc: cv, ex: [vline(0, "E: u = 0")], bad: e > 0 ? [[0, 0]] : [], good: e === 0 ? [[0, 1], [0, -1]] : [] };
    drawChart($("#f9-ch"), S);
    $("#f9-a-out").textContent = "a = " + a; $("#f9-b-out").textContent = "b = " + b;
  }
  seg("#f9-c", (v) => { F9.c = v; const best = { cusp: [2, 3], tan: [1, 2], cross: [1, 1] }[v]; F9.a = best[0]; F9.b = best[1]; $("#f9-a").value = F9.a; $("#f9-b").value = F9.b; fig9(); });
  $("#f9-a")?.addEventListener("input", (e) => { F9.a = +e.target.value; fig9(); });
  $("#f9-b")?.addEventListener("input", (e) => { F9.b = +e.target.value; fig9(); });

  // ============================================================ Figure 10: checked plane-curve trace, not a full canonical invariant
  const KW = {
    cusp: [
      { inv: "order 2", ph: "singular strict curve", why: "The cusp is singular. On y = 0 the coefficient ideal is (x³, 2), supported at the origin.", act: "blow up the origin", bad: [1, 1] },
      { inv: "smooth; tangent", ph: "boundary tangency", why: "The derivative of t² − x with respect to x is −1: the curve is smooth. But x = t² is tangent to E₁: x = 0.", act: "blow up the tangency (0, 0)", bad: [0.81, 0.9] },
      { inv: "three components", ph: "boundary triple point", why: "The strict curve t = s and E₁: s = 0 and E₂: t = 0 meet at one point. Three components cannot be coordinate hyperplanes in a surface.", act: "blow up the triple point (0, 0)", bad: [0.7, 0.7] },
      { inv: "done", ph: "normal crossings", why: "The curve w = 1 meets E₃: t = 0 transversely and away from E₁: w = 0. In the complementary chart, E₂ and the curve also meet E₃ at different points.", act: "", bad: [0.6, 1] },
    ],
    c5: [
      { inv: "order 2", ph: "singular strict curve", why: "The coefficient (x⁵, 2) on y = 0 has support x = 0.", act: "blow up the origin", bad: [1, 1] },
      { inv: "still order 2", ph: "a cusp again", why: "The strict transform t² − x³ is still singular of order 2. The transformed coefficient is (x³, 2), so the order-reduction task continues.", act: "blow up the origin", bad: [1, 1] },
      { inv: "smooth; tangent", ph: "boundary tangency", why: "The curve x = u² is smooth, but tangent to E₂: x = 0.", act: "blow up the tangency", bad: [0.81, 0.9] },
      { inv: "three components", ph: "boundary triple point", why: "The curve and two exceptional components share the origin; three is too many for normal crossings in a surface.", act: "blow up the triple point", bad: [0.7, 0.7] },
      { inv: "done", ph: "normal crossings", why: "The strict curve w = 1 crosses the new exceptional divisor transversely at a separate point.", act: "", bad: [0.6, 1] },
    ],
    tan: [
      { inv: "order 2", ph: "two tangent branches", why: "Both branches have tangent y = 0; the coefficient is (x⁴, 2).", act: "blow up the origin", bad: [0.9, 0.81] },
      { inv: "order 2; three components", ph: "boundary triple point", why: "The branches t = ±x now cross, but they and E₁ share the origin. The strict curve remains singular.", act: "blow up the triple point", bad: [0.7, 0.7] },
      { inv: "done", ph: "normal crossings", why: "The disjoint strict curves w = ±1 each cross E₂ at a different point.", act: "", bad: [0.6, 1] },
    ],
  };
  const F10 = { c: "cusp", hist: [] };
  const f10stage = () => F10.hist.filter((h) => !h.bad).length;
  function fig10() { if (!$("#f10-ch")) return;
    const st = f10stage(), K = KW[F10.c], cur = K[st], S = CH[F10.c][st];
    let nb = 0; for (let i = F10.hist.length - 1; i >= 0 && F10.hist[i].bad; i--) nb++;
    const badHere = nb ? [[cur.bad, "unrelated center"]] : [];
    $("#f10-h").innerHTML = `${S.h} <span>· f = ${S.fn} · ${cur.ph}</span>`;
    drawChart($("#f10-ch"), S, badHere);
    $("#f10-algebra").innerHTML = S.alg || `Total transform: <b>${S.fn}</b>`;
    const map=F10.c==="cusp"?CUSP_CHARTS[st]:F10.c==="c5"?HARD_CUSP_CHARTS[st]:null;
    $("#f10-checks").innerHTML = `${map?`<p><b>Projection to the original plane:</b> ${map.text}.</p>`:""}<p><b>Current check:</b> ${cur.why}</p><p><b>Next center:</b> ${cur.act || "none — embedded normal crossings achieved"}</p><p>Violet is the ambient exceptional boundary. Orange/blue is the strict curve. The displayed factors retain exceptional multiplicities.</p>`;
    // log
    let s4 = 0, rows = `<tr><td>start</td><td>${K[0].inv}</td><td>${K[0].why}</td><td>${K[0].act}</td></tr>`;
    F10.hist.forEach((h, i) => {
      if (h.bad) rows += `<tr><td>${i + 1}</td><td style="color:var(--bad)">${K[s4].inv}, unchanged</td><td>hypothetical unrelated blowup: the displayed bad point is untouched; this is outside the prescribed center selection</td><td>${K[s4].act}</td></tr>`;
      else { s4++; rows += `<tr class="${i === F10.hist.length - 1 ? "on" : ""}"><td>${i + 1}</td><td>${K[s4].inv}</td><td>${K[s4].why}</td><td>${K[s4].act || "stop"}</td></tr>`; }
    });
    $("#f10-log").innerHTML = `<table><thead><tr><th>Step</th><th>Geometric state</th><th>Why</th><th>Next center</th></tr></thead><tbody>${rows}</tbody></table>`;
    const done = cur.inv === "done";
    $("#f10-next").disabled = done; $("#f10-bad").disabled = done;
    $("#f10-next").style.opacity = done ? 0.45 : 1; $("#f10-bad").style.opacity = done ? 0.45 : 1;
  }
  seg("#f10-c", (v) => { F10.c = v; F10.hist = []; fig10(); });
  $("#f10-next")?.addEventListener("click", () => { if (KW[F10.c][f10stage()].inv !== "done") { F10.hist.push({ bad: false }); fig10(); } });
  $("#f10-bad")?.addEventListener("click", () => { if (KW[F10.c][f10stage()].inv !== "done" && F10.hist.length < 9) { F10.hist.push({ bad: true }); fig10(); } });
  $("#f10-reset")?.addEventListener("click", () => { F10.hist = []; fig10(); });

  // ============================================================ Figure 6: the two loops, illustrated
  function miniChart(svg, x, y, w, h, S, opts = {}) {
    const g = E("g", {}, svg), id = svg.id + "-mc" + Math.round(x) + "-" + Math.round(y);
    const defs = E("defs", {}, g), cp = E("clipPath", { id }, defs); E("rect", { x, y, width: w, height: h, rx: 6 }, cp);
    E("rect", { x, y, width: w, height: h, rx: 6, fill: C.surface, stroke: opts.border || C.rule, "stroke-width": opts.border ? 2 : 1 }, g);
    const X = (v) => x + (v - S.xr[0]) / (S.xr[1] - S.xr[0]) * w, Y = (v) => y + h - (v - S.yr[0]) / (S.yr[1] - S.yr[0]) * h;
    const inner = E("g", { "clip-path": `url(#${id})` }, g);
    (S.ex || []).forEach((e) => E("path", { d: pathD(e.pts, X, Y), stroke: C.blow, "stroke-width": 3, fill: "none" }, inner));
    if (S.cvc) S.cvc.forEach(([c, col]) => E("path", { d: pathD(c, X, Y), stroke: C[col], "stroke-width": 2.4, fill: "none" }, inner));
    else (S.cv || []).forEach((c) => E("path", { d: pathD(c, X, Y), stroke: C.hot, "stroke-width": 2.4, fill: "none" }, inner));
    (S.bad || []).forEach((p) => E("circle", { cx: X(p[0]), cy: Y(p[1]), r: 6, fill: "none", stroke: C.bad, "stroke-width": 2 }, g));
    (S.good || []).forEach((p) => E("circle", { cx: X(p[0]), cy: Y(p[1]), r: 3.5, fill: C.good }, g));
    if (opts.label) T(svg, x + w / 2, y + h + 15, opts.label, opts.labCol || C.ink, { at: { "text-anchor": "middle" }, st: ";font-weight:700;font-size:12px" });
    if (opts.sub) T(svg, x + w / 2, y + h + 29, opts.sub, C.muted, { at: { "text-anchor": "middle" }, st: ";font-size:11px" });
  }
  function fig11() { if (!$("#f11a")) return;
    let svg = $("#f11a"); svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 360 300");
    const st = CH.cusp, inv = ["order 2", "tangency", "triple point", "done"], sub = ["singular", "touches E₁", "three meet", "normal crossings"];
    const pos = [[20, 18], [200, 18], [20, 160], [200, 160]], w = 140, h = 92;
    st.forEach((S, i) => miniChart(svg, pos[i][0], pos[i][1], w, h, S, { label: inv[i], sub: sub[i], labCol: i === 3 ? C.good : C.blow, border: i === 3 ? C.good : null }));
    arrow(svg, 166, 64, 194, 64, C.blow, 2); arrow(svg, 200, 135, 166, 160, C.blow, 2); arrow(svg, 166, 206, 194, 206, C.blow, 2);
    svg = $("#f11b"); svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 360 300");
    T(svg, 10, 14, "On curves it works:", C.ink, { st: ";font-weight:700" });
    miniChart(svg, 20, 24, 130, 86, st[0], { label: "cusp y² = x³" });
    const lift = { xr: [-0.3, 1.2], yr: [-2, 2], cvc: [[par((s) => [s * s, 1.5 * s], 0, 1.2), "hot"], [par((s) => [s * s, 1.5 * s], -1.2, 0), "cold"]], ex: [], bad: [], good: [] };
    miniChart(svg, 210, 24, 130, 86, lift, { label: "x against slope 3τ/2", sub: "smooth", labCol: C.good, border: C.good });
    arrow(svg, 156, 67, 204, 67, C.ink, 2); T(svg, 180, 58, "one Nash step", C.ink, { at: { "text-anchor": "middle" }, st: ";font-size:11px" });
    T(svg, 10, 168, "In 4D a chart recurs (schematic):", C.ink, { st: ";font-weight:700" });
    const glyph = (cx, cy, s, col) => { const p = []; for (let i = -40; i <= 40; i++) { const t = i / 40; p.push([cx + s * (t * t * 1.4 - 0.5), cy - s * t * t * t * 1.1]); } E("path", { d: "M" + p.map((q) => q[0].toFixed(1) + " " + q[1].toFixed(1)).join("L"), fill: "none", stroke: col, "stroke-width": 2.6 }, svg); E("circle", { cx: cx - 0.5 * s, cy, r: 4, fill: "none", stroke: C.bad, "stroke-width": 1.8 }, svg); };
    E("rect", { x: 20, y: 180, width: 110, height: 80, rx: 8, fill: C.surface, stroke: C.rule }, svg); glyph(70, 220, 36, C.hot); T(svg, 28, 196, "X", C.ink, { st: ";font-weight:700" });
    E("rect", { x: 210, y: 180, width: 130, height: 80, rx: 8, fill: C.surface, stroke: C.rule }, svg);
    [[230, 190], [285, 190], [230, 225]].forEach(([bx, by]) => E("rect", { x: bx, y: by, width: 45, height: 28, rx: 4, fill: C.soft, stroke: C.rule }, svg));
    E("rect", { x: 285, y: 225, width: 45, height: 28, rx: 4, fill: "none", stroke: C.bad, "stroke-width": 2 }, svg); glyph(307, 239, 13, C.hot);
    T(svg, 275, 276, "Nash blowup: one chart ≅ X", C.ink, { at: { "text-anchor": "middle" }, st: ";font-weight:700;font-size:11.5px" });
    arrow(svg, 136, 210, 204, 210, C.ink, 2); T(svg, 170, 202, "blow up", C.ink, { at: { "text-anchor": "middle" }, st: ";font-size:11px" });
    E("path", { d: "M 300 262 C 300 296, 75 300, 75 266", fill: "none", stroke: C.bad, "stroke-width": 2, "stroke-dasharray": "5 4" }, svg);
    T(svg, 188, 296, "a singular affine chart recurs", C.bad, { at: { "text-anchor": "middle" }, st: ";font-weight:600;font-size:11px" });
  }

  // ============================================================ Figure 12: noisy point cloud
  function seeded(seed) { return function () { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function sgauss(r) { let u = 0; while (u === 0) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); }
  const median = (arr) => { if (!arr.length) return 0; const s = [...arr].sort((u, v) => u - v); return s[Math.floor(s.length / 2)]; };
  function pca2(Q) {
    let mx = 0, my = 0; Q.forEach((q) => { mx += q.x; my += q.y; }); mx /= Q.length; my /= Q.length;
    let sxx = 0, sxy = 0, syy = 0; Q.forEach((q) => { const ex = q.x - mx, ey = q.y - my; sxx += ex * ex; sxy += ex * ey; syy += ey * ey; });
    sxx /= Q.length; sxy /= Q.length; syy /= Q.length;
    const tr = sxx + syy, det = sxx * syy - sxy * sxy, disc = Math.sqrt(Math.max(0, tr * tr / 4 - det)), l1 = tr / 2 + disc, l2 = tr / 2 - disc;
    return { mx, my, phi: 0.5 * Math.atan2(2 * sxy, sxx - syy), ratio: l1 > 0 ? l2 / l1 : 1 };
  }
  function findCenter(P) {
    const thr = median(P.map((p) => p.ratio)), clean = P.filter((p) => p.ratio <= thr);
    if (clean.length < 6) return null;
    const u = (p) => [Math.cos(2 * p.phiN), Math.sin(2 * p.phiN)];
    let c1 = u(clean[0]), c2 = u(clean.reduce((b, p) => { const v = u(p), d = v[0] * c1[0] + v[1] * c1[1]; return d < b[0] ? [d, p] : b; }, [2, clean[0]])[1]), GA = [], GB = [];
    for (let it = 0; it < 10; it++) {
      GA = []; GB = [];
      clean.forEach((p) => { const v = u(p); (v[0] * c1[0] + v[1] * c1[1] >= v[0] * c2[0] + v[1] * c2[1] ? GA : GB).push(p); });
      const mean = (S, fb) => { let x = 0, y = 0; S.forEach((p) => { const v = u(p); x += v[0]; y += v[1]; }); const n = Math.hypot(x, y); return n ? [x / n, y / n] : fb; };
      c1 = mean(GA, c1); c2 = mean(GB, c2);
    }
    if (GA.length < 3 || GB.length < 3) return null;
    const L1 = pca2(GA), L2 = pca2(GB), d1 = [Math.cos(L1.phi), Math.sin(L1.phi)], d2 = [Math.cos(L2.phi), Math.sin(L2.phi)], det = -d1[0] * d2[1] + d1[1] * d2[0];
    if (Math.abs(det) < 1e-6) return null;
    const bx = L2.mx - L1.mx, by = L2.my - L1.my, s = (-bx * d2[1] + by * d2[0]) / det;
    return [L1.mx + s * d1[0], L1.my + s * d1[1]];
  }
  const F12 = { n: 0.025, a: 40, m: "n", seed: 7, rho: 0.12, shape: "cross" };
  const angDist = (a, b) => Math.abs(modPi(a - b));
  function fig12compute() { if (!$("#f12-pts")) return;
    const r = seeded(F12.seed), a = F12.a * Math.PI / 180, N = 140, P = [];
    [[0, a / 2], [1, -a / 2]].forEach(([lab, ang]) => { const c = Math.cos(ang), s = Math.sin(ang); for (let i = 0; i < N; i++) { const corner = F12.shape === "corner", t = corner ? 1.25 * r() : -1 + 2 * r(), nz = F12.n * sgauss(r); P.push({ x: t * c - nz * s - (corner ? 0.6 : 0), y: t * s + nz * c, lab, own: ang, other: -ang }); } });
    const r2 = F12.rho * F12.rho;
    for (const p of P) { const Q = P.filter((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 < r2); if (Q.length > 2) { const s = pca2(Q); p.phiN = s.phi; p.ratio = s.ratio; } else { p.phiN = 0; p.ratio = 1; } }
    let center = null, cerr = null;
    if (F12.m === "n") P.forEach((p) => { p.phi = p.phiN; });
    else { const f = findCenter(P); const tx = F12.shape === "corner" ? -0.6 : 0; center = f && Math.hypot(f[0] - tx, f[1]) < 2 ? f : [tx, 0]; cerr = f ? Math.hypot(center[0] - tx, center[1]) : null; P.forEach((p) => { p.phi = modPi(Math.atan2(p.y - center[1], p.x - center[0])); }); }
    let flagged = 0;
    P.forEach((p) => { const dOwn = angDist(p.phi, p.own), dOth = angDist(p.phi, p.other); p.flag = dOth < dOwn || dOth < 12 * Math.PI / 180; if (p.flag) flagged++; });
    F12.P = P; F12.center = center; F12.cerr = cerr; F12.flagged = flagged;
  }
  function build12() {
    const P = F12.P || [], lines = [], points = [], labels = [], FL = -0.9, LW = 0.5, R = 1.15, paper = rgb(C.paper);
    const sq = [[-R, -R], [R, -R], [R, R], [-R, R]];
    sq.forEach((c, i) => { const dd = sq[(i + 1) % 4]; lines.push({ a: [c[0], c[1], FL], b: [dd[0], dd[1], FL], col: C.rule, w: 1 }); });
    for (const p of P) {
      const base = dirRGB(p.phi);
      points.push({ p: [p.x, p.y, FL], col: css(mix(base, paper, 0.55)), r: 2.2 });
      points.push({ p: [p.x, p.y, LW * p.phi], col: css(base), r: p.flag ? 3.4 : 2.6, ring: p.flag ? C.bad : null });
    }
    if (F12.center) {
      const [cx, cy] = F12.center;
      lines.push({ a: [cx, cy, -LW * Math.PI / 2], b: [cx, cy, LW * Math.PI / 2], col: C.blow, w: 3, alpha: 0.75 });
      points.push({ p: [cx, cy, FL], col: C.blow, r: 5, ring: C.ink, top: true });
      labels.push({ p: [cx, cy, LW * Math.PI / 2], s: "fitted center: all directions", col: C.blow });
    } else {
      const ca = 0.75 * Math.cos(F12.a * Math.PI / 360) - (F12.shape === "corner" ? 0.6 : 0), sa = 0.75 * Math.sin(F12.a * Math.PI / 360);
      for (let i = 0; i < 36; i++) { const t0 = 2 * Math.PI * i / 36, t1 = 2 * Math.PI * (i + 1) / 36; lines.push({ a: [ca + F12.rho * Math.cos(t0), sa + F12.rho * Math.sin(t0), FL], b: [ca + F12.rho * Math.cos(t1), sa + F12.rho * Math.sin(t1), FL], col: C.ink, w: 1.3, dash: [3, 3] }); }
    }
    labels.push({ p: [R, -R, FL], s: "the data", col: C.muted });
    return { radius: 1.75, lines, points, labels };
  }
  const v12 = new View($("#f12-pts"), build12); v12.yaw = -0.5; v12.pitch = 0.42;
  function fig12() { if (!$("#f12-hist")) return;
    const P = F12.P;
    v12.draw();
    // histogram
    const svg = $("#f12-hist"), nb = 72, bins = new Array(nb).fill(0), binsF = new Array(nb).fill(0);
    P.forEach((p) => { const k = clamp(Math.floor((modPi(p.phi) + Math.PI / 2) / Math.PI * nb), 0, nb - 1); bins[k]++; if (p.flag) binsF[k]++; });
    const mx = Math.max(10, ...bins);
    const F = frame(svg, { W: 360, H: 300, l: 34, r: 12, t: 12, b: 42, xr: [-90, 90], yr: [0, mx * 1.12], xt: [-90, -45, 0, 45, 90].map((v) => [v, v + "°"]), yt: [[0, "0"]], xlab: "recorded direction", ylab: "points" });
    bins.forEach((c, k) => { if (!c) return; const a0 = -90 + 180 * k / nb, a1 = a0 + 180 / nb; E("rect", { x: F.X(a0) + 0.5, y: F.Y(c), width: F.X(a1) - F.X(a0) - 1, height: F.Y(0) - F.Y(c), fill: dirCol((a0 + a1) / 2 * Math.PI / 180) }, F.g); if (binsF[k]) E("rect", { x: F.X(a0) + 0.5, y: F.Y(binsF[k]), width: F.X(a1) - F.X(a0) - 1, height: F.Y(0) - F.Y(binsF[k]), fill: "none", stroke: C.bad, "stroke-width": 1.5 }, F.g); });
    [F12.a / 2, -F12.a / 2].forEach((v) => E("line", { x1: F.X(v), x2: F.X(v), y1: F.y0, y2: F.y1, stroke: C.ink, "stroke-dasharray": "4 3" }, F.g));
    T(svg, F.X(F12.a / 2) + 4, F.y0 + 16, "true", C.ink); T(svg, F.X(-F12.a / 2) + 4, F.y0 + 16, "true", C.ink);
    $("#f12-n-out").textContent = "σ = " + F12.n.toFixed(3);
    $("#f12-a-out").textContent = F12.a + "°";
    const pct = (100 * F12.flagged / P.length).toFixed(1);
    $("#f12-chips").innerHTML = `<span class="chip v">ambiguous points: <b>${F12.flagged}</b> of ${P.length} (${pct}%)</span>`
      + (F12.m === "h" ? `<span class="chip">fitted center: <b>${F12.cerr == null ? "fit failed" : F12.cerr.toFixed(3)}</b>${F12.cerr == null ? "" : (F12.shape === "corner" ? " from the true corner" : " from the true crossing")}</span><span class="chip">trouble spot: points near the center, where a small shift flips the direction</span>`
        : `<span class="chip">trouble spot: points near the crossing, whose neighborhoods contain both branches</span>`);
  }
  const f12all = () => { fig12compute(); fig12(); };
  $("#f12-n")?.addEventListener("input", (e) => { F12.n = +e.target.value; f12all(); });
  $("#f12-a")?.addEventListener("input", (e) => { F12.a = +e.target.value; f12all(); });
  seg("#f12-m", (v) => { F12.m = v; f12all(); });
  seg("#f12-s", (v) => { F12.shape = v; f12all(); });
  $("#f12-new")?.addEventListener("click", () => { F12.seed = (F12.seed * 7919 + 13) % 100003; f12all(); });


  // ============================================================ Figure 11: symmetric 2x2x2 tensors as cubics
  const TC = { m: "t", r0: 0.15, h: 0, k: 0 };
  const rHSV = (r) => hsv(25 + (clamp(r, -0.6, 0.6) + 0.6) / 1.2 * 250, isDark() ? 0.55 : 0.7, isDark() ? 0.95 : 0.82);
  const rCol = (r) => css(hsv(25 + (clamp(r, -0.6, 0.6) + 0.6) / 1.2 * 250, isDark() ? 0.55 : 0.7, isDark() ? 0.95 : 0.82));
  const tcABC = (r, s) => [-(2 * r + s), r * r + 2 * r * s, -r * r * s];
  const tcD = (r, s) => { const [a, b, c] = tcABC(r, s); return [a / 1.6, (b - 0.3) / 0.75, TC.k * 2.2 * r + (1 - TC.k) * c / 0.3]; };
  function tcBuild() {
    const lines = [], points = [], labels = [], R0 = TC.r0;
    // the surface as shaded quads on the band s = r + σ, |σ| ≤ 0.8
    const NR = 30, NS = 16, SG = 0.8, RR = 0.45, quads = [], L = [0.35, -0.45, 0.82];
    for (let i = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
      if (j === NS / 2 - 1 || j === NS / 2) {}
      const r0 = -RR + 2 * RR * i / NR, r1 = -RR + 2 * RR * (i + 1) / NR, g0 = -SG + 2 * SG * j / NS, g1 = -SG + 2 * SG * (j + 1) / NS;
      const pts = [tcD(r0, r0 + g0), tcD(r1, r1 + g0), tcD(r1, r1 + g1), tcD(r0, r0 + g1)];
      const u = pts[2].map((v, k) => v - pts[0][k]), w = pts[3].map((v, k) => v - pts[1][k]), nrm = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]], nl = Math.hypot(...nrm) || 1;
      const lit = 0.62 + 0.38 * Math.abs((nrm[0] * L[0] + nrm[1] * L[1] + nrm[2] * L[2]) / nl / Math.hypot(...L));
      const base = rHSV((r0 + r1) / 2), col = css(base.map((v) => v * lit));
      quads.push({ pts, col, alpha: 0.92, edge: css(base.map((v) => v * lit * 0.8)) });
    }
    // a few rulings drawn on top for the "straight lines" reading
    for (let i = 0; i <= 12; i++) { const r = -RR + 2 * RR * i / 12; lines.push({ a: tcD(r, r - SG), b: tcD(r, r + SG), col: C.ink, w: 0.9, alpha: 0.3 }); }
    // the rank-one curve: s = r
    let p = null; for (let i = 0; i <= 80; i++) { const r = -RR + 2 * RR * i / 80, q = tcD(r, r); if (p) lines.push({ a: p, b: q, col: C.bad, w: 3.2 }); p = q; }
    labels.push({ p: tcD(RR, RR), s: "rank one: (t − r)³", col: C.bad });
    // section plane a = -3 r0 and the section curve
    const sec = []; for (let i = 0; i <= 60; i++) { const e = -0.266 + 0.532 * i / 60, r = R0 + e, sv = R0 - 2 * e; if (Math.abs(r) <= 0.45) sec.push([r, sv]); }
    for (let i = 1; i < sec.length; i++) lines.push({ a: tcD(...sec[i - 1]), b: tcD(...sec[i]), col: C.ink, w: 3, top: true });
    const a0 = -3 * R0 / 1.6, zs = TC.k ? [-1.0, 1.0] : [-0.9, 0.9], ys = [-0.6, 1.0];
    const pl = [[a0, ys[0], zs[0]], [a0, ys[1], zs[0]], [a0, ys[1], zs[1]], [a0, ys[0], zs[1]]];
    pl.forEach((q, i) => lines.push({ a: q, b: pl[(i + 1) % 4], col: C.ink, w: 1.2, dash: [5, 4], alpha: 0.7 }));
    points.push({ p: tcD(R0, R0), col: C.surface, r: 7, ring: C.bad, top: true });
    // axes hints
    const ax = TC.k ? "r (Nash's datum)" : "c";
    labels.push({ p: [1.3, -0.6, -0.9], s: "a", col: C.muted }, { p: [-1.3, 1.0, -0.9], s: "b", col: C.muted }, { p: [-1.3, -0.6, 0.95], s: ax, col: C.muted });
    $("#tc-tag").innerHTML = TC.k < 0.5 ? "Colored by r, the repeated root. The surface <b>creases</b> along the red rank-one curve." : "Height is now r, Nash's recorded datum. <b>No crease</b>: a smooth sheet.";
    return { radius: 1.85, lines, points, labels, quads };
  }
  const v11 = new View($("#tc-cv"), tcBuild); window.__v11 = v11;
  const TCV = { t: [-0.5, 0.5], n: [1.2, 0.3] }; v11.yaw = TCV.t[0]; v11.pitch = TCV.t[1];
  function tcSection() { if (!$("#tc-sec")) return;
    const svg = $("#tc-sec"), R0 = TC.r0;
    if (TC.h > 0) {
      const S = CH.cusp[TC.h];
      drawChart(svg, S);
      $("#tc-h2").innerHTML = `The slice <span>after blowing up the rank-one curve ${TC.h === 1 ? "once" : TC.h + " times"}</span>`;
      $("#tc-alg").innerHTML = LAD_TXT.cusp[TC.h] + "<br><span style=\"font-family:var(--f-display)\">Every slice across the crease does this at once: the center is the whole red curve.</span>";
      return;
    }
    const xr = [-0.14, 0.42], yr = [-0.46, 0.46];
    const F = frame(svg, { W: 340, H: 300, l: 36, r: 10, t: 10, b: 40, xr, yr, xt: [[0, "0"]], yt: [[0, "0"]], xlab: "across the crease (straightened)" });
    const n = 46, a = -3 * R0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const X = xr[0] + (xr[1] - xr[0]) * (i + 0.5) / n, Y = yr[0] + (yr[1] - yr[0]) * (j + 0.5) / n;
      const b = 3 * R0 * R0 - 3 * X, c = Y - R0 ** 3 + 3 * R0 * X;
      const disc = a * a * b * b - 4 * b ** 3 - 4 * a ** 3 * c - 27 * c * c + 18 * a * b * c;
      E("rect", { x: F.X(xr[0] + (xr[1] - xr[0]) * i / n) - 0.3, y: F.Y(yr[0] + (yr[1] - yr[0]) * (j + 1) / n) - 0.3, width: (F.x1 - F.x0) / n + 0.6, height: (F.y1 - F.y0) / n + 0.6, fill: css(mix(rgb(C.surface), rgb(disc > 0 ? C.hot : C.cold), 0.24)) }, F.g);
    }
    for (let i = 0; i < 80; i++) {
      const e0 = -0.62 + 1.24 * i / 80, e1 = -0.62 + 1.24 * (i + 1) / 80;
      E("path", { d: pathD([[e0 * e0, 2 * e0 ** 3], [e1 * e1, 2 * e1 ** 3]], F.X, F.Y), stroke: rCol(R0 + (e0 + e1) / 2), "stroke-width": 3.4, fill: "none", "stroke-linecap": "round" }, F.g);
    }
    ring(svg, F.X(0), F.Y(0), 10);
    T(svg, F.X(0.3), F.Y(0) + 5, "rank 3", C.hot, { at: { "text-anchor": "middle" }, st: ";font-weight:700" });
    T(svg, F.X(0.06), F.Y(-0.38), "rank 2", C.cold, { st: ";font-weight:700" });
    T(svg, F.X(0) + 12, F.Y(0) + 22, "(t − r₀)³", C.bad, { st: ";font-weight:700" });
    $("#tc-h2").innerHTML = `The slice through the crease <span>at r₀ = ${fmt(R0)}</span>`;
    $("#tc-alg").innerHTML = `the plane a = −3r₀ = ${fmt(-3 * R0)}<br>inside the cusp (orange): three real roots, rank 3<br>outside (blue): one real root, rank 2<br>the tip is (t − r₀)³: rank one<br>straightened, the boundary is <b>(e², 2e³)</b>: a cusp<br><span style="font-family:var(--f-display)">The curve's color is the repeated root r. It is continuous through the tip, which is why Nash's lift by r is smooth.</span>`;
  }
  function fig11tc() { if (!$("#tc-cv")) return; v11.draw(); tcSection(); $("#tc-r-out").textContent = "r₀ = " + fmt(TC.r0); }
  seg("#tc-m", (v) => { const target = v === "n" ? 1 : 0, k0 = TC.k, y0 = v11.yaw, p0 = v11.pitch, [y1, p1] = TCV[v], t0 = performance.now(); const step = () => { const u = Math.min(1, (performance.now() - t0) / 900), w = u * u * (3 - 2 * u); TC.k = k0 + (target - k0) * w; v11.yaw = y0 + (y1 - y0) * w; v11.pitch = p0 + (p1 - p0) * w; v11.draw(); if (u < 1) requestAnimationFrame(step); }; requestAnimationFrame(step); });
  seg("#tc-h", (v) => { TC.h = +v; tcSection(); });
  $("#tc-r")?.addEventListener("input", (e) => { TC.r0 = +e.target.value; fig11tc(); });

  window.__draw2 = () => { v7.draw(); fig11tc(); figLadder(); fig9(); fig10(); fig11(); if (!F12.P) fig12compute(); fig12(); };
})();

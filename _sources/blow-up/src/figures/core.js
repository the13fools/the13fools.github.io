(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const NS = "http://www.w3.org/2000/svg";
  const E = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const C = {};
  const readColors = () => { const cs = getComputedStyle(document.documentElement); ["ink", "muted", "rule", "soft", "surface", "paper", "blow", "bad", "good", "hot", "cold", "steel"].forEach((k) => { C[k] = cs.getPropertyValue("--" + k).trim(); }); };
  const rgb = (h) => { h = (h || "#888").replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); const n = parseInt(h, 16); return isNaN(n) ? [136, 136, 136] : [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = (c, a) => a == null ? `rgb(${c.map((v) => Math.round(v)).join(",")})` : `rgba(${c.map((v) => Math.round(v)).join(",")},${a})`;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const isDark = () => { const c = rgb(C.paper); return 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] < 128; };
  const cvs = (cv) => { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); const W = Math.max(2, Math.round(r.width * d)), H = Math.max(2, Math.round(r.height * d)); if (cv.width !== W) cv.width = W; if (cv.height !== H) cv.height = H; return { ctx: cv.getContext("2d"), W, H, d }; };
  const sup = (v) => String(v).split("").map((c) => ({ "-": "⁻", "−": "⁻", ".": "·", "/": "ᐟ" }[c] || "⁰¹²³⁴⁵⁶⁷⁸⁹"[+c] || c)).join("");
  const fmt = (v, d = 2) => (Math.abs(v) < 0.5 * Math.pow(10, -d) ? (0).toFixed(d) : v.toFixed(d)).replace("-", "−");
  const T = (parent, x, y, text, fill, extra = {}) => E("text", Object.assign({ x, y, style: `fill:${fill || C.muted}` + (extra.st || "") }, extra.at || {}), parent, text);
  const seg = (id, cb) => { const g = $(id); if (!g) return; g.addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; g.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", x === b ? "true" : "false")); cb(b.dataset.v); }); };
  const hsv = (H, s, v) => { const f = (n) => { const k = (n + H / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); }; return [255 * f(5), 255 * f(3), 255 * f(1)]; };
  function frame(svg, o) {
    svg.innerHTML = ""; svg.setAttribute("viewBox", `0 0 ${o.W} ${o.H}`);
    const x0 = o.l, x1 = o.W - o.r, y0 = o.t, y1 = o.H - o.b;
    const X = (v) => x0 + (v - o.xr[0]) / (o.xr[1] - o.xr[0]) * (x1 - x0);
    const Y = (v) => y1 - (v - o.yr[0]) / (o.yr[1] - o.yr[0]) * (y1 - y0);
    const id = svg.id + "-clip" + (o.cid || ""), defs = E("defs", {}, svg), cp = E("clipPath", { id }, defs);
    E("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }, cp);
    const g = E("g", { "clip-path": `url(#${id})` }, svg);
    if (!o.noBox) E("rect", { x: x0, y: y0, width: x1 - x0, height: y1 - y0, fill: "none", stroke: C.rule }, svg);
    (o.xt || []).forEach(([v, t]) => { E("line", { x1: X(v), x2: X(v), y1: y1, y2: y1 + 4, stroke: C.muted }, svg); T(svg, X(v), y1 + 17, t, null, { at: { "text-anchor": "middle" } }); });
    (o.yt || []).forEach(([v, t]) => { E("line", { x1: x0 - 4, x2: x0, y1: Y(v), y2: Y(v), stroke: C.muted }, svg); T(svg, x0 - 7, Y(v) + 4, t, null, { at: { "text-anchor": "end" } }); });
    if (o.xlab) T(svg, (x0 + x1) / 2, y1 + 33, o.xlab, C.ink, { at: { "text-anchor": "middle" } });
    if (o.ylab) T(svg, x0 + 6, y0 + 15, o.ylab, C.ink);
    return { X, Y, g, x0, x1, y0, y1 };
  }
  const pathD = (pts, X, Y) => { let d = "", pen = false; for (const p of pts) { if (!p || !isFinite(p[0]) || !isFinite(p[1])) { pen = false; continue; } d += (pen ? "L" : "M") + X(p[0]).toFixed(1) + " " + Y(p[1]).toFixed(1); pen = true; } return d; };
  const ring = (parent, x, y, r) => E("circle", { cx: x, cy: y, r, fill: "none", stroke: C.bad, "stroke-width": 2.2 }, parent);
  let LUT = null;
  const makeLUT = () => { const p = rgb(C.paper), v = rgb(C.blow), k = rgb(C.ink), L = []; for (let i = 0; i < 256; i++) { const t = i / 255; L.push(t < 0.55 ? mix(p, v, t / 0.55) : mix(v, k, (t - 0.55) / 0.45)); } LUT = L; };
  // direction colour: period 180°, the same hue for a line and its reverse
  const modPi = (a) => { while (a > Math.PI / 2) a -= Math.PI; while (a <= -Math.PI / 2) a += Math.PI; return a; };
  const dirRGB = (a) => hsv(((modPi(a) * 180 / Math.PI + 90) * 2 + 200) % 360, isDark() ? 0.55 : 0.72, isDark() ? 0.95 : 0.8);
  const dirCol = (a) => css(dirRGB(a));
  const arrow = (parent, x1, y1, x2, y2, col, w = 2) => { E("line", { x1, y1, x2, y2, stroke: col, "stroke-width": w, "stroke-linecap": "round" }, parent); const a = Math.atan2(y2 - y1, x2 - x1), h = 7; E("path", { d: `M${x2} ${y2}L${x2 - h * Math.cos(a - 0.45)} ${y2 - h * Math.sin(a - 0.45)}L${x2 - h * Math.cos(a + 0.45)} ${y2 - h * Math.sin(a + 0.45)}Z`, fill: col }, parent); };
  const SCHED = new Set(); // figures that animate only while visible
  const vis = new WeakMap();
  const isOn = (el) => !!el && vis.get(el) !== false;
  const watch = (el, onShow) => { if (!el) return; if (!("IntersectionObserver" in window)) { vis.set(el, true); if (onShow) setTimeout(onShow, 0); return; } new IntersectionObserver((es) => es.forEach((e) => { vis.set(el, e.isIntersecting); if (e.isIntersecting && onShow) onShow(); })).observe(el); };

  // ============================================================ Figure 1: singular points as a field picture
  const F1 = { t: 0.55 };
  const F1D = {
    a: { f: (x, y) => y * y - x * x, g: (x, y) => [-2 * x, 2 * y], xr: [-1.1, 1.1], yr: [-1.1, 1.1], lv: [-0.6, -0.3, -0.1, 0.1, 0.3, 0.6], fmax: 1,
      zero: () => [[[-2, -2], [2, 2]], [[-2, 2], [2, -2]]], probe: (t) => [t, t], tan: () => [1, 1], name: "f = y² − x²" },
    t: { f: (x, y) => y * y - x ** 4, g: (x, y) => [-4 * x ** 3, 2 * y], xr: [-1.1, 1.1], yr: [-1.1, 1.1], lv: [-0.5, -0.2, -0.05, 0.05, 0.2, 0.5], fmax: 1,
      zero: () => [-1, 1].map((sg) => { const p = []; for (let i = -120; i <= 120; i++) { const x = 1.2 * i / 120; p.push([x, sg * x * x]); } return p; }), probe: (t) => [t, t * t], tan: (t) => [1, 2 * t], name: "f = y² − x⁴" },
    b: { f: (x, y) => y * y - x * x * x, g: (x, y) => [-3 * x * x, 2 * y], xr: [-0.5, 1.15], yr: [-0.825, 0.825], lv: [-0.3, -0.12, -0.04, 0.04, 0.12, 0.3], fmax: 0.6,
      zero: () => { const p = []; for (let i = -120; i <= 120; i++) { const s = 1.05 * i / 120; p.push([s * s, s * s * s]); } return [p]; }, probe: (t) => [t * t, t * t * t], tan: (t) => [2 * t, 3 * t * t], name: "f = y² − x³" },
  };
  function fig1panel(cv, D, t) {
    const { ctx, W, H, d } = cvs(cv), n = 220, img = new ImageData(n, n), hot = rgb(C.hot), cold = rgb(C.cold), paper = rgb(C.paper);
    const [x0, x1] = D.xr, [y0, y1] = D.yr, PX = (i) => x0 + (x1 - x0) * (i + 0.5) / n, PY = (j) => y1 - (y1 - y0) * (j + 0.5) / n;
    const F = new Float64Array(n * n); for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) F[j * n + i] = D.f(PX(i), PY(j));
    const lvIdx = (v) => { let k = 0; for (const L of D.lv) if (v > L) k++; return k; };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const v = F[j * n + i], tt = clamp(Math.abs(v) / D.fmax, 0, 1), c0 = mix(paper, v > 0 ? hot : cold, 0.12 + 0.45 * Math.sqrt(tt));
      const kk = lvIdx(v), edge = (i < n - 1 && lvIdx(F[j * n + i + 1]) !== kk) || (j < n - 1 && lvIdx(F[(j + 1) * n + i]) !== kk);
      const c = edge ? mix(c0, rgb(C.muted), 0.55) : c0, o = 4 * (j * n + i); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    const off = document.createElement("canvas"); off.width = n; off.height = n; off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const MX = (x) => (x - x0) / (x1 - x0) * W, MY = (y) => (y1 - y) / (y1 - y0) * H;
    // normal field ∇f/|∇f|
    const G = 13, ar = 0.38 * W / G;
    ctx.strokeStyle = isDark() ? "rgba(230,233,239,0.55)" : "rgba(28,32,40,0.45)"; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 1.2 * d;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) {
      const x = x0 + (x1 - x0) * (i + 0.5) / G, y = y1 - (y1 - y0) * (j + 0.5) / G, g = D.g(x, y), gl = Math.hypot(g[0], g[1]); if (gl < 1e-9) continue;
      const ux = g[0] / gl, uy = -g[1] / gl, cx = MX(x), cy = MY(y);
      ctx.beginPath(); ctx.moveTo(cx - ux * ar * 0.5, cy - uy * ar * 0.5); ctx.lineTo(cx + ux * ar * 0.5, cy + uy * ar * 0.5); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + ux * ar * 0.5, cy + uy * ar * 0.5); ctx.lineTo(cx + ux * ar * 0.5 - (ux * 0.9 - uy * 0.5) * 3.5 * d, cy + uy * ar * 0.5 - (uy * 0.9 + ux * 0.5) * 3.5 * d); ctx.lineTo(cx + ux * ar * 0.5 - (ux * 0.9 + uy * 0.5) * 3.5 * d, cy + uy * ar * 0.5 - (uy * 0.9 - ux * 0.5) * 3.5 * d); ctx.fill();
    }
    // zero set
    ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6 * d; ctx.lineCap = "round";
    for (const c of D.zero()) { ctx.beginPath(); c.forEach((p, k) => (k ? ctx.lineTo(MX(p[0]), MY(p[1])) : ctx.moveTo(MX(p[0]), MY(p[1])))); ctx.stroke(); }
    const lab = (s, x, y, col, al) => { ctx.font = `600 ${12.5 * d}px "Schibsted Grotesk", sans-serif`; ctx.textAlign = al || "left"; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); ctx.textAlign = "left"; };
    const P = D.probe(t), sing = Math.hypot(P[0], P[1]) < 0.015;
    ctx.strokeStyle = C.bad; ctx.lineWidth = 2.4 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), 11 * d, 0, Math.PI * 2); ctx.stroke();
    if (!sing) {
      const tv = D.tan(t), tl = Math.hypot(tv[0], tv[1]), u = [tv[0] / tl, tv[1] / tl], L = 0.6;
      ctx.strokeStyle = C.blow; ctx.lineWidth = 2.2 * d; ctx.setLineDash([7 * d, 5 * d]); ctx.beginPath(); ctx.moveTo(MX(P[0] - L * u[0]), MY(P[1] - L * u[1])); ctx.lineTo(MX(P[0] + L * u[0]), MY(P[1] + L * u[1])); ctx.stroke(); ctx.setLineDash([]);
      const g = D.g(P[0], P[1]), gl = Math.hypot(g[0], g[1]), gx = MX(P[0] + 0.28 * g[0] / gl), gy = MY(P[1] + 0.28 * g[1] / gl);
      ctx.strokeStyle = C.hot; ctx.lineWidth = 3 * d; ctx.beginPath(); ctx.moveTo(MX(P[0]), MY(P[1])); ctx.lineTo(gx, gy); ctx.stroke();
      ctx.fillStyle = C.blow; ctx.strokeStyle = C.surface; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(MX(P[0]), MY(P[1]), 6 * d, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      lab(`∇f = (${fmt(g[0])}, ${fmt(g[1])})`, 8 * d, 20 * d, C.hot);
      lab("dashed: tangent line", 8 * d, 38 * d, C.blow);
    } else {
      ctx.fillStyle = C.bad; ctx.beginPath(); ctx.arc(MX(0), MY(0), 5 * d, 0, Math.PI * 2); ctx.fill();
      lab("∇f = (0, 0): singular point", 8 * d, 20 * d, C.bad);
      lab("no tangent line here", 8 * d, 38 * d, C.ink);
    }
  }
  function fig1() { if (!$("#f1a")) return;
    fig1panel($("#f1a"), F1D.a, F1.t); fig1panel($("#f1t"), F1D.t, F1.t); fig1panel($("#f1b"), F1D.b, F1.t);
    $("#f1-t-out").textContent = Math.abs(F1.t) < 0.015 ? "at the origin" : (F1.t > 0 ? "+" : "−") + Math.abs(F1.t).toFixed(2);
  }
  $("#f1-t")?.addEventListener("input", (e) => { let v = +e.target.value; if (Math.abs(v) < 0.025) v = 0; F1.t = v; fig1(); });

  // ============================================================ collisions (shared)
  function collide(m, v0, gaps, e, maxc = 2000) {
    const x = [0, gaps[0], gaps[0] + gaps[1]], v = v0.slice(), ev = [{ t: 0, x: x.slice(), v: v.slice() }]; let t = 0, c = 0;
    const s0 = Math.abs(v0[0] - v0[1]) + Math.abs(v0[1] - v0[2]);
    while (c < maxc) {
      let best = Infinity, k = -1;
      for (let i = 0; i < 2; i++) { const rel = v[i] - v[i + 1]; if (rel > 1e-13 * s0) { const dt = (x[i + 1] - x[i]) / rel; if (dt < best) { best = dt; k = i; } } }
      if (k < 0) break;
      for (let i = 0; i < 3; i++) x[i] += v[i] * best; t += best; x[k + 1] = x[k];
      const M = m[k] + m[k + 1], vc = (m[k] * v[k] + m[k + 1] * v[k + 1]) / M;
      v[k] = vc - e * (v[k] - vc); v[k + 1] = vc - e * (v[k + 1] - vc); c++;
      ev.push({ t, x: x.slice(), v: v.slice(), k });
    }
    return { ev, v, c, t };
  }
  const posAt = (res, t, x0) => { const ev = res.ev; if (t <= 0) return ev[0].x.map((x, i) => x + ev[0].v[i] * t); let i = 0; while (i < ev.length - 1 && ev[i + 1].t <= t) i++; const e = ev[i]; return e.x.map((x, j) => x + e.v[j] * (t - e.t)); };
  const BALLCOL = () => [C.hot, C.blow, C.cold];
  const OUTCOL = () => [C.hot, C.cold, C.good, C.blow];
  function spacetime(cv, res, tEnd, xr, opts = {}) {
    const { ctx, W, H, d } = cvs(cv); ctx.clearRect(0, 0, W, H);
    const pad = 28 * d, MX = (x) => pad + (x - xr[0]) / (xr[1] - xr[0]) * (W - 2 * pad), MY = (t) => H - pad - t / tEnd * (H - 2 * pad);
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1 * d; ctx.beginPath(); ctx.moveTo(pad, H - pad); ctx.lineTo(W - pad, H - pad); ctx.moveTo(pad, H - pad); ctx.lineTo(pad, pad); ctx.stroke();
    const cols = BALLCOL(), ev = res.ev;
    for (let b = 0; b < 3; b++) {
      ctx.strokeStyle = cols[b]; ctx.lineWidth = 2.6 * d; ctx.beginPath(); ctx.moveTo(MX(ev[0].x[b]), MY(0));
      for (let i = 1; i < ev.length; i++) ctx.lineTo(MX(ev[i].x[b]), MY(ev[i].t));
      const L = ev[ev.length - 1]; ctx.lineTo(MX(L.x[b] + L.v[b] * (tEnd - L.t)), MY(tEnd)); ctx.stroke();
    }
    ctx.fillStyle = C.ink; for (let i = 1; i < ev.length; i++) { const e = ev[i]; ctx.beginPath(); ctx.arc(MX(e.x[e.k + 1]), MY(e.t), 3.2 * d, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = `500 ${12 * d}px "Schibsted Grotesk", sans-serif`; ctx.fillStyle = C.muted;
    ctx.fillText("time ↑", 4 * d, pad - 8 * d); ctx.fillText(opts.xlab || "position →", W - pad - 70 * d, H - 8 * d);
    if (opts.cursor != null) { ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5 * d; ctx.setLineDash([4 * d, 3 * d]); ctx.beginPath(); ctx.moveTo(pad, MY(opts.cursor)); ctx.lineTo(W - pad, MY(opts.cursor)); ctx.stroke(); ctx.setLineDash([]); }
    if (opts.note) { ctx.fillStyle = C.ink; ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`; ctx.fillText(opts.note, pad + 8 * d, pad + 4 * d); }
  }
  // mass-weighted configuration plane: returns a map from positions to 2D with the wedge symmetric about +x
  function wedgeMap(m) {
    const sq = m.map(Math.sqrt), n1 = [-1 / sq[0], 1 / sq[1], 0], n2 = [0, -1 / sq[1], 1 / sq[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], nrm = (a) => { const l = Math.sqrt(dot(a, a)); return a.map((v) => v / l); };
    const e1 = nrm(n1), t = dot(n2, e1), e2 = nrm(n2.map((v, i) => v - t * e1[i]));
    const P = (x) => { const q = x.map((v, i) => v * sq[i]); return [dot(q, e1), dot(q, e2)]; };
    // wall 1: a = 0, interior a > 0. wall 2: normal (n2·e1, n2·e2)
    const w2n = [dot(n2, e1), dot(n2, e2)];
    let d1 = [0, 1]; if (d1[0] * w2n[0] + d1[1] * w2n[1] < 0) d1 = [0, -1];
    let d2 = [w2n[1], -w2n[0]]; if (d2[0] < 0) d2 = [-d2[0], -d2[1]];
    const l2 = Math.hypot(d2[0], d2[1]); d2 = [d2[0] / l2, d2[1] / l2];
    const beta = Math.acos(clamp(d1[0] * d2[0] + d1[1] * d2[1], -1, 1));
    const bis = Math.atan2(d1[1] + d2[1], d1[0] + d2[0]), c = Math.cos(-bis), s = Math.sin(-bis);
    const R = (p) => [c * p[0] - s * p[1], s * p[0] + c * p[1]];
    return { map: (x) => R(P(x)), beta, w1: R(d1), w2: R(d2) };
  }

  // ============================================================ Figure 8 and the teaser: the cradle and its wedge
  const CR = { m: 0.25, s: 0.4, drag: false };
  const TZ = { m: 0.25, s: 0.3, drag: false };
  // the opening demo lives on the overview page; remember where the reader left it for section 6
  try { const kept = JSON.parse(sessionStorage.getItem("blowup-teaser") || "null"); if (kept) { TZ.s = kept.s; TZ.m = kept.m; } } catch (e) { /* storage unavailable */ }
  const V0 = [1, 0, -0.4];
  function chambers(st) {
    const N = 240, out = [], keys = [], vs = [];
    for (let i = 0; i < N; i++) { const s = (i + 0.5) / N, r = collide([1, st.m, 1], V0, [s, 1 - s], 1); const key = r.v.map((q) => q.toFixed(3)).join(","); let k = keys.indexOf(key); if (k < 0) { keys.push(key); vs.push(r.v); k = keys.length - 1; } out.push(k); }
    return { out, keys, vs, shares: keys.map((_, k) => out.filter((q) => q === k).length / N) };
  }
  const kAt = (st) => st.ch.out[Math.min(st.ch.out.length - 1, Math.floor(st.s * st.ch.out.length))];
  function drawBar(svg, st, hint) {
    const cols = OUTCOL(), ch = st.ch;
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 400 112");
    const x0 = 24, x1 = 376, X = (s) => x0 + s * (x1 - x0);
    ch.out.forEach((k, i) => E("rect", { x: X(i / ch.out.length), y: 26, width: (x1 - x0) / ch.out.length + 0.6, height: 30, fill: cols[k % 4] }, svg));
    E("rect", { x: x0, y: 26, width: x1 - x0, height: 30, fill: "none", stroke: C.rule }, svg);
    T(svg, x0, 18, "gap 1 much smaller", null); T(svg, x1, 18, "gap 2 much smaller", null, { at: { "text-anchor": "end" } });
    const mx = X(st.s); E("path", { d: `M${mx} 60 l-8 14 h16 z`, fill: C.ink }, svg); E("line", { x1: mx, x2: mx, y1: 22, y2: 60, stroke: C.ink, "stroke-width": 2 }, svg);
    T(svg, 200, 98, hint, null, { at: { "text-anchor": "middle" } });
  }
  function attachBar(svg, st, redraw) { if (!svg) return;
    const setS = (e) => { const r = svg.getBoundingClientRect(), x = (e.clientX - r.left) / r.width * 400; st.s = clamp((x - 24) / 352, 0.005, 0.995); redraw(); };
    svg.addEventListener("pointerdown", (e) => { st.drag = true; svg.setPointerCapture(e.pointerId); setS(e); });
    svg.addEventListener("pointermove", (e) => { if (st.drag) setS(e); });
    svg.addEventListener("pointerup", () => { st.drag = false; });
    svg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") st.s = clamp(st.s - 0.02, 0.005, 0.995); else if (e.key === "ArrowRight") st.s = clamp(st.s + 0.02, 0.005, 0.995); else return; e.preventDefault(); redraw(); });
  }
  function ballsAnim(cv, st, now) {
    if (!st.res) return;
    const { ctx, W, H, d } = cvs(cv); ctx.clearRect(0, 0, W, H);
    const m = [1, st.m, 1], rad = m.map((q) => 0.32 * Math.cbrt(q)), res = st.res;
    const tPre = 1.1, tPost = 1.4, per = tPre + Math.max(res.t, 0.01) + tPost, t = ((now / 1000) * 0.8 % (per + 0.6)) - tPre;
    const x = posAt(res, Math.min(t, per - tPre));
    const off = [0, rad[0] + rad[1], rad[0] + 2 * rad[1] + rad[2]], X = x.map((v, i) => v + off[i]);
    const ext = [posAt(res, -tPre), posAt(res, per - tPre)].flat().map((v, i) => v + off[i % 3]), rm = Math.max(...rad);
    const xa = Math.min(...ext) - rm - 0.15, xb = Math.max(...ext) + rm + 0.15, mid = (xa + xb) / 2, span = Math.max(xb - xa, 3.2);
    const sc = Math.min(W / span, H / 1.6), MX = (v) => W / 2 + (v - mid) * sc, gy = H * 0.62;
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5 * d; ctx.beginPath(); ctx.moveTo(0, gy + 0.45 * sc); ctx.lineTo(W, gy + 0.45 * sc); ctx.stroke();
    const cols = BALLCOL(), kc = OUTCOL()[kAt(st) % 4];
    for (let i = 0; i < 3; i++) {
      ctx.strokeStyle = C.steel; ctx.lineWidth = 1 * d; ctx.beginPath(); ctx.moveTo(MX(X[i]), 0); ctx.lineTo(MX(X[i]), gy - rad[i] * sc); ctx.stroke();
      ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(MX(X[i]), gy, rad[i] * sc, 0, Math.PI * 2); ctx.fill();
    }
    for (const e of res.ev.slice(1)) { const dtc = t - e.t; if (dtc >= 0 && dtc < 0.12) { const xc = e.x[e.k] + off[e.k] + rad[e.k]; ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * d; ctx.globalAlpha = 1 - dtc / 0.12; ctx.beginPath(); ctx.arc(MX(xc), gy, (0.2 + dtc * 3) * sc * 0.5, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1; } }
    ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`; ctx.fillStyle = C.muted;
    ctx.fillText(t < 0 ? "approaching" : t < res.t + 0.02 ? "colliding" : "after", 8 * d, 18 * d);
    if (t > res.t + 0.02) { ctx.fillStyle = kc; ctx.fillRect(W - 22 * d, 8 * d, 14 * d, 14 * d); }
  }
  function teaser() { if (!$("#tz-bar")) return;
    TZ.ch = chambers(TZ); TZ.res = collide([1, TZ.m, 1], V0, [TZ.s, 1 - TZ.s], 1);
    drawBar($("#tz-bar"), TZ, "drag: each color is a different outcome");
  }
  attachBar($("#tz-bar"), TZ, () => { try { sessionStorage.setItem("blowup-teaser", JSON.stringify({ s: TZ.s, m: TZ.m })); } catch (e) { /* storage unavailable */ } teaser(); });
  watch($("#tz-balls"));
  SCHED.add((now) => { if (isOn($("#tz-balls"))) ballsAnim($("#tz-balls"), TZ, now); });

  function fig2static() { if (!$("#f2-bar")) return;
    const m = [1, CR.m, 1], ch = chambers(CR); CR.ch = ch;
    CR.res = collide(m, V0, [CR.s, 1 - CR.s], 1);
    const kNow = kAt(CR), cols = OUTCOL();
    drawBar($("#f2-bar"), CR, "drag the marker to change the gap ratio");
    // wedge
    const W = wedgeMap(m), sv = $("#f2-wedge");
    const F = frame(sv, { W: 360, H: 300, l: 8, r: 8, t: 8, b: 8, xr: [-0.25, 1.45], yr: [-0.7, 0.7], noBox: true });
    const Rr = 3;
    E("path", { d: `M${F.X(0)} ${F.Y(0)}L${F.X(Rr * W.w1[0])} ${F.Y(Rr * W.w1[1])}L${F.X(Rr * W.w2[0] + Rr * W.w1[0])} ${F.Y(Rr * W.w2[1] + Rr * W.w1[1])}L${F.X(Rr * W.w2[0])} ${F.Y(Rr * W.w2[1])}Z`, fill: C.soft }, F.g);
    [W.w1, W.w2].forEach((w) => E("line", { x1: F.X(0), y1: F.Y(0), x2: F.X(Rr * w[0]), y2: F.Y(Rr * w[1]), stroke: C.ink, "stroke-width": 2.4 }, F.g));
    const vin = W.map(V0), vl = Math.hypot(vin[0], vin[1]);
    E("line", { x1: F.X(-3 * vin[0] / vl), y1: F.Y(-3 * vin[1] / vl), x2: F.X(0), y2: F.Y(0), stroke: C.muted, "stroke-width": 1.3, "stroke-dasharray": "5 4" }, F.g);
    const res = CR.res, ev = res.ev, r0 = Math.hypot(...W.map(ev[0].x)), sc = 0.5 / Math.max(r0, 1e-9);
    const pts = [W.map(ev[0].x.map((x, i) => x - ev[0].v[i] * 3)).map((v) => v * sc)];
    ev.forEach((e) => pts.push(W.map(e.x).map((v) => v * sc)));
    const L = ev[ev.length - 1], end = W.map(L.x.map((x, i) => x + L.v[i] * 3)).map((v) => v * sc);
    E("path", { d: pathD(pts, F.X, F.Y), fill: "none", stroke: C.ink, "stroke-width": 2.2 }, F.g);
    E("path", { d: pathD([pts[pts.length - 1], end], F.X, F.Y), fill: "none", stroke: cols[kNow % 4], "stroke-width": 3.2 }, F.g);
    pts.slice(2).forEach((p) => E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 3.5, fill: C.ink }, F.g));
    E("circle", { cx: F.X(0), cy: F.Y(0), r: 5, fill: C.bad }, sv);
    T(sv, F.X(0) - 4, F.Y(0) + 26, "corner: all touch", C.bad, { at: { "text-anchor": "start" }, st: ";font-weight:600" });
    const lw = (w, s) => T(sv, F.X(1.3 * w[0]), F.Y(1.3 * w[1]) + (w[1] > 0 ? -10 : 20), s, C.ink, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    lw(W.w1, "g₁ = 0: balls 1 and 2 touch"); lw(W.w2, "g₂ = 0: balls 2 and 3 touch");
    T(sv, F.x0 + 4, F.y1 - 8, `wedge angle β = ${(W.beta * 180 / Math.PI).toFixed(1)}°, 180°/β = ${(Math.PI / W.beta).toFixed(2)}`, C.muted);
    $("#f2-m-out").textContent = "m₂ = " + CR.m.toFixed(2);
    $("#f2-sub").textContent = `(${res.c} collision${res.c === 1 ? "" : "s"}; gaps enlarged)`;
    const integer = Math.abs(Math.PI / W.beta - Math.round(Math.PI / W.beta)) < 0.02;
    $("#f2-chips").innerHTML = ch.keys.map((key, i) => `<button type="button" class="chip" data-k="${i}" style="border:0;cursor:pointer;font:inherit;color:inherit${i === kNow ? ";outline:2px solid var(--ink)" : ""}" title="jump to a random gap ratio with this outcome"><span style="display:inline-block;width:11px;height:11px;border-radius:3px;background:${cols[i % 4]};margin-right:6px;vertical-align:-1px"></span>outgoing velocities ${ch.vs[i].map((q) => fmt(q, 2)).join(", ")} · share <b>${Math.round(ch.shares[i] * 100)}%</b></button>`).join("")
      + `<span class="chip ${integer ? "v" : ""}">${integer ? "180°/β is a whole number: every approach agrees" : "180°/β is not a whole number: the outcome depends on the approach"}</span>`;
    if (typeof window.__f16 === "function") window.__f16();
  }
  $("#f2-chips")?.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-k]"); if (!b) return;
    const k = +b.dataset.k, idx = []; CR.ch.out.forEach((q, i) => { if (q === k) idx.push(i); });
    const i = idx[Math.floor(Math.random() * idx.length)]; CR.s = (i + Math.random()) / CR.ch.out.length; fig2static();
  });
  let crTouched = false;
  attachBar($("#f2-bar"), CR, () => { crTouched = true; fig2static(); });
  $("#f2-m")?.addEventListener("input", (e) => { crTouched = true; CR.m = +e.target.value; fig2static(); });
  $("#f2-chips")?.addEventListener("click", () => { crTouched = true; });
  // pick up wherever the reader left the opening teaser
  watch($("#f2-balls"), () => { if (crTouched || (CR.s === TZ.s && CR.m === TZ.m)) return; CR.s = TZ.s; CR.m = TZ.m; $("#f2-m").value = CR.m; fig2static(); });
  SCHED.add((now) => { if (isOn($("#f2-balls"))) ballsAnim($("#f2-balls"), CR, now); });

  // ============================================================ Figure 3: narrowing wedge
  const F3 = { b: 14 };
  function wedgePath(beta) {
    // unfolded straight line passing at distance dd from the apex; fold by reflections
    const dd = 0.12, th0 = beta * 0.62, psi = th0 + Math.PI / 2, c = [dd * Math.cos(psi), dd * Math.sin(psi)], u = [Math.sin(psi), -Math.cos(psi)];
    // moving along +u the polar angle decreases, from psi + π/2 down to psi − π/2 = th0 (inside the wedge)
    const P = (s) => [c[0] + s * u[0], c[1] + s * u[1]];
    const S = 1.6, pts = [], hits = [];
    const fold = (p) => { const r = Math.hypot(p[0], p[1]); let a = Math.atan2(p[1], p[0]); if (a < 0) a += 2 * Math.PI; if (beta <= 0) return [r, 0]; let f = a % (2 * beta); if (f > beta) f = 2 * beta - f; return [r * Math.cos(f), r * Math.sin(f)]; };
    // crossing parameters
    const ss = [-S, S];
    if (beta > 0) {
      const a0 = psi - Math.PI / 2, a1 = psi + Math.PI / 2;
      for (let k = Math.ceil(a0 / beta + 1e-9); k * beta < a1 - 1e-9; k++) { const ang = k * beta, dir = [Math.cos(ang), Math.sin(ang)], den = u[0] * dir[1] - u[1] * dir[0]; if (Math.abs(den) < 1e-12) continue; const s = -(c[0] * dir[1] - c[1] * dir[0]) / den; hits.push(s); if (Math.abs(s) < S) ss.push(s); }
    }
    ss.sort((a, b) => a - b);
    ss.forEach((s) => pts.push(fold(P(s))));
    return { pts, n: hits.length };
  }
  function fig3() { if (!$("#f3-wedge")) return;
    const b = F3.b, beta = b * Math.PI / 180;
    const svg = $("#f3-wedge");
    const F = frame(svg, { W: 360, H: 300, l: 8, r: 8, t: 8, b: 8, xr: [-0.06, 1.0], yr: [-0.12, 0.76], noBox: true });
    if (b > 0) {
      E("path", { d: `M${F.X(0)} ${F.Y(0)}L${F.X(3)} ${F.Y(0)}L${F.X(3 * Math.cos(beta))} ${F.Y(3 * Math.sin(beta))}Z`, fill: C.soft }, F.g);
      E("line", { x1: F.X(0), y1: F.Y(0), x2: F.X(3), y2: F.Y(0), stroke: C.ink, "stroke-width": 2.4 }, F.g);
      E("line", { x1: F.X(0), y1: F.Y(0), x2: F.X(3 * Math.cos(beta)), y2: F.Y(3 * Math.sin(beta)), stroke: C.ink, "stroke-width": 2.4 }, F.g);
      const wp = wedgePath(beta);
      E("path", { d: pathD(wp.pts, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": b < 4 ? 1 : 2, "stroke-linejoin": "round" }, F.g);
      if (b >= 4) wp.pts.slice(1, -1).forEach((p) => E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 2.8, fill: C.ink }, F.g));
      T(svg, F.x0 + 6, F.y0 + 16, `${wp.n} bounces`, C.ink, { st: ";font-weight:700" });
      T(svg, F.x0 + 6, F.y0 + 32, `180°/β = ${(180 / b).toFixed(1)}`, null);
      F3.n = wp.n;
    } else {
      // touching walls: one ball pinned between two walls
      const y = F.Y(0.35), x = F.X(0.6);
      E("line", { x1: F.X(0.05), y1: y, x2: F.X(1.2), y2: y, stroke: C.ink, "stroke-width": 2.4 }, F.g);
      E("circle", { cx: x, cy: y, r: 6, fill: C.bad }, svg);
      arrow(svg, x, y - 10, x, y - 48, C.blow, 2.4); arrow(svg, x + 22, y + 10, x + 22, y + 48, C.blow, 2.4);
      T(svg, x + 34, y - 30, "flip off wall 1", C.blow, { st: ";font-weight:600" }); T(svg, x + 34, y + 40, "flip off wall 2", C.blow, { st: ";font-weight:600" });
      T(svg, F.x0 + 6, F.y0 + 16, "β = 0: the walls touch", C.ink, { st: ";font-weight:700" });
      T(svg, F.x0 + 6, F.y0 + 32, "g₁ ≥ 0 and g₂ ≥ 0 force g₁ + g₂ = 0", null);
      F3.n = Infinity;
    }
    const sc = $("#f3-count");
    const G = frame(sc, { W: 360, H: 300, l: 44, r: 12, t: 12, b: 42, xr: [0, 90], yr: [0, Math.log10(400)], xt: [0, 15, 30, 45, 60, 75, 90].map((v) => [v, v + "°"]), yt: [[0, "1"], [1, "10"], [2, "100"]], xlab: "wedge angle β", ylab: "bounces (log scale)" });
    const cur = []; for (let a = 0.45; a <= 90; a += 0.25) cur.push([a, Math.log10(180 / a)]);
    E("path", { d: pathD(cur, G.X, G.Y), fill: "none", stroke: C.steel, "stroke-width": 2, "stroke-dasharray": "5 4" }, G.g);
    const dots = []; for (let a = 1; a <= 90; a += 1) dots.push([a, Math.log10(Math.max(1, wedgePath(a * Math.PI / 180).n))]);
    E("path", { d: pathD(dots, G.X, G.Y), fill: "none", stroke: C.blow, "stroke-width": 2.2 }, G.g);
    [60, 45, 36, 30].forEach((a) => E("circle", { cx: G.X(a), cy: G.Y(Math.log10(180 / a)), r: 4, fill: C.good }, G.g));
    T(sc, G.x0 + 8, G.y1 - 10, "green: 180°/β whole (60° = equal masses)", C.good, { st: ";font-weight:600" });
    T(sc, G.x1 - 6, G.y0 + 15, "grey: 180°/β    violet: counted", null, { at: { "text-anchor": "end" } });
    if (b > 0) E("line", { x1: G.X(b), x2: G.X(b), y1: G.y0, y2: G.y1, stroke: C.ink, "stroke-width": 1.5 }, G.g);
    else { arrow(sc, G.X(0) + 12, G.Y(1.6), G.X(0) + 12, G.y0 + 4, C.bad, 2.2); T(sc, G.X(0) + 20, G.Y(1.9), "∞", C.bad, { st: ";font-weight:700;font-size:18px" }); }
    $("#f3-b-out").textContent = "β = " + b.toFixed(1) + "°";
    const whole = b > 0 && Math.abs(180 / b - Math.round(180 / b)) < 0.01;
    $("#f3-chips").innerHTML = b > 0
      ? `<span class="chip v">bounces: <b>${F3.n}</b></span><span class="chip">${whole ? "180°/β is a whole number: both sides of the corner agree" : "180°/β is not a whole number: two chambers with different outcomes"}</span>`
      : `<span class="chip v">a solver that handles one wall at a time: <b>never finishes</b></span><span class="chip">the fix: notice the implied equality g₁ + g₂ = 0 and stop the ball</span>`;
  }
  $("#f3-b")?.addEventListener("input", (e) => { F3.b = +e.target.value; fig3(); });

  // ============================================================ Figure 4: flat-bottomed well
  const WV = (x, y) => (y * y - x * x * x) ** 2;
  const F4X = [-0.5, 1.3], F4Y = [-0.9, 0.9];
  const F4P = [0.6, 0.3, 0.12, 0];
  const F4L = ["A", "B", "C", "D"];
  function fig4() { if (!$("#f4-top")) return;
    const { ctx, W, H, d } = cvs($("#f4-top")), n = 200, img = new ImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = F4X[0] + (F4X[1] - F4X[0]) * (i + 0.5) / n, y = F4Y[1] - (F4Y[1] - F4Y[0]) * (j + 0.5) / n, V = WV(x, y);
      const t = clamp(1 - (Math.log10(V + 1e-9) + 5) / 5.5, 0, 1), c = LUT[Math.round(Math.pow(t, 1.3) * 255 * 0.92)], o = 4 * (j * n + i);
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    const off = document.createElement("canvas"); off.width = n; off.height = n; off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const MX = (x) => (x - F4X[0]) / (F4X[1] - F4X[0]) * W, MY = (y) => (F4Y[1] - y) / (F4Y[1] - F4Y[0]) * H;
    ctx.strokeStyle = isDark() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.9)"; ctx.lineWidth = 1.4 * d; ctx.beginPath();
    for (let i = -100; i <= 100; i++) { const s = 1.05 * i / 100, x = s * s, y = s * s * s; i === -100 ? ctx.moveTo(MX(x), MY(y)) : ctx.lineTo(MX(x), MY(y)); } ctx.stroke();
    const cols = [C.cold, C.good, C.hot, C.bad];
    F4P.forEach((x, k) => {
      const y = Math.pow(x, 1.5), g = x > 0 ? [-3 * x * x, 2 * y] : [0, 1], gl = Math.hypot(g[0], g[1]), nn = [g[0] / gl, g[1] / gl], L = 0.22;
      ctx.strokeStyle = cols[k]; ctx.lineWidth = 3 * d; ctx.beginPath(); ctx.moveTo(MX(x - L * nn[0]), MY(y - L * nn[1])); ctx.lineTo(MX(x + L * nn[0]), MY(y + L * nn[1])); ctx.stroke();
      ctx.font = `700 ${13 * d}px "Schibsted Grotesk", sans-serif`; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; const lx = MX(x + (L + 0.05) * nn[0]) - 4 * d, ly = MY(y + (L + 0.05) * nn[1]) + 4 * d; ctx.strokeText(F4L[k], lx, ly); ctx.fillStyle = cols[k]; ctx.fillText(F4L[k], lx, ly);
    });
    ctx.strokeStyle = C.bad; ctx.lineWidth = 2.2 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), 11 * d, 0, Math.PI * 2); ctx.stroke();
    ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`;
    const lab = (s, x, y) => { ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; ctx.strokeText(s, x, y); ctx.fillStyle = C.ink; ctx.fillText(s, x, y); };
    lab("floor: V = 0 along y² = x³", 8 * d, H - 10 * d); lab("darker = lower", 8 * d, 18 * d);
    // cross-sections
    const sv = $("#f4-sec"); sv.innerHTML = ""; sv.setAttribute("viewBox", "0 0 360 140");
    const pw = 82, ph = 84, S = 0.25;
    F4P.forEach((x, k) => {
      const ox = 6 + k * 89, oy = 22, y = Math.pow(x, 1.5), g = x > 0 ? [-3 * x * x, 2 * y] : [0, 1], gl = Math.hypot(g[0], g[1]), nn = [g[0] / gl, g[1] / gl];
      const g2 = x > 0 ? gl * gl : 0, act = [], har = []; let mx = 0;
      for (let i = -60; i <= 60; i++) { const s = S * i / 60, v = WV(x + s * nn[0], y + s * nn[1]); act.push([s, v]); har.push([s, g2 * s * s]); mx = Math.max(mx, v); }
      const X = (s) => ox + (s + S) / (2 * S) * pw, Y = (v) => oy + ph - v / mx * ph * 0.92;
      E("rect", { x: ox, y: oy, width: pw, height: ph, fill: "none", stroke: C.rule }, sv);
      E("path", { d: pathD(har, X, Y), fill: "none", stroke: C.muted, "stroke-width": 1.4, "stroke-dasharray": "4 3" }, sv);
      E("path", { d: pathD(act, X, Y), fill: "none", stroke: cols[k], "stroke-width": 2.4 }, sv);
      T(sv, ox + 2, oy - 8, `${F4L[k]}: x = ${x}`, cols[k], { st: ";font-weight:700" });
      T(sv, ox + pw / 2, oy + ph + 16, x === 0 ? "quartic" : x < 0.2 ? "flattening" : "parabola", null, { at: { "text-anchor": "middle" } });
    });
    T(sv, 354, 136, "dashed: harmonic approximation", null, { at: { "text-anchor": "end" }, st: ";font-size:11px" });
    // eigenvalues
    const ev = $("#f4-eig");
    const G = frame(ev, { W: 360, H: 220, l: 40, r: 12, t: 12, b: 42, xr: [0, 0.8], yr: [-0.6, 12], xt: [[0, "0"], [0.2, "0.2"], [0.4, "0.4"], [0.6, "0.6"], [0.8, "0.8"]], yt: [[0, "0"], [5, "5"], [10, "10"]], xlab: "position x along the floor", ylab: "Hessian eigenvalues" });
    const big = []; for (let i = 0; i <= 120; i++) { const x = 0.8 * i / 120; big.push([x, 2 * (9 * x ** 4 + 4 * x ** 3)]); }
    E("path", { d: pathD(big, G.X, G.Y), fill: "none", stroke: C.cold, "stroke-width": 2.6 }, G.g);
    E("line", { x1: G.X(0), x2: G.X(0.8), y1: G.Y(0), y2: G.Y(0), stroke: C.hot, "stroke-width": 2.6 }, G.g);
    F4P.forEach((x, k) => E("circle", { cx: G.X(x), cy: G.Y(2 * (9 * x ** 4 + 4 * x ** 3)), r: 4, fill: cols[k] }, G.g));
    ring(ev, G.X(0), G.Y(0), 8);
    T(ev, G.X(0.36), G.Y(7.5), "across the floor: 2|∇f|²", C.cold, { st: ";font-weight:600" });
    T(ev, G.X(0.36), G.Y(0) - 8, "along the floor: 0", C.hot, { st: ";font-weight:600" });
  }

  // ============================================================ Figure 5: Painlevé's 0/0
  function fig5() { if (!$("#f5")) return;
    const g = 9.81, mu = 1.6, DEG = Math.PI / 180;
    const pF = (th) => 1 + 3 * Math.cos(th) ** 2 - 3 * mu * Math.sin(th) * Math.cos(th);
    const q = Math.sqrt(9 * mu * mu - 16), t1 = Math.atan((3 * mu - q) / 2), w1 = Math.sqrt(g / Math.sin(t1));
    const svg = $("#f5"), dx = 5, dy = 0.9;
    const F = frame(svg, { W: 360, H: 320, l: 44, r: 12, t: 12, b: 42, xr: [t1 / DEG - dx, t1 / DEG + dx], yr: [w1 - dy, w1 + dy], xt: [-4, -2, 0, 2, 4].map((v) => [t1 / DEG + v, (t1 / DEG + v).toFixed(0) + "°"]), yt: [-0.8, -0.4, 0, 0.4, 0.8].map((v) => [w1 + v, (w1 + v).toFixed(1)]), xlab: "rod angle θ", ylab: "spin rate ω" });
    const levels = [0.1, 0.3, 1, 3, 10, -0.1, -0.3, -1, -3, -10];
    for (const c of levels) {
      // N = c·g  ⇔  b + (c g) p = 0  ⇔  ω² sin θ = g − c g p(θ)
      const pts = []; for (let i = 0; i <= 200; i++) { const th = (t1 / DEG - dx + 2 * dx * i / 200) * DEG, r = (g - c * g * pF(th)) / Math.sin(th); pts.push(r >= 0 ? [th / DEG, Math.sqrt(r)] : null); }
      E("path", { d: pathD(pts, F.X, F.Y), fill: "none", stroke: c > 0 ? C.hot : C.cold, "stroke-width": 1 + 0.5 * Math.abs(Math.log10(Math.abs(c)) + 1.2), opacity: 0.85 }, F.g);
    }
    const b0 = []; for (let i = 0; i <= 200; i++) { const th = (t1 / DEG - dx + 2 * dx * i / 200) * DEG; b0.push([th / DEG, Math.sqrt(g / Math.sin(th))]); }
    E("path", { d: pathD(b0, F.X, F.Y), fill: "none", stroke: C.ink, "stroke-width": 2.2 }, F.g);
    E("line", { x1: F.X(t1 / DEG), x2: F.X(t1 / DEG), y1: F.y0, y2: F.y1, stroke: C.ink, "stroke-width": 2.2, "stroke-dasharray": "6 4" }, F.g);
    ring(svg, F.X(t1 / DEG), F.Y(w1), 9);
    T(svg, F.X(t1 / DEG) + 12, F.Y(w1) + 26, "0/0", C.bad, { st: ";font-weight:700" });
    T(svg, F.x1 - 6, F.y0 + 16, "black: N = 0 (b = 0)", C.ink, { at: { "text-anchor": "end" } });
    T(svg, F.x1 - 6, F.y0 + 32, "dashed: N = ±∞ (p = 0)", C.ink, { at: { "text-anchor": "end" } });
    T(svg, F.x0 + 6, F.y1 - 24, "orange: N > 0, pushing", C.hot, { st: ";font-weight:600" });
    T(svg, F.x0 + 6, F.y1 - 8, "blue: N < 0, would have to pull", C.cold, { st: ";font-weight:600" });
  }

  // ============================================================ Figure 6: three resolutions of one event
  const F6 = { m: 0.5 };
  function bubble(m, v0, first) {
    const v = v0.slice(); let hits = 0; const order = first === 0 ? [0, 1] : [1, 0];
    for (let it = 0; it < 10000; it++) {
      let any = false;
      for (const k of order) if (v[k] - v[k + 1] > 1e-12) { const M = m[k] + m[k + 1], vc = (m[k] * v[k] + m[k + 1] * v[k + 1]) / M; v[k] = 2 * vc - v[k]; v[k + 1] = 2 * vc - v[k + 1]; any = true; hits++; }
      if (!any) break;
    }
    return { v, hits };
  }
  function springs(m, v0, p) {
    const x = [0, 0, 0], v = v0.slice(), dt = 2e-4;
    const acc = () => { const a = [0, 0, 0]; for (let i = 0; i < 2; i++) { const dd = x[i] - x[i + 1]; if (dd > 0) { const Fc = Math.pow(dd, p); a[i] -= Fc / m[i]; a[i + 1] += Fc / m[i + 1]; } } return a; };
    let a = acc();
    for (let s = 0; s < 400000; s++) {
      for (let i = 0; i < 3; i++) { v[i] += 0.5 * dt * a[i]; x[i] += dt * v[i]; }
      a = acc(); for (let i = 0; i < 3; i++) v[i] += 0.5 * dt * a[i];
      if (x[0] <= x[1] && x[1] <= x[2] && v[0] <= v[1] + 1e-12 && v[1] <= v[2] + 1e-12) break;
    }
    return { v };
  }
  function fig6() { if (!$("#f6-table")) return;
    const m = [1, F6.m, 1], V = [1, 0, -1], ke = (v) => 0.5 * m.reduce((s, mi, i) => s + mi * v[i] * v[i], 0), K0 = ke(V);
    const A = bubble(m, V, 0), B = bubble(m, V, 1), L = springs(m, V, 1), H = springs(m, V, 1.5);
    const N = 400, keys = {}; for (let i = 0; i < N; i++) { const s = (i + 0.5) / N, r = collide(m, V, [s, 1 - s], 1), k = r.v.map((q) => q.toFixed(4)).join(","); if (!keys[k]) keys[k] = { v: r.v, c: 0, s }; keys[k].c++; }
    const chs = Object.values(keys).sort((a, b) => a.s - b.s);
    const row = (name, v, note, cls = "") => `<tr class="${cls}"><td>${name}</td>${v.map((q) => `<td class="v">${fmt(q, 3)}</td>`).join("")}<td class="v">${Math.round(100 * ke(v) / K0)}%</td><td>${note}</td></tr>`;
    let html = `<table><thead><tr><th>Method</th><th>v₁</th><th>v₂</th><th>v₃</th><th>Energy kept</th><th>Notes</th></tr></thead><tbody>`;
    html += row("Bubble sort, contact 1–2 first", A.v, `${A.hits} pairwise impulses`);
    html += row("Bubble sort, contact 2–3 first", B.v, `${B.hits} pairwise impulses`);
    html += row("Linear springs (penalty)", L.v, "symmetric; one answer");
    html += row("Hertz springs, F ∝ δ<sup>3/2</sup>", H.v, "symmetric; one answer");
    chs.forEach((ch) => { html += row(chs.length === 1 ? "Blowup: every approach" : ch.s < 0.5 ? "Blowup: gap 1 closes first" : "Blowup: gap 2 closes first", ch.v, `share <b>${Math.round(100 * ch.c / N)}%</b> of gap ratios`, "on"); });
    html += row("Perfectly inelastic", [0, 0, 0], "all stick: the restitution-0 end of All's Well's blend");
    html += `</tbody></table>`;
    $("#f6-table").innerHTML = html;
    $("#f6-m-out").textContent = "m₂ = " + F6.m.toFixed(2);
  }
  $("#f6-m")?.addEventListener("input", (e) => { F6.m = +e.target.value; fig6(); });

  window.__E = { isOn, posAt, BALLCOL, $, E, C, readColors, rgb, mix, css, clamp, isDark, cvs, sup, fmt, T, seg, hsv, frame, pathD, ring, makeLUT, LUT: () => LUT, modPi, dirRGB, dirCol, arrow, collide, spacetime, CR, SCHED, watch, vis };
  // ============================================================ section 1: the billiard corner and its blowup
  function figCorner() { if (!$("#f0-w")) return;
    const st = { m: 0.25, s: 0.3 }, m = [1, st.m, 1], ch = chambers(st), W = wedgeMap(m), cols = OUTCOL(), sv = $("#f0-w");
    const F = frame(sv, { W: 680, H: 300, l: 8, r: 8, t: 8, b: 8, xr: [-0.17, 0.75], yr: [-0.2, 0.2], noBox: true });
    const Rr = 3;
    E("path", { d: `M${F.X(0)} ${F.Y(0)}L${F.X(Rr * W.w1[0])} ${F.Y(Rr * W.w1[1])}L${F.X(Rr * W.w2[0] + Rr * W.w1[0])} ${F.Y(Rr * W.w2[1] + Rr * W.w1[1])}L${F.X(Rr * W.w2[0])} ${F.Y(Rr * W.w2[1])}Z`, fill: C.soft }, F.g);
    [W.w1, W.w2].forEach((w) => E("line", { x1: F.X(0), y1: F.Y(0), x2: F.X(Rr * w[0]), y2: F.Y(Rr * w[1]), stroke: C.ink, "stroke-width": 2.4 }, F.g));
    // one billiard path, from a gap ratio in the first chamber
    const res = collide(m, V0, [st.s, 1 - st.s], 1), ev = res.ev, r0 = Math.hypot(...W.map(ev[0].x)), sc = 0.62 / Math.max(r0, 1e-9);
    const pts = [W.map(ev[0].x.map((x, i) => x - ev[0].v[i] * 3)).map((v) => v * sc)];
    ev.forEach((e) => pts.push(W.map(e.x).map((v) => v * sc)));
    const L = ev[ev.length - 1], end = W.map(L.x.map((x, i) => x + L.v[i] * 3)).map((v) => v * sc);
    E("path", { d: pathD(pts, F.X, F.Y), fill: "none", stroke: C.ink, "stroke-width": 2 }, F.g);
    E("path", { d: pathD([pts[pts.length - 1], end], F.X, F.Y), fill: "none", stroke: cols[ch.out[Math.floor(st.s * ch.out.length)] % 4], "stroke-width": 3 }, F.g);
    pts.slice(2).forEach((p) => E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 3.5, fill: C.ink }, F.g));
    // the blown-up corner: an arc of directions colored by outcome
    const R0 = 0.07, N = ch.out.length;
    for (let i = 0; i < N; i++) {
      const s0 = i / N, s1 = (i + 1) / N, a0 = Math.atan2(...W.map([0, s0, 1]).reverse()), a1 = Math.atan2(...W.map([0, s1, 1]).reverse());
      const p0 = [R0 * Math.cos(a0), R0 * Math.sin(a0)], p1 = [R0 * Math.cos(a1), R0 * Math.sin(a1)];
      E("path", { d: pathD([p0, p1], F.X, F.Y), stroke: cols[ch.out[i] % 4], "stroke-width": 12, fill: "none" }, F.g);
    }
    E("circle", { cx: F.X(0), cy: F.Y(0), r: 5, fill: C.bad }, sv);
    T(sv, F.X(-0.165), F.Y(0) - 14, "corner:", C.bad, { st: ";font-weight:600" }); T(sv, F.X(-0.165), F.Y(0) + 2, "all three touch", C.bad, { st: ";font-weight:600" });
    ["the blown-up corner:", "every direction of approach,", "colored by its outcome"].forEach((L, i) => T(sv, F.X(-0.165), F.Y(-0.09) + 16 * i, L, C.blow, { st: ";font-weight:700" }));
    E("line", { x1: F.X(-0.03), y1: F.Y(-0.09) - 12, x2: F.X(0.05), y2: F.Y(-0.035), stroke: C.blow, "stroke-width": 1.4 }, sv);
    const lw = (w, s) => T(sv, F.X(0.62 * w[0]), F.Y(0.62 * w[1]) + (w[1] > 0 ? 22 : -12), s, C.ink, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    lw(W.w1, "wall g₁ = 0: balls 1 and 2 touch"); lw(W.w2, "wall g₂ = 0: balls 2 and 3 touch");
    T(sv, F.X(0.74), F.Y(0) + 4, "each bounce = one two-ball collision", C.muted, { at: { "text-anchor": "end" } });
  }
  window.__draw1 = () => { readColors(); makeLUT(); figCorner(); fig1(); teaser(); fig2static(); fig3(); fig4(); fig6(); };
  readColors(); makeLUT();
})();

// ============================================================ Nash's blowup of the 4D toric shape X contains X
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  if (!$("#n4-go")) return;
  const H = [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1], [2, 3, -2, -1], [1, 3, -1, -1], [1, 2, -1, 0]];
  // the six equations of X, as pairs of monomials (indices 1..7)
  const EQ = [[[1, 6], [3, 5]], [[4, 6], [2, 7]], [[7, 7], [2, 4, 5]], [[6, 7], [2, 2, 5]], [[3, 7], [1, 2, 2]], [[3, 4, 5], [1, 2, 7]]];
  // the chart's coordinates as ratios of x's: y_i = x_num / x_den (den 0 means 1)
  const RATIO = [[6, 5], [4, 2], [4, 5], [1, 0], [6, 3], [4, 3], [7, 2]];
  const SUB = "₀₁₂₃₄₅₆₇₈₉";
  const mono = (v, idx) => idx.reduce((p, i) => p * v[i - 1], 1);
  const name = (c, idx) => { const cnt = {}; idx.forEach((i) => { cnt[i] = (cnt[i] || 0) + 1; }); return Object.keys(cnt).map((i) => c + SUB[+i] + (cnt[i] > 1 ? "²" : "")).join(""); };
  const fmtN = (v) => (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(4));
  function render(x) {
    const y = x ? RATIO.map(([a, b]) => x[a - 1] / (b ? x[b - 1] : 1)) : null;
    const side = (c, v) => EQ.map(([l, r]) => {
      const eq = `${name(c, l)} = ${name(c, r)}`;
      if (!v) return eq;
      const L = mono(v, l), R = mono(v, r), ok = Math.abs(L - R) <= 1e-9 * Math.max(1, Math.abs(L));
      return `${eq.padEnd(12, " ").replace(/ /g, "&nbsp;")}&nbsp; ${fmtN(L)} = ${fmtN(R)} ${ok ? "<b>✓</b>" : "✗"}`;
    }).join("<br>");
    $("#n4-x").innerHTML = side("x", x);
    $("#n4-y").innerHTML = side("y", y);
    $("#n4-dict").innerHTML = "the chart's coordinates: " + RATIO.map(([a, b], i) => `y${SUB[i + 1]} = x${SUB[a]}${b ? "/x" + SUB[b] : ""}`).join(", ");
  }
  $("#n4-go").addEventListener("click", () => {
    const t = [0, 0, 0, 0].map(() => Math.exp(0.8 * (2 * Math.random() - 1)));
    const x = H.map((h) => h.reduce((p, e, k) => p * Math.pow(t[k], e), 1));
    $("#n4-t").textContent = "t = (" + t.map((v) => v.toFixed(3)).join(", ") + ")";
    render(x);
  });
  render(null);
})();

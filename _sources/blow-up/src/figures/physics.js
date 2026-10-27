import { cuspNeighborhoodShares } from "./learning-geometry.js";
(() => {
  "use strict";
  const X_ = window.__E;
  const { isOn } = window.__E;
  const { $, E, C, rgb, mix, css, clamp, isDark, cvs, sup, fmt, T, seg, hsv, frame, pathD, ring, collide, spacetime, CR, SCHED, watch, vis } = X_;
  const LUT = () => X_.LUT();

  // ============================================================ Figure 13: inelastic collapse
  const RC = 7 - 4 * Math.sqrt(3), IC = { le: -1.05 };
  const icRun = (e) => collide([1, 1, 1], [1, 0, -1], [0.3, 0.7], e, 400);
  let icCounts = null;
  function fig13() { if (!$("#ic-st")) return;
    const e = Math.pow(10, IC.le), r = icRun(e), collapse = e < RC;
    IC.res = r; IC.tEnd = collapse ? Math.max(0.01, r.t) : Math.min(1.1, Math.max(0.75, r.t * 1.3)); IC.note = collapse ? "collapse regime · finite recorded trace" : `${r.c} collisions`;
    spacetime($("#ic-st"), r, IC.tEnd, [-0.1, 1.1], { note: IC.note, xlab: "position →" });
    if (!icCounts) { icCounts = []; for (let i = 0; i <= 160; i++) { const le = Math.log10(RC) + 1e-4 + (0 - Math.log10(RC)) * Math.pow(i / 160, 1.6); icCounts.push([le, icRun(Math.pow(10, le)).c]); } }
    const svg = $("#ic-n");
    const F = frame(svg, { W: 360, H: 300, l: 40, r: 12, t: 12, b: 42, xr: [-1.7, 0], yr: [0, 40], xt: [[-1.7, "0.02"], [Math.log10(RC), "0.072"], [-0.5, "0.32"], [0, "1"]], yt: [0, 10, 20, 30, 40].map((v) => [v, String(v)]), xlab: "restitution e (log scale)", ylab: "collisions" });
    E("rect", { x: F.x0, y: F.y0, width: F.X(Math.log10(RC)) - F.x0, height: F.y1 - F.y0, fill: C.bad, opacity: 0.1 }, F.g);
    E("line", { x1: F.X(Math.log10(RC)), x2: F.X(Math.log10(RC)), y1: F.y0, y2: F.y1, stroke: C.bad, "stroke-dasharray": "5 4", "stroke-width": 1.5 }, F.g);
    E("path", { d: pathD(icCounts, F.X, F.Y), fill: "none", stroke: C.ink, "stroke-width": 2.2 }, F.g);
    T(svg, F.X(-1.66), F.y0 + 32, "infinitely", C.bad, { st: ";font-weight:700" }); T(svg, F.X(-1.66), F.y0 + 48, "many", C.bad, { st: ";font-weight:700" });
    T(svg, F.X(Math.log10(RC)) + 6, F.y0 + 16, "7 − 4√3", C.bad);
    E("line", { x1: F.X(IC.le), x2: F.X(IC.le), y1: F.y0, y2: F.y1, stroke: C.blow, "stroke-width": 2 }, F.g);
    $("#ic-e-out").textContent = "e = " + e.toFixed(3);
    $("#ic-chips").innerHTML = `<span class="chip ${collapse ? "v" : ""}">${collapse ? "collapse regime: the trace ends at its numerical cutoff" : `${r.c} collisions, then the balls separate`}</span><span class="chip">threshold 7 − 4√3 = <b>${RC.toFixed(4)}</b></span>`;
  }
  $("#ic-e")?.addEventListener("input", (e) => { IC.le = +e.target.value; fig13(); });
  function icAnim(now) { if (!$("#ic-st")) return;
    if (!IC.res) return;
    const per = 6, t = ((now / 1000) % (per + 1)) / per * IC.tEnd, tt = Math.min(t, IC.tEnd);
    spacetime($("#ic-st"), IC.res, IC.tEnd, [-0.1, 1.1], { note: IC.note, xlab: "position →", cursor: tt });
    const { ctx, W, H, d } = cvs($("#ic-balls")); ctx.clearRect(0, 0, W, H);
    const x = X_.posAt(IC.res, tt), rad = 0.028, pad = 28 * d, MX = (v) => pad + (v + 0.1) / 1.2 * (W - 2 * pad), gy = H * 0.55, sc = (W - 2 * pad) / 1.2;
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5 * d; ctx.beginPath(); ctx.moveTo(pad, gy + rad * sc + 3 * d); ctx.lineTo(W - pad, gy + rad * sc + 3 * d); ctx.stroke();
    const cols = X_.BALLCOL(), off = [-2 * rad, 0, 2 * rad];
    for (let i = 0; i < 3; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(MX(x[i] + off[i]), gy, rad * sc, 0, Math.PI * 2); ctx.fill(); }
    let nc = 0; for (const ev of IC.res.ev) if (ev.t > 0 && ev.t <= tt) nc++;
    ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`; ctx.fillStyle = C.muted; ctx.fillText(`t = ${tt.toFixed(3)} · collisions so far: ${nc}${nc >= 400 ? "+" : ""}`, 8 * d, 18 * d);
  }
  watch($("#ic-balls"));
  SCHED.add((now) => { if (isOn($("#ic-balls")) && vis.get($("#ic-balls")) !== undefined) icAnim(now); });

  // ============================================================ Figure 14: cross fields three ways
  const GLD = { d: 4, eps: 0.06, rho: 0.55, sims: [], N: 81, L: 1.04, Tmax: 2.4, running: false, bm: null };
  function glMake(start, rho) {
    const { N, L, d, eps } = GLD, h = 2 * L / (N - 1), n = N * N;
    const re = new Float64Array(n), im = new Float64Array(n), type = new Int8Array(n);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -L + i * h, y = -L + j * h, r = Math.hypot(x, y), th = Math.atan2(y, x), k = j * N + i;
      if (r >= 1) { type[k] = 1; re[k] = Math.cos(d * th); im[k] = Math.sin(d * th); continue; }
      if (rho > 0 && r <= rho) { type[k] = 2; continue; }
      const f = rho > 0 ? 1 : Math.pow(Math.tanh(r / (1.5 * eps)), d) * (1 + 0.02 * Math.sin(3 * x + 5 * y));
      re[k] = f * Math.cos(d * th); im[k] = f * Math.sin(d * th);
    }
    const idx = [], nb = [];
    for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (type[k]) continue; idx.push(k); for (const m of [k - 1, k + 1, k - N, k + N]) nb.push(type[m] === 2 ? k : m); }
    return { start, rho, re, im, type, h, idx: Int32Array.from(idx), nb: Int32Array.from(nb), nr: new Float64Array(n), ni: new Float64Array(n), t: 0, dt: Math.min(0.2 * h * h, 0.2 * eps * eps), E: 0, vs: [] };
  }
  function glStep(S, steps) {
    const { re, im, idx, nb, nr, ni, h, dt } = S, ih = 1 / (h * h), ie = 1 / (GLD.eps * GLD.eps), M = idx.length;
    for (let s = 0; s < steps; s++) {
      for (let q = 0; q < M; q++) {
        const k = idx[q], o = 4 * q, a1 = nb[o], a2 = nb[o + 1], a3 = nb[o + 2], a4 = nb[o + 3], r0 = re[k], i0 = im[k], g = 1 - r0 * r0 - i0 * i0;
        nr[k] = r0 + dt * ((re[a1] + re[a2] + re[a3] + re[a4] - 4 * r0) * ih + r0 * g * ie);
        ni[k] = i0 + dt * ((im[a1] + im[a2] + im[a3] + im[a4] - 4 * i0) * ih + i0 * g * ie);
      }
      for (let q = 0; q < M; q++) { const k = idx[q]; re[k] = nr[k]; im[k] = ni[k]; }
    }
    S.t += steps * dt;
  }
  function windings(re, im, type) {
    const { N, L } = GLD, h = 2 * L / (N - 1), vs = [];
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
      const ks = [j * N + i, j * N + i + 1, (j + 1) * N + i + 1, (j + 1) * N + i]; if (ks.some((k) => type[k])) continue;
      let w = 0; for (let q = 0; q < 4; q++) { let dd = Math.atan2(im[ks[(q + 1) % 4]], re[ks[(q + 1) % 4]]) - Math.atan2(im[ks[q]], re[ks[q]]); while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI; w += dd; }
      const n = Math.round(w / (2 * Math.PI)); if (n) vs.push([n, -L + (i + 0.5) * h, -L + (j + 0.5) * h]);
    }
    return vs;
  }
  function glMeasure(S) {
    const { N } = GLD, { re, im, type, h } = S; let En = 0;
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) {
      const k = j * N + i; if (type[k] === 2) continue;
      for (const m of [k + 1, k + N]) { if (type[m] === 2 || (type[k] === 1 && type[m] === 1)) continue; const dr = re[m] - re[k], di = im[m] - im[k]; En += 0.5 * (dr * dr + di * di); }
      if (!type[k]) { const a = 1 - re[k] * re[k] - im[k] * im[k]; En += a * a / (4 * GLD.eps * GLD.eps) * h * h; }
    }
    S.E = En; S.vs = windings(re, im, type);
  }
  // Burer–Monteiro lift: unit vectors in R^3, block-coordinate ("mixing") updates with over-relaxation
  function bmMake() {
    const { N, L } = GLD, h = 2 * L / (N - 1), n = N * N, V = new Float64Array(3 * n), type = new Int8Array(n);
    let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 - 0.5; };
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const x = -L + i * h, y = -L + j * h, r = Math.hypot(x, y), th = Math.atan2(y, x), k = j * N + i;
      V[3 * k] = Math.cos(4 * th); V[3 * k + 1] = Math.sin(4 * th); V[3 * k + 2] = r >= 1 ? 0 : 0.02 * rnd();
      if (r >= 1) type[k] = 1; else { const s = Math.hypot(V[3 * k], V[3 * k + 1], V[3 * k + 2]); for (let a = 0; a < 3; a++) V[3 * k + a] /= s; }
    }
    const idx = []; for (let j = 1; j < N - 1; j++) for (let i = 1; i < N - 1; i++) { const k = j * N + i; if (!type[k]) idx.push(k); }
    return { V, type, idx: Int32Array.from(idx), sweeps: 0, E: 0, vs: [], done: false, Eprev: 1e9 };
  }
  function bmStep(B, sweeps) {
    const { V, idx } = B, N = GLD.N;
    for (let s = 0; s < sweeps; s++) {
      for (let q = 0; q < idx.length; q++) {
        const k = idx[q]; let a0 = 0, a1 = 0, a2 = 0;
        for (const m of [k - 1, k + 1, k - N, k + N]) { a0 += V[3 * m]; a1 += V[3 * m + 1]; a2 += V[3 * m + 2]; }
        const sn = Math.hypot(a0, a1, a2) || 1;
        let v0 = V[3 * k] + 1.8 * (a0 / sn - V[3 * k]), v1 = V[3 * k + 1] + 1.8 * (a1 / sn - V[3 * k + 1]), v2 = V[3 * k + 2] + 1.8 * (a2 / sn - V[3 * k + 2]);
        const t = Math.hypot(v0, v1, v2) || 1; V[3 * k] = v0 / t; V[3 * k + 1] = v1 / t; V[3 * k + 2] = v2 / t;
      }
    }
    B.sweeps += sweeps;
  }
  function bmMeasure(B) {
    const { V, type } = B, N = GLD.N, n = N * N; let En = 0;
    for (let j = 0; j < N - 1; j++) for (let i = 0; i < N - 1; i++) { const k = j * N + i; for (const m of [k + 1, k + N]) { if (type[k] && type[m]) continue; let s = 0; for (let a = 0; a < 3; a++) { const dd = V[3 * k + a] - V[3 * m + a]; s += dd * dd; } En += 0.5 * s; } }
    const re = new Float64Array(n), im = new Float64Array(n); for (let k = 0; k < n; k++) { re[k] = V[3 * k]; im[k] = V[3 * k + 1]; }
    B.E = En; B.vs = windings(re, im, type);
    const c = ((N - 1) / 2) * N + (N - 1) / 2; B.uc = Math.hypot(V[3 * c], V[3 * c + 1]);
    if (Math.abs(B.Eprev - En) < 1e-7 && B.sweeps > 300) B.done = true; B.Eprev = En;
  }
  function crosses(ctx, d, MX, MY, sc, get, rho, dark) {
    const { N, L } = GLD, h = 2 * L / (N - 1), stp = 2 / 13, arm = 0.36 * stp * sc;
    ctx.lineCap = "round";
    for (let gy = -1 + stp / 2; gy < 1; gy += stp) for (let gx = -1 + stp / 2; gx < 1; gx += stp) {
      const r = Math.hypot(gx, gy); if (r > 0.95 || r < rho + 0.05) continue;
      const i = Math.round((gx + L) / h), j = Math.round((gy + L) / h), [ur, ui] = get(j * N + i);
      const m = Math.hypot(ur, ui), th = Math.atan2(ui, ur) / 4, cx = MX(gx), cy = MY(gy);
      ctx.strokeStyle = dark ? `rgba(240,242,248,${0.25 + 0.65 * Math.min(1, m)})` : `rgba(24,26,34,${0.2 + 0.7 * Math.min(1, m)})`; ctx.lineWidth = 1.7 * d;
      ctx.beginPath(); for (const a of [th, th + Math.PI / 2]) { const dx = Math.cos(a) * arm, dy = -Math.sin(a) * arm; ctx.moveTo(cx - dx, cy - dy); ctx.lineTo(cx + dx, cy + dy); } ctx.stroke();
    }
  }
  function diskFrame(cv, colorAt) {
    const { ctx, W, H, d } = cvs(cv), { N, L } = GLD, img = new ImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const k = j * N + i, o = 4 * ((N - 1 - j) * N + i), c = colorAt(k); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; }
    const off = document.createElement("canvas"); off.width = N; off.height = N; off.getContext("2d").putImageData(img, 0, 0);
    ctx.clearRect(0, 0, W, H); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const MX = (x) => (x + L) / (2 * L) * W, MY = (y) => (L - y) / (2 * L) * H, sc = W / (2 * L);
    ctx.fillStyle = C.soft; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(MX(0), MY(0), sc, 0, Math.PI * 2, true); ctx.fill();
    return { ctx, d, MX, MY, sc };
  }
  const ringCores = (ctx, d, MX, MY, vs) => { for (const [, x, y] of vs) { ctx.lineWidth = 4.5 * d; ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.beginPath(); ctx.arc(MX(x), MY(y), 8 * d, 0, Math.PI * 2); ctx.stroke(); ctx.lineWidth = 2.2 * d; ctx.strokeStyle = "#fff"; ctx.stroke(); } };
  const meanR = (vs) => vs.length ? vs.reduce((a, v) => a + Math.hypot(v[1], v[2]), 0) / vs.length : 0;
  function glRender(S, cv, tag) {
    const { re, im, type } = S, bg = rgb(C.soft), dark = isDark();
    const F = diskFrame(cv, (k) => { if (type[k]) return bg; const m = Math.min(1, Math.hypot(re[k], im[k])), hue = (Math.atan2(im[k], re[k]) * 180 / Math.PI + 360) % 360; return hsv(hue, dark ? 0.55 : 0.4, 0.1 + (dark ? 0.62 : 0.88) * Math.pow(m, 1.6)); });
    crosses(F.ctx, F.d, F.MX, F.MY, F.sc, (k) => [re[k], im[k]], S.rho, dark);
    const { ctx, d, MX, MY, sc } = F;
    ctx.strokeStyle = C.steel; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), sc, 0, Math.PI * 2); ctx.stroke();
    if (S.rho > 0) { ctx.fillStyle = C.soft; ctx.beginPath(); ctx.arc(MX(0), MY(0), sc * S.rho, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = C.blow; ctx.lineWidth = 3.5 * d; ctx.stroke(); }
    ringCores(ctx, d, MX, MY, S.vs);
    const free = S.vs.reduce((a, v) => a + v[0], 0), hole = GLD.d - free;
    tag.innerHTML = S.rho > 0 ? `<b>hole holds ${hole} of 4 turns</b>${S.vs.length ? ` · ${S.vs.length} free core${S.vs.length === 1 ? "" : "s"}` : ""}` : `<b>${S.vs.length} core${S.vs.length === 1 ? "" : "s"}</b>${S.vs.length ? ` at r ≈ ${meanR(S.vs).toFixed(2)}` : ""}`;
  }
  function bmRender(B, cv, tag) {
    const { V, type } = B, bg = rgb(C.soft), lut = LUT(), dark = isDark();
    const F = diskFrame(cv, (k) => type[k] ? bg : lut[Math.round(clamp(Math.abs(V[3 * k + 2]), 0, 1) * 255 * 0.8)]);
    crosses(F.ctx, F.d, F.MX, F.MY, F.sc, (k) => [V[3 * k], V[3 * k + 1]], 0, dark);
    const { ctx, d, MX, MY, sc } = F;
    ctx.strokeStyle = C.steel; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), sc, 0, Math.PI * 2); ctx.stroke();
    ringCores(ctx, d, MX, MY, B.vs);
    tag.innerHTML = `<b>${B.vs.length} core${B.vs.length === 1 ? "" : "s"}</b>${B.vs.length ? ` at r ≈ ${meanR(B.vs).toFixed(2)}` : ""} · lifted energy ${B.E.toFixed(2)}`;
  }
  function glChips() {
    const a = GLD.sims[0], b = GLD.sims[1], B = GLD.bm;
    const free = b.vs.reduce((s, v) => s + v[0], 0), dl = B ? B.uc / 2 : 0;
    $("#gl-chips").innerHTML = `<span class="chip">Ginzburg–Landau: one 4-fold core ≈ 16π·log(1/ε) = <b>${(16 * Math.PI * Math.log(1 / GLD.eps)).toFixed(0)}</b>, four single cores ≈ 4π·log(1/ε) = <b>${(4 * Math.PI * Math.log(1 / GLD.eps)).toFixed(0)}</b></span>`
      + `<span class="chip">hole: scaling heuristic ρ ≳ ε<b>${sup("1/4")}</b> = <b>${Math.pow(GLD.eps, 0.25).toFixed(2)}</b>; measured winding <b>${4 - free}</b></span>`
      + (B ? `<span class="chip v">lift: energy <b>${B.E.toFixed(2)}</b> vs 8π = <b>25.13</b>; local splitting heuristic: δ ≈ <b>${dl.toExponential(1)}</b>, so cores at δ<b>${sup("1/4")}</b> = <b>${Math.pow(dl, 0.25).toFixed(2)}</b></span>` : "");
  }
  function glDrawAll() { if (!$("#gl-a")) return; if (!GLD.sims.length) return; glRender(GLD.sims[0], $("#gl-a"), $("#gl-a-tag")); glRender(GLD.sims[1], $("#gl-b"), $("#gl-b-tag")); if (GLD.bm) bmRender(GLD.bm, $("#gl-c"), $("#gl-c-tag")); glChips(); }
  function glRestart() { if (!$("#gl-a")) return;
    $("#gl-rho-out").textContent = "ρ = " + GLD.rho.toFixed(2);
    GLD.sims = [glMake("giant", 0), glMake("giant", GLD.rho)]; GLD.sims.forEach(glMeasure);
    if (!GLD.bm) { GLD.bm = bmMake(); bmMeasure(GLD.bm); }
    glDrawAll(); GLD.running = true;
  }
  SCHED.add(() => {
    if (!GLD.running || !isOn($("#gl-a"))) return;
    const t0 = performance.now(); let n = 0;
    const live = () => GLD.sims.filter((S) => S.t < GLD.Tmax);
    while (n < 6 && performance.now() - t0 < 12 && live().length) { live().forEach((S) => glStep(S, 10)); n++; }
    if (GLD.bm && !GLD.bm.done) { bmStep(GLD.bm, 40); bmMeasure(GLD.bm); }
    GLD.sims.forEach(glMeasure); glDrawAll();
    if (!live().length && (!GLD.bm || GLD.bm.done)) GLD.running = false;
  });
  $("#gl-rho")?.addEventListener("change", (e) => { GLD.rho = +e.target.value; GLD.sims[1] = glMake("giant", GLD.rho); glMeasure(GLD.sims[1]); GLD.running = true; glDrawAll(); });
  $("#gl-rho")?.addEventListener("input", (e) => { $("#gl-rho-out").textContent = "ρ = " + (+e.target.value).toFixed(2); });
  $("#gl-run")?.addEventListener("click", () => { GLD.bm = null; glRestart(); });

  // ============================================================ Figure 15: energy versus volume
  const FV = { ln: 1.6, dl: 0.01, A: [-1.05, 0], B: [0.95, 0], R: 0.4, cut: 0.8 };
  const Zs = (n) => Math.PI * (1 - Math.exp(-n * FV.cut * FV.cut)) / n;
  const Zr = (n, dl) => { const w = Math.min(FV.cut, 9 / Math.sqrt(n)), a = Math.max(0, FV.R - w), b = FV.R + w, M = 600, hh = (b - a) / M; let s = 0; for (let i = 0; i <= M; i++) { const r = a + i * hh, f = Math.exp(-n * (r - FV.R) ** 2) * r; s += (i === 0 || i === M ? 1 : i % 2 ? 4 : 2) * f; } return Math.exp(-n * dl) * 2 * Math.PI * s * hh / 3; };
  const Pring = (n, dl) => { const r = Zr(n, dl), s = Zs(n); return r / (r + s); };
  function fig15() { if (!$("#f15-cv")) return;
    const n = Math.pow(10, FV.ln), dl = FV.dl;
    { const { ctx, W, H, d } = cvs($("#f15-cv")), nx = 240, ny = Math.round(nx * H / W), img = new ImageData(nx, ny), xr = [-2, 2], yh = 2 * H / W;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const x = xr[0] + 4 * (i + 0.5) / nx, y = yh - 2 * yh * (j + 0.5) / ny;
        const Vs = (x - FV.A[0]) ** 2 + (y - FV.A[1]) ** 2, Vr = dl + (Math.hypot(x - FV.B[0], y - FV.B[1]) - FV.R) ** 2, V = Math.min(Vs, Vr);
        const c = LUT()[Math.round(clamp(Math.exp(-n * V), 0, 1) * 255 * 0.9)], o = 4 * (j * nx + i); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
      }
      const off = document.createElement("canvas"); off.width = nx; off.height = ny; off.getContext("2d").putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
      const MX = (x) => (x + 2) / 4 * W, MY = (y) => (yh - y) / (2 * yh) * H;
      ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`;
      const lab = (s, x, y, al) => { ctx.textAlign = al || "left"; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; ctx.strokeText(s, x, y); ctx.fillStyle = C.ink; ctx.fillText(s, x, y); ctx.textAlign = "left"; };
      lab("well: depth 0, λ = 1", MX(FV.A[0]), MY(-0.84 * yh), "center");
      lab("ring: depth δ, λ = 1/2", MX(FV.B[0]), MY(-0.84 * yh), "center");
      lab(`n = 10${sup(FV.ln.toFixed(1))}`, 8 * d, 18 * d);
    }
    const svg = $("#f15-p");
    const F = frame(svg, { W: 360, H: 260, l: 44, r: 12, t: 12, b: 42, xr: [0, 5], yr: [0, 1], xt: [0, 1, 2, 3, 4, 5].map((v) => [v, "10" + sup(v)]), yt: [[0, "0"], [0.5, "50%"], [1, "100%"]], xlab: "n", ylab: "P(ring)" });
    const pts = []; for (let l = 0; l <= 5.0001; l += 0.04) pts.push([l, Pring(Math.pow(10, l), dl)]);
    E("line", { x1: F.x0, x2: F.x1, y1: F.Y(0.5), y2: F.Y(0.5), stroke: C.rule, "stroke-dasharray": "3 3" }, F.g);
    let cross = null; for (let i = pts.length - 1; i > 0; i--) if (pts[i - 1][1] >= 0.5 && pts[i][1] < 0.5) { cross = pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * (pts[i - 1][1] - 0.5) / (pts[i - 1][1] - pts[i][1]); break; }
    if (cross != null) { E("line", { x1: F.X(cross), x2: F.X(cross), y1: F.y0, y2: F.y1, stroke: C.ink, "stroke-dasharray": "5 4" }, F.g); T(svg, F.X(cross) + 5, F.y1 - 8, "crossover", C.ink); }
    E("path", { d: pathD(pts, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 3 }, F.g);
    const pn = Pring(n, dl);
    E("circle", { cx: F.X(FV.ln), cy: F.Y(pn), r: 5.5, fill: C.blow, stroke: C.surface, "stroke-width": 2 }, svg);
    T(svg, F.x0 + 8, F.Y(0.4), "ring wins on volume", C.blow, { st: ";font-weight:600" });
    T(svg, F.x1 - 8, F.Y(0.62), "well wins on energy", C.ink, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    $("#f15-n-out").textContent = "n = 10" + sup(FV.ln.toFixed(1));
    $("#f15-d-out").textContent = "δ = " + dl.toFixed(3);
    $("#f15-chips").innerHTML = `<span class="chip v">probability in the ring at this n: <b>${Math.round(pn * 100)}%</b></span><span class="chip">free energy: well ≈ <b>log n</b>, ring ≈ <b>n·δ + ½ log n</b></span>` + (cross != null ? `<span class="chip">crossover near n ≈ <b>${Math.round(Math.pow(10, cross)).toLocaleString()}</b></span>` : "");
  }
  $("#f15-n")?.addEventListener("input", (e) => { FV.ln = +e.target.value; fig15(); });
  $("#f15-d")?.addEventListener("input", (e) => { FV.dl = +e.target.value; fig15(); });

  // ============================================================ Figure 16: winner take all vs frozen shares
  const RHO = 0.25;
  let SHARE = null;
  const R4 = { ln: 4 };
  function fig16canvas() { if (!$("#r-cv")) return;
    const { ctx, W, H, d } = cvs($("#r-cv")), n = 240, img = new ImageData(n,n), N = 10**R4.ln;
    // Resolve the concentrating region instead of undersampling it on a fixed spatial grid.
    const sx=Math.min(1,3*N**(-1/6)), sy=Math.min(1,3*N**(-1/4));
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      let acc=0;
      for(let a=0;a<2;a++)for(let b=0;b<2;b++){
        const x=sx*(-1+2*(i+.25+.5*a)/n),y=sy*(1-2*(j+.25+.5*b)/n);
        acc+=Math.exp(-N*(y*y-x*x*x)**2);
      }
      const c=LUT()[Math.round(clamp((acc/4)**.6,0,1)*255*.85)],o=4*(j*n+i);
      img.data[o]=c[0];img.data[o+1]=c[1];img.data[o+2]=c[2];img.data[o+3]=255;
    }
    const off=document.createElement("canvas");off.width=off.height=n;off.getContext("2d").putImageData(img,0,0);
    ctx.imageSmoothingEnabled=true;ctx.drawImage(off,0,0,W,H);
    const MX=x=>(x/sx+1)/2*W,MY=y=>(1-y/sy)/2*H;
    ctx.strokeStyle=C.hot;ctx.lineWidth=2*d;ctx.setLineDash([6*d,5*d]);ctx.beginPath();
    ctx.ellipse(MX(0),MY(0),RHO/(2*sx)*W,RHO/(2*sy)*H,0,0,2*Math.PI);ctx.stroke();ctx.setLineDash([]);
    const label=(s,x,y)=>{ctx.font=`600 ${11.5*d}px "Schibsted Grotesk", sans-serif`;ctx.lineWidth=3*d;ctx.strokeStyle=C.paper;ctx.strokeText(s,x,y);ctx.fillStyle=C.ink;ctx.fillText(s,x,y);};
    label(`n = 10${sup(R4.ln.toFixed(1))} · automatic zoom`,8*d,18*d);
    label(`x: ±${sx.toPrecision(2)}; y: ±${sy.toPrecision(2)}`,8*d,H-12*d);
    if(Math.hypot(sx,sy)<RHO)label("This view lies inside the radius-0.25 disk",8*d,36*d);
  }
  function fig16plot() { if (!$("#r-plot") || !SHARE) return;
    const svg=$("#r-plot"),W=Math.max(270,Math.round(svg.getBoundingClientRect().width));
    const F=frame(svg,{W,H:300,l:44,r:14,t:28,b:44,xr:[1,12],yr:[0,1],xt:[1,4,8,12].map(v=>[v,"10"+sup(v)]),yt:[[0,"0"],[.5,"50%"],[1,"100%"]],xlab:"concentration n"});
    T(svg,F.x0,16,"Posterior mass inside radius 0.25",C.ink);
    E("path",{d:pathD(SHARE,F.X,F.Y),fill:"none",stroke:C.blow,"stroke-width":3},F.g);
    const cur=SHARE.reduce((b,p)=>Math.abs(p[0]-R4.ln)<Math.abs(b[0]-R4.ln)?p:b);
    E("circle",{cx:F.X(cur[0]),cy:F.Y(cur[1]),r:5.5,fill:C.blow,stroke:C.surface,"stroke-width":2},svg);
    $("#r-n-out").textContent="n = 10"+sup(R4.ln.toFixed(1));
    $("#r-chips").innerHTML=`<span class="chip v">Inside the fixed disk: <b>${(cur[1]*100).toFixed(1)}%</b></span><span class="chip">Tip neighborhood: <b>n⁻⁵ᐟ¹²</b>; outside it: <b>n⁻¹ᐟ²</b></span><span class="chip">The heatmap zooms; the integration square stays fixed.</span>`;
  }
  window.__f16 = fig16plot;
  $("#r-n")?.addEventListener("input", (e) => { R4.ln = +e.target.value; fig16canvas(); fig16plot(); });

  // ============================================================ Figure 17: ReLU crossing
  const RL = { a: 0.45, b: 0.35 };
  const Dfun = (b) => (b >= 0 ? (b * b * (1 - b) + b ** 3 / 3) / 2 : (b * b + (-b) ** 3 / 3) / 2);
  const relu = (x) => (x > 0 ? x : 0);
  const erf = (x) => { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y; };
  const BB = []; for (let i = 0; i <= 2400; i++) BB.push(0.9 * Math.pow(10, -14 + 14 * i / 2400));
  const thermo = (n) => { let Z = 0, M = 0; for (const sg of [1, -1]) { let pb = 0; for (const ab of BB) { const b = sg * (ab + pb) / 2, w = ab - pb; pb = ab; const c = n * Dfun(b); let I, J; if (c < 1e-8) { I = 2; J = c * 2 / 3; } else { const sc = Math.sqrt(c); I = Math.sqrt(Math.PI / c) * erf(sc); const Ip = -(Math.sqrt(Math.PI) / 2) * Math.pow(c, -1.5) * erf(sc) + Math.exp(-c) / c; J = -c * Ip; } Z += I * w; M += J * w; } } return M / Z; };
  let THERMO = null;
  const AR = [-1, 1], BR = [-0.9, 0.9];
  function fig17map() { if (!$("#rl-cv")) return;
    const { ctx, W, H, d } = cvs($("#rl-cv")), n = 180, img = new ImageData(n, n);
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const b = BR[0] + (BR[1] - BR[0]) * (i + 0.5) / n, a = AR[1] - (AR[1] - AR[0]) * (j + 0.5) / n, K = a * a * Dfun(b), t = clamp(1 - (Math.log10(K + 1e-12) + 7) / 6.5, 0, 1), c = LUT()[Math.round(t * 255 * 0.9)], o = 4 * (j * n + i); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; }
    const off = document.createElement("canvas"); off.width = n; off.height = n; off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const MX = (b) => (b - BR[0]) / (BR[1] - BR[0]) * W, MY = (a) => (AR[1] - a) / (AR[1] - AR[0]) * H;
    ctx.strokeStyle = C.hot; ctx.lineWidth = 2 * d; ctx.setLineDash([6 * d, 4 * d]); ctx.beginPath(); ctx.moveTo(0, MY(0)); ctx.lineTo(W, MY(0)); ctx.moveTo(MX(0), 0); ctx.lineTo(MX(0), H); ctx.stroke(); ctx.setLineDash([]);
    ctx.strokeStyle = C.bad; ctx.lineWidth = 2.2 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), 8 * d, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = C.surface; ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(MX(RL.b), MY(RL.a), 6 * d, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`;
    const lab = (s, x, y) => { ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; ctx.strokeText(s, x, y); ctx.fillStyle = C.ink; ctx.fillText(s, x, y); };
    lab("a₂ = 0: neuron 2 dead", 8 * d, MY(0) - 8 * d); lab("b₂ = 0: merged", MX(0) + 8 * d, 36 * d);
    lab("b₂ (second kink) →", W - 130 * d, H - 10 * d); lab("a₂ ↑", 8 * d, 18 * d);
  }
  function fig17f() { if (!$("#rl-f")) return;
    const svg = $("#rl-f"), a = RL.a, b = RL.b;
    const F = frame(svg, { W: 360, H: 250, l: 40, r: 12, t: 12, b: 42, xr: [-1, 1], yr: [-0.6, 1.2], xt: [[-1, "−1"], [0, "0"], [1, "1"]], yt: [[0, "0"], [0.5, "0.5"], [1, "1"]], xlab: "input x", ylab: "output" });
    const tp = [], fp = []; for (let i = 0; i <= 200; i++) { const x = -1 + 2 * i / 200; tp.push([x, relu(x)]); fp.push([x, (1 - a) * relu(x) + a * relu(x - b)]); }
    E("path", { d: pathD(tp, F.X, F.Y), fill: "none", stroke: C.ink, "stroke-width": 2, "stroke-dasharray": "6 4" }, F.g);
    E("path", { d: pathD(fp, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 3 }, F.g);
    const K = a * a * Dfun(b);
    T(svg, F.x0 + 8, F.y0 + 34, `a₂ = ${fmt(a)}, b₂ = ${fmt(b)}, K = ${K < 1e-4 ? K.toExponential(1) : K.toFixed(4)}`, C.ink, { st: ";font-weight:600" });
    T(svg, F.x0 + 8, F.y0 + 52, "violet: (1 − a₂)·relu(x) + a₂·relu(x − b₂)", C.blow);
    T(svg, F.x0 + 8, F.y0 + 68, "dashed: target relu(x)", null);
  }
  function fig17t() { if (!$("#rl-t")) return;
    if (!THERMO) { THERMO = []; for (let l = 1; l <= 16.001; l += 0.25) THERMO.push([l, thermo(Math.pow(10, l))]); }
    const svg = $("#rl-t");
    const F = frame(svg, { W: 360, H: 230, l: 44, r: 12, t: 12, b: 42, xr: [1, 16], yr: [0, 0.6], xt: [1, 4, 8, 12, 16].map((v) => [v, "10" + sup(v)]), yt: [[0, "0"], [0.25, "¼"], [0.5, "½"]], xlab: "n", ylab: "n·⟨K⟩" });
    E("line", { x1: F.x0, x2: F.x1, y1: F.Y(0.5), y2: F.Y(0.5), stroke: C.blow, "stroke-width": 1.5, "stroke-dasharray": "3 3" }, F.g);
    const approx = []; for (let l = 1.5; l <= 16; l += 0.1) approx.push([l, 0.5 - 1 / (l * Math.LN10)]);
    E("path", { d: pathD(approx, F.X, F.Y), fill: "none", stroke: C.steel, "stroke-width": 2, "stroke-dasharray": "6 4" }, F.g);
    E("path", { d: pathD(THERMO, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 3 }, F.g);
    T(svg, F.x1 - 6, F.Y(0.5) - 6, "λ = 1/2", C.blow, { at: { "text-anchor": "end" }, st: ";font-weight:700" });
    T(svg, F.x1 - 6, F.Y(0.2), "grey: λ − (m − 1)/log n", C.muted, { at: { "text-anchor": "end" } });
  }
  $("#rl-cv")?.addEventListener("click", (e) => { const r = e.currentTarget.getBoundingClientRect(); RL.b = BR[0] + (e.clientX - r.left) / r.width * (BR[1] - BR[0]); RL.a = AR[1] - (e.clientY - r.top) / r.height * (AR[1] - AR[0]); fig17map(); fig17f(); });

  // ============================================================ boot

  // ============================================================ Figure 12: one Ginzburg–Landau vortex
  function vxSolve(d, eps, M = 360, rmin = 1e-7) {
    const L0 = Math.log(rmin), h = -L0 / (M - 1), r = [], f = new Float64Array(M);
    for (let i = 0; i < M; i++) { r.push(Math.exp(L0 + i * h)); const x = r[i] / eps; f[i] = Math.pow(x / Math.sqrt(1 + x * x), d) / Math.pow((1 / eps) / Math.sqrt(1 + 1 / (eps * eps)), d); }
    f[0] = 0; f[M - 1] = 1;
    const a = new Float64Array(M), bb = new Float64Array(M), R = new Float64Array(M), cp = new Float64Array(M), dp = new Float64Array(M), dx = new Float64Array(M);
    for (let it = 0; it < 80; it++) {
      let res = 0;
      for (let i = 1; i < M - 1; i++) { const q = r[i] * r[i] / (eps * eps); R[i] = -2 * (f[i + 1] - 2 * f[i] + f[i - 1]) / (h * h) + 2 * d * d * f[i] - 2 * q * (1 - f[i] * f[i]) * f[i]; bb[i] = 4 / (h * h) + 2 * d * d - 2 * q * (1 - 3 * f[i] * f[i]); if (bb[i] < 4 / (h * h)) bb[i] = 4 / (h * h) + 2 * d * d; a[i] = -2 / (h * h); res = Math.max(res, Math.abs(R[i])); }
      for (let i = 1; i < M - 1; i++) { const m = bb[i] - (i > 1 ? a[i] * cp[i - 1] : 0); cp[i] = a[i] / m; dp[i] = (-R[i] - (i > 1 ? a[i] * dp[i - 1] : 0)) / m; }
      for (let i = M - 2; i >= 1; i--) dx[i] = dp[i] - (i < M - 2 ? cp[i] * dx[i + 1] : 0);
      for (let i = 1; i < M - 1; i++) f[i] = Math.min(1.2, Math.max(0, f[i] + dx[i]));
      if (res < 1e-9) break;
    }
    let En = 0; const dens = [];
    for (let i = 0; i < M - 1; i++) { const fm = (f[i] + f[i + 1]) / 2, rm = Math.exp(L0 + (i + 0.5) * h), fr = (f[i + 1] - f[i]) / h, e = Math.PI * (fr * fr + d * d * fm * fm + rm * rm * (1 - fm * fm) ** 2 / (2 * eps * eps)); dens.push([(L0 + (i + 0.5) * h) / Math.LN10, e]); En += e * h; }
    return { E: En, f, r, dens };
  }
  const VX = { d: 1, le: 1.3, cache: {}, cost: null };
  const vxGet = (d, le) => { const k = d + ":" + le.toFixed(2); return VX.cache[k] || (VX.cache[k] = vxSolve(d, Math.pow(10, -le))); };
  function vxCost() { if (VX.cost) return VX.cost; const xs = []; for (let le = 0.5; le <= 4.001; le += 0.1) xs.push(le); VX.cost = xs.map((le) => [le, vxGet(4, le).E, 4 * vxGet(1, le).E]); return VX.cost; }
  function fig12vx() { if (!$("#vx-cv")) return;
    const S = vxGet(VX.d, VX.le), eps = Math.pow(10, -VX.le);
    // field picture
    const { ctx, W, H, d: dpr } = cvs($("#vx-cv")), n = 140, img = new ImageData(n, n), paper = rgb(C.paper), ink = rgb(C.ink);
    const fAt = (rr) => { if (rr >= 1) return 1; const lr = Math.log(Math.max(rr, 1e-7)), L0 = Math.log(1e-7), h = -L0 / (S.f.length - 1), x = (lr - L0) / h, i = Math.min(S.f.length - 2, Math.max(0, Math.floor(x))), t = x - i; return S.f[i] * (1 - t) + S.f[i + 1] * t; };
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -1 + 2 * (i + 0.5) / n, y = 1 - 2 * (j + 0.5) / n, rr = Math.hypot(x, y), o = 4 * (j * n + i); const c = rr > 1 ? rgb(C.surface) : mix(rgb(C.bad), paper, 0.1 + 0.9 * fAt(rr)); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; }
    const off = document.createElement("canvas"); off.width = n; off.height = n; off.getContext("2d").putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const k = 11; ctx.lineCap = "round";
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const x = -1 + 2 * (i + 0.5) / k, y = -1 + 2 * (j + 0.5) / k, rr = Math.hypot(x, y); if (rr > 0.95) continue;
      const th = VX.d * Math.atan2(y, x) / 4, len = 0.07 * Math.max(0.15, fAt(rr)), cx = W / 2 + x * W / 2, cy = H / 2 - y * H / 2;
      ctx.strokeStyle = C.blow; ctx.lineWidth = 2 * dpr; ctx.beginPath();
      for (let q = 0; q < 2; q++) { const a = th + q * Math.PI / 2, dx = Math.cos(a) * len * W / 2, dy = Math.sin(a) * len * H / 2; ctx.moveTo(cx - dx, cy + dy); ctx.lineTo(cx + dx, cy - dy); }
      ctx.stroke();
    }
    ctx.strokeStyle = C.rule; ctx.lineWidth = 1.5 * dpr; ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - dpr, 0, 2 * Math.PI); ctx.stroke();
    if (eps > 0.004) { ctx.setLineDash([4 * dpr, 4 * dpr]); ctx.strokeStyle = C.bad; ctx.beginPath(); ctx.arc(W / 2, H / 2, eps * W / 2, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]); }
    // energy density per unit log r
    let svg = $("#vx-den"), ymax = Math.PI * VX.d * VX.d * 1.45;
    let F = frame(svg, { W: 300, H: 280, l: 40, r: 10, t: 12, b: 42, xr: [-6, 0], yr: [0, ymax], xt: [-6, -4, -2, 0].map((v) => [v, v ? "10" + sup(v) : "1"]), yt: [0, VX.d * VX.d].map((v) => [Math.PI * v, v ? (v === 1 ? "π" : v + "π") : "0"]), xlab: "radius r (log scale)", ylab: "energy per ln r" });
    const dn = S.dens.filter((p) => p[0] >= -6);
    E("path", { d: pathD([[-6, 0], ...dn, [0, 0]], F.X, F.Y) + "Z", fill: C.blow, "fill-opacity": 0.18 }, F.g);
    E("path", { d: pathD(dn, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.4 }, F.g);
    E("line", { x1: F.X(-6), x2: F.X(0), y1: F.Y(Math.PI * VX.d * VX.d), y2: F.Y(Math.PI * VX.d * VX.d), stroke: C.ink, "stroke-dasharray": "2 4" }, F.g);
    E("line", { x1: F.X(-VX.le), x2: F.X(-VX.le), y1: F.y0, y2: F.y1, stroke: C.bad, "stroke-dasharray": "4 4" }, F.g);
    T(svg, F.X(-VX.le) - 4, F.y0 + 30, "core: r ≈ ε", C.bad, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    T(svg, F.x0 + 6, F.Y(Math.PI * VX.d * VX.d) - 6, `plateau: π·d² = ${VX.d * VX.d === 1 ? "" : VX.d * VX.d}π`, C.ink, { st: ";font-weight:600" });
    // merge or split
    const cost = vxCost(); svg = $("#vx-cost");
    const ym = Math.max(...cost.map((p) => Math.max(p[1], p[2]))) * 1.08, yl = Math.min(0, ...cost.map((p) => p[1]));
    F = frame(svg, { W: 300, H: 280, l: 44, r: 10, t: 12, b: 42, xr: [0.5, 4], yr: [yl, ym], xt: [1, 2, 3, 4].map((v) => [v, "10" + sup(-v)]), yt: [0, 100, 200, 300, 400].filter((v) => v < ym).map((v) => [v, String(v)]), xlab: "core size ε (log scale)", ylab: "energy" });
    E("path", { d: pathD(cost.map((p) => [p[0], p[1]]), F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.6 }, F.g);
    E("path", { d: pathD(cost.map((p) => [p[0], p[2]]), F.X, F.Y), fill: "none", stroke: C.cold, "stroke-width": 2.6 }, F.g);
    E("line", { x1: F.X(VX.le), x2: F.X(VX.le), y1: F.y0, y2: F.y1, stroke: C.bad, "stroke-dasharray": "4 4" }, F.g);
    T(svg, F.X(2.4), F.Y(cost[Math.round((2.4 - 0.5) / 0.1)][1]) - 10, "one core, winding 4", C.hot, { at: { "text-anchor": "end" }, st: ";font-weight:700" });
    T(svg, F.X(3.95), F.Y(cost[cost.length - 1][2]) + 18, "four cores, winding 1", C.cold, { at: { "text-anchor": "end" }, st: ";font-weight:700" });
    $("#vx-e-out").textContent = "ε = " + (eps >= 0.01 ? eps.toFixed(3) : eps.toExponential(1).replace("e-", "×10⁻").replace(/⁻(\d)/, (m, q) => "⁻" + "⁰¹²³⁴⁵⁶⁷⁸⁹"[+q]));
    const e4 = vxGet(4, VX.le).E, e1 = vxGet(1, VX.le).E;
    $("#vx-chips").innerHTML = `<span class="chip v">this core: E = <b>${S.E.toFixed(1)}</b> ≈ ${VX.d * VX.d === 1 ? "" : VX.d * VX.d}π·log(1/ε) + <b>${(S.E - Math.PI * VX.d * VX.d * Math.log(1 / eps)).toFixed(1)}</b></span><span class="chip">one 4-fold core <b>${e4.toFixed(0)}</b> vs four simple cores <b>${(4 * e1).toFixed(0)}</b>, before their interaction</span>`;
  }
  seg("#vx-d", (v) => { VX.d = +v; fig12vx(); });
  $("#vx-e")?.addEventListener("input", (e) => { VX.le = +e.target.value; fig12vx(); });


  // ============================================================ teaser for section 8: drag the singularities
  const CD = { eps: 0.06, cores: null, anim: null, drag: -1 };
  const cdScatter = () => { CD.cores = [[-0.45, 0.25, 1], [0.3, 0.5, 1], [0.15, -0.35, 1], [-0.2, -0.6, 1]]; };
  cdScatter();
  const cdC = (d) => { const le = Math.log10(1 / CD.eps); return vxGet(d, Math.round(le * 100) / 100).E - Math.PI * d * d * Math.log(1 / CD.eps); };
  function cdEnergy(cores) {
    let E = 0;
    for (const [x, y, d] of cores) E += Math.PI * d * d * Math.log(1 / CD.eps) + cdC(d);
    for (let i = 0; i < cores.length; i++) for (let j = 0; j < cores.length; j++) {
      const [xi, yi, di] = cores[i], [xj, yj, dj] = cores[j];
      if (i !== j) E -= Math.PI * di * dj * Math.log(Math.max(Math.hypot(xi - xj, yi - yj), 1e-9));
      // |1 - conj(a_i) a_j|
      const re = 1 - (xi * xj + yi * yj), im = -(xi * yj - yi * xj);
      E -= Math.PI * di * dj * Math.log(Math.hypot(re, im));
    }
    return E;
  }
  const cdBest = () => { const r = Math.pow(12 / 44, 1 / 8); return cdEnergy([0, 1, 2, 3].map((k) => [r * Math.cos(Math.PI / 4 + k * Math.PI / 2), r * Math.sin(Math.PI / 4 + k * Math.PI / 2), 1])); };
  function cdField(x, y) {
    // u = prod [(z - a)(1 - conj(a) z)]^d, returns arg u and distance to nearest core
    let ang = 0, dmin = 9;
    for (const [ax, ay, d] of CD.cores) {
      const p1 = Math.atan2(y - ay, x - ax), qr = 1 - (ax * x + ay * y), qi = -(ax * y - ay * x), p2 = Math.atan2(qi, qr);
      ang += d * (p1 + p2); dmin = Math.min(dmin, Math.hypot(x - ax, y - ay));
    }
    return [ang, dmin];
  }
  function cdDraw() { if (!$("#cd-cv")) return;
    const cv = $("#cd-cv"), { ctx, W, H, d: dpr } = cvs(cv), n = 200, img = new ImageData(n, n), sf = rgb(C.surface), dk = isDark();
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const x = -1.04 + 2.08 * (i + 0.5) / n, y = 1.04 - 2.08 * (j + 0.5) / n, o = 4 * (j * n + i);
      let c;
      if (x * x + y * y > 1) c = sf;
      else { const [a, dm] = cdField(x, y), hue = ((a / (2 * Math.PI)) % 1 + 1) % 1 * 360, base = hsv(hue, dk ? 0.5 : 0.45, dk ? 0.75 : 0.97), core = Math.min(1, dm / (2.2 * CD.eps)); c = mix(dk ? [10, 10, 14] : [40, 30, 40], base, 0.25 + 0.75 * core * core); }
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    const off = document.createElement("canvas"); off.width = n; off.height = n; off.getContext("2d").putImageData(img, 0, 0); ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const M = (x, y) => [W / 2 + x * W / 2.08, H / 2 - y * H / 2.08];
    ctx.strokeStyle = dk ? "rgba(255,255,255,0.55)" : "rgba(30,25,40,0.55)"; ctx.lineWidth = 1.4 * dpr; ctx.lineCap = "round";
    const k = 17;
    for (let j = 0; j < k; j++) for (let i = 0; i < k; i++) {
      const x = -1 + 2 * (i + 0.5) / k, y = -1 + 2 * (j + 0.5) / k; if (x * x + y * y > 0.92) continue;
      const [a, dm] = cdField(x, y); if (dm < 0.05) continue; const th = a / 4, L = 0.042, [cx, cy] = M(x, y);
      ctx.beginPath(); for (let q = 0; q < 2; q++) { const t = th + q * Math.PI / 2, dx = Math.cos(t) * L * W / 2.08, dy = Math.sin(t) * L * H / 2.08; ctx.moveTo(cx - dx, cy + dy); ctx.lineTo(cx + dx, cy - dy); } ctx.stroke();
    }
    ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6 * dpr; ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2.08, 0, 2 * Math.PI); ctx.stroke();
    CD.cores.forEach(([x, y, d]) => { const [cx, cy] = M(x, y); ctx.fillStyle = C.surface; ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.arc(cx, cy, (6 + 2 * d) * dpr, 0, 2 * Math.PI); ctx.fill(); ctx.stroke(); if (d > 1) { ctx.fillStyle = C.ink; ctx.font = `700 ${12 * dpr}px sans-serif`; ctx.textAlign = "center"; ctx.fillText(String(d), cx, cy + 4 * dpr); } });
    const Eu = cdEnergy(CD.cores), Eb = cdBest(), Em = cdEnergy([[0, 0, 4]]);
    const svg = $("#cd-bars"); svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 340 230");
    const mx = Math.max(Eu, Em) * 1.08, X = (v) => 12 + 300 * v / mx;
    [["your layout", Eu, C.blow], ["reference square layout", Eb, C.cold], ["one merged point", Em, C.hot]].forEach(([lab, v, col], i) => {
      const y = 30 + i * 62;
      T(svg, 12, y - 6, lab, C.ink, { st: ";font-weight:600" });
      E("rect", { x: 12, y, width: Math.max(2, X(v) - 12), height: 26, rx: 4, fill: col, opacity: 0.85 }, svg);
      T(svg, Math.min(X(v) + 6, 300), y + 18, v.toFixed(1), C.ink, { st: ";font-weight:700" });
    });
    const sumd = CD.cores.reduce((s, c) => s + c[2], 0);
    const tagEl = $("#cd-tag");
    if (tagEl) tagEl.innerHTML = CD.cores.length === 1 ? "one point of winding 4" : `${CD.cores.length} points, windings adding to ${sumd}`;
    const capEl = $("#cd-cap");
    if (capEl) capEl.innerHTML = CD.cores.length === 1 ? "All four turns in one point. The log(1/ε) term is now 16 units instead of 4 × 1, because winding enters squared." : Eu - Eb < 0.15 ? "Near the stationary square layout for this point-vortex energy, at radius about 0.85." : "Drag the points closer together and the energy rises (they repel); push them toward the edge and it rises too (the boundary pushes back).";
  }
  function cdGrad(cores, h = 1e-4) {
    return cores.map((c, i) => [0, 1].map((ax) => { const p = cores.map((q) => q.slice()), m = cores.map((q) => q.slice()); p[i][ax] += h; m[i][ax] -= h; return (cdEnergy(p) - cdEnergy(m)) / (2 * h); }));
  }
  const cdClamp = (c) => { const r = Math.hypot(c[0], c[1]); if (r > 0.95) { c[0] *= 0.95 / r; c[1] *= 0.95 / r; } };
  $("#cd-relax")?.addEventListener("click", () => { if (CD.cores.length !== 4) cdScatter(); CD.anim = "relax"; });
  $("#cd-scatter")?.addEventListener("click", () => { CD.anim = null; const r = Math.random; CD.cores = [0, 1, 2, 3].map(() => { const t = 2 * Math.PI * r(), rr = 0.2 + 0.65 * Math.sqrt(r()); return [rr * Math.cos(t), rr * Math.sin(t), 1]; }); cdDraw(); });
  $("#cd-merge")?.addEventListener("click", () => { if (CD.cores.length !== 4) return; CD.anim = "merge"; });
  SCHED.add(() => {
    if (!CD.anim || !isOn($("#cd-cv"))) return;
    if (CD.anim === "relax") { for (let it = 0; it < 4; it++) { const g = cdGrad(CD.cores); let gn = 0; CD.cores.forEach((c, i) => { c[0] -= 0.0025 * g[i][0]; c[1] -= 0.0025 * g[i][1]; cdClamp(c); gn += Math.hypot(...g[i]); }); if (gn < 0.05) { CD.anim = null; break; } } }
    else if (CD.anim === "merge") { let far = 0; CD.cores.forEach((c) => { c[0] *= 0.9; c[1] *= 0.9; far = Math.max(far, Math.hypot(c[0], c[1])); }); if (far < 0.5 * CD.eps) { CD.cores = [[0, 0, 4]]; CD.anim = null; } }
    cdDraw();
  });
  (() => {
    const cv = $("#cd-cv"); if (!cv) return; const pos = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * 2.08 - 1.04, 1.04 - (e.clientY - r.top) / r.height * 2.08]; };
    cv.addEventListener("pointerdown", (e) => { const [x, y] = pos(e); let best = -1, bd = 0.12; CD.cores.forEach((c, i) => { const dd = Math.hypot(c[0] - x, c[1] - y); if (dd < bd) { bd = dd; best = i; } }); if (best < 0) return; CD.drag = best; CD.anim = null; cv.setPointerCapture(e.pointerId); e.preventDefault(); });
    cv.addEventListener("pointermove", (e) => { if (CD.drag < 0) return; const [x, y] = pos(e), c = CD.cores[CD.drag]; c[0] = x; c[1] = y; cdClamp(c); cdDraw(); });
    const end = () => { CD.drag = -1; }; cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
  })();
  watch($("#cd-cv"));

  function draw3() {
    try { fig12vx(); } catch (e) { console.error("fig12vx error:", e); }
    try { cdDraw(); } catch (e) { console.error("cdDraw error:", e); }
    try { fig13(); } catch (e) { console.error("fig13 error:", e); }
    try { glDrawAll(); } catch (e) { console.error("glDrawAll error:", e); }
    try { fig15(); } catch (e) { console.error("fig15 error:", e); }
    try { fig16canvas(); } catch (e) { console.error("fig16canvas error:", e); }
    try { fig16plot(); } catch (e) { console.error("fig16plot error:", e); }
    try { fig17map(); } catch (e) { console.error("fig17map error:", e); }
    try { fig17f(); } catch (e) { console.error("fig17f error:", e); }
    try { fig17t(); } catch (e) { console.error("fig17t error:", e); }
  }
  function drawAll() {
    try { window.__draw1(); } catch (e) { console.error("__draw1 error:", e); }
    try { window.__draw2(); } catch (e) { console.error("__draw2 error:", e); }
    try { if (window.__draw4) window.__draw4(); } catch (e) { console.error("__draw4 error:", e); }
    draw3();
  }
  if ($("#r-cv")) SHARE = cuspNeighborhoodShares(Array.from({length:111},(_,i)=>1+i/10),RHO);
  drawAll();
  if ($("#gl-rho-out")) $("#gl-rho-out").textContent = "ρ = " + GLD.rho.toFixed(2);
  watch($("#gl-a"), () => { if (!GLD.sims.length) glRestart(); });
  const loop = (now) => {
    SCHED.forEach((f) => {
      try { f(now); } catch (e) { console.error("SCHED loop error:", e); }
    });
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  const mq = window.matchMedia("(prefers-color-scheme: dark)"); mq.addEventListener && mq.addEventListener("change", drawAll);
  new MutationObserver(drawAll).observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  let rz = 0, lastW = window.innerWidth; window.addEventListener("resize", () => { if (window.innerWidth === lastW) return; lastW = window.innerWidth; clearTimeout(rz); rz = setTimeout(drawAll, 150); });
})();

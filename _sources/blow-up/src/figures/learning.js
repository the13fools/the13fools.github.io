import { crossingEvidence, reluLoss } from "./learning-geometry.js";
import { lnExact } from "./llc-network.js";

(() => {
  "use strict";
  const X_ = window.__E;
  const { isOn } = window.__E;
  const { $, E, C, rgb, mix, css, clamp, isDark, cvs, sup, fmt, T, seg, hsv, frame, pathD, ring, SCHED, watch, vis } = X_;
  // Match viewBox units to CSS pixels, so phone labels retain their size.
  function learningFrame(svg, options) {
    const width = Math.max(260, Math.round(svg.getBoundingClientRect().width) || options.W);
    const height = options.W > 500 ? (width < 500 ? 310 : 330) : options.H;
    return frame(svg, { ...options, W: width, H: height, l: Math.max(46, options.l || 0), r: Math.max(18, options.r || 0) });
  }
  const LUT = () => X_.LUT();
  const seeded = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const gauss = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };

  // ============================================================ Figure 13: hyperdeterminant slices
  const hdet = (a) => { const [a000, a001, a010, a011, a100, a101, a110, a111] = a;
    return a000 * a000 * a111 * a111 + a001 * a001 * a110 * a110 + a010 * a010 * a101 * a101 + a100 * a100 * a011 * a011
      - 2 * (a000 * a001 * a110 * a111 + a000 * a010 * a101 * a111 + a000 * a100 * a011 * a111 + a001 * a010 * a101 * a110 + a001 * a100 * a011 * a110 + a010 * a100 * a011 * a101)
      + 4 * (a000 * a011 * a101 * a110 + a001 * a010 * a100 * a111); };
  const outer = (a, b, c) => { const t = []; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) t.push(a[i] * b[j] * c[k]); return t; };
  const tadd = (...ts) => ts[0].map((_, q) => ts.reduce((s, t) => s + t[q], 0));
  const e0 = [1, 0], e1 = [0, 1];
  const CENTERS = {
    W: { T: tadd(outer(e0, e0, e1), outer(e0, e1, e0), outer(e1, e0, e0)), name: "W = e₀⊗e₀⊗e₁ + e₀⊗e₁⊗e₀ + e₁⊗e₀⊗e₀", info: "Δ(W) = 0. Rank 3, border rank 2. A smooth point of the boundary.", seed: 3 },
    D2: { T: tadd(outer(e0, e0, e0), outer(e0, e1, e1)), name: "e₀⊗(e₀⊗e₀ + e₁⊗e₁)", info: "Rank 2, but one flattening has rank 1. A singular point of Δ = 0: the boundary crosses itself.", seed: 4 },
    Z: { T: new Array(8).fill(0), name: "the zero tensor", info: "Δ is homogeneous of degree 4, so the boundary through 0 is a cone of lines.", seed: 5 },
  };
  const HD = { c: "W", bump: 0, probe: null };
  function hdDirs() {
    // for the degenerate center, pick directions along which the boundary really crosses itself (indefinite Hessian of Δ)
    for (let tries = 0; tries < 200; tries++) {
      const r = seeded(CENTERS[HD.c].seed * 101 + (HD.bump * 37 + tries) * 7919), T1 = [], T2 = []; for (let q = 0; q < 8; q++) { T1.push(gauss(r)); T2.push(gauss(r)); }
      if (HD.c !== "D2") return [T1, T2];
      const T0 = CENTERS.D2.T, D = (x, y) => hdet(T0.map((v, q) => v + x * T1[q] + y * T2[q])), h = 1e-3;
      const fxx = (D(h, 0) - 2 * D(0, 0) + D(-h, 0)) / (h * h), fyy = (D(0, h) - 2 * D(0, 0) + D(0, -h)) / (h * h), fxy = (D(h, h) - D(h, -h) - D(-h, h) + D(-h, -h)) / (4 * h * h);
      if (fxx * fyy - fxy * fxy < -0.05 * (fxx * fxx + fyy * fyy)) return [T1, T2];
    }
    return [new Array(8).fill(0).map((_, q) => q === 1 ? 1 : 0), new Array(8).fill(0).map((_, q) => q === 6 ? 1 : 0)];
  }
  function fig12() { if (!$("#hd-cv")) return;
    const cen = CENTERS[HD.c], [T1, T2] = hdDirs(), R = 1.0;
    const at = (x, y) => cen.T.map((v, q) => v + x * T1[q] + y * T2[q]);
    const { ctx, W, H, d } = cvs($("#hd-cv")), n = 400, img = new ImageData(n, n), sgn = new Int8Array(n * n);
    const cA = rgb(C.cold), cB = rgb(C.hot), ink = rgb(C.ink), paper = rgb(C.paper);
    let neg = 0;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const x = -R + 2 * R * (i + 0.5) / n, y = R - 2 * R * (j + 0.5) / n, v = hdet(at(x, y)); sgn[j * n + i] = v > 0 ? 1 : v < 0 ? -1 : 0; if (v < 0) neg++; }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const k = j * n + i, s = sgn[k], edge = (i < n - 1 && sgn[k + 1] !== s) || (j < n - 1 && sgn[k + n] !== s);
      const c = edge ? ink : mix(s >= 0 ? cA : cB, paper, 0.35), o = 4 * k;
      img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255;
    }
    const off = document.createElement("canvas"); off.width = n; off.height = n; off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const MX = (x) => (x + R) / (2 * R) * W, MY = (y) => (R - y) / (2 * R) * H;
    if (HD.c === "W") { ctx.fillStyle = C.bad; ctx.beginPath(); ctx.arc(MX(0), MY(0), 5 * d, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.strokeStyle = C.bad; ctx.lineWidth = 2.5 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), 11 * d, 0, Math.PI * 2); ctx.stroke(); }
    const [px, py] = HD.probe || [0, 0], Tp = at(px, py), v = hdet(Tp), onB = Math.abs(v) < 1e-6;
    if (HD.probe) { ctx.fillStyle = C.surface; ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * d; ctx.beginPath(); ctx.arc(MX(px), MY(py), 6 * d, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    $("#hd-tag").innerHTML = HD.probe ? `probe at (${fmt(px)}, ${fmt(py)})` : `the center: <b>${HD.c === "Z" ? "0" : HD.c === "W" ? "W" : "a degenerate tensor"}</b>`;
    const f2 = (q) => fmt(q, 2).padStart(5, " ").replace(/ /g, "&nbsp;");
    const slab = (i) => `[ ${f2(Tp[i * 4])} ${f2(Tp[i * 4 + 1])} ]<br>[ ${f2(Tp[i * 4 + 2])} ${f2(Tp[i * 4 + 3])} ]`;
    $("#hd-alg").innerHTML = `${HD.probe ? "probed tensor" : "center tensor"}, as two 2×2 slices:<br>${slab(0).split("<br>").map((r, k) => r + "&nbsp;&nbsp;&nbsp;" + slab(1).split("<br>")[k]).join("<br>")}<br>Δ = <b>${onB ? "0" : v.toExponential(2).replace("-", "−")}</b> → ${onB ? "on the boundary" : v > 0 ? "<b>rank 2</b>" : "<b>rank 3</b>"}`;
    $("#hd-cap").innerHTML = onB
      ? (HD.c === "W" && !HD.probe ? "This is W: rank 3, but a limit of rank-2 tensors. A rank-2 fit gets arbitrarily close only by sending its factors to infinity, as in Figures {fig:borderfit} and {fig:bordercompare}." : "On the boundary Δ = 0 the rank is decided by finer invariants. Tensors here are where rank-2 fits become ill-behaved.")
      : v > 0 ? "Blue: two rank-one terms suffice, and a rank-2 fit can reach zero loss."
      : "Orange: three rank-one terms are needed, and no best rank-2 approximation exists (de Silva and Lim). A rank-2 fit keeps lowering the loss while its factors grow without bound, as in Figure {fig:borderfit}.";
    $("#hd-chips").innerHTML = `<span class="chip v">rank 3 on <b>${Math.round(100 * neg / (n * n))}%</b> of this slice</span><span class="chip">a random Gaussian tensor has rank 3 with probability 1 − π/4 ≈ <b>21%</b></span>`;
  }
  seg("#hd-c", (v) => { HD.c = v; HD.probe = null; fig12(); });
  $("#hd-new")?.addEventListener("click", () => { HD.bump++; HD.probe = null; fig12(); });
  $("#hd-cv")?.addEventListener("click", (e) => { const r = e.currentTarget.getBoundingClientRect(); HD.probe = [-1 + 2 * (e.clientX - r.left) / r.width, 1 - 2 * (e.clientY - r.top) / r.height]; fig12(); });

  // ============================================================ Figure 14: border rank, two charts
  const Wt = CENTERS.W.T;
  const BR = { runs: null, it: 0, max: 1 << 21, lr: 0.01 };
  function brInit() { if (!$("#br-loss")) return;
    const r = seeded(7), P = []; for (let q = 0; q < 12; q++) P.push(r() - 0.5);
    const r2 = seeded(6), Q = []; for (let q = 0; q < 13; q++) Q.push(r2() - 0.5); Q[0] = 0.3;
    BR.runs = { P, Q, hp: [], hq: [] }; BR.it = 0; BR.next = 1;
  }
  // ordinary chart: a1 b1 c1 a2 b2 c2 (each in R^2)
  function brStepP(P, lr) {
    const R = new Array(8).fill(0);
    for (let h = 0; h < 2; h++) { const o = 6 * h; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) R[i * 4 + j * 2 + k] += P[o + i] * P[o + 2 + j] * P[o + 4 + k]; }
    let L = 0; for (let q = 0; q < 8; q++) { R[q] -= Wt[q]; L += 0.5 * R[q] * R[q]; }
    const g = new Array(12).fill(0);
    for (let h = 0; h < 2; h++) { const o = 6 * h; for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const rr = R[i * 4 + j * 2 + k]; g[o + i] += rr * P[o + 2 + j] * P[o + 4 + k]; g[o + 2 + j] += rr * P[o + i] * P[o + 4 + k]; g[o + 4 + k] += rr * P[o + i] * P[o + 2 + j]; } }
    for (let q = 0; q < 12; q++) P[q] -= lr * g[q];
    return L;
  }
  // blown-up chart: Q = [s, a(2), A(2), b(2), B(2), c(2), Cc(2)]
  // T = A b c + a B c + a b Cc + s(A B c + A b Cc + a B Cc) + s² A B Cc
  const TERMS = [[1, 3, 5, 0], [0, 4, 5, 0], [0, 3, 6, 0], [1, 4, 5, 1], [1, 3, 6, 1], [0, 4, 6, 1], [1, 4, 6, 2]]; // indices into vec list [_, a, A, b, B, c, Cc] mapped below
  function brStepQ(Q, lr) {
    const s = Q[0], V = [null, Q.slice(1, 3), Q.slice(3, 5), Q.slice(5, 7), Q.slice(7, 9), Q.slice(9, 11), Q.slice(11, 13)];
    const map = [[2, 3, 5], [1, 4, 5], [1, 3, 6], [2, 4, 5], [2, 3, 6], [1, 4, 6], [2, 4, 6]], pw = [0, 0, 0, 1, 1, 1, 2];
    const R = new Array(8).fill(0);
    for (let t = 0; t < 7; t++) { const [x, y, z] = map[t], w = Math.pow(s, pw[t]); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) R[i * 4 + j * 2 + k] += w * V[x][i] * V[y][j] * V[z][k]; }
    let L = 0; for (let q = 0; q < 8; q++) { R[q] -= Wt[q]; L += 0.5 * R[q] * R[q]; }
    const G = [0, [0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]];
    for (let t = 0; t < 7; t++) {
      const [x, y, z] = map[t], p = pw[t], w = Math.pow(s, p), dw = p ? p * Math.pow(s, p - 1) : 0;
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < 2; k++) { const rr = R[i * 4 + j * 2 + k]; G[x][i] += rr * w * V[y][j] * V[z][k]; G[y][j] += rr * w * V[x][i] * V[z][k]; G[z][k] += rr * w * V[x][i] * V[y][j]; G[0] += rr * dw * V[x][i] * V[y][j] * V[z][k]; }
    }
    Q[0] -= lr * G[0]; for (let v = 1; v <= 6; v++) for (let i = 0; i < 2; i++) Q[1 + 2 * (v - 1) + i] -= lr * G[v][i];
    return L;
  }
  const nrm = (P) => Math.sqrt(P.reduce((a, v) => a + v * v, 0));
  function brAdvance(budgetMs) {
    const t0 = performance.now(), R = BR.runs;
    while (BR.it < BR.max && performance.now() - t0 < budgetMs) {
      for (let s = 0; s < 2000 && BR.it < BR.max; s++) {
        const lp = brStepP(R.P, BR.lr), lq = brStepQ(R.Q, BR.lr); BR.it++;
        if (BR.it >= BR.next) { R.hp.push([Math.log10(BR.it), Math.log10(Math.max(lp, 1e-30)), nrm(R.P)]); R.hq.push([Math.log10(BR.it), Math.log10(Math.max(lq, 1e-30)), nrm(R.Q.slice(1)), R.Q[0]]); BR.next = Math.ceil(BR.next * 1.15); }
      }
    }
  }
  function fig13() { if (!$("#br-loss")) return;
    if (!BR.runs) return;
    const R = BR.runs, xm = Math.log10(BR.max);
    let svg = $("#br-loss");
    let F = frame(svg, { W: 360, H: 260, l: 46, r: 12, t: 12, b: 42, xr: [0, xm], yr: [-8, 1], xt: [0, 2, 4, 6].map((v) => [v, "10" + sup(v)]), yt: [[0, "1"], [-2, "10⁻²"], [-4, "10⁻⁴"], [-6, "10⁻⁶"], [-8, "10⁻⁸"]], xlab: "gradient steps", ylab: "loss" });
    E("path", { d: pathD(R.hp.map((p) => [p[0], p[1]]), F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.6 }, F.g);
    E("path", { d: pathD(R.hq.map((p) => [p[0], p[1]]), F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.6 }, F.g);
    T(svg, F.x1 - 6, F.y0 + 16, "orange: ordinary rank-2 factors", C.hot, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    T(svg, F.x1 - 6, F.y0 + 32, "violet: blown-up chart", C.blow, { at: { "text-anchor": "end" }, st: ";font-weight:600" });
    svg = $("#br-norm");
    F = frame(svg, { W: 360, H: 260, l: 46, r: 12, t: 12, b: 42, xr: [0, xm], yr: [0, 6], xt: [0, 2, 4, 6].map((v) => [v, "10" + sup(v)]), yt: [0, 2, 4, 6].map((v) => [v, String(v)]), xlab: "gradient steps", ylab: "|parameters|" });
    E("path", { d: pathD(R.hp.map((p) => [p[0], p[2]]), F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.6 }, F.g);
    E("path", { d: pathD(R.hq.map((p) => [p[0], p[2]]), F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.6 }, F.g);
    E("path", { d: pathD(R.hq.map((p) => [p[0], 5 * Math.abs(p[3])]), F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 1.5, "stroke-dasharray": "5 4" }, F.g);
    T(svg, F.x1 - 6, F.y1 - 10, "dashed: 5·|s| in the blown-up chart", C.blow, { at: { "text-anchor": "end" } });
    const lp = R.hp.length ? R.hp[R.hp.length - 1] : null, lq = R.hq.length ? R.hq[R.hq.length - 1] : null;
    $("#br-status").textContent = BR.it < BR.max ? `running: ${BR.it.toLocaleString()} steps` : `${BR.it.toLocaleString()} steps`;
    if (lp && lq) $("#br-chips").innerHTML = `<span class="chip">ordinary: loss <b>${Math.pow(10, lp[1]).toExponential(1)}</b>, |parameters| <b>${lp[2].toFixed(2)}</b> and still growing</span><span class="chip v">blown-up chart: loss <b>${Math.pow(10, lq[1]).toExponential(1)}</b>, |parameters| <b>${lq[2].toFixed(2)}</b>, s = <b>${lq[3].toFixed(3)}</b></span>`;
  }
  watch($("#br-loss"), () => { if (!BR.runs) { brInit(); } });
  SCHED.add(() => { if (!BR.runs || BR.it >= BR.max || !isOn($("#br-loss"))) return; brAdvance(10); fig13(); });
  $("#br-run")?.addEventListener("click", () => { brInit(); fig13(); });

  // ============================================================ Figure 18: learning coefficients of factorized models
  function aw(M, N, H, r) {
    if (N + r <= M + H && M + r <= N + H && H + r <= M + N) { const s = M + H + N + r; return s % 2 === 0 ? [(2 * (H + r) * (M + N) - (M - N) ** 2 - (H + r) ** 2) / 8, 1] : [(2 * (H + r) * (M + N) - (M - N) ** 2 - (H + r) ** 2 + 1) / 8, 2]; }
    if (M + H < N + r) return [(H * M - H * r + N * r) / 2, 1];
    if (N + H < M + r) return [(H * N - H * r + M * r) / 2, 1];
    return [M * N / 2, 1];
  }
  // sampled n<K> at n = 1000 (1000 Langevin chains), with (m − 1)/log n added back
  const LW_SAMPLES = [[1, 0, 1.359, 2], [2, 0, 2.453, 1], [3, 0, 3.345, 2], [5, 0, 4.479, 2], [2, 1, 3.416, 2], [4, 1, 4.466, 2]];
  const CP_SAMPLES = [[1, 'zero', 0.754], [2, 'zero', 1.460], [3, 'zero', 2.117], [2, 'G2', 4.068], [3, 'G2', 4.082]];
  function fig17() { if (!$("#lw-plot")) return;
    const svg = $("#lw-plot"), M = 3, N = 3;
    const F = learningFrame(svg, { W: 360, H: 290, l: 40, r: 12, t: 12, b: 42, xr: [0.5, 8.5], yr: [0, 7], xt: [1, 2, 3, 4, 5, 6, 7, 8].map((v) => [v, String(v)]), yt: [0, 1, 2, 3, 4, 5, 6, 7].map((v) => [v, String(v)]), xlab: "hidden width H", ylab: "λ" });
    const dl = []; for (let H = 0.5; H <= 8.5; H += 0.05) dl.push([H, 3 * H]);
    E("path", { d: pathD(dl, F.X, F.Y), fill: "none", stroke: C.steel, "stroke-width": 2, "stroke-dasharray": "6 4" }, F.g);
    E("line", { x1: F.x0, x2: F.x1, y1: F.Y(4.5), y2: F.Y(4.5), stroke: C.muted, "stroke-dasharray": "2 3" }, F.g);
    [[0, C.blow], [1, C.hot]].forEach(([r, col]) => {
      const pts = []; for (let H = 1; H <= 8; H++) pts.push([H, aw(M, N, H, r)[0]]);
      E("path", { d: pathD(pts, F.X, F.Y), fill: "none", stroke: col, "stroke-width": 2.6 }, F.g);
      pts.forEach((p) => E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 3, fill: col }, F.g));
    });
    LW_SAMPLES.forEach(([H, r, v, m]) => { const y = v + (m - 1) / Math.log(1000); E("circle", { cx: F.X(H), cy: F.Y(y), r: 6.5, fill: "none", stroke: C.ink, "stroke-width": 2 }, F.g); });
    const s2 = $("#lw-cp");
    const G = learningFrame(s2, { W: 360, H: 290, l: 40, r: 12, t: 12, b: 42, xr: [0.5, 3.5], yr: [0, 7], xt: [1, 2, 3].map((v) => [v, String(v)]), yt: [0, 1, 2, 3, 4, 5, 6, 7].map((v) => [v, String(v)]), xlab: "hidden width H (CP rank)", ylab: "n·⟨K⟩ at n = 1000" });
    const dl2 = []; for (let H = 0.5; H <= 3.5; H += 0.05) dl2.push([H, 3 * H]);
    E("path", { d: pathD(dl2, G.X, G.Y), fill: "none", stroke: C.steel, "stroke-width": 2, "stroke-dasharray": "6 4" }, G.g);
    E("line", { x1: G.x0, x2: G.x1, y1: G.Y(4), y2: G.Y(4), stroke: C.muted, "stroke-dasharray": "2 3" }, G.g);
    const cols = { zero: C.blow, G2: C.hot };
    ["zero", "G2"].forEach((tg) => { const pts = CP_SAMPLES.filter((p) => p[1] === tg).map((p) => [p[0], p[2]]); if (!pts.length) return; E("path", { d: pathD(pts, G.X, G.Y), fill: "none", stroke: cols[tg], "stroke-width": 2.2 }, G.g); pts.forEach((p) => E("circle", { cx: G.X(p[0]), cy: G.Y(p[1]), r: 5, fill: cols[tg] }, G.g)); });
    $("#lw-chips").innerHTML = `<span class="chip v">linear network, H = 8: <b>48</b> parameters, λ = <b>4.5</b></span><span class="chip">the regular count would be d/2 = <b>24</b></span>`;
  }

  // ============================================================ Figure 21: the LLC thermometer
  const LK = {
    bowl: { K: (a, b) => a * a + b * b, g: (a, b) => [2 * a, 2 * b], lam: 1, m: 1, lamS: "1", Lc: 2 },
    prod: { K: (a, b) => (a * b) ** 2, g: (a, b) => [2 * a * b * b, 2 * a * a * b], lam: 0.5, m: 2, lamS: "1/2", Lc: 6 },
    quart: { K: (a, b) => a ** 4 + b * b, g: (a, b) => [4 * a ** 3, 2 * b], lam: 0.75, m: 1, lamS: "3/4", Lc: 12 },
    cusp: { K: (a, b) => (b * b - a ** 3) ** 2, g: (a, b) => { const f = b * b - a ** 3; return [-6 * a * a * f, 4 * b * f]; }, lam: 5 / 12, m: 1, lamS: "5/12", Lc: 40 },
  };
  const LL = { k: "bowl", ln: 3, ch: null, hist: [], frames: 0, exact: null, paused: false, last: 0, steps: 0, cache: new Map(), rng: seeded(9) };
  function llcExact() {
    const L = LK[LL.k], n = Math.pow(10, LL.ln), G = 1200; let Z = 0, M = 0;
    for (let j = 0; j < G; j++) for (let i = 0; i < G; i++) { const a = -1 + 2 * (i + 0.5) / G, b = -1 + 2 * (j + 0.5) / G, k = n * L.K(a, b), w = Math.exp(-k); Z += w; M += k * w; }
    return M / Z;
  }
  function llcInit() {
    const key = LL.k + "|" + LL.ln;
    if (!LL.cache.has(key)) LL.cache.set(key, llcExact());
    const C2 = 300; LL.steps = 0; LL.rng = seeded(9); LL.ch = new Float64Array(2 * C2); LL.hist = []; LL.frames = 0; LL.sum = 0; LL.cnt = 0; LL.exact = LL.cache.get(key);
  }
  function llcAdvance() {
    const L = LK[LL.k], n = Math.pow(10, LL.ln), eta = 0.25 / (n * L.Lc), sq = Math.sqrt(2 * eta), ch = LL.ch, r = LL.rng;
    for (let s = 0; s < 80; s++) for (let c = 0; c < ch.length; c += 2) {
      const g = L.g(ch[c], ch[c + 1]);
      let a = ch[c] - eta * n * g[0] + sq * gauss(r), b = ch[c + 1] - eta * n * g[1] + sq * gauss(r);
      if (a > 1) a = 2 - a; if (a < -1) a = -2 - a; if (b > 1) b = 2 - b; if (b < -1) b = -2 - b;
      ch[c] = a; ch[c + 1] = b;
    }
    let m = 0; for (let c = 0; c < ch.length; c += 2) m += n * L.K(ch[c], ch[c + 1]); m /= ch.length / 2;
    LL.frames++; LL.steps += 80; if (LL.steps > 8000) { LL.sum += m; LL.cnt++; }
    LL.hist.push([LL.steps, LL.cnt ? LL.sum / LL.cnt : m]); if (LL.hist.length > 500) LL.hist.shift();
  }
  let llcImg = null, llcImgKey = "";
  function fig19() { if (!$("#llc-cv")) return;
    if (!LL.ch) return;
    const L = LK[LL.k], n = Math.pow(10, LL.ln);
    const { ctx, W, H, d } = cvs($("#llc-cv"));
    const key = LL.k + "|" + W + "|" + (isDark() ? 1 : 0);
    if (key !== llcImgKey) {
      const g = 180, img = new ImageData(g, g), lut = LUT();
      for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) { const a = -1 + 2 * (i + 0.5) / g, b = 1 - 2 * (j + 0.5) / g, K = L.K(a, b), t = clamp(1 - (Math.log10(K + 1e-12) + 6) / 6.5, 0, 1), c = lut[Math.round(t * 255 * 0.7)], o = 4 * (j * g + i); img.data[o] = c[0]; img.data[o + 1] = c[1]; img.data[o + 2] = c[2]; img.data[o + 3] = 255; }
      llcImg = document.createElement("canvas"); llcImg.width = g; llcImg.height = g; llcImg.getContext("2d").putImageData(img, 0, 0); llcImgKey = key;
    }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(llcImg, 0, 0, W, H);
    ctx.fillStyle = C.hot; const ch = LL.ch;
    for (let c = 0; c < ch.length; c += 2) { ctx.beginPath(); ctx.arc((ch[c] + 1) / 2 * W, (1 - ch[c + 1]) / 2 * H, 2.2 * d, 0, Math.PI * 2); ctx.fill(); }
    ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; const s = "300 Langevin chains"; ctx.strokeText(s, 8 * d, 18 * d); ctx.fillStyle = C.ink; ctx.fillText(s, 8 * d, 18 * d);
    const svg = $("#llc-plot"), hx = LL.hist, x1 = Math.max(1000, LL.steps);
    const F = learningFrame(svg, { W: 360, H: 290, l: 40, r: 12, t: 12, b: 42, xr: [Math.max(0, x1 - 40000), x1], yr: [0, 1.4], xt: [Math.max(0, x1 - 40000), x1].map(v => [v, v.toLocaleString()]), yt: [[0, "0"], [0.5, "0.5"], [1, "1"]], xlab: "Langevin steps per chain", ylab: "n·⟨K⟩" });
    E("line", { x1: F.x0, x2: F.x1, y1: F.Y(L.lam), y2: F.Y(L.lam), stroke: C.blow, "stroke-width": 2 }, F.g);
    E("line", { x1: F.x0, x2: F.x1, y1: F.Y(LL.exact), y2: F.Y(LL.exact), stroke: C.ink, "stroke-width": 1.5, "stroke-dasharray": "6 4" }, F.g);
    E("path", { d: pathD(hx, F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.6 }, F.g);
    $("#llc-n-out").textContent = "10" + sup(LL.ln);
    const est = hx.length ? hx[hx.length - 1][1] : 0;
    $("#llc-chips").innerHTML = `<span class="chip v">${LL.cnt ? "Running mean" : "Warm-up"}: <b>${LL.cnt ? est.toFixed(3) : `${Math.min(8000, LL.steps).toLocaleString()} / 8,000 steps`}</b></span><span class="chip">Grid reference at this n: <b>${LL.exact.toFixed(3)}</b></span><span class="chip">Asymptotic λ: <b>${L.lamS}</b></span>`;
    $("#llc-pause").textContent = LL.paused ? "Resume chains" : "Pause chains";
    $("#llc-explain").textContent = LL.k === "bowl" ? "A quadratic bowl confines both coordinates: λ = 1. At large n, the finite-n reference and the sampled mean approach that value." : LL.k === "prod" ? "The loss is zero along either axis. This extra room gives λ = 1/2; the finite-n reference is lower, with a slow logarithmic correction. The sampler should approach the dashed reference before we compare it with λ." : LL.k === "quart" ? "One quadratic direction contributes 1/2, and one quartic direction contributes 1/4: λ = 3/4." : "The cusp concentrates weight unevenly along its zero set. Its local exponent is λ = 5/12; mixing and finite-n effects make this a harder sampling example.";

  }
  seg("#llc-k", (v) => { LL.k = v; llcInit(); fig19(); });
  $("#llc-n")?.addEventListener("input", (e) => { LL.ln = +e.target.value; llcInit(); fig19(); });
  $("#llc-run")?.addEventListener("click", () => { llcInit(); fig19(); });
  $("#llc-pause")?.addEventListener("click", () => { LL.paused = !LL.paused; fig19(); });
  watch($("#llc-cv"), () => { if (!LL.ch) { llcInit(); fig19(); } });
  SCHED.add((now) => { if (!LL.ch || LL.paused || !isOn($("#llc-cv")) || now - LL.last < 50) return; LL.last = now; llcAdvance(); fig19(); });

  // ============================================================ Figure 16: one ReLU unit
  const NN = { c: 0.6, n: 200 };
  const nnK = reluLoss;
  function fig15nn() { if (!$("#nn-cv")) return;
    const c = NN.c, n = NN.n, R = 2;
    const { ctx, W, H, d } = cvs($("#nn-cv")), g = 200, img = new ImageData(g, g), lut = LUT();
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) { const w = -R + 2 * R * (i + 0.5) / g, a = R - 2 * R * (j + 0.5) / g, v = Math.exp(-n * nnK(a, w, c)), col = lut[Math.round(clamp(Math.pow(v, 0.6), 0, 1) * 255 * 0.85)], o = 4 * (j * g + i); img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; }
    const off = document.createElement("canvas"); off.width = g; off.height = g; off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, 0, 0, W, H);
    const MX = (w) => (w + R) / (2 * R) * W, MY = (a) => (R - a) / (2 * R) * H;
    ctx.strokeStyle = C.steel; ctx.lineWidth = 1 * d; ctx.globalAlpha = 0.7;
    for (const k of [-1.5, -0.8, -0.3, 0.3, 0.8, 1.5]) for (const sg of [1, -1]) { ctx.beginPath(); let on = false; for (let i = 1; i <= 200; i++) { const w = sg * (0.02 + 2 * i / 200), a = k / w; if (Math.abs(a) > R) { on = false; continue; } on ? ctx.lineTo(MX(w), MY(a)) : ctx.moveTo(MX(w), MY(a)); on = true; } ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6 * d;
    if (c > 0.005) { ctx.beginPath(); let on = false; for (let i = 1; i <= 300; i++) { const w = 0.01 + 2 * i / 300, a = c / w; if (a > R) { on = false; continue; } on ? ctx.lineTo(MX(w), MY(a)) : ctx.moveTo(MX(w), MY(a)); on = true; } ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(0, MY(0)); ctx.lineTo(W, MY(0)); ctx.moveTo(MX(0), 0); ctx.lineTo(MX(0), H); ctx.stroke(); ctx.strokeStyle = C.bad; ctx.lineWidth = 2.4 * d; ctx.beginPath(); ctx.arc(MX(0), MY(0), 10 * d, 0, Math.PI * 2); ctx.stroke(); }
    if (!NN.samp || NN.sc !== c) nnResample();
    NN.pts.forEach(([w, a], q) => { ctx.fillStyle = q < 40 ? C.hot : C.blow; ctx.globalAlpha = q < 40 ? 1 : 0.45; ctx.beginPath(); ctx.arc(MX(w), MY(a), (q < 40 ? 2.8 : 1.8) * d, 0, 2 * Math.PI); ctx.fill(); });
    ctx.globalAlpha = 1;
    // the functions these weights compute
    { const sv = $("#nn-fn"), F = learningFrame(sv, { W: 360, H: 260, l: 40, r: 12, t: 12, b: 40, xr: [-1, 1], yr: [-0.6, 1.2], xt: [[-1, "−1"], [0, "0"], [1, "1"]], yt: [[0, "0"], [1, "1"]], xlab: "input x" });
      NN.pts.slice(0, 40).forEach(([w, a]) => { E("path", { d: pathD([[-1, a * Math.max(0, -w)], [0, 0], [1, a * Math.max(0, w)]], F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 1.4, opacity: 0.55 }, F.g); });
      E("path", { d: pathD([[-1, 0], [0, 0], [1, c]], F.X, F.Y), fill: "none", stroke: C.ink, "stroke-width": 2.6, "stroke-dasharray": "6 4" }, F.g);
    }
    const lab = (s, x, y, col) => { ctx.font = `600 ${12 * d}px "Schibsted Grotesk", sans-serif`; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.paper; ctx.strokeText(s, x, y); ctx.fillStyle = col; ctx.fillText(s, x, y); };
    lab("a (output weight) ↑", 8 * d, 18 * d, C.ink); lab("w (input weight) →", W - 128 * d, H - 10 * d, C.ink);
    if (c > 0.005) lab("perfect fits: a·w = c", MX(Math.max(0.35, c / 1.6)) + 8 * d, MY(Math.min(1.6, c / Math.max(0.35, c / 1.6))) - 6 * d, C.ink);
    else { lab("a = 0: output off", 8 * d, MY(0) - 8 * d, C.ink); lab("w = 0: input off", MX(0) + 8 * d, 40 * d, C.ink); }
    // loss along the diagonal a = w
    const svg = $("#nn-cut"), pts = [], pq = [];
    for (let i = -100; i <= 100; i++) { const s = 2 * i / 100; pts.push([s, nnK(s, s, c)]); }
    const F = learningFrame(svg, { W: 360, H: 220, l: 40, r: 12, t: 12, b: 40, xr: [-2, 2], yr: [0, 0.6], xt: [[-2, "−2"], [-1, "−1"], [0, "0"], [1, "1"], [2, "2"]], yt: [[0, "0"], [0.3, "0.3"], [0.6, "0.6"]], xlab: "s, along a = w = s" });
    if (c > 0.005) { const s0 = Math.sqrt(c), k2 = 4 * c / 12; for (let i = -100; i <= 100; i++) { const s = 2 * i / 100; pq.push([s, k2 * (s - s0) ** 2]); } E("path", { d: pathD(pq, F.X, F.Y), fill: "none", stroke: C.steel, "stroke-width": 1.6, "stroke-dasharray": "5 4" }, F.g); }
    E("path", { d: pathD(pts, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.8 }, F.g);
    $("#nn-c-out").textContent = "c = " + c.toFixed(2);
    $("#nn-cap").textContent = c > 0.005 ? "Near the positive perfect fit, transverse curvature is nonzero. Dashed: the local quadratic approximation." : "At the crossing the loss grows like s⁴ along the diagonal: the Hessian is zero there and misses the shape entirely.";
    $("#nn-chips").innerHTML = c > 0.005
      ? `<span class="chip v">perfect fits: a·w = c on w > 0 (a rescaling orbit)</span><span class="chip">one flat direction, one curved: λ = <b>1/2</b> (regular count: 1)</span>`
      : `<span class="chip v">perfect fits: a = 0 or w = 0, crossing at the origin</span><span class="chip">λ = <b>1/2</b> with multiplicity m = <b>2</b>: the crossing adds a log log n term</span>`;
  }
  $("#nn-c")?.addEventListener("input", (e) => { NN.c = +e.target.value; if (NN.c < 0.02) NN.c = 0; fig15nn(); });
  function nnResample() { const c = NN.c, n = NN.n; NN.samp = gridSampler((w, a) => -n * nnK(a, w, c), [-2, 2], [-2, 2], 260); NN.sc = c; NN.pts = []; for (let k = 0; k < 700; k++) NN.pts.push(NN.samp(RND)); }

  // ============================================================ Figure 21: the LLC on a trained linear network
  const LN = { g: 10, res: [], H: 0, running: false, started: false, worker: null, job: 0, phase: "", chain: 0, error: "" };
  function fig19ln() { if (!$("#llcn-plot")) return;
    const svg = $("#llcn-plot"), narrow = svg.getBoundingClientRect().width < 500;
    const maxY = Math.max(6, ...LN.res.map(([,v]) => Math.ceil(v + 0.6)));
    const F = learningFrame(svg, { W: 720, H: 330, l: 48, r: 28, t: 24, b: 46, xr: [0.65, 5.35], yr: [0, maxY], xt: [1,2,3,4,5].map(v => [v, String(v)]), yt: Array.from({length: Math.floor(maxY/2)+1}, (_,i) => [2*i,String(2*i)]), xlab: "hidden width H", ylab: "scaled excess loss" });
    const ex = [1,2,3,4,5].map(H => [H,lnExact(H)]);
    E("path", { d: pathD(ex,F.X,F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.6 },F.g);
    ex.forEach(p => E("circle", { cx: F.X(p[0]), cy: F.Y(p[1]), r: 4, fill: C.blow }, F.g));
    LN.res.forEach(([H,v]) => {
      E("line", { x1:F.X(H),x2:F.X(H),y1:F.Y(lnExact(H)),y2:F.Y(v),stroke:C.hot,"stroke-width":2 },F.g);
      E("circle", { cx:F.X(H),cy:F.Y(v),r:5.5,fill:C.hot,stroke:C.surface,"stroke-width":2 },F.g);
      if(!narrow) T(svg,F.X(H),F.Y(v)+20,v.toFixed(2),C.hot,{at:{"text-anchor":"middle"}});
    });
    $("#llcn-status").textContent = LN.error || (LN.running ? `${LN.phase === "training" ? "Training" : "Sampling"} H = ${LN.H}${LN.chain ? ` · chain ${LN.chain}/4` : ""}…` : LN.res.length === 5 ? `Complete · γ = ${LN.g}` : LN.started ? `Stopped · ${LN.res.length}/5 widths finished` : "Ready");
    $("#llcn-stop").disabled = !LN.running;
    $("#llcn-chips").innerHTML = `<span class="chip">n = 1,000 · β = 1/log n · γ = ${LN.g}</span><span class="chip">${LN.res.length}/5 widths sampled</span>`;
    $("#llcn-results").innerHTML = `<table><thead><tr><th>Width H</th><th>Theoretical λ</th><th>Sample estimate</th></tr></thead><tbody>${ex.map(([H,v])=>`<tr><td>${H}</td><td>${v.toFixed(2)}</td><td>${LN.res.find(p=>p[0]===H)?.[1].toFixed(3) ?? "—"}</td></tr>`).join("")}</tbody></table>`;
  }
  function lnStop() { LN.job++; LN.worker?.terminate(); LN.worker = null; LN.running = false; fig19ln(); }
  function lnStart() {
    if (!$("#llcn-plot")) return;
    lnStop(); LN.started=true; LN.res=[]; LN.H=1; LN.running=true; LN.phase="training"; LN.chain=0; LN.error="";
    const job=LN.job;
    try {
      LN.worker = new Worker(new URL("./llc-network-worker.js", import.meta.url), { type: "module" });
      LN.worker.onmessage = ({data}) => {
        if(data.job!==LN.job) return;
        if(data.type==="progress") { LN.H=data.H;LN.phase=data.phase;LN.chain=data.chain; }
        if(data.type==="result") LN.res.push([data.H,data.value]);
        if(data.type==="complete" || data.type==="error") { LN.running=false;LN.worker?.terminate();LN.worker=null; }
        if(data.type==="error") LN.error="Sampling failed. Use Run again to retry.";
        fig19ln();
      };
      LN.worker.onerror=()=>{ if(job!==LN.job)return;LN.error="Sampler could not start. Use Run again to retry.";LN.running=false;LN.worker?.terminate();LN.worker=null;fig19ln(); };
      LN.worker.postMessage({gamma:LN.g,job});
    } catch(error) { LN.running=false;LN.error="Sampler could not start. Use Run again to retry."; }
    fig19ln();
  }
  seg("#llcn-g",v=>{LN.g=+v;lnStart();});
  $("#llcn-run")?.addEventListener("click",lnStart);
  $("#llcn-stop")?.addEventListener("click",lnStop);
  watch($("#llcn-plot"),()=>{if(!LN.started)lnStart();});
  window.addEventListener("pagehide",()=>LN.worker?.terminate());

  // ============================================================ Figure 10: rank-2 fit of W, as cubes
  const TZ3D = [[1,1.48,[-0.4887,-0.4379,0.4773,0.1989,0.0184,-0.0967,-0.0345,-0.2602,0.054,0.2299,-0.2424,-0.344]],[2,1.478,[-0.4891,-0.4378,0.4776,0.1988,0.0153,-0.0989,-0.0352,-0.2603,0.0548,0.2299,-0.2426,-0.344]],[3,1.477,[-0.4895,-0.4377,0.478,0.1987,0.0123,-0.101,-0.036,-0.2604,0.0555,0.23,-0.2428,-0.344]],[4,1.475,[-0.49,-0.4377,0.4784,0.1986,0.0092,-0.1032,-0.0367,-0.2605,0.0562,0.23,-0.243,-0.344]],[5,1.474,[-0.4904,-0.4376,0.4789,0.1986,0.0062,-0.1054,-0.0374,-0.2606,0.057,0.2301,-0.2433,-0.344]],[7,1.47,[-0.4914,-0.4375,0.4798,0.1985,0,-0.1098,-0.0389,-0.2608,0.0584,0.2302,-0.2437,-0.344]],[9,1.467,[-0.4924,-0.4375,0.4809,0.1984,-0.0061,-0.1142,-0.0404,-0.261,0.0599,0.2303,-0.2442,-0.344]],[12,1.462,[-0.4941,-0.4375,0.4826,0.1985,-0.0152,-0.1208,-0.0427,-0.2613,0.0621,0.2305,-0.2449,-0.344]],[15,1.458,[-0.4959,-0.4377,0.4846,0.1987,-0.0244,-0.1274,-0.0449,-0.2616,0.0644,0.2307,-0.2457,-0.344]],[19,1.451,[-0.4986,-0.4381,0.4875,0.1991,-0.0366,-0.1363,-0.048,-0.2621,0.0674,0.2309,-0.2467,-0.344]],[24,1.443,[-0.5023,-0.439,0.4917,0.2,-0.0519,-0.1475,-0.0519,-0.2627,0.0713,0.2313,-0.2481,-0.3441]],[30,1.432,[-0.5073,-0.4405,0.4975,0.2015,-0.0703,-0.161,-0.0567,-0.2635,0.076,0.2318,-0.2499,-0.3441]],[38,1.417,[-0.515,-0.4432,0.5066,0.2044,-0.0952,-0.1793,-0.0632,-0.2646,0.0824,0.2326,-0.2525,-0.3442]],[48,1.397,[-0.5261,-0.4479,0.52,0.2093,-0.1268,-0.2028,-0.0715,-0.2661,0.0906,0.2337,-0.2561,-0.3443]],[60,1.369,[-0.542,-0.4556,0.5394,0.2172,-0.1658,-0.2318,-0.0819,-0.2681,0.1007,0.2352,-0.2609,-0.3446]],[75,1.328,[-0.5659,-0.4682,0.5685,0.2303,-0.2165,-0.2697,-0.0953,-0.2707,0.1137,0.2374,-0.2675,-0.345]],[94,1.264,[-0.603,-0.4894,0.6134,0.2525,-0.2844,-0.3205,-0.113,-0.2743,0.1306,0.2405,-0.277,-0.3456]],[118,1.163,[-0.6605,-0.5241,0.6812,0.2895,-0.3757,-0.388,-0.1356,-0.2787,0.1518,0.2448,-0.2904,-0.3463]],[148,1.019,[-0.7428,-0.5748,0.7739,0.3467,-0.4918,-0.4705,-0.1623,-0.2828,0.1756,0.2497,-0.3077,-0.3461]],[185,0.892,[-0.8326,-0.6284,0.8664,0.4177,-0.6096,-0.5459,-0.1884,-0.2827,0.1962,0.2525,-0.3264,-0.3421]],[232,0.8478,[-0.8908,-0.658,0.9127,0.4801,-0.6868,-0.5798,-0.2085,-0.2747,0.2082,0.2499,-0.3425,-0.3313]],[290,0.84,[-0.9108,-0.6621,0.9127,0.5216,-0.7183,-0.5774,-0.223,-0.261,0.2139,0.2427,-0.3554,-0.3157]],[363,0.8366,[-0.9171,-0.6591,0.8993,0.5512,-0.7327,-0.5656,-0.2356,-0.2453,0.2187,0.234,-0.3673,-0.2983]],[454,0.8347,[-0.92,-0.656,0.8865,0.5727,-0.7416,-0.5551,-0.2475,-0.2301,0.2235,0.226,-0.3787,-0.2809]],[568,0.8337,[-0.9216,-0.654,0.8773,0.5869,-0.7471,-0.548,-0.2584,-0.2163,0.227,0.2211,-0.3897,-0.2642]],[710,0.8331,[-0.9221,-0.6532,0.8721,0.5945,-0.7497,-0.5443,-0.2688,-0.2041,0.2268,0.2221,-0.4006,-0.2481]],[888,0.8325,[-0.9215,-0.6539,0.871,0.5959,-0.7501,-0.5436,-0.2817,-0.1909,0.2185,0.2343,-0.4134,-0.2303]],[1110,0.8303,[-0.9184,-0.6577,0.875,0.5895,-0.748,-0.546,-0.309,-0.1666,0.1896,0.2723,-0.4355,-0.2043]],[1388,0.804,[-0.9062,-0.6731,0.8933,0.5598,-0.7399,-0.5552,-0.4183,-0.0819,0.0721,0.4042,-0.5206,-0.1369]],[1735,0.09396,[-0.9729,-0.6613,1.0465,0.355,-0.8144,-0.5495,-0.9885,0.3764,-0.7706,0.7162,-1.0472,0.361]],[2169,0.01409,[-1.1377,-0.4868,1.0972,0.4059,-0.9745,-0.404,-1.0632,0.4056,-1.0374,0.4552,-1.103,0.4319]],[2712,0.007081,[-1.2049,-0.4208,1.1458,0.3914,-1.0406,-0.3572,-1.1174,0.3804,-1.1103,0.3861,-1.158,0.4005]],[3390,0.004449,[-1.2504,-0.3856,1.1899,0.3653,-1.0877,-0.3324,-1.1622,0.3553,-1.1573,0.3552,-1.2032,0.3709]],[4238,0.003044,[-1.2877,-0.3604,1.2278,0.343,-1.1274,-0.3138,-1.2007,0.3345,-1.1961,0.3337,-1.2413,0.3476]],[5298,0.002189,[-1.3207,-0.3402,1.2617,0.3246,-1.1629,-0.2984,-1.235,0.3171,-1.2305,0.3162,-1.2752,0.3285]],[6623,0.001627,[-1.3511,-0.3229,1.2929,0.3088,-1.1958,-0.2851,-1.2667,0.3021,-1.2623,0.3013,-1.3063,0.3123]],[8279,0.001237,[-1.3797,-0.3079,1.3223,0.2949,-1.2268,-0.2732,-1.2966,0.2888,-1.2923,0.288,-1.3356,0.2981]],[10349,0.0009562,[-1.407,-0.2944,1.3505,0.2824,-1.2566,-0.2625,-1.3253,0.2769,-1.3211,0.2761,-1.3638,0.2853]],[12937,0.0007484,[-1.4336,-0.2821,1.3779,0.271,-1.2855,-0.2526,-1.3532,0.266,-1.349,0.2652,-1.3911,0.2737]],[16172,0.0005913,[-1.4597,-0.2707,1.4047,0.2605,-1.3138,-0.2435,-1.3805,0.2559,-1.3764,0.2552,-1.4178,0.263]],[20215,0.0004707,[-1.4854,-0.2602,1.4312,0.2507,-1.3418,-0.2349,-1.4074,0.2464,-1.4034,0.2458,-1.4442,0.253]],[25269,0.0003769,[-1.5109,-0.2504,1.4575,0.2415,-1.3695,-0.2268,-1.4341,0.2376,-1.4302,0.2369,-1.4704,0.2437]],[31587,0.0003033,[-1.5363,-0.2411,1.4837,0.2328,-1.3971,-0.2192,-1.4607,0.2292,-1.4569,0.2286,-1.4964,0.2349]],[39484,0.000245,[-1.5618,-0.2324,1.5099,0.2246,-1.4247,-0.2119,-1.4874,0.2212,-1.4836,0.2207,-1.5225,0.2265]],[49355,0.0001985,[-1.5873,-0.2241,1.5362,0.2168,-1.4523,-0.205,-1.514,0.2137,-1.5103,0.2132,-1.5487,0.2186]],[61694,0.0001613,[-1.613,-0.2162,1.5626,0.2094,-1.48,-0.1983,-1.5408,0.2065,-1.5371,0.206,-1.5749,0.2111]],[77118,0.0001313,[-1.6388,-0.2086,1.5891,0.2023,-1.5079,-0.1919,-1.5678,0.1996,-1.5642,0.1991,-1.6014,0.2039]],[96398,0.0001071,[-1.6649,-0.2014,1.6159,0.1955,-1.536,-0.1858,-1.5949,0.1929,-1.5914,0.1925,-1.628,0.197]],[120498,8.751e-05,[-1.6912,-0.1945,1.643,0.189,-1.5643,-0.1799,-1.6224,0.1866,-1.6189,0.1862,-1.6549,0.1904]],[150623,7.16e-05,[-1.7178,-0.1879,1.6703,0.1827,-1.5929,-0.1742,-1.65,0.1805,-1.6466,0.1801,-1.6821,0.184]],[188279,5.864e-05,[-1.7447,-0.1816,1.6979,0.1767,-1.6217,-0.1688,-1.678,0.1746,-1.6746,0.1743,-1.7096,0.1779]],[235349,4.808e-05,[-1.772,-0.1755,1.7259,0.1709,-1.6509,-0.1635,-1.7063,0.169,-1.703,0.1686,-1.7375,0.1721]],[294187,3.945e-05,[-1.7996,-0.1696,1.7542,0.1653,-1.6804,-0.1584,-1.735,0.1635,-1.7317,0.1632,-1.7656,0.1664]],[367734,3.24e-05,[-1.8276,-0.164,1.7829,0.16,-1.7103,-0.1534,-1.764,0.1583,-1.7608,0.158,-1.7942,0.161]],[459668,2.662e-05,[-1.856,-0.1585,1.8119,0.1548,-1.7405,-0.1487,-1.7934,0.1532,-1.7902,0.1529,-1.8231,0.1557]],[574585,2.188e-05,[-1.8848,-0.1533,1.8414,0.1498,-1.7711,-0.1441,-1.8232,0.1483,-1.8201,0.148,-1.8524,0.1507]],[718232,1.8e-05,[-1.9141,-0.1483,1.8713,0.145,-1.8021,-0.1396,-1.8534,0.1436,-1.8503,0.1433,-1.8822,0.1458]],[897790,1.481e-05,[-1.9437,-0.1434,1.9016,0.1403,-1.8335,-0.1353,-1.884,0.139,-1.881,0.1388,-1.9124,0.1411]],[1122238,1.219e-05,[-1.9739,-0.1387,1.9324,0.1358,-1.8654,-0.1311,-1.9151,0.1346,-1.9121,0.1344,-1.943,0.1365]],[1402798,1.004e-05,[-2.0044,-0.1342,1.9636,0.1314,-1.8976,-0.127,-1.9466,0.1303,-1.9436,0.1301,-1.9741,0.1322]],[1753498,8.272e-06,[-2.0355,-0.1298,1.9952,0.1272,-1.9304,-0.1231,-1.9786,0.1262,-1.9757,0.126,-2.0056,0.1279]],[2191873,6.816e-06,[-2.067,-0.1256,2.0274,0.1232,-1.9636,-0.1193,-2.011,0.1222,-2.0081,0.122,-2.0376,0.1238]],[2739842,5.617e-06,[-2.0991,-0.1215,2.06,0.1193,-1.9972,-0.1156,-2.0439,0.1183,-2.0411,0.1182,-2.0701,0.1198]],[3424803,4.63e-06,[-2.1316,-0.1176,2.0932,0.1155,-2.0314,-0.1121,-2.0773,0.1146,-2.0746,0.1144,-2.1031,0.116]],[4194304,3.886e-06,[-2.1616,-0.1141,2.1237,0.1121,-2.0628,-0.1089,-2.1081,0.1113,-2.1054,0.1112,-2.1336,0.1127]]];
  const TZ3 = { i: 0, play: false, last: 0, hold: 0 };
  const tTerm = (P, o) => outer(P.slice(o, o + 2), P.slice(o + 2, o + 4), P.slice(o + 4, o + 6));
  function cube(svg, t, vmax) {
    svg.innerHTML = ""; svg.setAttribute("viewBox", "0 0 200 112");
    const cs = 44, g = 16, x0 = 6, y0 = 18, sf = rgb(C.surface);
    [0, 1].forEach((k) => {
      const ox = x0 + k * (2 * cs + g);
      T(svg, ox + cs, 11, k ? "slice 2" : "slice 1", C.muted, { at: { "text-anchor": "middle" }, st: ";font-size:11px" });
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const v = t[i * 4 + j * 2 + k], a = Math.min(1, Math.abs(v) / vmax), x = ox + j * cs, y = y0 + i * cs;
        E("rect", { x: x + 1, y: y + 1, width: cs - 2, height: cs - 2, rx: 5, fill: css(mix(sf, rgb(v >= 0 ? C.hot : C.cold), 0.08 + 0.85 * a)), stroke: C.rule }, svg);
        const lab = Math.abs(v) < 5e-3 ? "0" : Math.abs(v) >= 10 ? v.toFixed(0) : v.toFixed(Math.abs(v) >= 1 ? 1 : 2);
        E("text", { x: x + cs / 2, y: y + cs / 2 + 5, "text-anchor": "middle", style: `fill:${C.ink};font:600 14px var(--f-mono, monospace);paint-order:stroke;stroke:${css(mix(sf, rgb(v >= 0 ? C.hot : C.cold), 0.08 + 0.85 * a))};stroke-width:0` }, svg, lab.replace("-", "−"));
      }
    });
  }
  function tzCharts() {
    const xm = Math.log10(TZ3D[TZ3D.length - 1][0]), xt = [0, 2, 4, 6].map((v) => [v, "10" + sup(v)]), cur = Math.log10(TZ3D[TZ3.i][0]);
    const err = TZ3D.map(([it, L]) => [Math.log10(it), Math.log10(Math.sqrt(2 * L))]);
    const size = TZ3D.map(([it, , P]) => [Math.log10(it), Math.max(...tTerm(P, 0).map(Math.abs), ...tTerm(P, 6).map(Math.abs))]);
    let svg = $("#tz3-err");
    let F = frame(svg, { W: 360, H: 200, l: 46, r: 12, t: 12, b: 40, xr: [0, xm], yr: [-3, 0.5], xt, yt: [[0, "1"], [-1, "0.1"], [-2, "0.01"], [-3, "0.001"]], xlab: "gradient steps" });
    E("path", { d: pathD(err, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.6 }, F.g);
    const ce = err[TZ3.i]; E("line", { x1: F.X(cur), x2: F.X(cur), y1: F.y0, y2: F.y1, stroke: C.muted, "stroke-dasharray": "3 3" }, F.g); E("circle", { cx: F.X(cur), cy: F.Y(ce[1]), r: 5, fill: C.blow }, F.g);
    T(svg, F.x1 - 6, F.y0 + 16, `error ${Math.pow(10, ce[1]).toPrecision(2)}`, C.blow, { at: { "text-anchor": "end" }, st: ";font-weight:700" });
    svg = $("#tz3-size");
    F = frame(svg, { W: 360, H: 200, l: 46, r: 12, t: 12, b: 40, xr: [0, xm], yr: [0, 10.5], xt, yt: [0, 2, 4, 6, 8, 10].map((v) => [v, String(v)]), xlab: "gradient steps" });
    E("path", { d: pathD(size, F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.6 }, F.g);
    E("line", { x1: F.X(0), x2: F.X(xm), y1: F.Y(1), y2: F.Y(1), stroke: C.muted, "stroke-dasharray": "2 4" }, F.g);
    T(svg, F.X(0) + 6, F.Y(1) - 6, "largest entry of W", C.muted);
    const cz = size[TZ3.i]; E("line", { x1: F.X(cur), x2: F.X(cur), y1: F.y0, y2: F.y1, stroke: C.muted, "stroke-dasharray": "3 3" }, F.g); E("circle", { cx: F.X(cur), cy: F.Y(cz[1]), r: 5, fill: C.hot }, F.g);
    T(svg, F.X(0) + 6, F.y0 + 16, `largest entry in a piece: ${cz[1].toFixed(1)}`, C.hot, { st: ";font-weight:700" });
  }
  function fig10tz() { if (!$("#tz3-a")) return;
    const [it, L, P] = TZ3D[TZ3.i], a = tTerm(P, 0), b = tTerm(P, 6), s = a.map((v, q) => v + b[q]);
    const vmax = Math.max(1, ...a.map(Math.abs), ...b.map(Math.abs));
    for(const [id,offset] of [['a',0],['b',6]]) {
      const vector=(start)=>`(${P[start].toFixed(4)}, ${P[start+1].toFixed(4)})`;
      $(`#tz3-factors-${id}`).innerHTML=['a','b','c'].map((name,i)=>`${name}${id==='a'?'₁':'₂'} = ${vector(offset+2*i)}`).join('<br>');
    }
    cube($("#tz3-a"), a, vmax); cube($("#tz3-b"), b, vmax); cube($("#tz3-c"), s, 1); cube($("#tz3-w"), Wt, 1);
    $("#tz3-s").value = TZ3.i; $("#tz3-s-out").textContent = it.toLocaleString();
    tzCharts();
    $("#tz3-play").textContent = TZ3.play ? "Pause" : "Play";
  }
  if ($("#tz3-s")) $("#tz3-s").max = TZ3D.length - 1;
  $("#tz3-s")?.addEventListener("input", (e) => { TZ3.i = +e.target.value; TZ3.play = false; fig10tz(); });
  $("#tz3-play")?.addEventListener("click", () => { TZ3.play = !TZ3.play; if (TZ3.play && TZ3.i >= TZ3D.length - 1) TZ3.i = 0; fig10tz(); });
  SCHED.add(() => {
    if (!TZ3.play || !isOn($("#tz3-a"))) return; const now = performance.now(); if (now - TZ3.last < 140) return; TZ3.last = now;
    if (TZ3.i >= TZ3D.length - 1) { if (++TZ3.hold < 18) return; TZ3.hold = 0; TZ3.i = 0; } else TZ3.i++;
    fig10tz();
  });
  watch($("#tz3-a"));

  // ============================================================ Figure 20: thermodynamic integration and WBIC
  const WB = { k: "cusp", n: 4, cache: {} };
  const WBK = { bowl: [(a, b) => a * a + b * b, 1, "1"], prod: [(a, b) => (a * b) ** 2, 0.5, "1/2"], cusp: [(a, b) => (b * b - a * a * a) ** 2, 5 / 12, "5/12"] };
  function wbCompute(k, n) {
    const key = k + n; if (WB.cache[key]) return WB.cache[key];
    const N = 300, f = WBK[k][0], Ks = new Float64Array(N * N), Ws = new Float64Array(N * N), us = [], ws = [];
    for (let i = 0; i < N; i++) { const u = -1 + (i + 0.5) * 2 / N; us.push(u * u * u); ws.push(3 * u * u / N); }
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) { Ks[i * N + j] = f(us[i], us[j]); Ws[i * N + j] = ws[i] * ws[j]; }
    const nn = Math.pow(10, n), lo = Math.log10(1e-2 / nn), M = 140, curve = [];
    const Eb = (beta) => { let z = 0, e = 0; for (let q = 0; q < N * N; q++) { const w = Ws[q] * Math.exp(-nn * beta * Ks[q]); z += w; e += w * nn * Ks[q]; } return e / z; };
    for (let m = 0; m <= M; m++) { const lb = lo + (0 - lo) * m / M, beta = Math.pow(10, lb); curve.push([lb, beta * Eb(beta)]); }
    let z1 = 0; for (let q = 0; q < N * N; q++) z1 += Ws[q] * Math.exp(-nn * Ks[q]);
    const bs = 1 / Math.log(nn), wbic = Eb(bs);
    return (WB.cache[key] = { curve, F: -Math.log(z1), wbic, bs, lo, nn });
  }
  function fig18wb() { if (!$("#wb-plot")) return;
    const R = wbCompute(WB.k, WB.n), lam = WBK[WB.k][1], ln = Math.log(R.nn);
    const ymax = Math.max(1.35, ...R.curve.map((p) => p[1])) * 1.12, svg = $("#wb-plot");
    const xt = []; for (let v = Math.ceil(R.lo); v <= 0; v++) if (!(svg.getBoundingClientRect().width < 520) || v % 2 === 0) xt.push([v, v === 0 ? "1" : "10" + sup(v)]);
    const narrow = svg.getBoundingClientRect().width < 520, F = learningFrame(svg, { W: narrow ? 420 : 760, H: narrow ? 320 : 300, l: 46, r: 14, t: 14, b: 44, xr: [R.lo, 0], yr: [0, ymax], xt, yt: [0, 0.5, 1].filter((v) => v < ymax).map((v) => [v, String(v)]), xlab: "inverse temperature β (log scale)", ylab: "β · E_β[nK]" });
    const xs = Math.log10(R.bs), hs = R.bs * R.wbic;
    E("path", { d: pathD([[R.lo, 0], ...R.curve, [0, 0]], F.X, F.Y) + "Z", fill: C.blow, "fill-opacity": 0.16 }, F.g);
    E("rect", { x: F.X(-WB.n), y: F.Y(hs), width: F.X(0) - F.X(-WB.n), height: F.Y(0) - F.Y(hs), fill: "none", stroke: C.hot, "stroke-width": 2.2, "stroke-dasharray": "6 4" }, F.g);
    E("path", { d: pathD(R.curve, F.X, F.Y), fill: "none", stroke: C.blow, "stroke-width": 2.6 }, F.g);
    E("line", { x1: F.X(R.lo), x2: F.X(0), y1: F.Y(lam), y2: F.Y(lam), stroke: C.ink, "stroke-width": 1.2, "stroke-dasharray": "2 4" }, F.g);
    E("line", { x1: F.X(xs), x2: F.X(xs), y1: F.Y(0), y2: F.Y(hs), stroke: C.hot, "stroke-width": 1.4 }, F.g);
    E("circle", { cx: F.X(xs), cy: F.Y(hs), r: 5, fill: C.hot }, F.g);
    T(svg, F.X(xs) + (narrow ? -8 : 8), F.Y(hs) - 10, "β* = 1/log n", C.hot, { st: ";font-weight:700", at: narrow ? { "text-anchor": "end" } : {} });
    T(svg, F.X(R.lo) + 8, F.Y(lam) - 6, `λ = ${WBK[WB.k][2]}`, C.ink, { st: ";font-weight:600" });
    T(svg, F.X(-WB.n) + 6, F.y1 - 8, "width log₁₀ n", C.hot);
    $("#wb-n-out").textContent = "10" + sup(WB.n);
    $("#wb-chips").innerHTML = `<span class="chip v">F = −log Z = <b>${R.F.toFixed(2)}</b></span><span class="chip">WBIC = <b>${R.wbic.toFixed(2)}</b></span><span class="chip">λ log n${WB.k === "prod" ? " − log log n" : ""} = <b>${(lam * ln - (WB.k === "prod" ? Math.log(ln) : 0)).toFixed(2)}</b></span><span class="chip">plateau height at β*, the thermometer's reading: <b>${hs.toFixed(2)}</b></span>`;
  }
  seg("#wb-k", (v) => { WB.k = v; fig18wb(); });
  $("#wb-n")?.addEventListener("input", (e) => { WB.n = +e.target.value; fig18wb(); });


  // ============================================================ shared: exact sampling from a gridded density
  function gridSampler(logp, xr, yr, g) {
    const cdf = new Float64Array(g * g); let mx = -Infinity; const lp = new Float64Array(g * g);
    for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) { const x = xr[0] + (xr[1] - xr[0]) * (i + 0.5) / g, y = yr[0] + (yr[1] - yr[0]) * (j + 0.5) / g, v = logp(x, y); lp[j * g + i] = v; if (v > mx) mx = v; }
    let acc = 0; for (let q = 0; q < g * g; q++) { acc += Math.exp(lp[q] - mx); cdf[q] = acc; }
    return (r) => { const u = r() * acc; let lo = 0, hi = g * g - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cdf[m] < u) lo = m + 1; else hi = m; } const i = lo % g, j = (lo / g) | 0; return [xr[0] + (xr[1] - xr[0]) * (i + r()) / g, yr[0] + (yr[1] - yr[0]) * (j + r()) / g]; };
  }
  const RND = seeded(99);

  // ============================================================ teaser for Part III: two perfect fits
  const TW = { ln: 0.6, pts: [], samp: null, curve: null, P1: [-0.45, 0], P2: [0.45, 0], R: 0.3 };
  const twK = (x, y) => { const r1 = (x - TW.P1[0]) ** 2 + (y - TW.P1[1]) ** 2, r2 = (x - TW.P2[0]) ** 2 + (y - TW.P2[1]) ** 2; return r1 * r2 * r2 / 9; };
  const twRegion = (x, y) => Math.hypot(x - TW.P1[0], y - TW.P1[1]) < TW.R ? 1 : Math.hypot(x - TW.P2[0], y - TW.P2[1]) < TW.R ? 2 : 0;
  function twShares(n) { const g = 320; let z = 0, z1 = 0, z2 = 0; for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) { const x = -1 + 2 * (i + 0.5) / g, y = -1 + 2 * (j + 0.5) / g, w = Math.exp(-n * twK(x, y)), k = twRegion(x, y); z += w; if (k === 1) z1 += w; else if (k === 2) z2 += w; } return [z1 / z, z2 / z]; }
  function twResample() { const n = Math.pow(10, TW.ln); TW.samp = gridSampler((x, y) => -n * twK(x, y), [-1, 1], [-1, 1], 260); TW.pts = []; for (let k = 0; k < 900; k++) TW.pts.push(TW.samp(RND)); }
  function figTw() { if (!$("#tw-cv")) return;
    if (!TW.curve) { TW.curve = []; for (let l = 0; l <= 4.001; l += 0.1) TW.curve.push([l, ...twShares(Math.pow(10, l))]); }
    if (!TW.samp) twResample();
    const n = Math.pow(10, TW.ln), cv = $("#tw-cv"), { ctx, W, H, d } = cvs(cv);
    if (!TW.off || TW.offKey !== (isDark() ? "d" : "l")) {
      const g = 160, img = new ImageData(g, g), lut = LUT();
      for (let j = 0; j < g; j++) for (let i = 0; i < g; i++) { const x = -1 + 2 * (i + 0.5) / g, y = 1 - 2 * (j + 0.5) / g, v = Math.exp(-40 * twK(x, y)), col = lut[Math.round(clamp(v, 0, 1) * 255 * 0.32)], o = 4 * (j * g + i); img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255; }
      TW.off = document.createElement("canvas"); TW.off.width = g; TW.off.height = g; TW.off.getContext("2d").putImageData(img, 0, 0); TW.offKey = (isDark() ? "d" : "l");
    }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(TW.off, 0, 0, W, H);
    const MX = (x) => (x + 1) / 2 * W, MY = (y) => (1 - y) / 2 * H;
    const cols = [C.muted, C.cold, C.hot];
    TW.pts.forEach(([x, y]) => { ctx.fillStyle = cols[twRegion(x, y)]; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(MX(x), MY(y), 2.1 * d, 0, 2 * Math.PI); ctx.fill(); });
    ctx.globalAlpha = 1;
    [[TW.P1, C.cold, "quadratic fit"], [TW.P2, C.hot, "quartic fit"]].forEach(([p, col, lab]) => {
      ctx.strokeStyle = col; ctx.lineWidth = 2 * d; ctx.setLineDash([5 * d, 4 * d]); ctx.beginPath(); ctx.arc(MX(p[0]), MY(p[1]), TW.R / 2 * W, 0, 2 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
      ctx.font = `700 ${12.5 * d}px "Schibsted Grotesk", sans-serif`; ctx.textAlign = "center"; ctx.lineWidth = 3 * d; ctx.strokeStyle = C.surface; const ty = MY(p[1]) - TW.R / 2 * H - 8 * d; ctx.strokeText(lab, MX(p[0]), ty); ctx.fillStyle = col; ctx.fillText(lab, MX(p[0]), ty);
    });
    ctx.textAlign = "start";
    const svg = $("#tw-plot"), cur = TW.curve, F = learningFrame(svg, { W: 360, H: 280, l: 44, r: 12, t: 14, b: 42, xr: [0, 4], yr: [0, 1], xt: [0, 1, 2, 3, 4].map((v) => [v, v ? "10" + sup(v) : "1"]), yt: [[0, "0"], [0.5, "50%"], [1, "100%"]], xlab: "data points n" });
    E("path", { d: pathD(cur.map((p) => [p[0], p[1]]), F.X, F.Y), fill: "none", stroke: C.cold, "stroke-width": 2.8 }, F.g);
    E("path", { d: pathD(cur.map((p) => [p[0], p[2]]), F.X, F.Y), fill: "none", stroke: C.hot, "stroke-width": 2.8 }, F.g);
    E("line", { x1: F.X(TW.ln), x2: F.X(TW.ln), y1: F.y0, y2: F.y1, stroke: C.muted, "stroke-dasharray": "3 3" }, F.g);
    if (TW.shKey !== TW.ln) { TW.sh = twShares(n); TW.shKey = TW.ln; }
    const sh = TW.sh;
    E("circle", { cx: F.X(TW.ln), cy: F.Y(sh[0]), r: 5, fill: C.cold }, F.g); E("circle", { cx: F.X(TW.ln), cy: F.Y(sh[1]), r: 5, fill: C.hot }, F.g);
    $("#tw-n-out").textContent = "n = " + Math.round(n).toLocaleString();
    $("#tw-chips").innerHTML = `<span class="chip">near the regular fit <b>${Math.round(100 * sh[0])}%</b></span><span class="chip v">near the degenerate fit <b>${Math.round(100 * sh[1])}%</b></span><span class="chip">elsewhere <b>${Math.max(0, Math.round(100 * (1 - sh[0] - sh[1])))}%</b></span>`;
  }
  $("#tw-n")?.addEventListener("input", (e) => { TW.ln = +e.target.value; twResample(); figTw(); });
  watch($("#tw-cv"));
  let twLast = 0;
  SCHED.add((now) => { if (!TW.samp || !isOn($("#tw-cv")) || now - twLast < 60) return; twLast = now; for (let k = 0; k < 25; k++) TW.pts[Math.floor(RND() * TW.pts.length)] = TW.samp(RND); figTw(); });

  // ============================================================ Figure 22: SLT Tensor Collision & Normal Crossing
  const SLT = { ln: 2.5 };
  function figSltTensor() {
    if (!$("#slt-cv")) return;
    const n = Math.pow(10, SLT.ln);
    const cv = $("#slt-cv"), { ctx, W, H, d } = cvs(cv);
    const g = 180, img = new ImageData(g, g), lut = LUT();
    for (let j = 0; j < g; j++) {
      for (let i = 0; i < g; i++) {
        const th = (i + 0.5) / g;
        const u = 1 - (j + 0.5) / g;
        const K = (th * u) ** 2;
        const v = Math.exp(-n * K);
        const col = lut[Math.round(clamp(v, 0, 1) * 255 * 0.9)];
        const o = 4 * (j * g + i);
        img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
      }
    }
    const off = document.createElement("canvas");
    off.width = g; off.height = g;
    off.getContext("2d").putImageData(img, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(off, 0, 0, W, H);

    // Divisor axis lines
    ctx.strokeStyle = C.blow; ctx.lineWidth = 3 * d;
    ctx.beginPath(); ctx.moveTo(0, H); ctx.lineTo(W, H); ctx.stroke(); // u = 0
    ctx.strokeStyle = C.bad; ctx.lineWidth = 3 * d;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, H); ctx.stroke(); // θ = 0

    ctx.font = `700 ${11 * d}px "JetBrains Mono", monospace`;
    ctx.fillStyle = C.bad; ctx.fillText("θ = 0", 8 * d, 18 * d);
    ctx.fillStyle = C.blow; ctx.fillText("u = 0", W - 110 * d, H - 8 * d);

    const svg = $("#slt-plot");
    if (svg) {
      const F = learningFrame(svg, { W: 360, H: 280, l: 48, r: 14, t: 14, b: 42, xr: [1, 4.2], yr: [-9.5, 0], xt: [1, 2, 3, 4].map(v => [v, "10" + sup(v)]), yt: [[0, "1"], [-3, "10⁻³"], [-6, "10⁻⁶"], [-9, "10⁻⁹"]], xlab: "concentration N", ylab: "evidence Z(N)" });
      if (!SLT.curves) SLT.curves = Array.from({length:65}, (_,i) => { const l=1+i*.05; return [l,crossingEvidence(10**l)]; });
      for (const [key, color, dash] of [["regular4", C.steel, "5 4"], ["regular3", C.cold, ""], ["crossing4", C.hot, ""]]) {
        const pts = SLT.curves.map(([l,z]) => [l,Math.log10(z[key])]);
        E("path", { d:pathD(pts,F.X,F.Y), fill:"none",stroke:color,"stroke-width":key==="crossing4"?3:2,"stroke-dasharray":dash },F.g);
      }
      E("line", { x1:F.X(SLT.ln),x2:F.X(SLT.ln),y1:F.y0,y2:F.y1,stroke:C.muted,"stroke-dasharray":"2 3" }, F.g);
    }
    const current = crossingEvidence(n);
    $("#slt-n-out").textContent = "N = " + Math.round(n).toLocaleString();
    $("#slt-chips").innerHTML = `<span class="chip v">Full toy: <b>λ = 3/2, m = 2</b></span><span class="chip">Crossing factor alone: <b>λ = 1/2, m = 2</b></span><span class="chip">Computed evidence <b>${current.crossing4.toExponential(3)}</b></span>`;
  }

  $("#slt-n")?.addEventListener("input", (e) => { SLT.ln = +e.target.value; figSltTensor(); });
  watch($("#slt-cv"), () => figSltTensor());

  window.__draw4 = () => { fig12(); fig13(); fig17(); fig19(); fig15nn(); fig19ln(); fig10tz(); fig18wb(); figTw(); figSltTensor(); };
})();

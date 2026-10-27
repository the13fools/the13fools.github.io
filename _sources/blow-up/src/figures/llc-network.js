// The original deterministic linear-network experiment, isolated so sampling
// can run in a worker without blocking layout, scrolling, or controls.
const seeded = (s) => () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const gauss = (r) => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
export function lnRun(H, gam, seed, progress = () => {}) {
    const r = seeded(seed), M = 3, N = 3, n = 1000, Wt = [[1, 0, 0], [0, 0, 0], [0, 0, 0]];
    const Sxx = [...Array(M)].map(() => Array(M).fill(0)), Syx = [...Array(N)].map(() => Array(M).fill(0)); let Syy = 0;
    const r0 = seeded(4242);
    for (let k = 0; k < n; k++) { const x = [gauss(r0), gauss(r0), gauss(r0)], y = Wt.map((row) => row.reduce((s, v, j) => s + v * x[j], 0) + gauss(r0)); for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) Sxx[i][j] += x[i] * x[j] / n; for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) Syx[i][j] += y[i] * x[j] / n; Syy += y.reduce((s, v) => s + v * v, 0) / n; }
    const P = H * M + N * H, gw = new Float64Array(P), Wm = [...Array(N)].map(() => new Float64Array(M)), G = [...Array(N)].map(() => new Float64Array(M));
    const loss = (w) => {
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { let s = 0; for (let h = 0; h < H; h++) s += w[H * M + i * H + h] * w[h * M + j]; Wm[i][j] = s; }
      let L = 0.5 * Syy; for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { L -= Wm[i][j] * Syx[i][j]; for (let k = 0; k < M; k++) L += 0.5 * Wm[i][j] * Wm[i][k] * Sxx[j][k]; }
      for (let i = 0; i < N; i++) for (let j = 0; j < M; j++) { let s = -Syx[i][j]; for (let k = 0; k < M; k++) s += Wm[i][k] * Sxx[k][j]; G[i][j] = s; }
      for (let h = 0; h < H; h++) for (let j = 0; j < M; j++) { let s = 0; for (let i = 0; i < N; i++) s += w[H * M + i * H + h] * G[i][j]; gw[h * M + j] = s; }
      for (let i = 0; i < N; i++) for (let h = 0; h < H; h++) { let s = 0; for (let j = 0; j < M; j++) s += G[i][j] * w[h * M + j]; gw[H * M + i * H + h] = s; }
      return L;
    };
    progress("training", 0);
    const w = new Float64Array(P); for (let q = 0; q < P; q++) w[q] = 0.1 * gauss(r);
    for (let it = 0; it < 20000; it++) { loss(w); for (let q = 0; q < P; q++) w[q] -= 0.05 * gw[q]; }
    const L0 = loss(w), beta = 1 / Math.log(n), eps = 2e-3, chains = 4, steps = 20000; let acc = 0, cnt = 0;
    for (let c = 0; c < chains; c++) { progress("sampling", c + 1); const v = Float64Array.from(w); for (let t = 0; t < steps; t++) { const L = loss(v); for (let q = 0; q < P; q++) v[q] += -0.5 * eps * (n * beta * gw[q] + gam * (v[q] - w[q])) + Math.sqrt(eps) * gauss(r); if (t >= steps / 4) { acc += L; cnt++; } } }
    return n * beta * (acc / cnt - L0);
  }
export function lnExact(H) { const M = 3, N = 3, r = 1; if (N + r <= M + H && M + r <= N + H && H + r <= M + N) { const s = M + H + N + r; return s % 2 === 0 ? (2 * (H + r) * (M + N) - (M - N) ** 2 - (H + r) ** 2) / 8 : (2 * (H + r) * (M + N) - (M - N) ** 2 - (H + r) ** 2 + 1) / 8; } if (M + H < N + r) return (H * M - H * r + N * r) / 2; if (N + H < M + r) return (H * N - H * r + M * r) / 2; return M * N / 2; }

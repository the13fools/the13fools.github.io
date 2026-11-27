// Graph Transport Playground solver, adapted from Wren’s worker (2026-11-20).
// The installer is used to create a worker on HTTPS and in a local file preview.
function installGraphTransportWorker(self) {
  // Graph Transport Playground worker (Wren, 2026-11-20): triangle density on an icosphere, Sinkhorn transport, spring relaxation.
  'use strict';
  const D2R = Math.PI / 180;
  const G = { N: 0, adj: null, mesh: null, nb: null, nbKey: '', kern: null, kernKey: '' };
  const norm3 = (x, y, z) => { const n = Math.hypot(x, y, z) || 1; return [x / n, y / n, z / n]; };

  function icosphere(level) {
    const t = (1 + Math.sqrt(5)) / 2; let V = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(v => norm3(...v));
    let F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
    for (let l = 0; l < level; l++) {
      const mid = new Map(), m = (a, b) => { const k = a < b ? a * 1e6 + b : b * 1e6 + a; let i = mid.get(k); if (i === undefined) { i = V.length; const p = V[a], q = V[b]; V.push(norm3(p[0] + q[0], p[1] + q[1], p[2] + q[2])); mid.set(k, i); } return i; };
      const F2 = []; for (const [a, b, c] of F) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); F2.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } F = F2;
    }
    const M = V.length, Vf = new Float64Array(3 * M); V.forEach((v, i) => Vf.set(v, 3 * i)); const area = new Float64Array(M);
    for (const [a, b, c] of F) { const u = [V[b][0] - V[a][0], V[b][1] - V[a][1], V[b][2] - V[a][2]], w = [V[c][0] - V[a][0], V[c][1] - V[a][1], V[c][2] - V[a][2]];
      const ar = Math.hypot(u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]) / 2; area[a] += ar / 3; area[b] += ar / 3; area[c] += ar / 3; }
    // nearest-vertex lookup on a 1-degree latitude/longitude table
    const lut = new Int32Array(180 * 360);
    for (let a = 0; a < 180; a++) for (let b = 0; b < 360; b++) { const th = (a + .5) * D2R, ph = (b + .5) * D2R, x = Math.sin(th) * Math.cos(ph), y = Math.sin(th) * Math.sin(ph), z = Math.cos(th);
      let bi = 0, bd = -2; for (let q = 0; q < M; q++) { const d = x * Vf[3 * q] + y * Vf[3 * q + 1] + z * Vf[3 * q + 2]; if (d > bd) { bd = d; bi = q; } } lut[a * 360 + b] = bi; }
    return { level, M, V: Vf, F: Uint32Array.from(F.flat()), area, lut };
  }
  function nearest(x, y, z) { const th = Math.acos(Math.max(-1, Math.min(1, z))); let ph = Math.atan2(y, x); if (ph < 0) ph += 2 * Math.PI; return G.mesh.lut[Math.min(179, Math.floor(th / D2R)) * 360 + Math.min(359, Math.floor(ph / D2R))]; }
  function neighbours(rho) {
    const key = G.mesh.level + ':' + rho; if (G.nbKey === key) return G.nb; const { M, V } = G.mesh, c = Math.cos(Math.min(179, rho + 8) * D2R), nb = [];
    for (let q = 0; q < M; q++) { const L = []; for (let p = 0; p < M; p++) if (V[3 * q] * V[3 * p] + V[3 * q + 1] * V[3 * p + 1] + V[3 * q + 2] * V[3 * p + 2] > c) L.push(p); nb.push(Int32Array.from(L)); }
    G.nb = nb; G.nbKey = key; return nb;
  }
  function kernel(sig) {
    const key = G.mesh.level + ':' + sig; if (G.kernKey === key) return G.kern; const { M, V, area } = G.mesh, cs = Math.cos(Math.min(3 * sig, 179) * D2R), s2 = 2 * (sig * D2R) ** 2, rows = [];
    for (let q = 0; q < M; q++) { const idx = [], w = []; let tw = 0; for (let r = 0; r < M; r++) { const d = V[3 * q] * V[3 * r] + V[3 * q + 1] * V[3 * r + 1] + V[3 * q + 2] * V[3 * r + 2]; if (d > cs) { const th = Math.acos(Math.min(1, d)), ww = Math.exp(-th * th / s2) * area[r]; idx.push(r); w.push(ww); tw += ww; } }
      rows.push([Int32Array.from(idx), Float64Array.from(w.map(x => x / tw))]); }
    G.kern = rows; G.kernKey = key; return rows;
  }

  // small graph triangles (vertices within rho of the centroid) -> count on each mesh vertex they contain -> smoothing -> density
  function density(X, rho, sig, floor) {
    const N = G.N, A = G.adj, { M, V, area } = G.mesh, nb = neighbours(rho), cr = Math.cos(rho * D2R), c2 = Math.cos(Math.min(180, 2 * rho) * D2R), cov = new Float64Array(M); let nT = 0;
    const L = new Int32Array(N);
    for (let i = 0; i < N; i++) {
      const xi = X[3 * i], yi = X[3 * i + 1], zi = X[3 * i + 2]; let nl = 0;
      for (let j = i + 1; j < N; j++) if (A[i * N + j] && xi * X[3 * j] + yi * X[3 * j + 1] + zi * X[3 * j + 2] > c2) L[nl++] = j;
      for (let a = 0; a < nl; a++) { const j = L[a], xj = X[3 * j], yj = X[3 * j + 1], zj = X[3 * j + 2], row = j * N;
        for (let b = a + 1; b < nl; b++) { const l = L[b]; if (!A[row + l]) continue; const xl = X[3 * l], yl = X[3 * l + 1], zl = X[3 * l + 2];
          let cx = xi + xj + xl, cy = yi + yj + yl, cz = zi + zj + zl; const cn = Math.hypot(cx, cy, cz); if (cn < 1e-9) continue; cx /= cn; cy /= cn; cz /= cn;
          if (xi * cx + yi * cy + zi * cz < cr || xj * cx + yj * cy + zj * cz < cr || xl * cx + yl * cy + zl * cz < cr) continue; nT++;
          const n1x = yi * zj - zi * yj, n1y = zi * xj - xi * zj, n1z = xi * yj - yi * xj, n2x = yj * zl - zj * yl, n2y = zj * xl - xj * zl, n2z = xj * yl - yj * xl, n3x = yl * zi - zl * yi, n3y = zl * xi - xl * zi, n3z = xl * yi - yl * xi;
          const sg = (n1x * xl + n1y * yl + n1z * zl) >= 0 ? 1 : -1;
          for (const q of nb[nearest(cx, cy, cz)]) { const px = V[3 * q], py = V[3 * q + 1], pz = V[3 * q + 2]; if (px * cx + py * cy + pz * cz < cr) continue;
            if (sg * (n1x * px + n1y * py + n1z * pz) >= 0 && sg * (n2x * px + n2y * py + n2z * pz) >= 0 && sg * (n3x * px + n3y * py + n3z * pz) >= 0) cov[q]++; } } }
    }
    let sm = cov; if (sig > 0) { const K = kernel(sig); sm = new Float64Array(M); for (let q = 0; q < M; q++) { const [idx, w] = K[q]; let s = 0; for (let t = 0; t < idx.length; t++) s += w[t] * cov[idx[t]]; sm[q] = s; } }
    // v4 (user: "the transport has a constant small background density"): nu = (1 - beta) * counts + beta * uniform, each normalised by mass;
    // 'floor' now carries beta, the background share of the mass (with no counted triangles the target is uniform)
    let cm = 0, am = 0; for (let q = 0; q < M; q++) { cm += sm[q] * area[q]; am += area[q]; } const nu = new Float64Array(M), beta = cm > 0 ? floor : 1;
    for (let q = 0; q < M; q++) nu[q] = (cm > 0 ? (1 - beta) * sm[q] * area[q] / cm : 0) + beta * area[q] / am;
    return { sm, nu, nT };
  }
  function sinkhorn(X, nu, eps, iters) {
    const N = G.N, { M, V } = G.mesh, K = new Float64Array(N * M);
    for (let i = 0; i < N; i++) { const xi = X[3 * i], yi = X[3 * i + 1], zi = X[3 * i + 2], o = i * M; for (let q = 0; q < M; q++) K[o + q] = Math.exp(-Math.max(0, 2 - 2 * (xi * V[3 * q] + yi * V[3 * q + 1] + zi * V[3 * q + 2])) / eps); }
    const u = new Float64Array(N).fill(1), v = new Float64Array(M).fill(1), a = 1 / N, tmp = new Float64Array(M);
    for (let t = 0; t < iters; t++) {
      for (let i = 0; i < N; i++) { let s = 0; const o = i * M; for (let q = 0; q < M; q++) s += K[o + q] * v[q]; u[i] = a / (s + 1e-300); }
      tmp.fill(0); for (let i = 0; i < N; i++) { const o = i * M, ui = u[i]; for (let q = 0; q < M; q++) tmp[q] += K[o + q] * ui; } for (let q = 0; q < M; q++) v[q] = nu[q] / (tmp[q] + 1e-300);
    }
    const Y = new Float64Array(3 * N); let cost = 0;
    for (let i = 0; i < N; i++) { let x = 0, y = 0, z = 0, m = 0; const o = i * M; for (let q = 0; q < M; q++) { const w = u[i] * K[o + q] * v[q]; x += w * V[3 * q]; y += w * V[3 * q + 1]; z += w * V[3 * q + 2]; m += w; cost += w * Math.max(0, 2 - 2 * (X[3 * i] * V[3 * q] + X[3 * i + 1] * V[3 * q + 1] + X[3 * i + 2] * V[3 * q + 2])); }
      // a row whose kernel underflowed (far from every mesh vertex at small eps) gives m = 0 or a non-finite sum: keep the point where it is
      Y.set(m > 0 && isFinite(x + y + z) ? norm3(x, y, z) : [X[3 * i], X[3 * i + 1], X[3 * i + 2]], 3 * i); }
    return { Y, cost };
  }
  // pair energies, theta = angle between the two points:
  //  'layout'    edges: 1/2 k (theta - eps)^2 (Hookean spring);  non-edges: c exp(-theta^2 / 2 s^2) (Gaussian repulsion)
  //  'hooke'     1/2 k (theta - eps)^2 on the chosen pairs (edges / all / marked)
  //  'threshold' edges: 1/2 k max(0, theta - eps)^2;  non-edges: 1/2 k max(0, eps - theta)^2 (a thresholded-similarity embedding, cf. Saul et al. 2026)
  function springGrad(X, Gr, p) {
    const N = G.N, A = G.adj, eps = p.rest * D2R, k = p.stiff, rc = p.repC, rs2 = 2 * (p.repS * D2R) ** 2; let E = 0; Gr.fill(0);
    for (let i = 0; i < N; i++) { const xi = X[3 * i], yi = X[3 * i + 1], zi = X[3 * i + 2];
      for (let j = i + 1; j < N; j++) { const e = A[i * N + j]; let g;  // g = dE/dtheta for this pair
        const c = Math.max(-1, Math.min(1, xi * X[3 * j] + yi * X[3 * j + 1] + zi * X[3 * j + 2])), th = Math.acos(c);
        if (p.kind === 'layout') { if (e) { const d = th - eps; E += .5 * k * d * d; g = k * d; } else { const w = rc * Math.exp(-th * th / rs2); if (w < 1e-12) continue; E += w; g = -w * 2 * th / rs2; } }
        else if (p.kind === 'threshold') { const d = e ? Math.max(0, th - eps) : Math.min(0, th - eps); if (d === 0) continue; E += .5 * k * d * d; g = k * d; }
        else { if (p.pairs === 'edges' && !e) continue; if (p.pairs === 'marked' && !(G.mark[i] && G.mark[j])) continue; const d = th - eps; E += .5 * k * d * d; g = k * d; }
        const s = Math.sqrt(Math.max(1 - c * c, 1e-12)), f = g / s;
        Gr[3 * i] -= f * (X[3 * j] - c * xi); Gr[3 * i + 1] -= f * (X[3 * j + 1] - c * yi); Gr[3 * i + 2] -= f * (X[3 * j + 2] - c * zi);
        Gr[3 * j] -= f * (xi - c * X[3 * j]); Gr[3 * j + 1] -= f * (yi - c * X[3 * j + 1]); Gr[3 * j + 2] -= f * (zi - c * X[3 * j + 2]); } }
    return E;
  }
  // triangle family terms over all triples, m = number of edges among the triple, chord-triangle areas (as in the Degree-Matched Lab):
  //   (mu2 / n) sum f2[m] area^2   and   (mu1 / n) sum f1[m] area
  // 16 area^2 = 2 (d1 d2 + d1 d3 + d2 d3) - d1^2 - d2^2 - d3^2 with d = squared chord lengths; the gradient goes through dE/dd per pair, then dd_ij/dx_i = -2 x_j.
  function famGrad(X, Gr, p) {
    const N = G.N, A = G.adj, f2 = p.f2, f1 = p.f1, s2 = p.mu2 / N, s1 = p.mu1 / N; if (!s2 && !s1) return 0;
    // v6: optional locality cutoff (user's page was taking minutes per cycle at n 800): only triples whose three pairs are all within p.triCut degrees
    const cut = p.triCut == null ? 180 : p.triCut, dmax = cut >= 180 ? 5 : 2 - 2 * Math.cos(cut * D2R);
    const d = new Float64Array(N * N), dD = new Float64Array(N * N); let E = 0; const near = [];
    for (let i = 0; i < N; i++) { const L = []; for (let j = i + 1; j < N; j++) { const v = Math.max(0, 2 - 2 * (X[3 * i] * X[3 * j] + X[3 * i + 1] * X[3 * j + 1] + X[3 * i + 2] * X[3 * j + 2])); d[i * N + j] = v; if (v <= dmax) L.push(j); } near.push(L); }
    for (let a = 0; a < N; a++) { const La = near[a]; for (let ib = 0; ib < La.length; ib++) { const b = La[ib], ab = a * N + b, d1 = d[ab], eab = A[ab];
      for (let ic = ib + 1; ic < La.length; ic++) { const c = La[ic], ac = a * N + c, bc = b * N + c; if (d[bc] > dmax) continue; const m = eab + A[ac] + A[bc], w2 = f2[m] * s2, w1 = f1[m] * s1; if (!w2 && !w1) continue;
        const d2 = d[ac], d3 = d[bc], q = 2 * (d1 * d2 + d1 * d3 + d2 * d3) - d1 * d1 - d2 * d2 - d3 * d3, ar2 = Math.max(q, 0) / 16;
        const p1 = 2 * (d2 + d3 - d1), p2 = 2 * (d1 + d3 - d2), p3 = 2 * (d1 + d2 - d3); let g = 0;
        if (w2) { E += w2 * ar2; g += w2 / 16; }
        if (w1) { const ar = Math.sqrt(ar2); E += w1 * ar; if (ar > 1e-9) g += w1 / (32 * ar); }
        if (g && q > 0) { dD[ab] += g * p1; dD[ac] += g * p2; dD[bc] += g * p3; } } } }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const g = dD[i * N + j]; if (!g) continue;
      Gr[3 * i] -= 2 * g * X[3 * j]; Gr[3 * i + 1] -= 2 * g * X[3 * j + 1]; Gr[3 * i + 2] -= 2 * g * X[3 * j + 2];
      Gr[3 * j] -= 2 * g * X[3 * i]; Gr[3 * j + 1] -= 2 * g * X[3 * i + 1]; Gr[3 * j + 2] -= 2 * g * X[3 * i + 2]; }
    return E;
  }
  // v7 (2026-11-21, K420): bounded small-triangle reward  E_T = -W sum over graph triangles G_ab G_ac G_bc,  G = exp(-theta^2 / 2 sig^2)
  //   = -(W / 3) sum_{i<j} H_ij (H^2)_ij with H = A o G; it saturates per triangle instead of vanishing as the triangle shrinks (the area^2 pull does).
  //   dE/dtheta_ij = W A_ij (H^2)_ij G_ij theta_ij / sig^2. Pairs with G < 1e-9 (theta > ~6.4 sig) are skipped.
  function triGrad(X, Gr, p) {
    const N = G.N, A = G.adj, W = p.triW || 0; if (!(W > 0)) return 0; const sg = (p.triSig || 10) * D2R, s2 = 2 * sg * sg, H = new Float64Array(N * N), TH = new Float64Array(N * N), L = [];
    for (let i = 0; i < N; i++) L.push([]);
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { if (!A[i * N + j]) continue; const c = Math.max(-1, Math.min(1, X[3 * i] * X[3 * j] + X[3 * i + 1] * X[3 * j + 1] + X[3 * i + 2] * X[3 * j + 2])), th = Math.acos(c), g = Math.exp(-th * th / s2);
      if (g < 1e-9) continue; H[i * N + j] = H[j * N + i] = g; TH[i * N + j] = th; L[i].push(j); L[j].push(i); }
    let E = 0;
    for (let i = 0; i < N; i++) { const Li = L[i]; for (const j of Li) { if (j < i) continue; let h2 = 0; const row = j * N; for (const k of Li) h2 += H[i * N + k] * H[row + k]; if (!h2) continue;
      const g = H[i * N + j], th = TH[i * N + j]; E -= W / 3 * g * h2; const dEdth = W * h2 * g * th / (sg * sg);
      const xi = X[3 * i], yi = X[3 * i + 1], zi = X[3 * i + 2], c = Math.cos(th), sn = Math.sqrt(Math.max(1 - c * c, 1e-12)), f = dEdth / sn;
      Gr[3 * i] -= f * (X[3 * j] - c * xi); Gr[3 * i + 1] -= f * (X[3 * j + 1] - c * yi); Gr[3 * i + 2] -= f * (X[3 * j + 2] - c * zi);
      Gr[3 * j] -= f * (xi - c * X[3 * j]); Gr[3 * j + 1] -= f * (yi - c * X[3 * j + 1]); Gr[3 * j + 2] -= f * (zi - c * X[3 * j + 2]); } }
    return E;
  }
  // v8 (2026-11-21, user: "f(1) should make the vertex not connected to the other two push away from the edge midpoint, and f(2) the pair not connected
  // from an edge should repel from each other ... make it an energy"):
  //  E1 = w1 sum over edges ab and vertices c adjacent to neither of exp(-phi^2 / 2 s1^2), phi = angle(c, M), M = (a + b) / |a + b|   (pairs with phi > 4 s1 skipped)
  //  E2 = w2 sum over paths a-c-b with ab a non-edge of G(th_ac) G(th_bc) R(th_ab), G = R = exp(-th^2 / 2 s2^2)  = (w2 / 2) tr(Rn H H),
  //       H = A o G (edges), Rn = (1 - A - I) o R (non-edges); entries below 1e-9 (th > ~6.4 s2) are dropped.
  function wedgeGrad(X, Gr, p) {
    const N = G.N, A = G.adj; let E = 0;
    const w1 = p.f1W || 0, w2 = p.f2W || 0;
    if (w1 > 0) { const s1 = (p.f1S || 15) * D2R, s12 = s1 * s1, cmin = Math.cos(Math.min(4 * s1, Math.PI));
      for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) { if (!A[a * N + b]) continue;
        let mx = X[3 * a] + X[3 * b], my = X[3 * a + 1] + X[3 * b + 1], mz = X[3 * a + 2] + X[3 * b + 2]; const mn = Math.hypot(mx, my, mz); if (mn < 1e-9) continue; mx /= mn; my /= mn; mz /= mn;
        for (let c = 0; c < N; c++) { if (c === a || c === b || A[a * N + c] || A[b * N + c]) continue; const xc = X[3 * c], yc = X[3 * c + 1], zc = X[3 * c + 2];
          const u = Math.max(-1, Math.min(1, xc * mx + yc * my + zc * mz)); if (u < cmin) continue; const ph = Math.acos(u), e = w1 * Math.exp(-ph * ph / (2 * s12)); E += e;
          const sn = Math.sqrt(Math.max(1 - u * u, 0)), gu = sn > 1e-9 ? e * ph / (s12 * sn) : e / s12;   // dE/du, u = c . M
          Gr[3 * c] += gu * mx; Gr[3 * c + 1] += gu * my; Gr[3 * c + 2] += gu * mz;
          const tx = gu * (xc - u * mx) / mn, ty = gu * (yc - u * my) / mn, tz = gu * (zc - u * mz) / mn;
          Gr[3 * a] += tx; Gr[3 * a + 1] += ty; Gr[3 * a + 2] += tz; Gr[3 * b] += tx; Gr[3 * b + 1] += ty; Gr[3 * b + 2] += tz; } } }
    if (w2 > 0) { const s2 = (p.f2S || 15) * D2R, s22 = s2 * s2, H = new Float64Array(N * N), R = new Float64Array(N * N), TH = new Float64Array(N * N), LH = [], LR = [];
      for (let i = 0; i < N; i++) { LH.push([]); LR.push([]); }
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) { const c = Math.max(-1, Math.min(1, X[3 * i] * X[3 * j] + X[3 * i + 1] * X[3 * j + 1] + X[3 * i + 2] * X[3 * j + 2])), th = Math.acos(c), g = Math.exp(-th * th / (2 * s22));
        if (g < 1e-9) continue; TH[i * N + j] = TH[j * N + i] = th; if (A[i * N + j]) { H[i * N + j] = H[j * N + i] = g; LH[i].push(j); LH[j].push(i); } else { R[i * N + j] = R[j * N + i] = g; LR[i].push(j); LR[j].push(i); } }
      const pairForce = (i, j, dEdth) => { const th = TH[i * N + j], c = Math.cos(th), sn = Math.sqrt(Math.max(1 - c * c, 1e-12)), f = dEdth / sn, xi = X[3 * i], yi = X[3 * i + 1], zi = X[3 * i + 2];
        Gr[3 * i] -= f * (X[3 * j] - c * xi); Gr[3 * i + 1] -= f * (X[3 * j + 1] - c * yi); Gr[3 * i + 2] -= f * (X[3 * j + 2] - c * zi);
        Gr[3 * j] -= f * (xi - c * X[3 * j]); Gr[3 * j + 1] -= f * (yi - c * X[3 * j + 1]); Gr[3 * j + 2] -= f * (zi - c * X[3 * j + 2]); };
      for (let a = 0; a < N; a++) for (const b of LR[a]) { if (b < a) continue; let h2 = 0; const rb = b * N; for (const k of LH[a]) h2 += H[a * N + k] * H[rb + k]; if (!h2) continue;   // non-edge ab: (H^2)_ab
        const r = R[a * N + b], th = TH[a * N + b]; E += w2 * h2 * r; pairForce(a, b, -w2 * h2 * r * th / s22); }
      for (let x = 0; x < N; x++) for (const y of LH[x]) { if (y < x) continue; let q = 0; const ry = y * N, rx = x * N;   // edge xy: (H Rn)_xy + (H Rn)_yx
        for (const k of LH[x]) q += H[rx + k] * R[k * N + y]; for (const k of LH[y]) q += H[ry + k] * R[k * N + x]; if (!q) continue;
        const g = H[rx + y], th = TH[rx + y]; pairForce(x, y, -w2 * q * g * th / s22); } }
    return E;
  }
  function totalGrad(X, Gr, p) { const E = springGrad(X, Gr, p); return E + famGrad(X, Gr, p) + triGrad(X, Gr, p) + wedgeGrad(X, Gr, p); }
  function relax(X, p, id) {
    const N = G.N, Gr = new Float64Array(3 * N), mm = p.maxMove * D2R; let E = 0;
    for (let t = 0; t < p.steps; t++) {
      E = totalGrad(X, Gr, p); let gm = 0;
      for (let i = 0; i < N; i++) { const gx = Gr[3 * i], gy = Gr[3 * i + 1], gz = Gr[3 * i + 2], dt = gx * X[3 * i] + gy * X[3 * i + 1] + gz * X[3 * i + 2]; Gr[3 * i] = gx - dt * X[3 * i]; Gr[3 * i + 1] = gy - dt * X[3 * i + 1]; Gr[3 * i + 2] = gz - dt * X[3 * i + 2]; gm = Math.max(gm, Math.hypot(Gr[3 * i], Gr[3 * i + 1], Gr[3 * i + 2])); }
      if (!isFinite(gm)) { const bad = []; for (const [nm, f] of [['springs', springGrad], ['area terms', famGrad], ['triangle reward', triGrad], ['one-edge / open-path', wedgeGrad]]) { const T = new Float64Array(3 * N); f(X, T, p); if (T.some(v => !isFinite(v))) bad.push(nm); }
        throw new Error(`non-finite gradient at relaxation step ${t + 1}` + (bad.length ? ` (from: ${bad.join(', ')})` : '') + '; positions kept from the step before'); }
      if (gm < 1e-12) break; const eta = mm / gm;
      for (let i = 0; i < N; i++) X.set(norm3(X[3 * i] - eta * Gr[3 * i], X[3 * i + 1] - eta * Gr[3 * i + 1], X[3 * i + 2] - eta * Gr[3 * i + 2]), 3 * i);
      if (t % p.every === p.every - 1) self.postMessage({ id, frame: X.slice(), E, t: t + 1 });
    }
    return totalGrad(X, Gr, p);
  }

  self.onmessage = (ev) => {
    const m = ev.data, id = m.id;
    try {
      if (m.cmd === 'graph') { G.N = m.N; G.adj = m.adj; G.mark = m.mark; self.postMessage({ id, ok: true }); }
      else if (m.cmd === 'mesh') { if (!G.mesh || G.mesh.level !== m.level) { G.mesh = icosphere(m.level); G.nbKey = ''; G.kernKey = ''; } const { M, V, F } = G.mesh; self.postMessage({ id, M, V: Float32Array.from(V), F }); }
      else if (m.cmd === 'density') { const t0 = Date.now(), r = density(m.X, m.rho, m.sig, m.floor); self.postMessage({ id, sm: r.sm, nu: r.nu, nT: r.nT, ms: Date.now() - t0 }); }
      else if (m.cmd === 'transport') { const t0 = Date.now(), r = sinkhorn(m.X, m.nu, m.eps, m.iters); self.postMessage({ id, Y: r.Y, cost: r.cost, ms: Date.now() - t0 }); }
      else if (m.cmd === 'energy') { const X = Float64Array.from(m.X), Gr = new Float64Array(3 * G.N); self.postMessage({ id, E: totalGrad(X, Gr, m.p), Gr }); }
      else if (m.cmd === 'relax') { const X = Float64Array.from(m.X), E = relax(X, m.p, id); self.postMessage({ id, X, E, done: true }); }
    } catch (e) { self.postMessage({ id, error: String(e && e.stack || e) }); }
  };
}

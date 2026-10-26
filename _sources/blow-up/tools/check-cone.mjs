import assert from "node:assert/strict";
import { coneChartPoint } from "../src/figures/cone-geometry.js";
const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-12, `${a} != ${b}`);
// The sampled chart must satisfy both defining equations and invert the
// blowdown off its exceptional fiber, including the cone's negative nappe.
for (const u of [-1.2, -0.02, 0, 0.02, 1.2]) {
  for (let i = 0; i < 97; i++) {
    const { resolved: [v, w, s], original: [X, Y, Z] } = coneChartPoint(u, 2 * Math.PI * i / 97);
    near(v * v + w * w, 1);
    near(X * X + Y * Y, Z * Z);
    near(s, Z);
    if (u) { near(X / Z, v); near(Y / Z, w); }
    else { near(X, 0); near(Y, 0); near(Z, 0); }
  }
}
// Distinct directions remain distinct in the resolution but map to one apex.
const a = coneChartPoint(0, 0), b = coneChartPoint(0, Math.PI / 2);
assert.notDeepEqual(a.resolved, b.resolved);
for (const p of [a.original, b.original]) p.forEach(x => near(x, 0));
console.log("check-cone: equations, inverse map, and exceptional fiber OK");

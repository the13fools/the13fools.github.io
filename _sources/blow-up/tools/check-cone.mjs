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
// Linked A/B records: old positions coalesce, but direction records and
// the nonzero gradient upstairs persist even at u=0.
const { coneComparison } = await import('../src/figures/cone-geometry.js');
for(const u of [-1.2,-.3,0,.3,1.2])for(const theta of [0,.7,Math.PI]){
  const q=coneComparison(u,theta);
  near(q.originalDistance,Math.SQRT2*Math.abs(u));
  near(q.resolvedDistance,Math.SQRT2);
  near(q.originalGradient,2*Math.SQRT2*Math.abs(u));near(q.resolvedGradient,2);
  for(const p of [q.A,q.B])near(p.resolved[0]*p.original[0]+p.resolved[1]*p.original[1]-p.original[2],0);
}
// The full ambient exceptional plane maps to the center. Only its unit
// circle is the limiting direction set of this cone (strict transform).
const {coneBlowdown,coneDirectionProbe}=await import('../src/figures/cone-geometry.js');
for(const rho of [0,.55,1,1.35])for(const theta of [0,.7,2.4]){
 const q=coneDirectionProbe(rho,theta),[v,w]=q.chart;
 q.original.forEach(x=>near(x,0));near(q.strictResidual,rho*rho-1);
 for(const u of [-.3,.1]){
  const [X,Y,Z]=coneBlowdown([v,w,u]);
  near((X*X+Y*Y-Z*Z)/(u*u),q.strictResidual);
 }
 assert.equal(Math.abs(q.strictResidual)<1e-12,rho===1);
}
console.log('Ambient exceptional plane and strict-cone intersection verified.');

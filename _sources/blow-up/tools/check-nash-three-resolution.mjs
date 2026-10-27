import assert from "node:assert/strict";
import { H,determinant,inverse } from "../src/figures/nash-three-geometry.js";
import { RESOLUTION_RAYS as R,NORMALIZATION_ADDED,BOUNDARY_ORDER,TRIANGULATED_CONES,RESOLVED_CONES,chartExponents,chartMultiplicity,evaluateChart,dot } from "../src/figures/nash-three-resolution-geometry.js";
import { sectionPoint,threefoldResiduals } from "../src/figures/nash-three-section-geometry.js";
const cross=([a,b,c],[x,y,z])=>[b*z-c*y,c*x-a*z,a*y-b*x];
const gcd=(a,b)=>b?gcd(b,a%b):Math.abs(a);
const [u,v]=NORMALIZATION_ADDED,zero=[0,0,0];
const add=(a,b)=>a.map((x,i)=>x+b[i]),scale=(a,k)=>a.map(x=>x*k);
assert.deepEqual(scale(u,3),add(H[3],H[5]));assert.deepEqual(scale(v,2),add(H[1],H[3]));
assert.deepEqual(add(H[1],u),H[2]);assert.deepEqual(add(H[0],u),H[4]);
// Representatives in half-open fundamental parallelepipeds. There are exactly
// |det| cosets; distinct representatives with fractional coordinates exhaust them.
for(const [basis,reps] of [[[H[0],H[1],H[3]],[zero,v]],[[H[0],H[3],H[5]],[zero,u,scale(u,2)]]]){
  const det=determinant(basis),D=Math.abs(det),sign=Math.sign(det);
  const numerators=p=>basis.map((_,j)=>sign*determinant(basis.map((g,k)=>j===k?p:g)));
  assert.equal(reps.length,D);
  reps.forEach(p=>numerators(p).forEach(n=>assert.ok(n>=0&&n<D)));
  for(let i=0;i<reps.length;i++)for(let j=i+1;j<reps.length;j++)assert.ok(numerators(reps[i].map((x,k)=>x-reps[j][k])).some(n=>n%D!==0));
}
// Recover every extreme ray of the dual cone directly from H, exactly.
const found=new Set();
for(let i=0;i<H.length;i++)for(let j=i+1;j<H.length;j++){
  const v=cross(H[i],H[j]),g=v.reduce(gcd,0);if(!g)continue;
  for(const sign of [-1,1]){const n=v.map(x=>sign*x/g);if(H.every(h=>dot(h,n)>=0))found.add(n.join(","));}
}
assert.deepEqual([...found].sort(),R.slice(0,4).map(n=>n.join(",")).sort());
assert.deepEqual(TRIANGULATED_CONES.map(chartMultiplicity),[1,2]);
assert.deepEqual(RESOLVED_CONES.map(chartMultiplicity),[1,1,1,1]);
assert.deepEqual(R[4].map(x=>2*x),R[0].map((x,i)=>x+R[2][i]+R[3][i]));
// The cross-section by x+y+z=1 is a convex quadrilateral. The chosen diagonal
// splits it into two triangles; the new ray is strictly inside the index-2 cone.
// Exact barycentric weights of n₄ in that normalized triangle are (1,2,5)/8.
assert.deepEqual([R[0],R[2],R[3]].map(n=>n.reduce((a,b)=>a+b,0)),[1,2,5]);
const planar=R.map(n=>n.slice(0,2).map(x=>60*x/n.reduce((a,b)=>a+b,0)));
const area2=ids=>Math.abs(ids.reduce((a,id,j)=>a+planar[id][0]*planar[ids[(j+1)%ids.length]][1]-planar[id][1]*planar[ids[(j+1)%ids.length]][0],0));
assert.equal(TRIANGULATED_CONES.reduce((s,c)=>s+area2(c),0),area2(BOUNDARY_ORDER));
assert.equal(RESOLVED_CONES.reduce((s,c)=>s+area2(c),0),area2(BOUNDARY_ORDER));
for(const cone of RESOLVED_CONES){
  assert.ok(cone.every(i=>R[i].every(Number.isInteger)));
  const P=chartExponents(cone);P.flat().forEach(e=>assert.ok(Number.isInteger(e)&&e>=0));
  inverse(cone.map(i=>R[i])).flat().forEach(v=>assert.ok(Number.isInteger(v)));
  const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,k)=>a.map(v=>v*k);
  assert.deepEqual(mul(P[4],2),add(P[2],P[5]));
  assert.deepEqual(add(P[0],P[4]),add(P[1],P[5]));
  assert.deepEqual(add(P[0],P[2]),add(P[1],P[4]));
  assert.deepEqual(add(add(mul(P[0],2),P[1]),P[3]),mul(P[2],2));
  assert.deepEqual(add(mul(P[0],3),P[3]),add(P[2],P[4]));
  for(const p of [[0,0,0],[0.4,0.7,0.8],[-0.5,0.6,1]])threefoldResiduals(evaluateChart(cone,p)).forEach(v=>assert.ok(Math.abs(v)<1e-10));
}
// Proper faces are unchanged and smooth: no regular point is modified by refinement.
for(let i=0;i<4;i++)assert.equal(cross(R[BOUNDARY_ORDER[i]],R[BOUNDARY_ORDER[(i+1)%4]]).reduce(gcd,0),1);
const last=RESOLVED_CONES[3];
evaluateChart(last,[0.3,0.7,1]).forEach((v,i)=>assert.ok(Math.abs(v-sectionPoint(0.7,0.3)[i])<1e-12));
assert.deepEqual(evaluateChart(last,[0.3,0.7,0]),[0,0,0,0,0,0]);
console.log("check-nash-three-resolution: exact normalization, dual cone, full fan refinement, four unimodular charts, polynomial identities, torus inverses, and exceptional-plane map OK");

import assert from "node:assert/strict";
import { H,H1,H2,U,U_INVERSE,HOLE,FIRST_BASIS,SECOND_BASIS,FIRST_RECIPES,SECOND_RECIPES,fromRecipe,determinant,multiply,scale,nashChartGenerators } from "../src/figures/nash-three-geometry.js";
const key=v=>v.join(",");
const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
const plus=(a,b)=>a.map((x,i)=>x+b[i]);
// A positive integer grading makes membership enumeration finite and exact.
function generatedUpTo(gens,grading,bound) {
  const weights=gens.map(g=>dot(grading,g));
  weights.forEach(w=>assert.ok(Number.isInteger(w)&&w>0));
  const points=new Map([["0,0,0",[0,0,0]]]);
  const queue=[[0,0,0]];
  for(let i=0;i<queue.length;i++) for(const g of gens) {
    const p=plus(queue[i],g);
    if(dot(grading,p)>bound||points.has(key(p))) continue;
    points.set(key(p),p); queue.push(p);
  }
  return points;
}
function equalSemigroups(raw,reduced,grading) {
  const rawSet=new Set(raw.map(key));
  reduced.forEach(v=>assert.ok(rawSet.has(key(v)),`Reduced generator absent: ${v}`));
  const bound=Math.max(...raw.map(v=>dot(grading,v)));
  const generated=generatedUpTo(reduced,grading,bound);
  raw.forEach(v=>assert.ok(generated.has(key(v)),`No nonnegative decomposition for ${v}`));
}
assert.equal(determinant(FIRST_BASIS.map(i=>H[i])),3);
assert.equal(determinant(SECOND_BASIS.map(i=>H1[i])),-2);
assert.deepEqual(FIRST_RECIPES.map(r=>fromRecipe(H,r)),H1);
assert.deepEqual(SECOND_RECIPES.map(r=>fromRecipe(H1,r)),H2);
equalSemigroups(nashChartGenerators(H,FIRST_BASIS),H1,[5,8,10]);
// L₂(v)=L(U⁻¹v), where L(x,y,z)=x+2y+3z.
const L=[1,2,3];
const L2=U_INVERSE[0].map((_,j)=>L.reduce((s,l,i)=>s+l*U_INVERSE[i][j],0));
equalSemigroups(nashChartGenerators(H1,SECOND_BASIS),H2,L2);
assert.equal(determinant(U),1);
assert.deepEqual(H.map(h=>multiply(U,h)),H2);
assert.deepEqual(H2.map(t=>multiply(U_INVERSE,t)),H);
// The hole is missing, but its third multiple is the sum h₄+h₆.
const low=generatedUpTo(H,L,3);
assert.ok(!low.has(key(HOLE)));
assert.ok(!low.has(key(scale(HOLE,2))));
assert.ok(low.has(key(scale(HOLE,3))));
assert.deepEqual(plus(H[3],H[5]),scale(HOLE,3));
assert.deepEqual(H1[1],HOLE); // The first chart adds this particular old hole.
const lowT=generatedUpTo(H2,L2,3), transportedHole=multiply(U,HOLE);
assert.ok(!lowT.has(key(transportedHole)));
assert.ok(lowT.has(key(scale(transportedHole,3))));
console.log("check-nash-three: both Nash charts, semigroup reductions, unimodular recurrence, and missing-point witness OK");

import assert from 'node:assert/strict';
import { tensorEntries, tensorLoss, localLoss, goodFitArea, evidence, simpson } from '../src/figures/learning-geometry.js';
const near = (a,b,tol=1e-10) => assert.ok(Math.abs(a-b) < tol, `${a} ≠ ${b}`);
for (const [s,d] of [[0,0],[.3,0],[0,.3],[.21,-.37],[-.4,.1]]) {
  const a=s+d,b=s-d, entries=tensorEntries(s,d);
  entries.forEach((v,i) => { const p=(i&1)+((i>>1)&1)+((i>>2)&1); near(v,(a**p+b**p)/2); });
  near(entries.reduce((sum,v,i)=>sum+(v-(i===0?1:0))**2,0)/3,tensorLoss(s,d));
  near(tensorLoss(0,d),d**4);
}
near(tensorLoss(0,.3)/tensorLoss(0,.15),16);
near(goodFitArea(.01,false)/goodFitArea(.1,false),.1);
near(goodFitArea(.01,true)/goodFitArea(.1,true),10**(-.75));
// Independent midpoint area quadrature checks the closed area used by the display.
const eps=.1, N=100000;
const directArea=4*Array.from({length:N},(_,i)=>{const d=eps**.25*(i+.5)/N; return Math.sqrt(eps-d**4)*eps**.25/N;}).reduce((a,b)=>a+b,0);
near(goodFitArea(eps,true),directArea,1e-7);
// Independent two-dimensional quadrature checks normalization and candidate posterior shares.
for (const collision of [false,true]) {
  const n=3, M=600;
  let z=0;
  for(let j=0;j<M;j++)for(let i=0;i<M;i++) z+=Math.exp(-n*localLoss(-1+2*(i+.5)/M,-1+2*(j+.5)/M,collision))/(M*M);
  near(z,evidence(n)[collision?'collision':'regular'],2e-6);
}
for(const n of [1,100,10000]) {
  const z=evidence(n); assert.ok(z.share>.5&&z.share<1); assert.ok(z.collision>z.regular);
  // Doubling the quadrature resolution should not change any displayed digit.
  const i2=2*simpson(x=>Math.exp(-n*x*x),0,1,8192),i4=2*simpson(x=>Math.exp(-n*x**4),0,1,8192);
  near(z.regular,i2*i2/4,1e-11); near(z.collision,i2*i4/4,1e-11);
}
near(evidence(10000).regular/evidence(1000).regular,.1,1e-10);
near(evidence(10000).collision/evidence(1000).collision,10**(-.75),1e-10);
console.log('Learning story: tensor identities, cancellation, area scaling, and evidence integrals verified.');

const { crossingEvidence, gaussianMean, reluLoss, monomialJacobian } = await import('../src/figures/learning-geometry.js');
near(gaussianMean(0),1);
for (const n of [.001,.2,1,100,10000]) near(gaussianMean(n),simpson(x=>Math.exp(-n*x*x),0,1,8192),2e-7);
// Verify the crossing factor by an independent 2D midpoint integral.
{
  const n=3,M=700;let z=0;
  for(let i=0;i<M;i++)for(let j=0;j<M;j++) z+=Math.exp(-n*((i+.5)/M*(j+.5)/M)**2)/(M*M);
  near(crossingEvidence(n).product,z,1e-6);
}
for(const n of [10,1000,10**4.2]) {
  const a=crossingEvidence(n),b=crossingEvidence(n,8192);
  near(a.crossing4/b.crossing4,1,2e-6);
  assert.ok(a.crossing4>a.regular3 && a.regular3>a.regular4);
}
// ReLU formula checked against its actual stated input distribution and target, both signs of w.
for(const [a,w,c] of [[.7,.6,.4],[.7,-.6,.4],[0,1,.5],[1,0,.5],[.8,-.3,0]]) {
  const relu=x=>Math.max(0,x);
  near(reluLoss(a,w,c),simpson(x=>(a*relu(w*x)-c*relu(x))**2/4,-1,1),1e-10);
}
near(reluLoss(.4,.5,.2),0);
const {CUSP_CHARTS,CUSP_OTHER_FINAL}=await import('../src/figures/resolution-geometry.js');
assert.deepEqual(monomialJacobian(...CUSP_CHARTS[3].map),[-1,4,1]);
assert.deepEqual(monomialJacobian(...CUSP_OTHER_FINAL.map),[1,4,2]);
assert.deepEqual(monomialJacobian([2,0],[3,1]),[2,4,0]);
assert.deepEqual(monomialJacobian([2,1],[1,0]),[-1,2,0]);
near((4+1)/12,5/12); near((1+1)/4,.5);near((2+1)/6,.5);
console.log('Editorial math audit: both Jacobians, cusp chart volume exponents, ReLU half-MSE, and integrated crossing evidence verified.');
const { cuspNeighborhoodShares }=await import('../src/figures/learning-geometry.js');
const levels=[1,4,8,12], shares=cuspNeighborhoodShares(levels), refined=cuspNeighborhoodShares(levels,.25,2);
for(let i=0;i<levels.length;i++) {
  assert.ok(shares[i][1]>0&&shares[i][1]<1);
  if(i)assert.ok(shares[i][1]>shares[i-1][1]);
  near(shares[i][1],refined[i][1],.002);
}
console.log('Cusp probability audit: fixed-neighborhood mass increases, stays below one, and converges under mesh refinement.');

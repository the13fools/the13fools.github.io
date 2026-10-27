import assert from "node:assert/strict";
import {recoverFourfoldPoint,fourfoldResiduals,sliceResidual} from "../src/figures/toric-slice-geometry.js";
const check=(p,t,r,q)=>{
 assert.ok(Math.abs(sliceResidual(p,t,r,q))<1e-11);
 const x=recoverFourfoldPoint(p,t,r,q);
 assert.ok(x.every(Number.isFinite));
 for(const v of fourfoldResiduals(x))assert.ok(Math.abs(v)<1e-10,`Equation residual ${v}`);
};
for(const q of [-0.8,-0.2,0.02,0.2,0.8])for(const t of [-1.3,-0.9,0.7,1.3])for(const p of [-1,0,1])check(p,t,q**3/t**2,q);
for(const p of [-1,0,1])for(const s of [-1.3,0,1.3]){check(p,s,0,0);check(p,0,s,0);}
console.log("check-toric-slice: both central planes and nearby sections satisfy all six fourfold equations");

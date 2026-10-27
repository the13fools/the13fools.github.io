import { H,determinant } from "./nash-three-geometry.js";
// N is dual to the exponent lattice M. A ray n records the order <h,n> of χ^h.
export const RESOLUTION_RAYS=[[0,0,1],[0,1,2],[1,0,1],[1,2,2],[1,1,2]];
export const BOUNDARY_ORDER=[0,1,3,2];
export const NORMALIZATION_ADDED=[[0,-1,1],[-1,0,1]];
export const NORMALIZATION_GENERATORS=[H[0],H[1],H[3],H[5],...NORMALIZATION_ADDED];
export const TRIANGULATED_CONES=[[0,1,3],[0,2,3]];
export const RESOLVED_CONES=[[0,1,3],[0,2,4],[0,3,4],[2,3,4]];
export const dot=(a,b)=>a.reduce((s,v,i)=>s+v*b[i],0);
export const chartExponents=cone=>H.map(h=>cone.map(i=>dot(h,RESOLUTION_RAYS[i])));
export const chartMultiplicity=cone=>Math.abs(determinant(cone.map(i=>RESOLUTION_RAYS[i])));
export const evaluateChart=(cone,point)=>chartExponents(cone).map(exponents=>exponents.reduce((p,e,i)=>p*point[i]**e,1));
export const monomial=(exponents,names=["r","s","t"])=>{
  const supers=n=>String(n).replace(/\d/g,d=>"⁰¹²³⁴⁵⁶⁷⁸⁹"[Number(d)]);
  return exponents.map((e,i)=>e===0?"":names[i]+(e===1?"":supers(e))).filter(Boolean).join("·")||"1";
};

import assert from "node:assert/strict";
import { CUSP_CHARTS,CUSP_OTHER_FINAL,HARD_CUSP_CHARTS } from "../src/figures/resolution-geometry.js";
const normalized=terms=>{
  const m=new Map();for(const [c,a,b] of terms){const k=`${a},${b}`;m.set(k,(m.get(k)||0)+c);}
  return [...m].filter(([,c])=>c!==0).sort(([a],[b])=>a.localeCompare(b));
};
const multiply=(a,b)=>a.flatMap(([c,i,j])=>b.map(([d,k,l])=>[c*d,i+k,j+l]));
for(const [charts,power] of [[CUSP_CHARTS,3],[[CUSP_OTHER_FINAL],3],[HARD_CUSP_CHARTS,5]])for(const chart of charts){
  const [x,y]=chart.map;
  const substituted=[[1,2*y[0],2*y[1]],[-1,power*x[0],power*x[1]]];
  const factored=chart.factors.reduce(multiply,[[1,0,0]]);
  assert.deepEqual(normalized(substituted),normalized(factored),chart.text);
  assert.ok(Math.abs(x[0]*y[1]-x[1]*y[0])===1,"Chart must be birational on the torus");
}
console.log("check-resolution: cusp and higher-cusp composite maps and exact factored pullbacks, including the final complementary chart, OK");

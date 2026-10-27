// Exact real section of the fourfold in arXiv:2409.19767v3, Remark 3.
// Fix x₂=q, x₅=1. Project to (p,t,r)=(x₁,x₆,x₄).
// Its zero set is r t²=q³; at q=0 this is the union r=0 or t=0.
export const sliceResidual = (p,t,r,q) => r*t*t-q*q*q;
export function recoverFourfoldPoint(p,t,r,q) {
  return [p,q,p*t,r,1,t,q===0 ? 0 : q*q/t];
}
export function fourfoldResiduals(x) {
  const [,a,b,c,d,e,f,g]=[null,...x];
  return [a*f-c*e,d*f-b*g,g*g-b*d*e,f*g-b*b*e,c*g-a*b*b,c*d*e-a*b*g];
}

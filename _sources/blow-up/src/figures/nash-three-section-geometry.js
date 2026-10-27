// An exact real section of X(S) in six ambient coordinates, not its exponent lattice.
// Put x₄=1 and project to (A,B,C)=(x₁,x₂,x₆). Its real image is A⁶=B³C².
export const sectionPoint=(s,u)=>[s*u,s*s,s*s*u,1,s*u*u,u*u*u];
export const sectionProjection=x=>[x[0],x[1],x[5]];
export const sectionResidual=([a,b,c])=>a**6-b**3*c*c;
export function recoverSectionPoint(a,b,c){
  const u=Math.cbrt(c);
  return [a,b,b*u,1,a*u,c];
}
export function threefoldResiduals([a,b,c,d,e,f]){
  return [e*e-c*f,a*e-b*f,a*c-b*e,a*a*b*d-c*c,a*a*a*d-c*e];
}
export function threefoldJacobian([a,b,c,d,e,f]){
  return [[0,0,-f,0,2*e,-c],[e,-f,0,0,a,-b],[c,-e,a,0,-b,0],
    [2*a*b*d,a*a*d,-2*c,a*a*b,0,0],[3*a*a*d,0,-e,a*a*a,-c,0]];
}

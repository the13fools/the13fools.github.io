// Z-direction chart of the real blowup of X² + Y² = Z².
// Drawing code uses these same coordinates; no deformation or step sequence.
export const coneBlowdown = ([v,w,u]) => [u*v,u*w,u];

export function coneChartPoint(u, theta) {
  const v = Math.cos(theta), w = Math.sin(theta);
  return { resolved: [v, w, u], original: coneBlowdown([v,w,u]) };
}


// Compare two direction records a quarter turn apart in the same u-slice.
export function coneComparison(u, theta) {
  const A=coneChartPoint(u,theta),B=coneChartPoint(u,theta+Math.PI/2);
  const distance=(a,b)=>Math.hypot(...a.map((value,i)=>value-b[i]));
  return {A,B,originalDistance:distance(A.original,B.original),resolvedDistance:distance(A.resolved,B.resolved),
    originalGradient:Math.hypot(2*A.original[0],2*A.original[1],-2*A.original[2]),
    resolvedGradient:Math.hypot(2*A.resolved[0],2*A.resolved[1])};
}

// A point of the ambient exceptional plane need not lie on the strict cone.
export function coneDirectionProbe(radius,theta) {
  const v=radius*Math.cos(theta),w=radius*Math.sin(theta),chart=[v,w,0];
  return {chart,original:coneBlowdown(chart),strictResidual:v*v+w*w-1};
}

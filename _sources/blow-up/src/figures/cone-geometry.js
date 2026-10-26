// Z-direction chart of the real blowup of X² + Y² = Z².
// Drawing code uses these same coordinates; no deformation or step sequence.
export function coneChartPoint(u, theta) {
  const v = Math.cos(theta), w = Math.sin(theta);
  return { resolved: [v, w, u], original: [u * v, u * w, u] };
}

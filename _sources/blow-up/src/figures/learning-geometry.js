// Explicit teaching models. No browser state or random sampling enters these calculations.
export function tensorEntries(s, d) {
  return Array.from({ length: 8 }, (_, i) => {
    const ones = (i & 1) + ((i >> 1) & 1) + ((i >> 2) & 1);
    return [1, s, s * s + d * d, s ** 3 + 3 * s * d * d][ones];
  });
}
export const tensorLoss = (s, d) => s * s + (s * s + d * d) ** 2 + (s ** 3 + 3 * s * d * d) ** 2 / 3;
export const localLoss = (s, d, collision) => s * s + (collision ? d ** 4 : d * d);
export function simpson(fn, a, b, steps = 4096) {
  const h = (b - a) / steps;
  let sum = fn(a) + fn(b);
  for (let i = 1; i < steps; i++) sum += (i % 2 ? 4 : 2) * fn(a + i * h);
  return sum * h / 3;
}
const collisionAreaConstant = 4 * simpson(t => Math.cos(t) ** 2 * Math.sqrt(1 + Math.sin(t) ** 2), 0, Math.PI / 2, 512);
export const goodFitArea = (epsilon, collision) => collision ? collisionAreaConstant * epsilon ** 0.75 : Math.PI * epsilon;
export function evidence(n) {
  const i2 = 2 * simpson(x => Math.exp(-n * x * x), 0, 1);
  const i4 = 2 * simpson(x => Math.exp(-n * x ** 4), 0, 1);
  const regular = i2 * i2 / 4, collision = i2 * i4 / 4;
  return { regular, collision, share: collision / (regular + collision) };
}

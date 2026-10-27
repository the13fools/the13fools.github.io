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

// Half-MSE for inputs uniform on [-1,1], target c*relu(x).
export const reluLoss = (a, w, c) => w > 0 ? (a * w - c) ** 2 / 12 : (a * a * w * w + c * c) / 12;
// Mean of exp(-z*x^2) on [0,1]. A local series avoids cancellation at z=0.
export function gaussianMean(z) {
  if (z < 0.25) {
    let term = 1, sum = 1;
    for (let k = 1; k < 18; k++) { term *= -z / k; sum += term / (2 * k + 1); }
    return sum;
  }
  const x = Math.sqrt(z), t = 1 / (1 + .3275911 * x);
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-z);
  return Math.sqrt(Math.PI) * erf / (2 * x);
}
export function crossingEvidence(n, steps = 4096) {
  const g = gaussianMean(n), product = simpson(u => gaussianMean(n * u * u), 0, 1, steps);
  return { regular4: g ** 4, regular3: g ** 3, crossing4: g * g * product, product };
}
// For a monomial map (x,y)=(u^a v^b,u^c v^d), the Jacobian is
// (ad-bc) u^(a+c-1) v^(b+d-1). Used to audit the displayed resolution exponents.
export function monomialJacobian(x, y) {
  return [x[0] * y[1] - x[1] * y[0], x[0] + y[0] - 1, x[1] + y[1] - 1];
}

// Integrate cusp sublevel areas first, then their Stieltjes integral against exp(-n*epsilon).
// Logarithmic meshes resolve the cusp's anisotropic scales even for n=10^12.
export function cuspNeighborhoodShares(logNs, radius = .25, refinement = 1) {
  const eCount = Math.round(814 * refinement), xCount = Math.round(1200 * refinement);
  const levels = Array.from({length:eCount + 1}, (_,i) => 10**(-40 + 40.7*i/eCount));
  const xs = Array.from({length:xCount}, (_,i) => 10**(-16 + 16*i/(xCount-1)));
  const length = (x,e,rho) => {
    const root=Math.sqrt(e), x3=x*x*x, lo=Math.max(0,x3-root);
    let hi=Math.min(1,x3+root);
    if(rho) hi=Math.min(hi,rho*rho-x*x);
    return hi>lo ? 2*(Math.sqrt(hi)-Math.sqrt(lo)) : 0;
  };
  const areas = rho => levels.map(e => {
    let area=0;
    for(const sign of [1,-1]) {
      let prevX=0, prevLength=length(0,e,rho);
      for(const x of xs) { const next=length(sign*x,e,rho); area+=(x-prevX)*(next+prevLength)/2;prevX=x;prevLength=next; }
    }
    return area;
  });
  const total=areas(0), inside=areas(radius);
  return logNs.map(logN => {
    const n=10**logN;let z=0,zi=0;
    for(let i=1;i<levels.length;i++) {
      const weight=Math.exp(-n*Math.sqrt(levels[i]*levels[i-1]));
      z+=weight*(total[i]-total[i-1]);zi+=weight*(inside[i]-inside[i-1]);
    }
    return [logN,zi/z];
  });
}

import { tensorEntries, tensorLoss, localLoss, goodFitArea, evidence } from './learning-geometry.js';

function init() {
  if (!document.querySelector('#tc-loss, #room-eps')) return;
  const { $, E, C, T, frame, pathD } = window.__E;
  const percent = x => `${(100 * x).toFixed(1)}%`;
  const num = x => x === 0 ? '0' : Math.abs(x) >= 0.001 ? Number(x.toPrecision(3)).toString() : x.toExponential(2);
  function plot(id, square = true) {
    const svg = $(id), W = Math.max(250, Math.round(svg.getBoundingClientRect().width));
    const H = square ? W + 18 : Math.max(260, W * 0.76);
    const f = frame(svg, { W, H, l: 45, r: 18, t: 32, b: 49, xr: square ? [-1, 1] : [0, 0.6], yr: square ? [-1, 1] : [0, 0.55], xt: square ? [[-1, '−1'], [0, '0'], [1, '1']] : [[0, '0'], [.3, '0.3'], [.6, '0.6']], yt: square ? [[-1, '−1'], [0, '0'], [1, '1']] : [[0, '0'], [.25, '0.25'], [.5, '0.5']], xlab: square ? 'mean s' : 'displacement δ' });
    T(svg, f.x0, 18, square ? 'separation d' : 'loss K', C.ink);
    return { ...f, svg };
  }
  let mode = 'fit';
  function tensor() {
    if (!$('#tc-loss')) return;
    const delta = +$('#tc-delta').value, s = mode === 'together' ? delta : 0, d = mode === 'apart' ? delta : 0;
    $('#tc-delta-out').textContent = delta.toFixed(2);
    $('#tc-delta').disabled = mode === 'fit';
    const values = tensorEntries(s, d), a = s + d, b = s - d;
    $('#tc-arithmetic').textContent = `Add the half-components: entry 001 is ${num(a / 2)} + (${num(b / 2)}) = ${num(s)}; entry 011 is ${num(a * a / 2)} + ${num(b * b / 2)} = ${num(s * s + d * d)}.`;
    for(const [id,value,color] of [['a',a,C.cold],['b',b,C.hot]]) {
      const svg=$(`#tc-factor-${id}`), W=Math.max(250,svg.getBoundingClientRect().width);
      const F=frame(svg,{W,H:190,l:44,r:25,t:22,b:36,xr:[-.2,1.4],yr:[-.8,.8],xt:[[0,'0'],[1,'1']],yt:[[-.6,'−0.6'],[0,'0'],[.6,'0.6']],xlab:'first entry',ylab:'second entry'});
      E('line',{x1:F.X(0),y1:F.Y(0),x2:F.X(1),y2:F.Y(value),stroke:color,'stroke-width':3},F.g);
      const angle=Math.atan2(F.Y(value)-F.Y(0),F.X(1)-F.X(0)), tip=[F.X(1),F.Y(value)];
      E('path',{d:`M${tip[0]},${tip[1]} L${tip[0]-10*Math.cos(angle-.4)},${tip[1]-10*Math.sin(angle-.4)} L${tip[0]-10*Math.cos(angle+.4)},${tip[1]-10*Math.sin(angle+.4)} Z`,fill:color},F.g);
      T(svg,F.X(1)+9,F.Y(value)-9,`(1, ${num(value)})`,color,{at:{'text-anchor':'end'}});
      $(`#tc-factor-${id}-out`).textContent=`All three factors are v(${id}) = (1, ${num(value)}). Each tensor entry is ½ times the product of its three selected factor entries.`;
    }
    $('#tc-entries').innerHTML = `<table><thead><tr><th>Entry</th><th>Term A</th><th>Term B</th><th>Sum</th><th>Target</th></tr></thead><tbody>${values.map((v, i) => {const power=(i&1)+((i>>1)&1)+((i>>2)&1);return `<tr class="${Math.abs(v - (i === 0 ? 1 : 0)) > 1e-9 ? 'changed' : ''}"><th>${i.toString(2).padStart(3, '0')}</th><td>${num(a**power/2)}</td><td>${num(b**power/2)}</td><td>${num(v)}</td><td>${i===0?1:0}</td></tr>`;}).join('')}</tbody></table>`;
    $('#tc-result').textContent = `a = ${num(s + d)}, b = ${num(s - d)} · loss K = ${num(tensorLoss(s, d))}. ` + (mode === 'fit' || delta === 0 ? 'Both components equal the target. Choose a movement above.' : mode === 'together' ? 'Their changes add: even the single-1 entries change immediately.' : 'Opposite changes cancel: the single-1 entries stay at zero. Only the three double-1 entries change, by δ².');
    const { g, X, Y } = plot('#tc-loss', false);
    for (const [apart, color] of [[false, C.cold], [true, C.hot]]) {
      const points = Array.from({ length: 121 }, (_, i) => { const v = i / 200; return [v, tensorLoss(apart ? 0 : v, apart ? v : 0)]; });
      E('path', { d: pathD(points, X, Y), fill: 'none', stroke: color, 'stroke-width': 2.5 }, g);
      if (mode !== 'fit') E('circle', { cx: X(delta), cy: Y(tensorLoss(apart ? 0 : delta, apart ? delta : 0)), r: mode === (apart ? 'apart' : 'together') ? 6 : 3.5, fill: color, stroke: C.paper, 'stroke-width': 1.5 }, g);
    }
  }
  function room() {
    if (!$('#room-eps')) return;
    const eps = 10 ** +$('#room-eps').value;
    $('#room-eps-out').textContent = num(eps);
    $('#room-eps').setAttribute('aria-valuetext', num(eps));
    $('#room-tighten').disabled = +$('#room-eps').value <= -3;
    for (const collision of [false, true]) {
      const name = collision ? 'collision' : 'regular', { g, X, Y } = plot(`#room-${name}`), color = collision ? C.hot : C.cold;
      for (const axis of [0, 1]) E('line', { x1: X(axis ? -1 : 0), y1: Y(axis ? 0 : -1), x2: X(axis ? 1 : 0), y2: Y(axis ? 0 : 1), stroke: C.rule, 'stroke-dasharray': '3 4' }, g);
      const points = Array.from({ length: 361 }, (_, i) => { const t = 2 * Math.PI * i / 360, z = Math.sin(t); return [Math.sqrt(eps) * Math.cos(t), collision ? eps ** .25 * Math.sign(z) * Math.sqrt(Math.abs(z)) : Math.sqrt(eps) * z]; });
      E('path', { d: pathD(points, X, Y) + 'Z', fill: color, 'fill-opacity': .25, stroke: color, 'stroke-width': 2.5 }, g);
      E('circle', { cx: X(0), cy: Y(0), r: 3, fill: C.ink }, g);
      $(`#room-${name}-out`).textContent = `${percent(goodFitArea(eps, collision) / 4)} of the prior square · area ∝ ε${collision ? '³⁄⁴' : '¹'}`;
    }
    $('#room-result').textContent = `At this tolerance, the collision leaves ${(goodFitArea(eps, true) / goodFitArea(eps, false)).toFixed(2)}× as much acceptable area. Tightening by a factor of 10 keeps 10% of the regular area, but 17.8% of the collision area.`;
  }
  // A fixed pixel grid and a shared color map keep the two likelihood pictures comparable.
  function heatmap(id, n, collision) {
    const { g, X, Y } = plot(id), canvas = document.createElement('canvas'), N = 512;
    canvas.width = canvas.height = N;
    const ctx = canvas.getContext('2d'), image = ctx.createImageData(N, N);
    const low = [24, 28, 46], high = [242, 202, 111];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const s = -1 + 2 * (i + .5) / N, d = 1 - 2 * (j + .5) / N, weight = Math.exp(-n * localLoss(s, d, collision)), p = (j * N + i) * 4;
      for (let k = 0; k < 3; k++) image.data[p + k] = low[k] + (high[k] - low[k]) * weight;
      image.data[p + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    E('image', { href: canvas.toDataURL(), x: X(-1), y: Y(1), width: X(1) - X(-1), height: Y(-1) - Y(1), preserveAspectRatio: 'none' }, g);
  }
  function bayes() {
    if (!$('#evidence-n')) return;
    const n = 10 ** +$('#evidence-n').value, result = evidence(n);
    $('#evidence-n-out').textContent = Math.round(n).toLocaleString();
    $('#evidence-n').setAttribute('aria-valuetext', Math.round(n).toLocaleString());
    document.querySelectorAll('[data-evidence]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.evidence === +$('#evidence-n').value))); 
    for (const collision of [false, true]) {
      const name = collision ? 'collision' : 'regular';
      heatmap(`#evidence-${name}`, n, collision);
      $(`#evidence-${name}-out`).textContent = `Evidence Z = ${num(result[name])}`;
    }
    const a = $('#evidence-share-regular'), b = $('#evidence-share-collision');
    a.style.width = `${100 * (1 - result.share)}%`; b.style.width = `${100 * result.share}%`;
    a.textContent = percent(1 - result.share); b.textContent = percent(result.share);
    $('#evidence-share').setAttribute('aria-label', `Regular ${percent(1 - result.share)}, collision ${percent(result.share)}`);
    $('#evidence-result').textContent = `Regular: ${percent(1 - result.share)} · Collision: ${percent(result.share)}. Same best loss, but the collision has ${(result.collision / result.regular).toFixed(2)}× the integrated weight.`;
  }
  $('#tc-modes')?.addEventListener('click', event => {
    const b = event.target.closest('button'); if (!b) return;
    mode = b.dataset.mode;
    $('#tc-modes').querySelectorAll('button').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    tensor();
  });
  $('#tc-delta')?.addEventListener('input', tensor);
  $('#room-eps')?.addEventListener('input', room);
  $('#room-tighten')?.addEventListener('click', () => { $('#room-eps').value = String(Math.max(-3, +$('#room-eps').value - 1)); room(); });
  $('#room-reset')?.addEventListener('click', () => { $('#room-eps').value = '-1'; room(); });
  $('#evidence-n')?.addEventListener('input', bayes);
  document.querySelectorAll('[data-evidence]').forEach(b => b.addEventListener('click', () => { $('#evidence-n').value = b.dataset.evidence; bayes(); }));
  const draw = () => { tensor(); room(); bayes(); };
  let timer;
  new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(draw, 80); }).observe(document.querySelector('.story-panel'));
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => setTimeout(draw, 100));
  draw();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

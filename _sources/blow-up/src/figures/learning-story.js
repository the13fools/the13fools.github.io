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
  let mode = 'apart', probe = 1;
  const indices=index=>[(index>>2)&1,(index>>1)&1,index&1];
  const bits=index=>index.toString(2).padStart(3,'0');
  function tensor() {
    if (!$('#tc-loss')) return;
    const delta=+$('#tc-delta').value,s=mode==='together'?delta:0,d=mode==='apart'?delta:0;
    const a=s+d,b=s-d,values=tensorEntries(s,d),target=values.map((_,i)=>i===0?1:0);
    const term=value=>values.map((_,i)=>value**indices(i).reduce((sum,x)=>sum+x,0)/2);
    const av=term(a),bv=term(b),chosen=indices(probe),label=bits(probe);
    $('#tc-delta-out').textContent=String(+delta.toPrecision(4));
    $('#tc-delta').disabled=mode==='fit';$('#tc-halve').disabled=delta===0;
    const ones=chosen.reduce((sum,x)=>sum+x,0);
    const lossVal=tensorLoss(s,d);
    let explanation='';
    if(mode==='fit'||delta===0){
      explanation='<b>Problem:</b> Fitting rank-1 target tensor T* (entry 000 is 1; others 0) with a 2-component symmetric model. At a = b = 0, both components collide into identical rank-1 terms (A = B = T*/2). Their sum matches T* with zero loss K = 0.';
    }else if(mode==='together'){
      explanation=`<b>Move Together (s = ${num(delta)}, d = 0):</b> Both components shift in the same direction (a = b = +${num(delta)}). Linear errors reinforce (+${num(delta/2)} + ${num(delta/2)} = ${num(delta)}). Prediction error is order δ, so squared loss grows <b>quadratically</b>: K ≈ δ² = ${num(lossVal)} (steep curvature, Hessian H_ss = 2).`;
    }else{
      explanation=`<b>Pull Apart (s = 0, d = ${num(delta)}):</b> Components shift in opposite directions (a = +${num(delta)}, b = -${num(delta)}). In their sum T = A + B, linear first-order errors <b>cancel identically to zero</b> (+${num(delta/2)} - ${num(delta/2)} = 0!). Single-1 entries stay strictly zero. Error appears only at order δ² (${num(d*d)}), so squared loss grows <b>quartically</b>: K = δ⁴ = ${num(lossVal)} (Hessian H_dd = 0, degenerate flat valley!).`;
    }
    $('#tc-result').innerHTML=`<b>Status:</b> a = ${num(a)}, b = ${num(b)} (mean s = ${num(s)}, separation d = ${num(d)}) · <b>Loss K = ${num(lossVal)}</b> · rank ${d===0?1:2} (two allowed terms).<br>${explanation}`;
    const active=document.activeElement,focus=active?.matches('[data-tensor-entry]')?{card:active.dataset.card}:null;
    const cards=[{key:'a',name:'Term A · weight ½',values:av,factor:a,color:'cold'},{key:'b',name:'Term B · weight ½',values:bv,factor:b,color:'hot'},{key:'sum',name:'Prediction T = A + B',values,color:'blow'},{key:'target',name:'Fixed data T*',values:target,factor:0,color:'ink'}];
    const factorRows=value=>`<div class="tensor-vector-list">${chosen.map((pick,axis)=>`<div><span>${['i','j','k'][axis]}</span><span class="tensor-bracket">[</span>${[1,value].map((v,j)=>`<span class="factor-entry ${pick===j?'picked':''}">${num(v)}</span>`).join('')}<span class="tensor-bracket">]</span></div>`).join('')}</div>`;
    $('#tensor-components').innerHTML=cards.map(card=>`<div class="tensor-card tensor-${card.color}"><h4>${card.name}</h4><div class="tensor-card-factors">${card.factor!==undefined?factorRows(card.factor):`<p>For each entry, add the two numbers at the same position.</p><p class="tensor-sum-entry">${num(av[probe])} + (${num(bv[probe])}) = <b>${num(values[probe])}</b></p>`}</div><div class="tensor-slices">${[0,1].map(k=>`<table><caption>k = ${k}</caption><thead><tr><th>i ∖ j</th><th>0</th><th>1</th></tr></thead><tbody>${[0,1].map(i=>`<tr><th>${i}</th>${[0,1].map(j=>{const index=4*i+2*j+k,v=card.values[index];return `<td><button type="button" class="tensor-cell ${index===probe?'picked':''}" style="--cell-strength:${v===0?0:Math.min(.55,.08+.42*Math.abs(v))};--cell-color:var(--${v<0?'cold':'hot'})" data-card="${card.key}" data-tensor-entry="${index}" tabindex="${index===probe?0:-1}" aria-pressed="${index===probe}" aria-label="${card.name}, entry ${bits(index)}: ${num(v)}">${num(v)}</button></td>`;}).join('')}</tr>`).join('')}</tbody></table>`).join('')}</div></div>`).join('');
    if(focus)$(`[data-card="${focus.card}"][data-tensor-entry="${probe}"]`)?.focus({preventScroll:true});
    const product=value=>chosen.map(i=>num(i?value:1)).join(' × '),error=values[probe]-target[probe];
    let note='';
    if(mode==='apart'){
      if(ones===1){
        note=`<div class="tensor-note"><b>Linear cancellation:</b> Opposite linear terms cancel in the sum: ${num(av[probe])} + (${num(bv[probe])}) = <b>0.000</b>. Prediction error is strictly zero at order δ!</div>`;
      }else if(ones===2){
        note=`<div class="tensor-note"><b>Second-order error:</b> Both components square to positive values: ${num(av[probe])} + ${num(bv[probe])} = <b>${num(values[probe])} = d²</b>. Prediction error is d², so squared loss error² = (d²)² = <b>d⁴</b>.</div>`;
      }else if(ones===3){
        note=`<div class="tensor-note"><b>Cubic cancellation:</b> (+d)³ + (-d)³ = +d³ - d³ = <b>0</b>. Terms cancel out, zero error.</div>`;
      }else{
        note=`<div class="tensor-note"><b>Target match:</b> Both terms evaluate to ½ × 1 = ½. Sum is 1.000, exactly matching target entry 000.</div>`;
      }
    }else if(mode==='together'){
      if(ones===1){
        note=`<div class="tensor-note"><b>Constructive addition:</b> Both linear terms add: ${num(av[probe])} + ${num(bv[probe])} = <b>${num(values[probe])} = s</b>. Error is order δ, so loss scales quadratically as s² = δ².</div>`;
      }else if(ones===2){
        note=`<div class="tensor-note"><b>Quadratic term:</b> Both components add: ${num(av[probe])} + ${num(bv[probe])} = <b>${num(values[probe])} = s²</b>.</div>`;
      }else if(ones===3){
        note=`<div class="tensor-note"><b>Cubic term:</b> Both components add: ${num(av[probe])} + ${num(bv[probe])} = <b>${num(values[probe])} = s³</b>.</div>`;
      }else{
        note=`<div class="tensor-note"><b>Target match:</b> Both terms evaluate to ½ × 1 = ½. Sum is 1.000, matching target entry 000.</div>`;
      }
    }else{
      note=`<div class="tensor-note"><b>Exact fit:</b> At a = b = 0, entry ${label} evaluates to ${num(values[probe])}, matching target ${num(target[probe])} with zero error.</div>`;
    }
    $('#tc-arithmetic').innerHTML=`<p><b>Trace entry ${label}</b> · i = ${chosen[0]}, j = ${chosen[1]}, k = ${chosen[2]}. Highlighted vector entries supply the factors.</p><div class="tensor-trace-grid"><div><b>Term A:</b> ½ × ${product(a)} = ${num(av[probe])}</div><div><b>Term B:</b> ½ × ${product(b)} = ${num(bv[probe])}</div><div><b>Sum T:</b> ${num(av[probe])} + (${num(bv[probe])}) = ${num(values[probe])}</div><div><b>Error:</b> ${num(values[probe])} − ${num(target[probe])} = ${num(error)}; error²/3 = ${num(error**2/3)}</div></div>${note}`;
    document.querySelectorAll('[data-entry]').forEach(button=>button.setAttribute('aria-pressed',String(+button.dataset.entry===probe)));
    $('#tc-entries').innerHTML=`<table><thead><tr><th>Entry</th><th>Term A</th><th>Term B</th><th>Sum</th><th>Target</th></tr></thead><tbody>${values.map((v,i)=>`<tr class="${Math.abs(v-target[i])>1e-9?'changed':''}"><th>${bits(i)}</th><td>${num(av[i])}</td><td>${num(bv[i])}</td><td>${num(v)}</td><td>${target[i]}</td></tr>`).join('')}</tbody></table>`;
    const together=x=>tensorLoss(x,0),apart=x=>tensorLoss(0,x);
    $('#tc-comparison').innerHTML=`<table><thead><tr><th>Move</th><th>K at δ</th><th>K at δ/2</th><th>Reduction</th></tr></thead><tbody>${[['Together',together],['Apart',apart]].map(([name,loss])=>`<tr><th>${name}</th><td>${num(loss(delta))}</td><td>${num(loss(delta/2))}</td><td>${delta?num(loss(delta)/loss(delta/2))+'×':'—'}</td></tr>`).join('')}</tbody></table>`;
    const groups=[0,1,2,3].map(order=>values.reduce((sum,v,i)=>sum+(indices(i).reduce((a,b)=>a+b,0)===order?(v-target[i])**2/3:0),0));
    $('#tc-budget').innerHTML=`<h4>Which errors make the current loss?</h4><div class="loss-budget-rows">${groups.map((v,i)=>`<div><span>${i} ones · ${[1,3,3,1][i]} ${i===0||i===3?'entry':'entries'}</span><b>${num(v)}</b></div>`).join('')}</div><p class="cap">Add these four contributions to obtain K. The three double-1 entries account for the entire loss when the components pull apart.</p>`;
    const svg=$('#tc-loss'),W=Math.max(260,svg.getBoundingClientRect().width),F=frame(svg,{W,H:280,l:59,r:22,t:30,b:48,xr:[-2,Math.log10(.6)],yr:[-8,.1],xt:[[-2,'0.01'],[-1,'0.1'],[Math.log10(.6),'0.6']],yt:[[-8,'10⁻⁸'],[-6,'10⁻⁶'],[-4,'10⁻⁴'],[-2,'10⁻²'],[0,'1']],xlab:'displacement δ'});
    T(svg,F.x0,17,'scaled squared error K',C.ink);
    for(const [loss,color] of [[together,C.cold],[apart,C.hot]]){
      const pts=Array.from({length:181},(_,i)=>{const x=-2+(Math.log10(.6)+2)*i/180;return [x,Math.log10(loss(10**x))];});
      E('path',{d:pathD(pts,F.X,F.Y),fill:'none',stroke:color,'stroke-width':2.5},F.g);
      if(delta>=.01)E('circle',{cx:F.X(Math.log10(delta)),cy:F.Y(Math.log10(loss(delta))),r:5,fill:color,stroke:C.paper,'stroke-width':1.5},F.g);
    }
    if(delta>=.01)E('line',{x1:F.X(Math.log10(delta)),x2:F.X(Math.log10(delta)),y1:F.y0,y2:F.y1,stroke:C.muted,'stroke-dasharray':'3 4'},F.g);
    T(svg,F.X(-1.75),F.Y(-3),'slope → 2',C.cold);T(svg,F.X(-1.45),F.Y(-6.25),'slope = 4',C.hot);
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
  $('#tc-halve')?.addEventListener('click',()=>{$('#tc-delta').value=String(+$('#tc-delta').value/2);tensor();});
  $('#tc-reset')?.addEventListener('click',()=>{$('#tc-delta').value='0.3';tensor();});
  $('#tc-probes')?.addEventListener('click',event=>{const button=event.target.closest('[data-entry]');if(button){probe=+button.dataset.entry;tensor();}});
  $('#tensor-components')?.addEventListener('click',event=>{const button=event.target.closest('[data-tensor-entry]');if(button){probe=+button.dataset.tensorEntry;tensor();}});
  $('#tensor-components')?.addEventListener('keydown',event=>{
    const button=event.target.closest('[data-tensor-entry]');if(!button)return;
    const flip={ArrowRight:2,ArrowLeft:2,ArrowDown:4,ArrowUp:4};
    if(event.key in flip){event.preventDefault();probe=probe^flip[event.key];tensor();}
    if(event.key==='PageUp'||event.key==='PageDown'){event.preventDefault();probe=probe^1;tensor();}
  });
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

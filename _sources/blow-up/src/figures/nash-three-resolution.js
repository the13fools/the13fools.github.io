import { RESOLUTION_RAYS as R,BOUNDARY_ORDER,TRIANGULATED_CONES,RESOLVED_CONES,chartMultiplicity,chartExponents,evaluateChart,monomial } from "./nash-three-resolution-geometry.js";
import { threefoldResiduals } from "./nash-three-section-geometry.js";
function init(){
  const svg=document.getElementById("nash3-resolution-fan");if(!svg)return;
  const {$,E,C,T}=window.__E,select=$("#nash3-resolution-chart");
  const stages=[...document.querySelectorAll("[data-resolution-stage]")];
  let stage=0,timer=null;
  const descriptions=[
    ["Input: the non-normal threefold X(S)","The original semigroup has holes. The dual cone is defined by ⟨hᵢ,n⟩ ≥ 0 and has four primitive rays. A fan alone cannot record the holes, so simply drawing this cone does not normalize the variety."],
    ["1. Normalize the coordinate algebra","Adjoin U = c/b and V = c/a. Their exponents are (0,−1,1) and (−1,0,1), with U³ = x₄x₆ and V² = x₂x₄. Together with x₁, x₂, x₄, x₆ they generate the saturated semigroup. The cone stays fixed, but the coordinate algebra changes. Four extreme rays still prevent this full cone from being smooth."],
    ["2. Triangulate the cone","Insert the diagonal ⟨n₁,n₄⟩. This gives cones (n₁,n₂,n₄) of determinant −1 and (n₁,n₃,n₄) of determinant 2. The first chart is smooth; the second still has an index-2 lattice defect. Triangles alone do not prove smoothness."],
    ["3. Subdivide the index-2 cone: done","Add n₅ = (1,1,2) = (n₁+n₃+n₄)/2. It lies strictly inside the determinant-2 cone. Splitting that cone into three gives four maximal cones in total, all with determinant ±1. Each final chart is an ordinary smooth affine three-space."],
  ];
  function stop(){if(timer)clearInterval(timer);timer=null;$("#nash3-resolution-play").textContent="Play computed steps";}
  function update(){
    stages.forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.resolutionStage)===stage)));
    $("#nash3-resolution-title").textContent=descriptions[stage][0];$("#nash3-resolution-description").textContent=descriptions[stage][1];
    $("#nash3-resolution-next").disabled=stage===3;$("#nash3-resolution-maps").hidden=stage!==3;
    const W=Math.max(260,svg.getBoundingClientRect().width),H=330;
    svg.replaceChildren();svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    const points=R.map(n=>{const d=n.reduce((a,b)=>a+b,0);return [45+n[0]/d/0.5*(W-90),H-45-n[1]/d/0.4*(H-95)];});
    const polygon=(ids,fill,stroke,width=2)=>E("polygon",{points:ids.map(i=>points[i].join(",")).join(" "),fill,stroke,"stroke-width":width,"fill-opacity":0.16},svg);
    polygon(BOUNDARY_ORDER,C.steel,C.steel);
    const cones=stage===2?TRIANGULATED_CONES:stage===3?RESOLVED_CONES:[];
    cones.forEach((cone,i)=>{
      const mult=chartMultiplicity(cone),selected=stage===3&&Number(select.value)===i;
      polygon(cone,mult===1?C.blow:C.hot,selected?C.ink:mult===1?C.blow:C.hot,selected?3:1.7);
      const center=cone.map(i=>points[i]).reduce((a,p)=>[a[0]+p[0]/3,a[1]+p[1]/3],[0,0]);
      T(svg,center[0],center[1]+4,stage===3?"ABCD"[i]:`|det| = ${mult}`,mult===1?C.blow:C.hot,{at:{"text-anchor":"middle"},st:";font-size:13px;font-weight:700"});
    });
    R.forEach((n,i)=>{if(i===4&&stage!==3)return;const [x,y]=points[i];E("circle",{cx:x,cy:y,r:i===4?6:4,fill:i===4?C.hot:C.ink},svg);
      const offsets=[[0,23],[-2,-12],[0,23],[5,-12],[24,23]][i];
      T(svg,x+offsets[0],y+offsets[1],`n${"₁₂₃₄₅"[i]}`,i===4?C.hot:C.ink,{at:{"text-anchor":"middle"},st:";font-weight:700"});
    });
    const index=Number(select.value),cone=RESOLVED_CONES[index],P=chartExponents(cone);
    $("#nash3-resolution-basis").textContent=`Chart ${"ABCD"[index]}: rays ${cone.map(i=>`n${i+1} = (${R[i].join(", ")})`).join("; ")}. |det| = ${chartMultiplicity(cone)}.`;
    $("#nash3-resolution-equations").innerHTML=P.map((p,i)=>`<div><span>x${"₁₂₃₄₅₆"[i]}</span><code>${monomial(p)}</code></div>`).join("");
  }
  stages.forEach(b=>b.addEventListener("click",()=>{stop();stage=Number(b.dataset.resolutionStage);update();}));
  $("#nash3-resolution-next").addEventListener("click",()=>{stop();stage=Math.min(3,stage+1);update();});
  $("#nash3-resolution-play").addEventListener("click",()=>{
    if(timer){stop();return;}stage=0;update();$("#nash3-resolution-play").textContent="Pause animation";
    timer=setInterval(()=>{stage++;update();if(stage===3)stop();},4000);
  });
  select.addEventListener("change",update);new ResizeObserver(update).observe(svg.parentElement);
  window.addEventListener("pagehide",stop);document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",update);update();

  // Draw actual coordinate level sets in a smooth A³ chart and their images.
  // The target is a projection from A⁶, never a literal surface model of X.
  const source=$("#nash3-resolution-source"),target=$("#nash3-resolution-target");
  const inputs=["r","s","t"].map(k=>$("#nash3-map-"+k)),overlay=$("#nash3-map-levels");
  let yaw=-0.55,pitch=0.45,drag=null,animation=null;
  const last=RESOLVED_CONES[3],projectPoint=x=>[x[0],x[1],x[5]],levels=[0,.25,.5,.75,1];
  const colors=()=>[C.blow,C.cold,C.good,C.hot,C.bad];
  const levelName=t=>t===0?"0 · E":t===1?"1":t.toFixed(2);
  function render(canvas,isSource){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const d=Math.min(2,devicePixelRatio||1),W=rect.width,H=rect.height;
    canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);const ctx=canvas.getContext("2d");ctx.scale(d,d);
    ctx.fillStyle=C.soft;ctx.fillRect(0,0,W,H);
    const [r,s,t]=inputs.map(i=>Number(i.value)),palette=colors();
    const project=([a,b,c])=>{const x=a*Math.cos(yaw)-b*Math.sin(yaw),y=a*Math.sin(yaw)+b*Math.cos(yaw),k=Math.min(W,H)*.26;return [W/2+k*x,H/2+12-k*(c*Math.cos(pitch)-y*Math.sin(pitch)),c*Math.sin(pitch)+y*Math.cos(pitch)];};
    const image=p=>isSource?p:projectPoint(evaluateChart(last,p));
    const quads=[];
    function quad(pts,col,alpha){const pp=pts.map(p=>project(image(p)));quads.push({pp,col,alpha,z:pp.reduce((s,p)=>s+p[2],0)/4});}
    const slices=overlay.checked?levels:[0,t].filter((v,i,a)=>a.indexOf(v)===i);
    slices.forEach(level=>{
      const idx=levels.indexOf(level),col=idx<0?C.steel:palette[idx];
      const N=isSource?4:14;
      // In the target every point of the t=0 plane is the same origin.
      if(!isSource&&level===0)return;
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){
        const a=-1+2*i/N,b=-1+2*(i+1)/N,c=-1+2*j/N,e=-1+2*(j+1)/N;
        quad([[a,c,level],[b,c,level],[b,e,level],[a,e,level]],col,isSource?(level===0?.3:.12):.23);
      }
    });
    quads.sort((a,b)=>a.z-b.z);
    for(const q of quads){ctx.beginPath();q.pp.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.globalAlpha=q.alpha;ctx.fillStyle=q.col;ctx.fill();ctx.globalAlpha=isSource?.3:.12;ctx.strokeStyle=q.col;ctx.lineWidth=.6;ctx.stroke();}ctx.globalAlpha=1;
    function path(pts,col,width=1.5,dash=[]){ctx.beginPath();pts.map(p=>project(image(p))).forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.strokeStyle=col;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);}
    // The active level has a dashed boundary even when it is between fixed levels.
    path([[-1,-1,t],[1,-1,t],[1,1,t],[-1,1,t],[-1,-1,t]],C.ink,1.3,[4,4]);
    path(Array.from({length:65},(_,i)=>[r,s,i/64]),C.surface,5);
    path(Array.from({length:65},(_,i)=>[r,s,i/64]),C.ink,2);
    const label=(text,p,color)=>{ctx.font="12px system-ui";ctx.fillStyle=color;ctx.fillText(text,Math.max(8,Math.min(W-ctx.measureText(text).width-8,p[0]+7)),Math.max(16,Math.min(H-32,p[1]-7)));};
    const axes=[[1.25,0,0],[0,1.25,0],[0,0,1.25]],names=isSource?["r","s","t"]:["x₁","x₂","x₆"];
    axes.forEach((p,i)=>{const a=project([0,0,0]),b=project(p);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=C.steel;ctx.lineWidth=1;ctx.stroke();label(names[i],b,C.muted);});
    if(overlay.checked)levels.forEach((level,i)=>{const p=project(image([r,s,level]));ctx.beginPath();ctx.arc(p[0],p[1],4.5,0,2*Math.PI);ctx.fillStyle=palette[i];ctx.fill();ctx.strokeStyle=C.surface;ctx.lineWidth=1.5;ctx.stroke();});
    const origin=project([0,0,0]);
    if(!isSource){ctx.beginPath();ctx.arc(origin[0],origin[1],6,0,2*Math.PI);ctx.fillStyle=C.blow;ctx.fill();label("E → origin",[origin[0]-85,origin[1]+28],C.blow);}
    if(isSource){if(overlay.checked)levels.forEach((level,i)=>label(`t = ${levelName(level)}`,project([-1,-1,level]),palette[i]));else label("E: t = 0",project([-1,-1,0]),C.blow);}
    const p=project(image([r,s,t]));ctx.beginPath();ctx.arc(p[0],p[1],6,0,2*Math.PI);ctx.fillStyle=C.surface;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2.5;ctx.stroke();
    ctx.font="12px system-ui";ctx.fillStyle=C.muted;ctx.fillText(isSource?"Parallel t-levels · independent r, s":"Their images under the same map π",12,H-14);
  }
  function updateMap(){
    const p=inputs.map(i=>Number(i.value)),x=evaluateChart(last,p),palette=colors();
    ["r","s","t"].forEach((k,i)=>$("#nash3-map-"+k+"-out").textContent=p[i].toFixed(2));
    $("#nash3-map-legend").innerHTML=levels.map((t,i)=>`<span><i style="background:${palette[i]}"></i>t = ${levelName(t)}</span>`).join("");
    $("#nash3-map-coordinates").textContent=`(r, s, t) = (${p.map(v=>v.toFixed(2)).join(", ")}) → (x₁,…,x₆) = (${x.map(v=>v.toFixed(3)).join(", ")})`;
    const residual=Math.max(...threefoldResiduals(x).map(Math.abs));
    $("#nash3-map-status").textContent=p[2]===0
      ? `At t = 0, all (r,s,0) map to the same six-coordinate origin. Move r or s: the white source dot moves within the exceptional plane; its image stays fixed. The source chart is smooth. Maximum equation residual: ${residual.toExponential(1)}.`
      : `The white dots correspond at t = ${p[2].toFixed(2)}. The black path fixes r = ${p[0].toFixed(2)}, s = ${p[1].toFixed(2)} and varies t. Its image bends because some coordinates shrink as t². Maximum equation residual: ${residual.toExponential(1)}.`;
    $("#nash3-map-table").innerHTML=levels.map((t,j)=>{const q=evaluateChart(last,[p[0],p[1],t]);return `<tr><th scope="row" style="color:${palette[j]}">${levelName(t)}</th>${[0,1,2,4,5].map(i=>`<td>${q[i].toFixed(4)}</td>`).join("")}</tr>`;}).join("");
    render(source,true);render(target,false);
  }
  function stopMap(){if(animation!==null)cancelAnimationFrame(animation);animation=null;$("#nash3-map-animate").textContent="Animate approach to the origin";}
  inputs.forEach(i=>i.addEventListener("input",()=>{stopMap();updateMap();}));overlay.addEventListener("change",updateMap);
  $("#nash3-map-zero").addEventListener("click",()=>{stopMap();inputs[2].value="0";updateMap();});
  $("#nash3-map-one").addEventListener("click",()=>{stopMap();inputs[2].value="1";updateMap();});
  $("#nash3-map-animate").addEventListener("click",()=>{
    if(animation!==null){stopMap();return;}if(matchMedia("(prefers-reduced-motion: reduce)").matches){inputs[2].value="0";updateMap();return;}
    const from=Number(inputs[2].value)||1;inputs[2].value=String(from);const start=performance.now();$("#nash3-map-animate").textContent="Pause approach";
    const tick=now=>{const progress=Math.min(1,(now-start)/3500);inputs[2].value=String(from*(1-progress));updateMap();if(progress<1)animation=requestAnimationFrame(tick);else stopMap();};animation=requestAnimationFrame(tick);
  });
  for(const canvas of [source,target]){
    canvas.addEventListener("pointerdown",e=>{drag={canvas,id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{if(!drag||drag.canvas!==canvas||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-drag.y)*.008));drag.x=e.clientX;drag.y=e.clientY;updateMap();});
    canvas.addEventListener("keydown",e=>{const delta={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];if(!delta)return;e.preventDefault();yaw+=delta[0];pitch=Math.max(-1.1,Math.min(1.1,pitch+delta[1]));updateMap();});
    for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,()=>drag=null);
    new ResizeObserver(updateMap).observe(canvas.parentElement);
  }
  window.addEventListener("pagehide",stopMap);document.addEventListener("visibilitychange",()=>{if(document.hidden)stopMap();});window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",updateMap);updateMap();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();

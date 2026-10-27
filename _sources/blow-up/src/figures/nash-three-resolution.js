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

  // Inspect the explicit last chart A³_(r,s,t) → X ⊂ A⁶. No surface deformation
  // is used to represent a blowup: this second animation is the actual blowdown map.
  const source=$("#nash3-resolution-source"),target=$("#nash3-resolution-target");
  const inputs=["r","s","t"].map(k=>$("#nash3-map-"+k));
  let yaw=0.6,pitch=0.45,drag=null,animation=null;
  const last=RESOLVED_CONES[3],projectPoint=x=>[x[0],x[1],x[5]];
  function render(canvas,isSource){
    const rect=canvas.getBoundingClientRect();if(!rect.width||!rect.height)return;
    const d=Math.min(2,devicePixelRatio||1),W=rect.width,H=rect.height;
    canvas.width=Math.round(W*d);canvas.height=Math.round(H*d);const ctx=canvas.getContext("2d");ctx.scale(d,d);
    ctx.fillStyle=C.soft;ctx.fillRect(0,0,W,H);
    const [r,s,t]=inputs.map(i=>Number(i.value));
    const project=([a,b,c])=>{const x=a*Math.cos(yaw)-b*Math.sin(yaw),y=a*Math.sin(yaw)+b*Math.cos(yaw),k=Math.min(W,H)*0.27;return [W/2+k*x,H/2+25-k*(c*Math.cos(pitch)-y*Math.sin(pitch)),c*Math.sin(pitch)+y*Math.cos(pitch)];};
    const quads=[];
    function quad(pts,col,alpha){const pp=pts.map(project);quads.push({pp,col,alpha,z:pp.reduce((s,p)=>s+p[2],0)/4});}
    const Rg=1;
    if(isSource){quad([[-Rg,-Rg,0],[Rg,-Rg,0],[Rg,Rg,0],[-Rg,Rg,0]],C.blow,0.42);quad([[-Rg,-Rg,t],[Rg,-Rg,t],[Rg,Rg,t],[-Rg,Rg,t]],C.cold,0.12);}
    else {const N=20;for(let i=0;i<N;i++)for(let j=0;j<N;j++){
      const a=-1+2*i/N,b=-1+2*(i+1)/N,c=-1+2*j/N,e=-1+2*(j+1)/N;
      quad([[a,c,t],[b,c,t],[b,e,t],[a,e,t]].map(p=>projectPoint(evaluateChart(last,p))),c+e>=0?C.hot:C.cold,0.65);
    }}
    quads.sort((a,b)=>a.z-b.z);for(const q of quads){ctx.beginPath();q.pp.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.globalAlpha=q.alpha;ctx.fillStyle=q.col;ctx.fill();ctx.globalAlpha=0.15;ctx.strokeStyle=C.surface;ctx.stroke();}ctx.globalAlpha=1;
    function line(a,b,col,dash=[]){const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);ctx.setLineDash(dash);ctx.strokeStyle=col;ctx.lineWidth=1.3;ctx.stroke();ctx.setLineDash([]);}
    const axes=[[1.25,0,0],[0,1.25,0],[0,0,1.25]],names=isSource?["r","s","t"]:["x₁","x₂","x₆"];
    axes.forEach((p,i)=>{line([0,0,0],p,C.steel);const q=project(p);ctx.font="12px system-ui, sans-serif";ctx.fillStyle=C.ink;ctx.fillText(names[i],q[0]+5,q[1]-5);});
    if(isSource)line([r,s,0],[r,s,t],C.ink,[4,4]);
    const p=project(isSource?[r,s,t]:projectPoint(evaluateChart(last,[r,s,t])));
    ctx.beginPath();ctx.arc(p[0],p[1],6,0,2*Math.PI);ctx.fillStyle=C.surface;ctx.fill();ctx.strokeStyle=C.ink;ctx.lineWidth=2.5;ctx.stroke();
    ctx.font="12px system-ui, sans-serif";ctx.fillStyle=C.blow;ctx.fillText(isSource?"Violet plane: t = 0":"Image of the selected t-section",12,H-14);
  }
  function updateMap(){
    const p=inputs.map(i=>Number(i.value)),x=evaluateChart(last,p);
    ["r","s","t"].forEach((k,i)=>$("#nash3-map-"+k+"-out").textContent=p[i].toFixed(2));
    $("#nash3-map-coordinates").textContent=`(x₁,…,x₆) = (${x.map(v=>v.toFixed(3)).join(", ")})`;
    const residual=Math.max(...threefoldResiduals(x).map(Math.abs));
    $("#nash3-map-status").textContent=p[2]===0
      ? `t = 0: every (r,s,0) on this exceptional surface maps to the same six-coordinate origin. The source chart remains smooth. All five equation residuals are ${residual.toExponential(1)}.`
      : `t = ${p[2].toFixed(2)}: the two dots correspond under the explicit monomial map. The right viewport projects six coordinates to (x₁,x₂,x₆); the full tuple is shown above. Maximum equation residual ${residual.toExponential(1)}.`;
    render(source,true);render(target,false);
  }
  function stopMap(){if(animation)cancelAnimationFrame(animation);animation=null;$("#nash3-map-animate").textContent="Animate approach to the origin";}
  inputs.forEach(i=>i.addEventListener("input",()=>{stopMap();updateMap();}));
  $("#nash3-map-zero").addEventListener("click",()=>{stopMap();inputs[2].value="0";updateMap();});
  $("#nash3-map-animate").addEventListener("click",()=>{
    if(animation){stopMap();return;}const from=Number(inputs[2].value)||1;inputs[2].value=String(from);const start=performance.now();$("#nash3-map-animate").textContent="Pause approach";
    const tick=now=>{const progress=Math.min(1,(now-start)/3500);inputs[2].value=String(from*(1-progress));updateMap();if(progress<1)animation=requestAnimationFrame(tick);else stopMap();};animation=requestAnimationFrame(tick);
  });
  for(const canvas of [source,target]){
    canvas.addEventListener("pointerdown",e=>{drag={canvas,id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{if(!drag||drag.canvas!==canvas||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*0.008;pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-drag.y)*0.008));drag.x=e.clientX;drag.y=e.clientY;updateMap();});
    canvas.addEventListener("keydown",e=>{const delta={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];if(!delta)return;e.preventDefault();yaw+=delta[0];pitch=Math.max(-1.1,Math.min(1.1,pitch+delta[1]));updateMap();});
    for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,()=>drag=null);
    new ResizeObserver(updateMap).observe(canvas.parentElement);
  }
  window.addEventListener("pagehide",stopMap);document.addEventListener("visibilitychange",()=>{if(document.hidden)stopMap();});window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",updateMap);updateMap();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();

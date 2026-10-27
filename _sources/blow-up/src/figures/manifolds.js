import { coneChartPoint, coneComparison } from "./cone-geometry.js";

function initCone() {
  const $ = id => document.getElementById(id), original = $("cone-original"), resolved = $("cone-resolved");
  if (!original || !resolved) return;
  const uInput = $("cone-u"), thetaInput = $("cone-theta"), viewInput = $("cone-view");
  const {E,T,C} = window.__E;
  let yaw = 28 * Math.PI / 180, pitch = -0.3, drag = null, animation = null;
  const fmt = a => a.map(x => (Math.abs(x) < 0.0005 ? 0 : x).toFixed(2)).join(", ");
  function draw(canvas, isResolved, u, theta) {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = rect.width, H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d"); ctx.scale(dpr,dpr); ctx.fillStyle=C.surface; ctx.fillRect(0,0,W,H);
    const project = ([x,y,z]) => {
      const a=x*Math.cos(yaw)-y*Math.sin(yaw), b=x*Math.sin(yaw)+y*Math.cos(yaw), scale=Math.min(W,H)*0.28;
      return [W/2+scale*a,H/2-scale*(z*Math.cos(pitch)-b*Math.sin(pitch)),z*Math.sin(pitch)+b*Math.cos(pitch)];
    };
    const point=(u,t)=>{const p=coneChartPoint(u,t);return project(isResolved?p.resolved:p.original);};
    const path=pts=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));};
    const quads=[], rows=24, columns=48;
    for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
      const a=-1.2+2.4*i/rows,b=-1.2+2.4*(i+1)/rows,c=2*Math.PI*j/columns,d=2*Math.PI*(j+1)/columns;
      const pts=[point(a,c),point(b,c),point(b,d),point(a,d)];
      quads.push({pts,depth:pts.reduce((n,p)=>n+p[2],0)/4,theta:(c+d)/2});
    }
    quads.sort((a,b)=>a.depth-b.depth);
    for(const q of quads){path(q.pts);ctx.closePath();ctx.fillStyle=`hsl(${isResolved?263:211} 30% ${53+12*Math.cos(q.theta+yaw-.8)}%)`;ctx.fill();ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=.5;ctx.stroke();}
    const ring=level=>Array.from({length:97},(_,j)=>point(level,2*Math.PI*j/96));
    if(isResolved){path(ring(0));ctx.strokeStyle=C.surface;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle=C.blow;ctx.lineWidth=3.5;ctx.stroke();}
    path(ring(u));ctx.strokeStyle=C.ink;ctx.lineWidth=1.6;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);
    [theta,theta+Math.PI/2].forEach((t,i)=>{
      path([point(-1.2,t),point(1.2,t)]);ctx.strokeStyle=i?C.hot:C.cold;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);
      const p=point(u,t), radius=!isResolved&&u===0?(i?5:9):6;
      ctx.beginPath();ctx.arc(p[0],p[1],radius,0,2*Math.PI);ctx.fillStyle=i?C.hot:C.cold;ctx.fill();ctx.strokeStyle=C.surface;ctx.lineWidth=2;ctx.stroke();
      if(isResolved||u!==0||i===0){ctx.font="bold 13px system-ui";ctx.fillStyle=C.ink;ctx.fillText(!isResolved&&u===0?"A = B":i?"B":"A",Math.max(8,Math.min(W-48,p[0]+10)),Math.max(18,Math.min(H-30,p[1]-10)));}
    });
    ctx.font="12px system-ui";ctx.fillStyle=C.muted;ctx.fillText(isResolved?"u vertical · v, w horizontal":"Z vertical · X, Y horizontal",12,H-12);
  }
  function drawRings(u,theta){
    const svg=$("cone-rings"), W=Math.max(260,svg.getBoundingClientRect().width),H=180,R=Math.min(54,W/6);
    svg.replaceChildren();svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    [false,true].forEach((up,i)=>{
      const cx=W*(i?.75:.25),cy=86,rad=up?R:Math.abs(u)*R;
      E("circle",{cx,cy,r:rad,fill:"none",stroke:up&&u===0?C.blow:C.steel,"stroke-width":2},svg);
      [theta,theta+Math.PI/2].forEach((a,j)=>{const rr=up?R:u*R,x=cx+rr*Math.cos(a),y=cy-rr*Math.sin(a);E("circle",{cx:x,cy:y,r:!up&&u===0?(j?4:8):5,fill:j?C.hot:C.cold,stroke:C.surface,"stroke-width":1.5},svg);});
      T(svg,cx,18,up?"Resolved (v, w)":"Original (X, Y)",C.ink,{at:{"text-anchor":"middle"},st:";font-size:13px;font-weight:700"});
      T(svg,cx,158,up?"radius = 1":`radius = |u| = ${Math.abs(u).toFixed(2)}`,C.muted,{at:{"text-anchor":"middle"},st:";font-size:12px"});
    });
    T(svg,W/2,90,"← π",C.muted,{at:{"text-anchor":"middle"},st:";font-size:14px"});
  }
  function update(){
    const u=Number(uInput.value), degrees=Number(thetaInput.value), theta=degrees*Math.PI/180, q=coneComparison(u,theta);
    $("cone-u-out").textContent=u.toFixed(2);$("cone-theta-out").textContent=`${degrees}°`;$("cone-view-out").textContent=`${viewInput.value}°`;
    $("cone-state").textContent=u===0?"At u = 0: A and B are different points on the exceptional circle, but both map to the same old apex. Turn θ: the resolved records move; the old position stays fixed.":"Track two directions 90° apart. As u approaches 0, their old positions merge. Their resolved records stay distinct.";
    $("cone-original-record").textContent=`A = (${fmt(q.A.original)}) · B = (${fmt(q.B.original)}). Distance = ${q.originalDistance.toFixed(3)}.`;
    $("cone-resolved-record").textContent=`A = (${fmt(q.A.resolved)}) · B = (${fmt(q.B.resolved)}). Distance = ${q.resolvedDistance.toFixed(3)}.`;
    $("cone-original-test").textContent=`Old equation: F = X² + Y² − Z² = 0. ‖∇F‖ = ${q.originalGradient.toFixed(3)}. ${u===0?"Zero gradient: the apex is singular.":"Nonzero here; tends to zero at the apex."}`;
    $("cone-resolved-test").textContent="New equation: g = v² + w² − 1 = 0. ‖∇g‖ = 2 everywhere: the cylinder is smooth, including its exceptional circle.";
    $("cone-point").textContent=`π(A): (${fmt(q.A.resolved)}) → (${fmt(q.A.original)}). ${u===0?"The circle E is the fiber over the apex.":"Off E, v = X/Z and w = Y/Z recover the direction uniquely."}`;
    $("cone-nash-record").textContent=`Limiting normal directions: A [${fmt([q.A.resolved[0],q.A.resolved[1],-1])}], B [${fmt([q.B.resolved[0],q.B.resolved[1],-1])}]. These label the planes vX + wY − Z = 0; at the apex they remain different even though the old position is the same.`;
    const gradOrig = $("cone-row-grad-orig"), regOrig = $("cone-row-reg-orig"), distOrig = $("cone-row-dist-orig"), distRes = $("cone-row-dist-res"), areaOrig = $("cone-row-area-orig");
    if (gradOrig) gradOrig.textContent = `∇F = (${fmt([2*q.A.original[0], 2*q.A.original[1], -2*q.A.original[2]])}), ‖∇F‖ = ${q.originalGradient.toFixed(3)}${u === 0 ? " (zero: singular apex!)" : " > 0"}`;
    if (regOrig) regOrig.innerHTML = u === 0 ? "<b>Singular apex:</b> rank 0, implicit function theorem fails" : "Smooth regular point (away from apex)";
    if (distOrig) distOrig.textContent = `‖A − B‖ = ${q.originalDistance.toFixed(3)}${u === 0 ? " (coalesce to apex!)" : " (shrinks as √2|u|)"}`;
    if (distRes) distRes.textContent = `‖A − B‖ = ${q.resolvedDistance.toFixed(3)} (separated on circle E)`;
    if (areaOrig) areaOrig.textContent = `dA = ${(Math.SQRT2 * Math.abs(u)).toFixed(3)} du dθ${u === 0 ? " (metric collapsed to 0 area!)" : " > 0"}`;
    draw(original,false,u,theta);draw(resolved,true,u,theta);drawRings(u,theta);
  }
  function stop(){if(animation!==null)cancelAnimationFrame(animation);animation=null;$("cone-stop").disabled=true;}
  function animate(kind){
    stop();const start=performance.now(),from=Number(uInput.value)||.8,theta=Number(thetaInput.value),duration=kind==="sweep"?4000:2000;
    const set=p=>{if(kind==="sweep"){uInput.value="0";thetaInput.value=String(Math.round((theta+360*p)%360));}else uInput.value=String(kind==="leave"?.8*p:from*(1-p));update();};
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){set(kind==="sweep"?.25:1);return;}
    $("cone-stop").disabled=false;
    const tick=now=>{const p=Math.min(1,(now-start)/duration);set(p);if(p<1)animation=requestAnimationFrame(tick);else stop();};animation=requestAnimationFrame(tick);
  }
  for(const input of [uInput,thetaInput])input.addEventListener("input",()=>{stop();update();});
  viewInput.addEventListener("input",()=>{yaw=Number(viewInput.value)*Math.PI/180;update();});
  $("cone-approach").addEventListener("click",()=>animate("approach"));$("cone-sweep").addEventListener("click",()=>animate("sweep"));$("cone-leave").addEventListener("click",()=>animate("leave"));$("cone-stop").addEventListener("click",stop);
  $("cone-exceptional").addEventListener("click",()=>{stop();uInput.value="0";update();});
  $("cone-reset").addEventListener("click",()=>{stop();uInput.value=".6";thetaInput.value="45";viewInput.value="28";yaw=28*Math.PI/180;pitch=-.3;update();});
  for(const canvas of [original,resolved]){
    canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId,canvas};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{if(!drag||drag.canvas!==canvas||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(-1.2,Math.min(1.2,pitch+(e.clientY-drag.y)*.008));drag.x=e.clientX;drag.y=e.clientY;viewInput.value=String(Math.round(Math.atan2(Math.sin(yaw),Math.cos(yaw))*180/Math.PI));update();});
    canvas.addEventListener("keydown",e=>{const d={ArrowLeft:[-.12,0],ArrowRight:[.12,0],ArrowUp:[0,.1],ArrowDown:[0,-.1]}[e.key];if(!d)return;e.preventDefault();yaw+=d[0];pitch=Math.max(-1.2,Math.min(1.2,pitch+d[1]));update();});
    for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,()=>drag=null);
    new ResizeObserver(update).observe(canvas.parentElement);
  }
  window.addEventListener("pagehide",stop);document.addEventListener("visibilitychange",()=>{if(document.hidden)stop();});
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change",update);update();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initCone);else initCone();

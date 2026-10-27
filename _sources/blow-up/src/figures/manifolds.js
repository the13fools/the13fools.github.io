import { coneChartPoint, coneComparison, coneDirectionProbe } from "./cone-geometry.js";

function initCone() {
  const $ = id => document.getElementById(id), original = $("cone-original"), resolved = $("cone-resolved");
  if (!original || !resolved) return;
  const uInput = $("cone-u"), thetaInput = $("cone-theta"), viewInput = $("cone-view");
  const {E,T,C} = window.__E;
  const showPlane=$("cone-plane"),showSurfaces=$("cone-surfaces"),probeInput=$("cone-probe-radius");
  let yaw = 28 * Math.PI / 180, pitch = -0.3, drag = null, animation = null;
  const fmt = a => a.map(x => (Math.abs(x) < 0.0005 ? 0 : x).toFixed(2)).join(", ");
  function draw(canvas, isResolved, u, theta) {
    const rect = canvas.getBoundingClientRect(); if (!rect.width || !rect.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2), W = rect.width, H = rect.height;
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    const ctx = canvas.getContext("2d"); ctx.scale(dpr,dpr); ctx.fillStyle=C.surface; ctx.fillRect(0,0,W,H);
    const project = ([x,y,z]) => {
      const a=x*Math.cos(yaw)-y*Math.sin(yaw), b=x*Math.sin(yaw)+y*Math.cos(yaw), scale=Math.min(W,H)*(showPlane.checked?.235:.28);
      return [W/2+scale*a,H/2-scale*(z*Math.cos(pitch)-b*Math.sin(pitch)),z*Math.sin(pitch)+b*Math.cos(pitch)];
    };
    const point=(u,t)=>{const p=coneChartPoint(u,t);return project(isResolved?p.resolved:p.original);};
    const path=pts=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));};
    const quads=[], rows=24, columns=48;
    if(showSurfaces.checked)for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){
      const a=-1.2+2.4*i/rows,b=-1.2+2.4*(i+1)/rows,c=2*Math.PI*j/columns,d=2*Math.PI*(j+1)/columns;
      const pts=[point(a,c),point(b,c),point(b,d),point(a,d)];
      quads.push({pts,depth:pts.reduce((n,p)=>n+p[2],0)/4,theta:(c+d)/2});
    }
    quads.sort((a,b)=>a.depth-b.depth);
    for(const q of quads){path(q.pts);ctx.closePath();ctx.fillStyle=`hsl(${isResolved?263:211} 30% ${53+12*Math.cos(q.theta+yaw-.8)}%)`;ctx.fill();ctx.strokeStyle="rgba(255,255,255,.12)";ctx.lineWidth=.5;ctx.stroke();}
    // The ambient exceptional divisor is the whole u=0 plane in this chart.
    // Draw it transparently through the cylinder so its intersection is legible.
    if(isResolved&&showPlane.checked){
      const patch=[[-1.4,-1.4,0],[1.4,-1.4,0],[1.4,1.4,0],[-1.4,1.4,0]].map(project);
      path(patch);ctx.closePath();ctx.globalAlpha=.12;ctx.fillStyle=C.blow;ctx.fill();ctx.globalAlpha=.65;ctx.strokeStyle=C.blow;ctx.lineWidth=1;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
      for(const a of [-1,-.5,0,.5,1])for(const pts of [[[a,-1.4,0],[a,1.4,0]],[[-1.4,a,0],[1.4,a,0]]]){path(pts.map(project));ctx.globalAlpha=.23;ctx.strokeStyle=C.blow;ctx.lineWidth=.7;ctx.stroke();}
      ctx.globalAlpha=1;
    }
    const ring=level=>Array.from({length:97},(_,j)=>point(level,2*Math.PI*j/96));
    if(isResolved){path(ring(0));ctx.strokeStyle=C.surface;ctx.lineWidth=7;ctx.stroke();ctx.strokeStyle=C.blow;ctx.lineWidth=3.5;ctx.stroke();}
    if(showSurfaces.checked){path(ring(u));ctx.strokeStyle=C.ink;ctx.lineWidth=1.6;ctx.setLineDash([3,3]);ctx.stroke();ctx.setLineDash([]);}
    if(showPlane.checked){
      const probe=coneDirectionProbe(Number(probeInput.value),theta),p=project(isResolved?probe.chart:probe.original);
      ctx.beginPath();ctx.arc(p[0],p[1],8,0,2*Math.PI);ctx.fillStyle=C.surface;ctx.fill();ctx.strokeStyle=C.muted;ctx.lineWidth=2;ctx.stroke();
      ctx.font="bold 12px system-ui";ctx.fillStyle=C.muted;
      if(isResolved)ctx.fillText("Q",Math.max(8,Math.min(W-18,p[0]-17)),Math.max(18,Math.min(H-30,p[1]+18)));
    }
    if(!isResolved){const p=project([0,0,0]);ctx.beginPath();ctx.arc(p[0],p[1],4,0,2*Math.PI);ctx.fillStyle=C.blow;ctx.fill();ctx.font="12px system-ui";ctx.fillStyle=C.blow;ctx.fillText("old apex O",p[0]+12,p[1]+24);}
    [theta,theta+Math.PI/2].forEach((t,i)=>{
      if(showSurfaces.checked){path([point(-1.2,t),point(1.2,t)]);ctx.strokeStyle=i?C.hot:C.cold;ctx.lineWidth=1.5;ctx.setLineDash([5,4]);ctx.stroke();ctx.setLineDash([]);}
      const p=point(u,t), radius=!isResolved&&u===0?(i?5:9):6;
      ctx.beginPath();ctx.arc(p[0],p[1],radius,0,2*Math.PI);ctx.fillStyle=i?C.hot:C.cold;ctx.fill();ctx.strokeStyle=C.surface;ctx.lineWidth=2;ctx.stroke();
      if(isResolved||u!==0||i===0){ctx.font="bold 13px system-ui";ctx.fillStyle=C.ink;ctx.fillText(!isResolved&&u===0?"A = B":i?"B":"A",Math.max(8,Math.min(W-48,p[0]+10)),Math.max(18,Math.min(H-30,p[1]-10)));}
    });
    ctx.font="12px system-ui";ctx.fillStyle=C.muted;ctx.fillText(isResolved?"u vertical · v, w horizontal":"Z vertical · X, Y horizontal",12,H-12);
    if(isResolved&&showPlane.checked){ctx.fillStyle=C.blow;ctx.fillText("Pale plane: ambient E (u = 0)",12,22);ctx.fillText("Bold circle: exceptional curve",12,40);}
  }
  function drawRings(theta){
    const svg=$("cone-rings"),W=Math.max(260,svg.getBoundingClientRect().width),narrow=W<560,H=narrow?410:280,R=narrow?65:67;
    const cx=narrow?W/2:W*.75,cy=narrow?120:130,ox=narrow?W/2:W*.22,oy=narrow?340:130;
    const rho=Number(probeInput.value),on=Math.abs(rho-1)<1e-9,probe=coneDirectionProbe(rho,theta),[v,w]=probe.chart;
    svg.replaceChildren();svg.setAttribute("viewBox",`0 0 ${W} ${H}`);
    const write=(x,y,text,color=C.ink,size=12)=>T(svg,x,y,text,color,{at:{"text-anchor":"middle"},st:`;font-size:${size}px`});
    E("rect",{x:cx-1.4*R,y:cy-1.4*R,width:2.8*R,height:2.8*R,fill:C.blow,"fill-opacity":.08,stroke:C.blow,"stroke-opacity":.5,"stroke-dasharray":"4 4"},svg);
    for(const a of [-1,-.5,0,.5,1]){
      E("line",{x1:cx+a*R,x2:cx+a*R,y1:cy-1.4*R,y2:cy+1.4*R,stroke:C.rule},svg);
      E("line",{x1:cx-1.4*R,x2:cx+1.4*R,y1:cy+a*R,y2:cy+a*R,stroke:C.rule},svg);
    }
    E("circle",{cx,cy,r:R,fill:"none",stroke:C.blow,"stroke-width":3.5},svg);
    E("line",{x1:cx,y1:cy,x2:cx+R*v,y2:cy-R*w,stroke:C.muted,"stroke-dasharray":"3 3"},svg);
    E("circle",{cx:cx+R*v,cy:cy-R*w,r:7,fill:C.surface,stroke:on?C.blow:C.muted,"stroke-width":2},svg);
    [theta,theta+Math.PI/2].forEach((a,j)=>{
      const x=cx+R*Math.cos(a),y=cy-R*Math.sin(a);
      E("circle",{cx:x,cy:y,r:4.5,fill:j?C.hot:C.cold,stroke:C.surface,"stroke-width":1.5},svg);
      write(x+10,y-10,j?"B":on?"A = Q":"A",j?C.hot:C.cold);
    });
    if(!on)write(cx+R*v+12,cy-R*w+19,"Q",C.muted);
    write(cx+R*1.25,cy-5,"v",C.muted);write(cx+9,cy-R*1.23,"w",C.muted);
    E("circle",{cx:ox,cy:oy,r:9,fill:C.surface,stroke:C.muted,"stroke-width":2},svg);
    E("circle",{cx:ox,cy:oy,r:5,fill:C.blow},svg);write(ox+19,oy-10,"O",C.blow,14);
    if(narrow){
      write(cx,18,"Ambient E: plane u = 0 · dimension 2",C.blow,13);
      write(cx,232,"Exceptional circle · dimension 1",C.blow);
      E("line",{x1:cx,y1:248,x2:cx,y2:306,stroke:C.muted,"stroke-width":1.5},svg);
      E("path",{d:`M${cx-5} 298 L${cx} 307 L${cx+5} 298`,fill:"none",stroke:C.muted,"stroke-width":1.5},svg);
      write(cx+65,280,"π forgets (v, w)",C.muted,11);
      write(ox,378,"Old apex: one point · dimension 0",C.ink,13);
      write(ox,400,"Every (v, w, 0) maps here.",C.muted);
    }else{
      write(cx,22,"Ambient E: plane u = 0 · dimension 2",C.blow,13);
      write(ox,22,"Old apex: one point · dimension 0",C.ink,13);
      const x1=cx-1.4*R-15,x2=ox+28;
      E("line",{x1,y1:oy,x2,y2:oy,stroke:C.muted,"stroke-width":1.5},svg);
      E("path",{d:`M${x2+8} ${oy-5} L${x2} ${oy} L${x2+8} ${oy+5}`,fill:"none",stroke:C.muted,"stroke-width":1.5},svg);
      write((x1+x2)/2,oy-13,"π forgets (v, w)",C.muted);
      write(cx,246,"Exceptional circle on cone · dimension 1",C.blow);
      write(ox,246,"Every (v, w, 0) maps here.",C.muted);
    }
  }
  function update(){
    const u=Number(uInput.value), degrees=Number(thetaInput.value), theta=degrees*Math.PI/180, q=coneComparison(u,theta);
    $("cone-u-out").textContent=u.toFixed(2);$("cone-theta-out").textContent=`${degrees}°`;$("cone-view-out").textContent=`${viewInput.value}°`;
    $("cone-state").textContent=!showSurfaces.checked?(showPlane.checked?"Exceptional-set view: the pale plane is u = 0 in the new ambient chart. Its bold circle belongs to the resolved cone. The entire plane maps to the one old apex O.":"Exceptional-circle view: all the violet circle’s points map to the old apex O. Turn on the ambient plane to see the surrounding direction records."):u===0?"At u = 0: A and B are different points on the exceptional circle, but both map to the same old apex. Turn θ: the resolved records move; the old position stays fixed.":"Track two directions 90° apart. As u approaches 0, their old positions merge. Their resolved records stay distinct.";
    $("cone-original-record").textContent=`A = (${fmt(q.A.original)}) · B = (${fmt(q.B.original)}). Distance = ${q.originalDistance.toFixed(3)}.`;
    $("cone-resolved-record").textContent=`A = (${fmt(q.A.resolved)}) · B = (${fmt(q.B.resolved)}). Distance = ${q.resolvedDistance.toFixed(3)}.`;
    $("cone-original-test").textContent=`Old equation: F = X² + Y² − Z² = 0. ‖∇F‖ = ${q.originalGradient.toFixed(3)}. ${u===0?"Zero gradient: the apex is singular.":"Nonzero here; tends to zero at the apex."}`;
    $("cone-resolved-test").textContent="New equation: g = v² + w² − 1 = 0. ‖∇g‖ = 2 everywhere: the cylinder is smooth, including its exceptional circle.";
    $("cone-point").textContent=`π(A): (${fmt(q.A.resolved)}) → (${fmt(q.A.original)}). ${u===0?"The circle E is the fiber over the apex.":"Off E, v = X/Z and w = Y/Z recover the direction uniquely."}`;
    $("cone-nash-record").textContent=`Limiting normal directions: A [${fmt([q.A.resolved[0],q.A.resolved[1],-1])}], B [${fmt([q.B.resolved[0],q.B.resolved[1],-1])}]. These label the planes vX + wY − Z = 0; at the apex they remain different even though the old position is the same.`;
    const gradOrig = $("cone-row-grad-orig"), regOrig = $("cone-row-reg-orig"), distOrig = $("cone-row-dist-orig"), distRes = $("cone-row-dist-res"), areaOrig = $("cone-row-area-orig");
    if (gradOrig) gradOrig.textContent = `∇F = (${fmt([2*q.A.original[0], 2*q.A.original[1], -2*q.A.original[2]])}), ‖∇F‖ = ${q.originalGradient.toFixed(3)}${u === 0 ? " (zero: singular apex)" : " > 0"}`;
    if (regOrig) regOrig.innerHTML = u === 0 ? "<b>Singular apex:</b> rank 0, implicit function theorem fails" : "Smooth regular point (away from apex)";
    if (distOrig) distOrig.textContent = `‖A − B‖ = ${q.originalDistance.toFixed(3)}${u === 0 ? " (both at the apex)" : " (shrinks as √2|u|)"}`;
    if (distRes) distRes.textContent = `‖A − B‖ = ${q.resolvedDistance.toFixed(3)} (direction records stay distinct)`;
    if (areaOrig) areaOrig.textContent = `dA = ${(Math.SQRT2 * Math.abs(u)).toFixed(3)} du dθ${u === 0 ? " (pullback area vanishes)" : " > 0"}`;
    const rho=Number(probeInput.value),probe=coneDirectionProbe(rho,theta),on=Math.abs(rho-1)<1e-9;
    $("cone-probe-out").textContent=rho.toFixed(2);
    $("cone-probe-result").textContent=`Q = (${fmt(probe.chart)}) has image π(Q) = (0, 0, 0). ${on?"Q is on the exceptional circle: it belongs to both the ambient exceptional plane and the resolved cone.":`Q is on the ambient exceptional plane, but off the resolved cone: v² + w² = ${(rho*rho).toFixed(3)}, not 1.`} ${on?"It is a limiting direction of cone points.":rho===0?"Even the new chart’s origin represents a direction: [0:0:1], the old Z-axis, which is not a direction along the cone.":"Move Q to ρ = 1 to select a direction used by the cone."}`;
    draw(original,false,u,theta);draw(resolved,true,u,theta);drawRings(theta);
  }
  function stop(){if(animation!==null)cancelAnimationFrame(animation);animation=null;$("cone-stop").disabled=true;}
  function animate(kind){
    stop();if(kind!=="sweep")showSurfaces.checked=true;const start=performance.now(),from=Number(uInput.value)||.8,theta=Number(thetaInput.value),duration=kind==="sweep"?4000:2000;
    const set=p=>{if(kind==="sweep"){uInput.value="0";thetaInput.value=String(Math.round((theta+360*p)%360));}else uInput.value=String(kind==="leave"?.8*p:from*(1-p));update();};
    if(matchMedia("(prefers-reduced-motion: reduce)").matches){set(kind==="sweep"?.25:1);return;}
    $("cone-stop").disabled=false;
    const tick=now=>{const p=Math.min(1,(now-start)/duration);set(p);if(p<1)animation=requestAnimationFrame(tick);else stop();};animation=requestAnimationFrame(tick);
  }
  $("cone-inspect").addEventListener("click",()=>{stop();uInput.value="0";showPlane.checked=true;showSurfaces.checked=false;pitch=-.7;yaw=.35;viewInput.value="20";update();});
  for(const input of [showPlane,showSurfaces])input.addEventListener("change",update);
  probeInput.addEventListener("input",update);
  $("cone-probe-on").addEventListener("click",()=>{probeInput.value="1";update();});
  $("cone-probe-off").addEventListener("click",()=>{probeInput.value=".55";update();});
  for(const input of [uInput,thetaInput])input.addEventListener("input",()=>{stop();update();});
  viewInput.addEventListener("input",()=>{yaw=Number(viewInput.value)*Math.PI/180;update();});
  $("cone-approach").addEventListener("click",()=>animate("approach"));$("cone-sweep").addEventListener("click",()=>animate("sweep"));$("cone-leave").addEventListener("click",()=>animate("leave"));$("cone-stop").addEventListener("click",stop);
  $("cone-exceptional").addEventListener("click",()=>{stop();uInput.value="0";update();});
  $("cone-reset").addEventListener("click",()=>{stop();uInput.value=".6";thetaInput.value="45";viewInput.value="28";showPlane.checked=true;showSurfaces.checked=true;probeInput.value=".55";yaw=28*Math.PI/180;pitch=-.3;update();});
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

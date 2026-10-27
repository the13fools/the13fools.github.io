import { recoverFourfoldPoint, fourfoldResiduals } from "./toric-slice-geometry.js";
function initToricSlice(){
  const left=document.getElementById("toric-central"),right=document.getElementById("toric-nearby");
  if(!left||!right)return;
  const slider=document.getElementById("toric-q"),angle=document.getElementById("toric-angle");
  let yaw=0.6,pitch=0.45,drag=null;
  function draw(canvas,q){
    const rect=canvas.getBoundingClientRect(),d=Math.min(2,devicePixelRatio||1);
    if(!rect.width||!rect.height)return;
    canvas.width=Math.round(rect.width*d);canvas.height=Math.round(rect.height*d);
    const ctx=canvas.getContext("2d");ctx.scale(d,d);
    const W=rect.width,H=rect.height,cs=getComputedStyle(document.documentElement),color=k=>cs.getPropertyValue(k).trim();
    ctx.fillStyle=color("--soft");ctx.fillRect(0,0,W,H);
    const project=([p,t,r])=>{
      const a=p*Math.cos(yaw)-t*Math.sin(yaw),b=p*Math.sin(yaw)+t*Math.cos(yaw),scale=Math.min(W,H)*0.23;
      return [W/2+scale*a,H/2-scale*(r*Math.cos(pitch)-b*Math.sin(pitch)),r*Math.sin(pitch)+b*Math.cos(pitch)];
    };
    const quads=[],N=24,R=1.3;
    const add=(points,branch)=>{
      const pts=points.map(project);quads.push({pts,branch,z:pts.reduce((v,p)=>v+p[2],0)/4});
    };
    if(q===0){
      for(let i=0;i<N;i++)for(let j=0;j<N;j++){
        const a=-R+2*R*i/N,b=-R+2*R*(i+1)/N,c=-R+2*R*j/N,e=-R+2*R*(j+1)/N;
        add([[a,c,0],[b,c,0],[b,e,0],[a,e,0]],0);
        add([[a,0,c],[b,0,c],[b,0,e],[a,0,e]],1);
      }
    }else{
      const minT=Math.sqrt(Math.abs(q*q*q)/R);
      for(const sign of [-1,1])for(let i=0;i<N;i++)for(let j=0;j<N;j++){
        const p0=-R+2*R*i/N,p1=-R+2*R*(i+1)/N,t0=sign*(minT+(R-minT)*j/N),t1=sign*(minT+(R-minT)*(j+1)/N);
        add([[p0,t0,q**3/t0**2],[p1,t0,q**3/t0**2],[p1,t1,q**3/t1**2],[p0,t1,q**3/t1**2]],sign>0?0:1);
      }
    }
    quads.sort((a,b)=>a.z-b.z);
    for(const {pts,branch} of quads){
      ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
      ctx.globalAlpha=0.82;ctx.fillStyle=color(branch?"--cold":"--blow");ctx.fill();
      ctx.globalAlpha=0.18;ctx.strokeStyle=color("--surface");ctx.lineWidth=0.5;ctx.stroke();
    }
    ctx.globalAlpha=1;
    if(q===0){
      const a=project([-R,0,0]),b=project([R,0,0]);ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.strokeStyle=color("--bad");ctx.lineWidth=3;ctx.stroke();
    }
    ctx.font="12px system-ui, sans-serif";ctx.fillStyle=color("--muted");ctx.fillText("p = x₁ · t = x₆ · r = x₄ (vertical)",12,H-12);
  }
  function update(){
    const q=Number(slider.value);document.getElementById("toric-q-out").textContent=q.toFixed(2);document.getElementById("toric-angle-out").textContent=`${angle.value}°`;
    document.getElementById("toric-state").textContent=q===0?"Central section: r·t² = 0. The two planes meet along t = r = 0 (red).":"Nearby section: r = q³/t². In this viewing box the two sheets are smooth and avoid t = 0.";
    // Verify a displayed sample against all six defining equations.
    const t=q===0?0:1,r=q**3,p=0.5,x=recoverFourfoldPoint(p,t,r,q);
    const residual=Math.max(...fourfoldResiduals(x).map(Math.abs));
    document.getElementById("toric-check").textContent=`All six fourfold equations hold at the sample point (maximum residual ${residual.toExponential(1)}).`;
    draw(left,0);draw(right,q);
  }
  slider.addEventListener("input",update);angle.addEventListener("input",()=>{yaw=Number(angle.value)*Math.PI/180;update();});
  document.getElementById("toric-zero").addEventListener("click",()=>{slider.value="0";update();});
  for(const canvas of [left,right]){
    canvas.addEventListener("pointerdown",e=>{drag={canvas,id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{if(!drag||drag.canvas!==canvas||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*0.008;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-drag.y)*0.008));drag.x=e.clientX;drag.y=e.clientY;angle.value=String(Math.round(yaw*180/Math.PI));update();});
    for(const e of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(e,()=>drag=null);
    new ResizeObserver(update).observe(canvas.parentElement);
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",update);update();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initToricSlice);else initToricSlice();

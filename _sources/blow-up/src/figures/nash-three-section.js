import { sectionPoint,sectionProjection,threefoldResiduals } from "./nash-three-section-geometry.js";

function init(){
  const canvas=document.getElementById("nash3-surface"),svg=document.getElementById("nash3-cut");
  if(!canvas||!svg)return;
  const slider=document.getElementById("nash3-cut-b"),rotation=document.getElementById("nash3-section-angle");
  const {$,E,C,frame,pathD,T}=window.__E;
  let yaw=0.7,pitch=0.45,drag=null;
  const limit=1.12;
  function draw(){
    const B=Number(slider.value),rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const d=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(rect.width*d);canvas.height=Math.round(rect.height*d);
    const ctx=canvas.getContext("2d");ctx.scale(d,d);const W=rect.width,H=rect.height;
    ctx.fillStyle=C.soft;ctx.fillRect(0,0,W,H);
    const project=([a,b,c])=>{
      const x=a*Math.cos(yaw)-(b-0.35)*Math.sin(yaw),y=a*Math.sin(yaw)+(b-0.35)*Math.cos(yaw),k=Math.min(W,H)*0.25;
      return [W/2+k*x,H/2-k*(c*Math.cos(pitch)-y*Math.sin(pitch)),c*Math.sin(pitch)+y*Math.cos(pitch)];
    };
    const point=(s,u)=>sectionProjection(sectionPoint(s,u));
    const quads=[],N=26;
    for(const sign of [-1,1])for(let i=0;i<N;i++)for(let j=0;j<N;j++){
      const s0=sign*limit*i/N,s1=sign*limit*(i+1)/N,u0=-limit+2*limit*j/N,u1=-limit+2*limit*(j+1)/N;
      const pts=[point(s0,u0),point(s1,u0),point(s1,u1),point(s0,u1)].map(project);
      quads.push({pts,col:sign>0?C.hot:C.cold,depth:pts.reduce((s,p)=>s+p[2],0)/4});
    }
    quads.sort((a,b)=>a.depth-b.depth);
    for(const q of quads){
      ctx.beginPath();q.pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();
      ctx.globalAlpha=0.48;ctx.fillStyle=q.col;ctx.fill();ctx.globalAlpha=0.12;ctx.strokeStyle=C.surface;ctx.lineWidth=0.5;ctx.stroke();
    }
    ctx.globalAlpha=1;
    const stroke=(pts,col,width=2,dash=[])=>{
      ctx.beginPath();pts.map(project).forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
      ctx.strokeStyle=col;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
    };
    const label=(p,text,col)=>{const q=project(p);ctx.font="12px system-ui, sans-serif";ctx.lineWidth=4;ctx.strokeStyle=C.soft;ctx.strokeText(text,q[0]+5,q[1]-7);ctx.fillStyle=col;ctx.fillText(text,q[0]+5,q[1]-7);};
    // These are the two singular lines of this actual x₄=1 section.
    stroke([[0,-0.7,0],[0,limit*limit,0]],C.bad,3.5);
    stroke([[0,0,-(limit**3)],[0,0,limit**3]],C.bad,3.5);
    if(B>0)for(const sign of [-1,1])stroke(Array.from({length:121},(_,i)=>point(sign*Math.sqrt(B),-limit+2*limit*i/120)),C.blow,3);
    else if(B===0)stroke([[0,0,-(limit**3)],[0,0,limit**3]],C.blow,4,[6,4]);
    else {const p=project([0,B,0]);ctx.beginPath();ctx.arc(p[0],p[1],6,0,2*Math.PI);ctx.fillStyle=C.blow;ctx.fill();}
    label([limit,0,0],"A = x₁",C.ink);label([0,limit*limit,0],"B = x₂",C.ink);label([0,0,limit**3],"C = x₆",C.ink);
    const width=Math.max(260,svg.getBoundingClientRect().width);
    const F=frame(svg,{W:width,H:310,l:43,r:16,t:18,b:43,xr:[-1.35,1.35],yr:[-1.5,1.5],xt:[[-1,"−1"],[0,"0"],[1,"1"]],yt:[[-1,"−1"],[0,"0"],[1,"1"]],xlab:"A = x₁",ylab:"C = x₆"});
    if(B>0)for(const sign of [-1,1]){
      const pts=Array.from({length:181},(_,i)=>{const u=-limit+2*limit*i/180;return [sign*Math.sqrt(B)*u,u**3];});
      E("path",{d:pathD(pts,F.X,F.Y),fill:"none",stroke:sign>0?C.hot:C.cold,"stroke-width":3},F.g);
      E("line",{x1:F.X(-1.35),y1:F.Y(0),x2:F.X(1.35),y2:F.Y(0),stroke:C.steel,"stroke-dasharray":"4 4"},F.g);
    }else if(B===0)E("line",{x1:F.X(0),x2:F.X(0),y1:F.Y(-1.5),y2:F.Y(1.5),stroke:C.bad,"stroke-width":4},F.g);
    if(B!==0)E("circle",{cx:F.X(0),cy:F.Y(0),r:6,fill:C.bad,stroke:C.surface,"stroke-width":2},F.g);
    $("#nash3-cut-b-out").textContent=B.toFixed(2);$("#nash3-section-angle-out").textContent=`${rotation.value}°`;
    $("#nash3-section-state").textContent=B>0
      ? `B = ${B.toFixed(2)}: C = ±A³/B³ᐟ². Two real branches have the same tangent C = 0 at the red origin. The branch colors refer to this real section, not to irreducible components of the whole threefold.`
      : B===0?"B = 0: the section is the entire C-axis. Every point on this line is algebraically singular in the threefold."
      :"B < 0: A⁶ = B³C² forces A = C = 0. Only one real point remains in this cut; the negative B-axis is included in the full zero set.";
    const sample=sectionPoint(0.6,0.7),res=Math.max(...threefoldResiduals(sample).map(Math.abs));
    $("#nash3-section-check").textContent=`Mesh vertices satisfy all five defining equations (sample residual ${res.toExponential(1)}). This is a real surface section of a threefold in six ambient coordinates.`;
  }
  slider.addEventListener("input",draw);rotation.addEventListener("input",()=>{yaw=Number(rotation.value)*Math.PI/180;draw();});
  document.getElementById("nash3-central-cut").addEventListener("click",()=>{slider.value="0";draw();});
  canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointermove",e=>{if(!drag||drag.id!==e.pointerId)return;yaw+=(e.clientX-drag.x)*0.008;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-drag.y)*0.008));drag.x=e.clientX;drag.y=e.clientY;rotation.value=String(Math.round(yaw*180/Math.PI));draw();});
  for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,()=>drag=null);
  new ResizeObserver(draw).observe(canvas.parentElement);window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",draw);draw();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();

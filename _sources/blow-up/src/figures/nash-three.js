import { H,H1,H2,U,U_INVERSE,HOLE,FIRST_RECIPES,SECOND_RECIPES,multiply,scale } from "./nash-three-geometry.js";

function initNashThree() {
  const original=document.getElementById("nash3-original");
  const current=document.getElementById("nash3-current");
  if(!original||!current) return;
  const selector=document.getElementById("nash3-generator");
  const rotation=document.getElementById("nash3-rotation");
  const stages=[...document.querySelectorAll("[data-nash3-stage]")];
  let stage=0,selected=1,yaw=0.65,pitch=0.38,drag=null;
  const sub=n=>String(n).replace(/\d/g,d=>"₀₁₂₃₄₅₆₇₈₉"[Number(d)]);
  const fmt=v=>`(${v.join(", ")})`;
  const names=(prefix,gens)=>gens.map((_,i)=>prefix+sub(i+1));
  const hNames=names("h",H),gNames=names("g",H1),tNames=names("t",H2);
  function source() {
    return stage===0 ? H1 : stage===1 ? H2 : H2.map(t=>multiply(U_INVERSE,t));
  }
  function currentNames(){return stage===0?gNames:stage===1?tNames:hNames;}
  function options() {
    selector.replaceChildren(...source().map((v,i)=>{
      const option=document.createElement("option"); option.value=String(i);
      option.textContent=`${currentNames()[i]} = ${fmt(v)}`; return option;
    }));
    selector.value=String(selected);
  }

  function draw(canvas,gens,labels,isOriginal) {
    const rect=canvas.getBoundingClientRect();
    if(!rect.width||!rect.height) return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr);
    const ctx=canvas.getContext("2d"); ctx.scale(dpr,dpr);
    const W=rect.width,Ht=rect.height;
    const css=getComputedStyle(document.documentElement),col=n=>css.getPropertyValue(n).trim();
    ctx.fillStyle=col("--soft");ctx.fillRect(0,0,W,Ht);
    const hole=isOriginal||stage===2?HOLE:stage===1?multiply(U,HOLE):null;
    const triple=hole?scale(hole,3):null;
    const highlight=isOriginal?(stage===0?FIRST_RECIPES[selected].filter(i=>i!==null):[selected]):[selected];
    const axisLength=2;
    const axes=[[axisLength,0,0],[0,axisLength,0],[0,0,axisLength]];
    const projectRaw=([x,y,z])=>{
      const a=x*Math.cos(yaw)-y*Math.sin(yaw),b=x*Math.sin(yaw)+y*Math.cos(yaw);
      return [a,z*Math.cos(pitch)-b*Math.sin(pitch)];
    };
    const raw=[...gens,[0,0,0],...axes,...(hole?[hole,triple]:[])].map(projectRaw);
    const minX=Math.min(...raw.map(p=>p[0])),maxX=Math.max(...raw.map(p=>p[0]));
    const minY=Math.min(...raw.map(p=>p[1])),maxY=Math.max(...raw.map(p=>p[1]));
    const fit=Math.min((W-76)/(maxX-minX||1),(Ht-76)/(maxY-minY||1));
    const project=p=>{const [x,y]=projectRaw(p);return [W/2+fit*(x-(minX+maxX)/2),Ht/2-fit*(y-(minY+maxY)/2)];};
    function line(a,b,color,width=1,dash=[]) {
      const p=project(a),q=project(b);ctx.beginPath();ctx.moveTo(...p);ctx.lineTo(...q);
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.stroke();ctx.setLineDash([]);
    }
    function dot(v,color,r=4,hollow=false) {
      const p=project(v);ctx.beginPath();ctx.arc(...p,r,0,Math.PI*2);
      ctx.fillStyle=hollow?col("--soft"):color;ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();
    }
    // Labels retain screen-space size as the 3D view turns.
    const placed=[];
    function label(v,text,color) {
      const [x,y]=project(v);ctx.font="12px system-ui, sans-serif";
      const width=ctx.measureText(text).width;
      let best=null;
      for(const [dx,dy] of [[9,-9],[9,18],[-width-9,-9],[-width-9,18],[9,-24],[-width-9,-24]]) {
        const left=Math.max(5,Math.min(W-width-5,x+dx)),top=Math.max(17,Math.min(Ht-8,y+dy));
        const overlap=placed.reduce((s,b)=>s+(left<b.x+b.w&&left+width>b.x&&top-13<b.y+4&&top>b.y-13?1:0),0);
        if(!best||overlap<best.overlap)best={x:left,y:top,w:width,overlap};
        if(overlap===0)break;
      }
      placed.push(best);ctx.lineWidth=3;ctx.strokeStyle=col("--soft");ctx.strokeText(text,best.x,best.y);
      ctx.fillStyle=color;ctx.fillText(text,best.x,best.y);
    }
    axes.forEach((a,i)=>{
      line(scale(a,-0.45),a,col("--rule"));
      label(a,["x","y","z"][i],col("--muted"));
    });
    const O=[0,0,0];
    gens.forEach((v,i)=>line(O,v,col(highlight.includes(i)?"--blow":"--steel"),highlight.includes(i)?2.5:1));
    if(hole){line(O,triple,col("--steel"),1,[3,4]);dot(triple,col("--cold"));dot(hole,col("--hot"),6,true);}
    if(isOriginal&&stage===0){
      const [end,start]=FIRST_RECIPES[selected];
      if(start!==null) line(H[start],H[end],col("--blow"),2.5,[5,3]);
    }
    gens.forEach((v,i)=>dot(v,col(highlight.includes(i)?"--blow":"--cold"),highlight.includes(i)?5:3));
    dot(O,col("--muted"),2);
    // Selected labels and the missing-point witness take precedence.
    highlight.forEach(i=>label(gens[i],labels[i],col("--blow")));
    if(hole){label(hole,isOriginal||stage===2?"u ∉ S":"U₃u ∉ T",col("--hot"));label(triple,isOriginal||stage===2?"3u ∈ S":"3U₃u ∈ T",col("--cold"));}
    gens.forEach((v,i)=>{if(!highlight.includes(i))label(v,labels[i],col("--muted"));});
  }

  function update() {
    stages.forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.nash3Stage)===stage)));
    const vectors=source(),labels=currentNames();
    const headings=["First Nash chart · 8 generators","Second Nash chart · 6 generators","After U₃⁻¹ · the original 6 generators"];
    document.getElementById("nash3-heading").textContent=headings[stage];
    document.getElementById("nash3-rotation-out").textContent=`${rotation.value}°`;
    const i=selected;
    let equation,summary;
    if(stage===0){
      const [end,start]=FIRST_RECIPES[i];
      equation=`${gNames[i]} = ${hNames[end]}${start===null?"":` − ${hNames[start]}`} = ${fmt(H1[i])}.`;
      summary="Choose A = {h₁, h₄, h₆}, det A = 3. The first Nash chart is generated by g₁,…,g₈. A dashed violet segment on the left shows the selected difference.";
    }else if(stage===1){
      const [end,start]=SECOND_RECIPES[i];
      equation=`${tNames[i]} = ${gNames[end]}${start===null?"":` − ${gNames[start]}`} = ${fmt(H2[i])} = U₃${hNames[i]}.`;
      summary="Choose A₁ = {g₁, g₅, g₇}, det A₁ = −2. This second Nash chart has generators t₁,…,t₆, with tᵢ = U₃hᵢ for every i.";
    }else{
      equation=`U₃⁻¹ ${tNames[i]} = ${hNames[i]} = ${fmt(vectors[i])}. All six generator pairs agree exactly.`;
      summary="U₃ is an integer lattice automorphism (det U₃ = 1). This is a change of lattice basis, not a third blowup. The entire semigroup T becomes S, including its missing-point witness.";
    }
    document.getElementById("nash3-equation").textContent=equation;
    document.getElementById("nash3-status").textContent=summary;
    document.getElementById("nash3-caption").textContent=stage===0?"X(S_A) has dimension 3 and 8 monomial coordinates.":stage===1?"X(T) has dimension 3 and 6 monomial coordinates.":"X(T) ≅ X(S): a singular affine chart recurs after two Nash blowups.";
    draw(original,H,hNames,true);draw(current,vectors,stage===0?labels.map((name,i)=>i===1?"g₂ = u":name):labels,false);
  }
  stages.forEach(button=>button.addEventListener("click",()=>{stage=Number(button.dataset.nash3Stage);selected=stage===0?1:0;options();update();}));
  selector.addEventListener("change",()=>{selected=Number(selector.value);update();});
  rotation.value=String(Math.round(yaw*180/Math.PI));
  rotation.addEventListener("input",()=>{yaw=Number(rotation.value)*Math.PI/180;update();});
  for(const canvas of [original,current]){
    canvas.addEventListener("pointerdown",e=>{drag={x:e.clientX,y:e.clientY,canvas,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener("pointermove",e=>{
      if(!drag||drag.canvas!==canvas||drag.id!==e.pointerId)return;
      yaw+=(e.clientX-drag.x)*0.008;yaw=Math.atan2(Math.sin(yaw),Math.cos(yaw));
      pitch=Math.max(-1.1,Math.min(1.1,pitch+(e.clientY-drag.y)*0.008));
      drag.x=e.clientX;drag.y=e.clientY;rotation.value=String(Math.round(yaw*180/Math.PI));update();
    });
    for(const event of ["pointerup","pointercancel","lostpointercapture"])canvas.addEventListener(event,()=>{drag=null;});
    new ResizeObserver(update).observe(canvas.parentElement);
  }
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",update);
  options();update();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initNashThree);
else initNashThree();

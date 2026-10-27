import { H,H1,H2,U,U_INVERSE,HOLE,FIRST_HOLE,FIRST_RECIPES,SECOND_RECIPES,multiply,scale } from "./nash-three-geometry.js";

function initNashThree() {
  const original=document.getElementById("nash3-original");
  const current=document.getElementById("nash3-current");
  if(!original||!current) return;
  const selector=document.getElementById("nash3-generator");
  const rotation=document.getElementById("nash3-rotation");
  const stages=[...document.querySelectorAll("[data-nash3-stage]")];
  let stage=-1,selected=0,yaw=0.65,pitch=0.38,drag=null;
  const sub=n=>String(n).replace(/\d/g,d=>"₀₁₂₃₄₅₆₇₈₉"[Number(d)]);
  const fmt=v=>`(${v.join(", ")})`;
  const names=(prefix,gens)=>gens.map((_,i)=>prefix+sub(i+1));
  const hNames=names("h",H),gNames=names("g",H1),tNames=names("t",H2);
  function source() {
    return stage===-1 ? H : stage===0 ? H1 : stage===1 ? H2 : H2.map(t=>multiply(U_INVERSE,t));
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
    const hole=isOriginal||stage===-1||stage===2?HOLE:stage===1?multiply(U,HOLE):FIRST_HOLE;
    const multiple=!isOriginal&&stage===0?2:3;
    const triple=scale(hole,multiple);
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
      label(a,["a exponent","b exponent","c exponent"][i],col("--muted"));
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
    if(hole){
      const base=isOriginal||stage===-1||stage===2;
      label(hole,base?"u ∉ S":stage===0?"w ∉ Sₐ":"U₃u ∉ T",col("--hot"));
      label(triple,base?"3u ∈ S":stage===0?"2w = g₇ ∈ Sₐ":"3U₃u ∈ T",col("--cold"));
    }
    gens.forEach((v,i)=>{if(!highlight.includes(i))label(v,labels[i],col("--muted"));});
  }

  function drawRoute(){
    const svg=document.getElementById('nash3-route'),{E,T,C}=window.__E;
    const W=Math.max(260,svg.getBoundingClientRect().width),gap=22,margin=8,box=(W-2*margin-2*gap)/3;
    svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${W} 135`);
    const active=Math.min(2,stage+1),middle=i=>margin+i*(box+gap)+box/2;
    T(svg,W/2,9,'Solid arrows: one Nash step, then keep one chart',C.muted,{at:{'text-anchor':'middle'},st:';font-size:10px'});
    for(let i=0;i<3;i++){
      E('rect',{x:margin+i*(box+gap),y:14,width:box,height:58,rx:6,fill:i===active?C.soft:C.surface,stroke:i===active?C.blow:C.rule,'stroke-width':i===active?2:1},svg);
      T(svg,middle(i),37,['Start X','1st chart Y','2nd chart Z'][i],C.ink,{at:{'text-anchor':'middle'},st:';font-size:12px;font-weight:600'});
      T(svg,middle(i),57,i===2?'singular · ≅ X':'singular',C.bad,{at:{'text-anchor':'middle'},st:';font-size:11px'});
      if(i<2){const x=margin+(i+1)*box+i*gap;E('line',{x1:x+3,x2:x+gap-4,y1:43,y2:43,stroke:C.ink},svg);E('path',{d:`M${x+gap-4} 43 l-5 -3 v6 Z`,fill:C.ink},svg);}
    }
    E('path',{d:`M${middle(2)} 75 V100 H${middle(0)} V75`,fill:'none',stroke:stage===2?C.blow:C.steel,'stroke-width':1.6,'stroke-dasharray':'4 4'},svg);
    E('path',{d:`M${middle(0)} 75 l-3 5 h6 Z`,fill:stage===2?C.blow:C.steel},svg);
    E('rect',{x:W/2-108,y:85,width:216,height:38,fill:C.paper},svg);
    T(svg,W/2,99,'Z ≅ X: the same coordinate algebra',stage===2?C.blow:C.muted,{at:{'text-anchor':'middle'},st:';font-size:11px'});
    T(svg,W/2,117,'Dashed return = identify, not blow up',C.muted,{at:{'text-anchor':'middle'},st:';font-size:10px'});
  }

  function update() {
    stages.forEach(button=>button.setAttribute("aria-pressed",String(Number(button.dataset.nash3Stage)===stage)));
    drawRoute();
    const vectors=source(),labels=currentNames();
    const headings={"-1":"Start · the same singular semigroup",0:"First Nash chart · 8 generators",1:"Second Nash chart · 6 generators",2:"After U₃⁻¹ · the original 6 generators"};
    document.getElementById("nash3-heading").textContent=headings[stage];
    document.getElementById("nash3-rotation-out").textContent=`${rotation.value}°`;
    const lessons={
      '-1':{title:'Start: one singular coordinate algebra',change:'The threefold has six coordinate functions. Its origin has tangent dimension 6, although the variety has dimension 3.',failure:'The quotient q = c/b is not a regular coordinate function on this affine variety, but q³ = x₄x₆ is. This missing integral function witnesses non-normality.',takeaway:'There is a singularity to remove. The orange hollow lattice point encodes q; it is not an absent spatial point.'},
      0:{title:'First Nash step: one obstruction is repaired, another survives',change:'In the selected tangent-plane chart, q = c/b becomes an allowed coordinate function g₂.',failure:'A different function p = ab/c is still missing, even though p² is the coordinate g₇. This new chart is still non-normal and therefore singular.',takeaway:'Recording tangent planes can improve the coordinates without making the resulting space smooth.'},
      1:{title:'Second Nash step: a copy of the original singularity returns',change:'This selected chart has six generators t₁,…,t₆. Every tᵢ is obtained from the original hᵢ by the same invertible integer map U₃.',failure:'The whole coordinate ring, including its relations, is isomorphic to the original ring. Thus this chart contains the same singular local type again.',takeaway:'The proof concerns one open neighborhood of the blowup. Other charts can improve while this one prevents resolution.'},
      2:{title:'Identify the chart: repeat the same obstruction forever',change:'Applying U₃⁻¹ only renames the monomial coordinates. It performs no additional blowup.',failure:'Nash respects open subsets and isomorphisms. Its next two steps inside this copy reproduce the same singular neighborhood.',takeaway:'After 2, 4, 6, … steps, a singular chart survives. That proves nontermination of this ordinary Nash iteration.'}
    };
    const lesson=lessons[stage];
    document.getElementById('nash3-lesson').innerHTML=`<h4>${lesson.title}</h4><div class="nash-lesson-columns"><div><h5>What changed?</h5><p>${lesson.change}</p></div><div><h5>What still fails?</h5><p>${lesson.failure}</p></div></div><p class="nash-takeaway"><b>Read this as:</b> ${lesson.takeaway}</p>`;
    const i=selected;
    let equation,summary;
    if(stage===-1){
      equation=`${hNames[i]} = ${fmt(H[i])}. The missing point u = (0, −1, 1) has 3u = h₄ + h₆ in S.`;
      summary="Start here. Both panels show S. The orange hollow point is a missing monomial exponent, not a missing physical point of the variety.";
    }else if(stage===0){
      const [end,start]=FIRST_RECIPES[i];
      equation=`${gNames[i]} = ${hNames[end]}${start===null?"":` − ${hNames[start]}`} = ${fmt(H1[i])}.`;
      summary="The selected tangent-coordinate chart uses A = {h₁, h₄, h₆}, det A = 3. It adds the old hole u as g₂, but w = (1, 1, −1) is still missing even though 2w = g₇ is present. This chart remains non-normal and singular.";
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
    document.getElementById("nash3-caption").textContent=stage===-1?"X(S) is three-dimensional, embedded in six coordinates.":stage===0?"The first selected open chart is singular, despite filling the old hole.":stage===1?"The second selected open chart has the transported hole U₃u = (−2, 0, 1).":"X(T) ≅ X(S): this is a basis change after two blowups, not a third blowup.";
    const proof=document.getElementById("nash3-proof-step");
    if(proof)proof.textContent=stage===-1?"0 blowups · singular at the torus-fixed origin":stage===0?"1 blowup · follow one singular open chart":stage===1?"2 blowups · a chart is isomorphic to the starting variety":"Repeat: after 2, 4, 6, … blowups, an open chart of the same singular type survives. Other charts may improve.";
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
  new ResizeObserver(update).observe(document.getElementById("nash-recurrence-demo"));
  options();update();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",initNashThree);
else initNashThree();

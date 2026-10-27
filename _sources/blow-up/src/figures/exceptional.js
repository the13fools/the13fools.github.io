function init(){
  const plane=document.getElementById("exceptional-plane"),chart=document.getElementById("exceptional-chart");if(!plane||!chart)return;
  const {$,E,C,frame,pathD,T}=window.__E;
  const xInput=$("#exceptional-x"),tInput=$("#exceptional-t"),button=$("#exceptional-zero");
  let animation=0;
  const fmt=n=>Math.abs(n)<.005?"0":n.toFixed(2);
  function draw(){
    const x=Number(xInput.value),t=Number(tInput.value);
    const records=[{name:"A",slope:1,color:C.hot},{name:"B",slope:-1,color:C.cold},{name:"P",slope:t,color:C.steel,probe:true}];
    for(const [svg,lifted] of [[plane,false],[chart,true]]){
      const W=Math.max(260,svg.getBoundingClientRect().width);
      const F=frame(svg,{W,H:310,l:40,r:16,t:20,b:42,xr:[-1,1],yr:[-1.8,1.8],xt:[[-1,"−1"],[0,"0"],[1,"1"]],yt:[[-1,"−1"],[0,"0"],[1,"1"]],xlab:"x",ylab:lifted?"slope t":"y"});
      if(lifted){E("line",{x1:F.X(0),x2:F.X(0),y1:F.Y(-1.8),y2:F.Y(1.8),stroke:C.blow,"stroke-width":5},F.g);T(svg,F.X(0)+9,F.Y(1.58),"E: all slopes",C.blow);}
      for(const r of records){
        E("path",{d:pathD(lifted?[[-1,r.slope],[1,r.slope]]:[[-1,-r.slope],[1,r.slope]],F.X,F.Y),stroke:r.color,fill:"none","stroke-width":r.probe?1.5:2.5,...(r.probe?{"stroke-dasharray":"4 4"}:{})},F.g);
        // At x=0 the three old positions coincide. Concentric rings show that
        // identification without displacing the points or inventing a gap.
        const overlap=!lifted&&x===0;
        E("circle",{cx:F.X(x),cy:F.Y(lifted?r.slope:x*r.slope),r:overlap?({A:10,B:7,P:3}[r.name]):6,fill:overlap?"none":C.surface,stroke:r.color,"stroke-width":2.5},svg);
        if(!overlap&&(lifted||Math.abs(x)>.15))T(svg,F.X(x)+(x>.65?-10:10),F.Y(lifted?r.slope:x*r.slope)+(r.probe&&Math.abs(Math.abs(t)-1)<.16?18:-9),r.name,r.color,{at:{"text-anchor":x>.65?"end":"start"}});
      }
      if(!lifted&&x===0)T(svg,F.X(-.88),F.Y(1.5),"One old point: A = B = P",C.ink);
    }
    $("#exceptional-x-out").textContent=fmt(x);$("#exceptional-t-out").textContent=fmt(t);
    $("#exceptional-records").innerHTML=`<table><caption>Read each point as a record</caption><thead><tr><th>Path</th><th>Old position (x, y)</th><th>New record (x, slope)</th></tr></thead><tbody>${records.map(r=>`<tr><th scope="row" style="color:${r.color}">${r.name}${r.probe?" · probe":" · curve"}</th><td>(${fmt(x)}, ${fmt(x*r.slope)})</td><td>(${fmt(x)}, ${fmt(r.slope)})</td></tr>`).join("")}</tbody></table>`;
    $("#exceptional-status").textContent=x===0
      ? "All three old positions are (0, 0). Upstairs, A and B are distinct points (0, +1) and (0, −1). Moving the probe explores other points of E; it does not move the old origin."
      : "Bring x to zero. The old points approach each other, while their slope labels remain separate. The new coordinates project back by (x, t) → (x, xt).";
    button.textContent=x===0?"Start the approach again":"Bring the points to the origin";
  }
  function cancel(){cancelAnimationFrame(animation);animation=0;}
  xInput.addEventListener("input",()=>{cancel();draw();});tInput.addEventListener("input",draw);
  button.addEventListener("click",()=>{
    cancel();const from=Number(xInput.value);if(from===0){xInput.value="0.7";draw();return;}
    if(window.matchMedia("(prefers-reduced-motion: reduce)").matches){xInput.value="0";draw();return;}
    const start=performance.now();function tick(now){const progress=Math.min(1,(now-start)/1400);xInput.value=String(progress===1?0:from*(1-progress));draw();if(progress<1)animation=requestAnimationFrame(tick);else animation=0;}animation=requestAnimationFrame(tick);
  });
  document.addEventListener("visibilitychange",()=>{if(document.hidden)cancel();});
  new ResizeObserver(draw).observe(plane.parentElement);window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",draw);draw();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();

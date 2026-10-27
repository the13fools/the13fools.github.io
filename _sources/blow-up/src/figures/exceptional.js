function init(){
  const plane=document.getElementById("exceptional-plane"),chart=document.getElementById("exceptional-chart");if(!plane||!chart)return;
  const {$,E,C,frame,pathD,T}=window.__E;
  const xInput=$("#exceptional-x"),tInput=$("#exceptional-t");
  function draw(){
    const x=Number(xInput.value),t=Number(tInput.value);
    for(const [svg,lifted] of [[plane,false],[chart,true]]){
      const W=Math.max(260,svg.getBoundingClientRect().width);
      const F=frame(svg,{W,H:310,l:40,r:16,t:20,b:42,xr:[-1,1],yr:[-1.8,1.8],xt:[[-1,"−1"],[0,"0"],[1,"1"]],yt:[[-1,"−1"],[0,"0"],[1,"1"]],xlab:"x",ylab:lifted?"t = y/x":"y"});
      if(lifted)E("line",{x1:F.X(0),x2:F.X(0),y1:F.Y(-1.8),y2:F.Y(1.8),stroke:C.blow,"stroke-width":5},F.g);
      else E("line",{x1:F.X(-1),x2:F.X(1),y1:F.Y(-t),y2:F.Y(t),stroke:C.steel,"stroke-dasharray":"4 4"},F.g);
      for(const sign of [-1,1])E("path",{d:pathD(lifted?[[-1,sign],[1,sign]]:[[-1,-sign],[1,sign]],F.X,F.Y),stroke:C.hot,fill:"none","stroke-width":2.5},F.g);
      if(lifted){for(const y of [-1,1])E("circle",{cx:F.X(0),cy:F.Y(y),r:5,fill:C.hot,stroke:C.surface,"stroke-width":2},svg);T(svg,F.X(0)+9,F.Y(1.6),"E: x = 0",C.blow);}
      else E("circle",{cx:F.X(0),cy:F.Y(0),r:5,fill:C.blow},svg);
      E("circle",{cx:F.X(x),cy:F.Y(lifted?t:x*t),r:7,fill:C.surface,stroke:C.ink,"stroke-width":2.5},svg);
    }
    $("#exceptional-x-out").textContent=x.toFixed(2);$("#exceptional-t-out").textContent=t.toFixed(2);
    $("#exceptional-status").textContent=x===0
      ? `On E: (0, ${t.toFixed(2)}) → (0, 0). Moving t chooses another direction above the same original point.`
      : `Off E: (${x.toFixed(2)}, ${t.toFixed(2)}) → (${x.toFixed(2)}, ${(x*t).toFixed(2)}). Here the projection is invertible: t = y/x.`;
  }
  xInput.addEventListener("input",draw);tInput.addEventListener("input",draw);$("#exceptional-zero").addEventListener("click",()=>{xInput.value="0";draw();});
  new ResizeObserver(draw).observe(plane.parentElement);window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",draw);draw();
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();

/* Draggable 360° panorama (equirectangular), shared by the lots gallery. Extracted from lot-gallery.js.
   panorama(stage, src, item) → dispose(). item: {initialView:{yaw,pitch,fov}, outline:[[u,v]…], showOutline} */
export function panorama(stage,src,item={}){
 let yaw=item.initialView?.yaw||0, pitch=item.initialView?.pitch||0, pointer=null, lastX=0, lastY=0;
 let fov=item.initialView?.fov ?? 72; const touches=new Map(); let pinch0=0, fov0=fov;
 const zoomTo=v=>{fov=Math.max(28,Math.min(95,v));schedule()};
 stage.addEventListener('wheel',e=>{e.preventDefault();zoomTo(fov*(1+Math.sign(e.deltaY)*.08))},{passive:false});
 let disposed=false, raf=0, renderScene, disposeScene;
 stage.style.backgroundImage='url("'+src+'")';
 function paint(){
  raf=0;
  stage.style.backgroundPosition=((.5-yaw/360)*stage.clientHeight*2+stage.clientWidth/2-stage.clientHeight*2)+'px '+(50+pitch/2)+'%';
  renderScene?.();
 }
 function schedule(){if(!raf && !disposed)raf=requestAnimationFrame(paint)}
 function turn(horizontal,vertical){
  yaw=(yaw+horizontal)%360;
  pitch=Math.max(-85,Math.min(85,pitch+vertical));
  stage.parentElement.classList.add('panorama-explored');
  schedule();
 }
 stage.onpointerdown=e=>{
  touches.set(e.pointerId,[e.clientX,e.clientY]);
  if(touches.size===2){const [a,b]=[...touches.values()];pinch0=Math.hypot(a[0]-b[0],a[1]-b[1]);fov0=fov;pointer=null;return}
  if(pointer!==null || e.button!==0 || e.target.closest('button'))return;
  pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;
  stage.setPointerCapture(pointer);
 };
 stage.onpointermove=e=>{
  if(touches.has(e.pointerId))touches.set(e.pointerId,[e.clientX,e.clientY]);
  if(touches.size===2&&pinch0){const [a,b]=[...touches.values()];zoomTo(fov0*pinch0/Math.max(1,Math.hypot(a[0]-b[0],a[1]-b[1])));return}
  if(e.pointerId!==pointer)return;
  const scale=fov/Math.max(1,stage.clientHeight);
  turn((lastX-e.clientX)*scale,(e.clientY-lastY)*scale);
  lastX=e.clientX;lastY=e.clientY;
 };
 stage.onpointerup=stage.onpointercancel=stage.onlostpointercapture=e=>{
  touches.delete(e.pointerId);if(touches.size<2)pinch0=0;
  if(e.pointerId===pointer)pointer=null;
 };
 stage.onkeydown=e=>{
  if(e.key==='+'||e.key==='='){e.preventDefault();zoomTo(fov*.9);return}if(e.key==='-'){e.preventDefault();zoomTo(fov*1.1);return}
  const delta={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,8],ArrowDown:[0,-8]}[e.key];
  if(delta){e.preventDefault();turn(...delta)}
 };
 const resize=new ResizeObserver(schedule);
 resize.observe(stage);
 schedule();
 async function load(){
  const T=await import('/vendor/three.module.js');
  if(disposed)return;
  const renderer=new T.WebGLRenderer({antialias:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(item.initialView?.fov ?? 72,1,.1,20);
  const texture=new T.TextureLoader().load(src,()=>{if(!disposed){stage.append(renderer.domElement);schedule()}});
  texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=T.RepeatWrapping;
  const geometry=new T.SphereGeometry(10,64,40);
  geometry.scale(-1,1,1);
  const material=new T.MeshBasicMaterial({map:texture});
  // Light version first, then the high-resolution one (8192x4096, within the GPU limit) replaces it.
  if(item.hd){const max=renderer.capabilities.maxTextureSize;if(max>=8192)new T.TextureLoader().load(item.hd,hd=>{if(disposed){hd.dispose();return}hd.colorSpace=T.SRGBColorSpace;hd.wrapS=T.RepeatWrapping;hd.anisotropy=renderer.capabilities.getMaxAnisotropy();const old=material.map;material.map=hd;material.needsUpdate=true;old.dispose();stage.dataset.hd='1';schedule()});}
  scene.add(new T.Mesh(geometry,material));
  const annotationResources=[];
  if(item.outline&&item.showOutline!==false){
   const points=item.outline.map(([u,v])=>new T.Vector3(9.8*Math.sin(Math.PI*v)*Math.cos(2*Math.PI*u),9.8*Math.cos(Math.PI*v),9.8*Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u)));
   const borderGeometry=new T.BufferGeometry().setFromPoints([...points,points[0]]);
   const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();const borderMaterial=new T.LineBasicMaterial({color:new T.Color(css('--c-map-lot-active')||'#ffe3a0'),depthTest:false});
   const border=new T.Line(borderGeometry,borderMaterial);border.renderOrder=2;scene.add(border);
   const fillGeometry=new T.BufferGeometry().setFromPoints(points);const triangles=[];
   for(let i=1;i<points.length-1;i++)triangles.push(0,i,i+1);
   fillGeometry.setIndex(triangles);
   const fillMaterial=new T.MeshBasicMaterial({color:new T.Color(css('--c-map-lot-active')||'#e5c578'),transparent:true,opacity:.22,side:T.DoubleSide,depthTest:false});
   const fill=new T.Mesh(fillGeometry,fillMaterial);fill.renderOrder=1;scene.add(fill);
   annotationResources.push(borderGeometry,borderMaterial,fillGeometry,fillMaterial);
  }
  let width=0,height=0;
  renderScene=()=>{
   if(width!==stage.clientWidth || height!==stage.clientHeight){
    width=stage.clientWidth;height=stage.clientHeight;
    if(!width || !height)return;
    renderer.setSize(width,height,false);
    camera.aspect=width/height;camera.updateProjectionMatrix();
   }
   if(camera.fov!==fov){camera.fov=fov;camera.updateProjectionMatrix()}
   const h=yaw*Math.PI/180,v=pitch*Math.PI/180;
   camera.lookAt(Math.cos(v)*Math.cos(h),Math.sin(v),Math.cos(v)*Math.sin(h));
   renderer.render(scene,camera);
  };
  disposeScene=()=>{annotationResources.forEach(r=>r.dispose());texture.dispose();material.dispose();geometry.dispose();renderer.dispose();renderer.forceContextLoss()};
 }
 load().catch(()=>{/* The draggable preview remains available. */});
 return ()=>{disposed=true;resize.disconnect();cancelAnimationFrame(raf);disposeScene?.()};
}

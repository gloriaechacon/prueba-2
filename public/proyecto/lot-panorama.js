/* Draggable 360° panorama (equirectangular), shared by the lots gallery. Extracted from lot-gallery.js.
   panorama(stage, src, item) → dispose(). item: {initialView:{yaw,pitch,fov}, outline:[[u,v]…], showOutline} */
export function panorama(stage,src,item={}){
 let yaw=item.initialView?.yaw||0, pitch=item.initialView?.pitch||0, pointer=null, lastX=0, lastY=0;
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
  if(pointer!==null || e.button!==0 || e.target.closest('button'))return;
  pointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;
  stage.setPointerCapture(pointer);
 };
 stage.onpointermove=e=>{
  if(e.pointerId!==pointer)return;
  const scale=72/Math.max(1,stage.clientHeight);
  turn((lastX-e.clientX)*scale,(e.clientY-lastY)*scale);
  lastX=e.clientX;lastY=e.clientY;
 };
 stage.onpointerup=stage.onpointercancel=stage.onlostpointercapture=e=>{
  if(e.pointerId===pointer)pointer=null;
 };
 stage.onkeydown=e=>{
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
   const h=yaw*Math.PI/180,v=pitch*Math.PI/180;
   camera.lookAt(Math.cos(v)*Math.cos(h),Math.sin(v),Math.cos(v)*Math.sin(h));
   renderer.render(scene,camera);
  };
  disposeScene=()=>{annotationResources.forEach(r=>r.dispose());texture.dispose();material.dispose();geometry.dispose();renderer.dispose();renderer.forceContextLoss()};
 }
 load().catch(()=>{/* The draggable preview remains available. */});
 return ()=>{disposed=true;resize.disconnect();cancelAnimationFrame(raf);disposeScene?.()};
}

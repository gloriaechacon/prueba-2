const base='/assets/lot-photos/', panel=document.querySelector('#lot-gallery'), select=document.querySelector('#c-lot');
const strings={
 en:['Lot','Field photography','Photos','360° tours','Drag to look around or use the arrow keys.','Photo'],
 es:['Lote','Fotografías del terreno','Fotos','Recorridos 360°','Arrastra para mirar alrededor o usa las flechas del teclado.','Foto'],
 pt:['Lote','Fotografias do terreno','Fotos','Passeios 360°','Arraste para olhar ao redor ou use as setas do teclado.','Foto']
};
let catalog,lot,type='photo',index=0;
let releasePanorama;
function render(){
 releasePanorama?.();
 releasePanorama=null;
 const key=select.value, items=catalog?.[key]?.filter(x=>!x.hidden);panel.hidden=!items?.length;if(panel.hidden){panel.replaceChildren();return}
 if(key!==lot){lot=key;type='photo';index=0}
 const unified=['RP-01','RP-05','RP-07'].includes(key);
 const t=strings[window.rpcI18n?.language]||strings.en, list=unified?items:items.filter(x=>x.type===type), item=list[index];
 if(unified)type=item.type;
 const label=t[0]+' '+Number(key.slice(3)), name=(type==='photo'?t[5]:'360°')+(unified?'':' '+(index+1));
 panel.innerHTML='<header><div><small>'+label+'</small><h2>'+t[1]+'</h2></div><div class="media-tabs"></div></header><div class="media-stage"></div><footer><strong>'+name+(unified?' · '+(index+1):'')+' / '+list.length+'</strong><span></span></footer><div class="media-thumbs"></div>';
 function button(parent,label,active,click){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',active);b.onclick=click;parent.append(b);return b}
 if(!unified)for(const [mode,title] of [['photo',t[2]],['360',t[3]]]){const count=items.filter(x=>x.type===mode).length;if(count)button(panel.querySelector('.media-tabs'),title+' ('+count+')',type===mode,()=>{type=mode;index=0;render();panel.querySelector('.media-tabs [aria-pressed=true]').focus({preventScroll:true})})}
 const stage=panel.querySelector('.media-stage'), source=base+item.file;
 if(type==='photo'){const img=new Image();img.src=source;img.alt=label+' · '+name;stage.append(img);if(item.outline){const holder=document.createElement('div');holder.className='photo-outline-holder';stage.append(holder);const resize=new ResizeObserver(()=>{if(!img.naturalWidth)return;const scale=Math.min(stage.clientWidth/img.naturalWidth,stage.clientHeight/img.naturalHeight);holder.style.width=img.naturalWidth*scale+'px';holder.style.height=img.naturalHeight*scale+'px'});resize.observe(stage);img.onload=()=>{resize.unobserve(stage);resize.observe(stage)};holder.innerHTML='<svg viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true"><polygon points="'+item.outline.map(p=>p.map(v=>v*1000).join(',')).join(' ')+'"/></svg>';releasePanorama=()=>resize.disconnect();}}
 if((unified||type==='photo') && list.length>1){
  const labels={en:['Previous photo','Next photo'],es:['Foto anterior','Foto siguiente'],pt:['Foto anterior','Próxima foto']};
  const captions=labels[window.rpcI18n?.language] || labels.en;
  [-1,1].forEach((step,i)=>{
   const arrow=document.createElement('button');
   arrow.type='button';
   arrow.className='photo-arrow '+(step<0?'previous':'next');
   arrow.setAttribute('aria-label',captions[i]);
   arrow.onclick=()=>{
    index=(index+step+list.length)%list.length;
    render();
    panel.querySelector('.'+arrow.className.split(' ').join('.')).focus({preventScroll:true});
   };
   stage.append(arrow);
  });
 }
 if(type==='360'){
  stage.tabIndex=0;
  stage.setAttribute('aria-label',label+' · '+name+'. '+t[4]);
  releasePanorama=panorama(stage,source,item);
  const instructions={
   en:['Drag to explore','Swipe to explore'],
   es:['Arrastra para explorar','Desliza para explorar'],
   pt:['Arraste para explorar','Deslize para explorar']
  };
  const wording=instructions[window.rpcI18n?.language]||instructions.en;
  const hint=document.createElement('span');
  hint.className='panorama-hint';
  hint.dataset.noTranslate='';
  hint.setAttribute('aria-hidden','true');
  hint.textContent=wording[matchMedia('(pointer: coarse)').matches?1:0]+' · 360°';
  const frame=document.createElement('div');
  frame.className='panorama-frame';
  stage.before(frame);
  frame.append(stage,hint);
  panel.querySelector('footer span').textContent=t[4];
 }
 if(item.outline){const note=document.createElement('p');note.className='lot-outline-note';note.dataset.noTranslate='';note.textContent=label+' · '+(({en:'Indicative outline, pending your confirmation.',es:'Marcación orientativa, pendiente de tu confirmación.',pt:'Marcação indicativa, aguardando confirmação.'})[window.rpcI18n?.language]||'Indicative outline, pending confirmation.');panel.querySelector('footer').after(note);}
 list.forEach((it,i)=>{const b=button(panel.querySelector('.media-thumbs'),'',i===index,()=>{index=i;render();panel.querySelector('.media-thumbs [aria-pressed=true]').focus({preventScroll:true})});b.setAttribute('aria-label',(type==='photo'?t[5]:'360°')+' '+(i+1));const img=new Image();img.alt='';img.loading='lazy';img.src=base+it.file.replace('.jpg','-thumb.jpg');b.append(img);if(unified){const caption=it.type==='360'?'360°':t[5];b.setAttribute('aria-label',caption);const text=document.createElement('span');text.textContent=caption;b.append(text)}});
}
// Draw a continuous panorama in a single canvas. The wrapped image also
// provides a draggable preview while the renderer loads or if WebGL is unavailable.
function panorama(stage,src,item={}){
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
  const scene=new T.Scene(), camera=new T.PerspectiveCamera(72,1,.1,20);
  const texture=new T.TextureLoader().load(src,()=>{if(!disposed){stage.append(renderer.domElement);schedule()}});
  texture.colorSpace=T.SRGBColorSpace;
  texture.wrapS=T.RepeatWrapping;
  const geometry=new T.SphereGeometry(10,64,40);
  geometry.scale(-1,1,1);
  const material=new T.MeshBasicMaterial({map:texture});
  scene.add(new T.Mesh(geometry,material));
  const annotationResources=[];
  if(item.outline){
   const points=item.outline.map(([u,v])=>new T.Vector3(9.8*Math.sin(Math.PI*v)*Math.cos(2*Math.PI*u),9.8*Math.cos(Math.PI*v),9.8*Math.sin(Math.PI*v)*Math.sin(2*Math.PI*u)));
   const borderGeometry=new T.BufferGeometry().setFromPoints([...points,points[0]]);
   const borderMaterial=new T.LineBasicMaterial({color:0xffe3a0,depthTest:false});
   const border=new T.Line(borderGeometry,borderMaterial);border.renderOrder=2;scene.add(border);
   const fillGeometry=new T.BufferGeometry().setFromPoints(points);fillGeometry.setIndex([0,1,2,0,2,3]);
   const fillMaterial=new T.MeshBasicMaterial({color:0xe5c578,transparent:true,opacity:.22,side:T.DoubleSide,depthTest:false});
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
select.addEventListener('change',render);window.addEventListener('rpc:lots-ready',render);document.addEventListener('rpc:language',render);
fetch(base+'catalog.json').then(r=>r.json()).then(data=>{catalog=data;render()});

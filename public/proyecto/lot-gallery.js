const base='/assets/lot-photos/', panel=document.querySelector('#lot-gallery'), select=document.querySelector('#c-lot');
const strings={
 en:['Lot','Field photography','Photos','360° tours','Drag to look around or use the arrow keys.','Photo'],
 es:['Lote','Fotografías del terreno','Fotos','Recorridos 360°','Arrastra para mirar alrededor o usa las flechas del teclado.','Foto'],
 pt:['Lote','Fotografias do terreno','Fotos','Passeios 360°','Arraste para olhar ao redor ou use as setas do teclado.','Foto']
};
let catalog,lot,type='photo',index=0;
function render(){
 const key=select.value, items=catalog?.[key];panel.hidden=!items?.length;if(panel.hidden){panel.replaceChildren();return}
 if(key!==lot){lot=key;type='photo';index=0}
 const t=strings[window.rpcI18n?.language]||strings.en, list=items.filter(x=>x.type===type), item=list[index];
 const label=t[0]+' '+Number(key.slice(3)), name=(type==='photo'?t[5]:'360°')+' '+(index+1);
 panel.innerHTML='<header><div><small>'+label+'</small><h2>'+t[1]+'</h2></div><div class="media-tabs"></div></header><div class="media-stage"></div><footer><strong>'+name+' / '+list.length+'</strong><span></span></footer><div class="media-thumbs"></div>';
 function button(parent,label,active,click){const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-pressed',active);b.onclick=click;parent.append(b);return b}
 for(const [mode,title] of [['photo',t[2]],['360',t[3]]]){const count=items.filter(x=>x.type===mode).length;if(count)button(panel.querySelector('.media-tabs'),title+' ('+count+')',type===mode,()=>{type=mode;index=0;render();panel.querySelector('.media-tabs [aria-pressed=true]').focus({preventScroll:true})})}
 const stage=panel.querySelector('.media-stage'), source=base+item.file;
 if(type==='photo'){const img=new Image();img.src=source;img.alt=label+' · '+name;stage.append(img)}
 if(type==='photo' && list.length>1){
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
 if(type==='360'){stage.tabIndex=0;stage.setAttribute('aria-label',label+' · '+name+'. '+t[4]);panorama(stage,source);panel.querySelector('footer span').textContent=t[4]}
 list.forEach((it,i)=>{const b=button(panel.querySelector('.media-thumbs'),'',i===index,()=>{index=i;render();panel.querySelector('.media-thumbs [aria-pressed=true]').focus({preventScroll:true})});b.setAttribute('aria-label',(type==='photo'?t[5]:'360°')+' '+(i+1));const img=new Image();img.alt='';img.loading='lazy';img.src=base+it.file.replace('.jpg','-thumb.jpg');b.append(img)});
}
// A perspective cube gives touch, mouse and keyboard users a full spherical view without a second WebGL context.
function panorama(stage,src){
 const cube=document.createElement('div');cube.className='pano-cube';stage.append(cube);
 ['','rotateY(-90deg)','rotateY(180deg)','rotateY(90deg)','rotateX(-90deg)','rotateX(90deg)'].forEach((r,i)=>{const img=new Image();img.alt='';img.draggable=false;img.src=src.replace('.jpg','-'+i+'.jpg');img.style.transform=r+' translateZ(-500px)';cube.append(img)});
 let yaw=0,pitch=0,drag=null;
 function draw(){pitch=Math.max(-89,Math.min(89,pitch));cube.style.transform='translateZ(var(--lens)) rotateX('+pitch+'deg) rotateY('+yaw+'deg)'}
 draw();stage.onpointerdown=e=>{drag=[e.clientX,e.clientY];stage.setPointerCapture(e.pointerId)};
 stage.onpointermove=e=>{if(!drag)return;yaw-=(e.clientX-drag[0])*.16;pitch+=(e.clientY-drag[1])*.16;drag=[e.clientX,e.clientY];draw()};
 stage.onlostpointercapture=()=>{drag=null};
 stage.onkeydown=e=>{const delta={ArrowLeft:[-8,0],ArrowRight:[8,0],ArrowUp:[0,-8],ArrowDown:[0,8]}[e.key];if(delta){e.preventDefault();yaw+=delta[0];pitch+=delta[1];draw()}};
}
select.addEventListener('change',render);window.addEventListener('rpc:lots-ready',render);document.addEventListener('rpc:language',render);
fetch(base+'catalog.json').then(r=>r.json()).then(data=>{catalog=data;render()});

(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const query=new URLSearchParams(location.search);
 let palette=query.get('palette')||sessionStorage.getItem('rpc-palette')||'champagne';
 function setPalette(value){if(!['champagne','navy'].includes(value))return;palette=value;document.body.dataset.palette=value;sessionStorage.setItem('rpc-palette',value);}
 setPalette(palette);
 const page=document.body.dataset.page;
 const pageMap={'inicio':'','project-intro-title':'','lotes':'lotes','entorno':'entorno','viviendas':'viviendas','inversion':'inversion','contacto':'contacto'};
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;if(event.data?.type==='rainbow-palette')setPalette(event.data.palette);if(!document.body.classList.contains('salon')&&event.data?.type==='rainbow-section'&&Object.hasOwn(pageMap,event.data.section)){const next=pageMap[event.data.section];if(next===(page==='inicio'?'':page))return;location.href='/proyecto/'+(next?next+'/':'')+'?palette='+palette;}});
 if(parent!==window&&!document.body.classList.contains('salon'))parent.postMessage({type:'rainbow-page',section:page},location.origin);
 const menu=document.querySelector('.c-menu');menu?.addEventListener('click',()=>{const open=document.querySelector('.c-nav').classList.toggle('open');menu.setAttribute('aria-expanded',open);});
 const video=document.querySelector('.c-film video'),pause=document.querySelector('#c-video');
 if(video){if(reduced.matches)video.pause();function label(){pause.textContent=video.paused?'Reproducir video':'Pausar video';}video.addEventListener('play',label);video.addEventListener('pause',label);pause.addEventListener('click',()=>video.paused?video.play().catch(()=>{}):video.pause());label();}
 // Keep the current page visible until native navigation commits.
 let state={};try{state=JSON.parse(sessionStorage.getItem('rpc-choice')||'{}');}catch{}
 function save(){sessionStorage.setItem('rpc-choice',JSON.stringify(state));const form=document.querySelector('#c-consultation');if(form){form.elements.lot.value=state.lot||'';form.elements.house.value=state.house||'';}}
 async function lotData(){const response=await fetch('/assets/geography/collection-lots.json');if(!response.ok)throw Error('Datos no disponibles');return response.json();}
 if(document.querySelector('#c-map')){
  lotData().then(data=>{
   const select=document.querySelector('#c-lot');data.lots.forEach(lot=>select.add(new Option('Lote '+String(lot.pinIndex).padStart(2,'0')+' · '+lot.front.nearestStreet,lot.id)));
   const map=null;const layers=new Map();
   if(map){L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:19}).addTo(map);data.lots.forEach(lot=>{const layer=L.geoJSON(lot.parcelPolygon,{style:{color:'#824b35',weight:2,fillOpacity:.18}}).addTo(map);layers.set(lot.id,layer);layer.on('click',()=>choose(lot.id));L.marker([lot.pin.lat,lot.pin.lon],{icon:L.divIcon({className:'c-lot-marker',html:String(lot.pinIndex).padStart(2,'0'),iconSize:[34,34]}),title:'Seleccionar lote '+lot.pinIndex}).addTo(map).on('click',()=>choose(lot.id));});}
   function choose(id){const lot=data.lots.find(l=>l.id===id)||data.lots[0];state.lot=lot.id;save();select.value=lot.id;document.querySelector('#c-lot-title').textContent='Lote '+String(lot.pinIndex).padStart(2,'0');document.querySelector('#c-street').textContent=lot.front.nearestStreet;document.querySelector('#c-lot-facts').innerHTML='<div><dt>Área reportada (MLS)</dt><dd>'+lot.mlsReported.acres+' acres</dd></div><div><dt>Catastro</dt><dd>'+lot.countyAcres+' acres</dd></div><div><dt>Parcela</dt><dd>'+lot.parcelId+'</dd></div>';document.querySelector('#c-lot-caveat').textContent=lot.needsConfirmation?'Porción ofrecida reportada: 0.24 acres. El contorno catastral reúne 0.70 acres; los linderos de la porción deben confirmarse.':lot.precision;const google=document.querySelector('#c-google');google.href=lot.sourceURL;layers.forEach((layer,key)=>layer.setStyle({fillOpacity:key===lot.id ? .45 : .12,weight:key===lot.id?3:1}));if(map)map.flyTo([lot.pin.lat,lot.pin.lon],17,{animate:!reduced.matches,duration:.6});}
   select.addEventListener('change',()=>choose(select.value));choose(query.get('lot')||state.lot||data.lots[0].id);dispatchEvent(new Event('rpc:lots-ready'));
  }).catch(()=>{document.querySelector('#c-map').textContent='No se pudo cargar el mapa. Intenta recargar esta página.';});
 }
 const studio=document.querySelector('#c-studio');
 if(studio){let trigger;document.querySelectorAll('[data-house]').forEach(button=>button.addEventListener('click',()=>{trigger=button;state.house=button.dataset.house;save();const href='/utah/?house='+state.house+'&view=exterior&lang='+(window.rpcI18n?.language||'en');studio.querySelector('iframe').src=href;document.querySelector('#c-studio-direct').href=href;studio.showModal();}));document.querySelector('#c-close-studio').addEventListener('click',()=>studio.close());studio.addEventListener('close',()=>{studio.querySelector('iframe').src='about:blank';trigger?.focus();});}
 const places={rainbow:['Rainbow Park','Un vecindario residencial al oeste de Ocala. Los lotes de la colección están distribuidos en distintas calles de esta zona.','/assets/geography/collection-aerial.jpg','/proyecto/lotes/','Rainbow Park Ocala Florida','Imagen aérea de referencia · USDA / USGS'],wec:['Mundo ecuestre','Competencias, hoteles, gastronomía y eventos forman parte de la identidad de World Equestrian Center.','/assets/territory-wec.jpg','https://worldequestriancenter.com/ocala-fl/','World Equestrian Center Ocala','Fotografía: World Equestrian Center'],downtown:['El centro de Ocala','Un entorno urbano para conocer el comercio, la gastronomía y los espacios de encuentro de la ciudad.','/assets/territory-downtown.jpg','https://www.ocalamarion.com/blog/explore-historic-downtown-ocala/','Downtown Ocala','Fotografía: Ocala / Marion County'],nature:['Rainbow Springs','Agua, senderos y paisaje natural. Un destino regional para conocer otra faceta de Florida.','/assets/territory-nature.jpg','https://www.ocalamarion.com/things-to-do/outdoors/parks/rainbow-springs-state-park/','Rainbow Springs State Park','Fotografía: Ocala / Marion County'],airport:['Conexiones con la región','El Aeropuerto Internacional de Ocala es una referencia de conectividad regional. Consulta su información oficial para conocer servicios.','/assets/ocala-airport-aerial.jpg','https://www.ocalafl.gov/government/city-departments-i-z/ocala-international-airport','Ocala International Airport','Fotografía aérea: USDA / USGS The National Map']};
 let placeRequest=0,placeAnimations=[];
 document.querySelectorAll('[data-place]').forEach(button=>button.addEventListener('click',async()=>{
  const request=++placeRequest,d=places[button.dataset.place];
  document.querySelectorAll('[data-place]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  // Decode first so the picture and its description enter together, even on slow connections.
  if(d[2]){const preview=new Image();preview.src=d[2];try{await preview.decode();}catch{}}
  if(request!==placeRequest)return;
  placeAnimations.forEach(animation=>animation.cancel());placeAnimations=[];
  document.querySelector('#c-place-title').textContent=d[0];
  document.querySelector('#c-place-description').textContent=d[1];
  const img=document.querySelector('#c-place-image');img.hidden=!d[2];if(d[2])img.src=d[2];img.alt=d[0];
  const placeLink=document.querySelector('#c-place-link');placeLink.href=d[3];placeLink.textContent=button.dataset.place==='rainbow'?'Ver los lotes':'Conocer el destino';placeLink.target=button.dataset.place==='rainbow'?'_self':'_blank';
  document.querySelector('#c-place-map').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(d[4]);
  document.querySelector('#c-place-credit').textContent=d[5];
  if(!reduced.matches)placeAnimations=[...document.querySelector('.c-destination').children].filter(el=>!el.hidden).map(el=>el.animate([
   {opacity:.45,filter:'blur(8px)'},{opacity:1,filter:'blur(0px)'}
  ],{duration:900,easing:'cubic-bezier(.22,1,.36,1)'}));
 }));
 reduced.addEventListener('change',()=>{if(reduced.matches)placeAnimations.forEach(animation=>animation.cancel());});

 const form=document.querySelector('#c-consultation');
 if(form){for(const i of [1,5,6,7,9,14]){const id='RP-'+String(i).padStart(2,'0');form.elements.lot.add(new Option('Lote '+String(i).padStart(2,'0'),id));}form.elements.lot.value=state.lot||'';form.elements.house.value=state.house||'';form.addEventListener('submit',event=>{
  const data=Object.fromEntries(new FormData(form));state.lot=data.lot;state.house=data.house;save();
  
 });}

})();

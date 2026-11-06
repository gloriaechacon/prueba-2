(()=>{
const host=document.getElementById('region-map');if(!host||!window.L)return;
const places={classic:{name:'Classic Mile',point:[29.152725,-82.34334]},wec:{name:'World Equestrian Center',point:[29.200286,-82.259861]},downtown:{name:'Downtown Ocala',point:[29.1878,-82.1367]},nature:{name:'Rainbow Springs',point:[29.1025,-82.4375]},airport:{name:'Aeropuerto de Ocala',point:[29.1717,-82.2242]}};
const map=L.map(host,{scrollWheelZoom:true,touchZoom:true,doubleClickZoom:true,zoomControl:false,zoomSnap:.25});L.control.zoom({position:'topright'}).addTo(map);
const layers={sketch:L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18,attribution:'&copy; OpenStreetMap'}),satellite:L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:18,attribution:'USDA / USGS The National Map'})};let layer=layers.sketch.addTo(map);host.dataset.mode='sketch';
const rainbowPin=L.marker([29.15,-82.373],{title:'Rainbow Park',alt:'Rainbow Park',keyboard:true,icon:L.divIcon({className:'region-rainbow-pin',html:'<svg viewBox="0 0 28 38" aria-hidden="true"><path d="M14 36S2 21 2 14a12 12 0 0 1 24 0c0 7-12 22-12 22Z" fill="#a33e32" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="4" fill="white"/></svg><span>Rainbow Park</span>',iconSize:[28,38],iconAnchor:[14,36]})}).addTo(map);
rainbowPin.on('click',()=>{document.querySelector('[data-place="rainbow"]').click();Object.values(markers).forEach(m=>m.getElement()?.classList.remove('selected'));map.panInside([29.15,-82.373],{padding:[45,45]})});

const markers={};Object.entries(places).forEach(([key,p])=>{const marker=L.marker(p.point,{keyboard:true,title:p.name,icon:L.divIcon({className:'region-place region-'+key,html:'<span>'+p.name+'</span>',iconSize:[0,0],iconAnchor:[0,0]})}).addTo(map);marker.on('click',()=>choose(key));markers[key]=marker;});
const reset=()=>map.fitBounds(Object.values(places).map(p=>p.point),{padding:host.clientWidth<500?[45,80]:[85,65],animate:false});reset();
function choose(key){document.querySelector('[data-place="'+key+'"]').click();Object.entries(markers).forEach(([id,m])=>{m.getElement()?.classList.toggle('selected',id===key);m.getElement()?.setAttribute('aria-pressed',String(id===key));m.setZIndexOffset(id===key?1000:0)});map.panInside(places[key].point,{padding:[80,70],animate:!matchMedia('(prefers-reduced-motion:reduce)').matches});}
document.querySelectorAll('[data-region-mode]').forEach(b=>b.onclick=()=>{map.removeLayer(layer);layer=layers[b.dataset.regionMode].addTo(map);host.dataset.mode=b.dataset.regionMode;document.querySelectorAll('[data-region-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
const resetButton=document.createElement('button');resetButton.className='region-reset';resetButton.textContent='Ver todo el entorno';resetButton.onclick=reset;document.querySelector('.regional-map-note').before(resetButton);
new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(host);
const areas=window.addRegionalAreas(map,key=>document.querySelector('[data-place="'+key+'"]')?.click());
document.querySelectorAll('[data-place]').forEach(b=>b.addEventListener('click',()=>{
 const key=b.dataset.place;
 Object.entries(markers).forEach(([id,m])=>{m.getElement()?.classList.toggle('selected',id===key);m.setZIndexOffset(id===key?1000:0)});
 areas.focus(key);
}));
choose('wec');
})();
(()=>{const map=document.querySelector('#region-map'),title=document.querySelector('#c-place-title');if(!map||!title)return;
 const jump=document.createElement('a');jump.className='region-detail-jump';jump.href='#c-place-title';map.after(jump);
 const update=()=>{const lang=document.documentElement.lang.slice(0,2);jump.textContent=(({en:'View details',es:'Ver detalles',pt:'Ver detalhes'})[lang]||'View details')+' · '+title.textContent;};
 jump.dataset.noTranslate='';new MutationObserver(update).observe(title,{childList:true,subtree:true,characterData:true});document.addEventListener('rpc:language',update);update();
})();

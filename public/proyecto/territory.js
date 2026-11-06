(()=>{
const data={
 rainbow:{index:'01',category:'RAINBOW PARK · EL ORIGEN',title:'Aquí comienza<br>tu colección.',description:'Lotes residenciales distribuidos en Rainbow Park, al oeste de Ocala. Un vecindario con viviendas de distintos propietarios y desarrolladores, donde Next Fraga reúne su colección.',tags:['Lotes dispersos','Entorno residencial','Next Fraga'],image:'/assets/geography/collection-aerial.jpg',alt:'Imagen aérea del entorno de Rainbow Park',label:'VISTA AÉREA / RAINBOW PARK',credit:'Imagen aérea de referencia · USDA / USGS',source:null,link:'/proyecto/lotes/',linkText:'Ver la colección',query:'Rainbow Park Ocala Florida',path:'M245 330Q220 275 245 240'},
 wec:{index:'02',category:'DEPORTE · HOSPITALIDAD · EVENTOS',title:'World Equestrian Center',description:'World Equestrian Center reúne competencias, hoteles, gastronomía y espacios para eventos. Un referente para entender la identidad ecuestre de Ocala.',tags:['Cultura ecuestre','Hospitalidad','Encuentro'],image:'assets/territory-wec.jpg',alt:'Exterior de The Equestrian Manor en World Equestrian Center',label:'THE EQUESTRIAN MANOR / WEC',credit:'Fotografía: World Equestrian Center',source:'https://worldequestriancenter.com/growth/',link:'https://worldequestriancenter.com/ocala-fl/',linkText:'Visitar sitio oficial del WEC',query:'World Equestrian Center Ocala',path:'M245 330Q335 170 460 172'},
 downtown:{index:'03',category:'CULTURA · GASTRONOMÍA · PASEOS',title:'El ritmo<br>de la ciudad.',description:'El centro histórico de Ocala reúne comercios, restaurantes y espacios para pasear alrededor de su plaza. Otra manera de descubrir la vida local, más allá del terreno.',tags:['Plaza histórica','Comercio local','Gastronomía'],image:'assets/territory-downtown.jpg',alt:'Plaza del centro histórico de Ocala con su quiosco y visitantes',label:'HISTORIC DOWNTOWN SQUARE / OCALA',credit:'Fotografía: Ocala / Marion County Visitors Bureau',source:'https://www.ocalamarion.com/blog/explore-historic-downtown-ocala/',link:'https://www.ocalamarion.com/blog/explore-historic-downtown-ocala/',linkText:'Visitar guía oficial de turismo',query:'Ocala Historic Downtown Square',path:'M245 330Q460 280 703 300'},
 nature:{index:'04',category:'AGUA · PAISAJE · TIEMPO AL AIRE LIBRE',title:'Cambia<br>de ritmo.',description:'Rainbow Springs, en Dunnellon, ofrece manantiales, senderos y actividades en el agua. Un destino regional para imaginar los días que también se viven fuera de casa.',tags:['Manantiales','Senderos','Kayak'],image:'assets/territory-nature.jpg',alt:'Aguas claras y vegetación de Rainbow Springs State Park',label:'RAINBOW SPRINGS STATE PARK / DUNNELLON',credit:'Fotografía: Ocala / Marion County Visitors Bureau',source:'https://www.ocalamarion.com/things-to-do/outdoors/parks/rainbow-springs-state-park/',link:'https://www.floridastateparks.org/parks-and-trails/rainbow-springs-state-park',linkText:'Visitar sitio oficial del parque',query:'Rainbow Springs State Park Dunnellon',path:'M245 330Q160 380 130 464'},
 classic:{index:'06',category:'Entrenamiento ecuestre',title:'Classic Mile Training Center',description:'Centro de entrenamiento ecuestre sobre W Highway 40, al este de los lotes de la colección.',tags:['Classic Mile','W Highway 40'],image:'/assets/classic-mile-outline.svg',alt:'Classic Mile',label:'Classic Mile',credit:'Marion County Property Appraiser',source:'https://www.pa.marion.fl.us/',link:'https://jamesbigleyranches.com/properties/the-classic-mile/',linkText:'Conocer el destino',query:'Classic Mile Training Center Ocala',path:''},
 airport:{index:'05',category:'CONECTIVIDAD · AVIACIÓN GENERAL',title:'Otra forma<br>de llegar.',description:'Ocala International Airport, al oeste de la ciudad, atiende aviación general, corporativa y carga. Una referencia para quienes llegan en aeronaves privadas o por viajes de negocio.',tags:['Aviación privada','Actividad corporativa','Ocala'],image:'assets/territory-airport.svg',alt:'Ilustración editorial de aviación; no representa las instalaciones del aeropuerto',label:'AVIACIÓN / ILUSTRACIÓN EDITORIAL',credit:'Información: City of Ocala · Ilustración conceptual',source:'https://www.ocalafl.gov/government/city-departments-i-z/ocala-international-airport',link:'https://www.ocalafl.gov/government/city-departments-i-z/ocala-international-airport',linkText:'Visitar sitio oficial del aeropuerto',query:'Ocala International Airport',path:'M245 330Q400 350 535 425'}
};
let selected='rainbow',mode='satellite';const $=id=>document.getElementById(id);
// Regional reference points; these markers are not parcel boundaries or access directions.
const places={rainbow:{point:[29.15,-82.373],name:'Rainbow Park'},classic:{point:[29.152725,-82.34334],name:'Classic Mile'},wec:{point:[29.200286,-82.259861],name:'World Equestrian Center'},downtown:{point:[29.1878,-82.1367],name:'Downtown Ocala'},nature:{point:[29.1025,-82.4375],name:'Rainbow Springs'},airport:{point:[29.1717,-82.2242],name:'Aeropuerto de Ocala'}};
let map,baseLayer,areas;const markers={};
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
function updateMap(){
 const d=data[selected];$('territory-map-fallback').href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(d.query);
 if(!map)return;
 Object.entries(markers).forEach(([key,marker])=>{
  const active=key===selected,el=marker.getElement();
  el?.classList.toggle('is-selected',active);el?.setAttribute('aria-pressed',String(active));el?.setAttribute('aria-label',places[key].name);
  marker.setZIndexOffset(active?1000:0);
  if(active)marker.openTooltip();else marker.closeTooltip();
 });
 // Preserve zoom and orientation. Pan only when a selected point is outside the current view.
 map.panInside(places[selected].point,{padding:[50,50],animate:!reduced.matches,duration:.6});
}
function setBase(){if(!map)return;const next=layers[mode];if(next===baseLayer)return;if(baseLayer)map.removeLayer(baseLayer);baseLayer=next.addTo(map);}
let layers;
function initMap(){
 const old=$('territory-iframe');const host=document.createElement('div');host.id='territory-live-map';host.setAttribute('aria-label','Mapa del entorno de Rainbow Park. Selecciona un lugar para ver su ficha.');old.replaceWith(host);
 if(!window.L){host.textContent='No se pudo cargar el mapa. Puedes consultar cada ubicación en Google Maps.';return;}
 map=L.map(host,{scrollWheelZoom:true,touchZoom:true,doubleClickZoom:true,zoomControl:false});L.control.zoom({position:'topright'}).addTo(map);
 layers={satellite:L.tileLayer('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}',{maxNativeZoom:16,maxZoom:18,attribution:'Imágenes: USDA / USGS The National Map'}),streets:L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'})};
 Object.entries(places).forEach(([key,place])=>{
  const marker=L.marker(place.point,{title:place.name,alt:place.name,keyboard:true,icon:L.divIcon({className:key==='rainbow'?'region-rainbow-pin':'territory-location',html:key==='rainbow'?'<svg viewBox="0 0 28 38" aria-hidden="true"><path d="M14 36S2 21 2 14a12 12 0 0 1 24 0c0 7-12 22-12 22Z" fill="#a33e32" stroke="white" stroke-width="2"/><circle cx="14" cy="14" r="4" fill="white"/></svg><span>Rainbow Park</span>':'<span>'+data[key].index+'</span>',iconSize:key==='rainbow'?[28,38]:[38,38],iconAnchor:key==='rainbow'?[14,36]:[19,19]})}).addTo(map);
  if(key!=='rainbow')marker.bindTooltip(place.name,{direction:'top',offset:[0,-20],className:'territory-place-label'});marker.on('click',()=>select(key));markers[key]=marker;
 });
 const reset=()=>map.fitBounds(Object.values(places).map(p=>p.point),{padding:[48,48],maxZoom:12,animate:false});
 areas=window.addRegionalAreas(map,select);
 setBase();reset();updateMap();
 const resetButton=document.createElement('button');resetButton.type='button';resetButton.className='territory-reset';resetButton.textContent='Ver todos los lugares';resetButton.addEventListener('click',reset);document.querySelector('[data-territory-map]')?.parentElement.append(resetButton);
 if(!resetButton.isConnected)host.parentElement.insertBefore(resetButton,host);
 new ResizeObserver(()=>map.invalidateSize({pan:false})).observe(host);
 host.parentElement.querySelector('p').firstChild.textContent='Los puntos son referencias del entorno. Selecciona un número o ';
}
function select(key){selected=key;const d=data[key];document.querySelectorAll('[data-destination]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.destination===key)));$('destination-image').src=d.image;$('destination-image').alt=d.alt;$('destination-photo-label').textContent=d.label;$('destination-index').textContent=d.index+' / '+String(Object.keys(data).length).padStart(2,'0');$('destination-category').textContent=d.category;$('destination-title').innerHTML=d.title;$('destination-description').textContent=d.description;$('destination-tags').innerHTML=d.tags.map(t=>`<span>${t}</span>`).join('');const link=$('destination-link');link.textContent=d.linkText;link.href=d.link;const mapLink=$('destination-map-link');mapLink.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(d.query);mapLink.setAttribute('aria-label','Ver '+d.query+' en Google Maps (abre otra pestaña)');if(d.link.startsWith('#')||d.link.startsWith('/'))link.removeAttribute('target');else link.target='_blank';const credit=$('destination-credit');credit.textContent=d.credit;if(d.source){credit.href=d.source;credit.target='_blank'}else{credit.removeAttribute('href');credit.removeAttribute('target')}$('territory-connection').setAttribute('d',d.path);updateMap();areas?.focus(key)}
document.querySelectorAll('[data-destination]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.destination)));
document.querySelectorAll('[data-territory-map]').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.territoryMap;document.querySelectorAll('[data-territory-map]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});setBase()}));
$('territory-artboard').hidden=true;$('territory-real-map').hidden=false;
const controls=[...document.querySelectorAll('[data-territory-map]')];controls.forEach((b,i)=>{b.dataset.territoryMap=i===0?'satellite':'streets';b.textContent=i===0?'Satélite':'Calles';b.setAttribute('aria-pressed',String(i===0));b.classList.toggle('active',i===0);});
select('rainbow');
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initMap,{once:true});else initMap();

document.querySelectorAll('.outlook-list details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)document.querySelectorAll('.outlook-list details').forEach(x=>{if(x!==d)x.open=false})}));
})();

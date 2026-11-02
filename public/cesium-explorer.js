import {clusterPins} from './pin-clusters.js?v=2';
import {houses} from './house-data.js?v=finishes6';
let libraryPromise;
function loadCesium(){if(libraryPromise)return libraryPromise;window.CESIUM_BASE_URL=new URL('./vendor/cesium/',import.meta.url).href;libraryPromise=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('./vendor/cesium/Cesium.js',import.meta.url).href;script.onload=()=>resolve(window.Cesium);script.onerror=()=>reject(Error('Cesium unavailable'));document.head.append(script)});return libraryPromise}
export async function createCesiumExplorer({container,data,dem,lots,onSelect,onStatus}){
const tr=s=>window.rpcI18n?.t(s)||s;const C=await loadCesium();C.Ion.defaultAccessToken='';const credit=document.querySelector('.zone-credit');credit.innerHTML='<div id="zone-cesium-credits"></div>';
const host=document.createElement('div');host.id='zone-cesium';container.append(host);
const viewer=new C.Viewer(host,{baseLayer:false,baseLayerPicker:false,geocoder:false,homeButton:false,sceneModePicker:false,navigationHelpButton:false,animation:false,timeline:false,fullscreenButton:false,infoBox:false,selectionIndicator:false,requestRenderMode:true,maximumRenderTimeChange:Infinity,creditContainer:document.querySelector('#zone-cesium-credits'),contextOptions:{webgl:{alpha:false,antialias:true}}});
const scene=viewer.scene,camera=viewer.camera;viewer.useBrowserRecommendedResolution=false;viewer.resolutionScale=Math.min(devicePixelRatio,1.5)/devicePixelRatio;scene.globe.baseColor=C.Color.fromCssColorString('#657f57');scene.globe.enableLighting=false;scene.globe.depthTestAgainstTerrain=true;scene.fog.enabled=true;scene.screenSpaceCameraController.minimumZoomDistance=30;scene.screenSpaceCameraController.maximumZoomDistance=22000000;scene.screenSpaceCameraController.enableCollisionDetection=true;scene.highDynamicRange=false;scene.postProcessStages.fxaa.enabled=true;scene.backgroundColor=C.Color.fromCssColorString('#b6d7e6');
const rad=Math.PI/180,R=6378137,cos=Math.cos(data.center[1]*rad),mx=R*data.center[0]*rad,my=R*Math.log(Math.tan(Math.PI/4+data.center[1]*rad/2));
function ll(x,z){return[(mx+x/cos)/R/rad,(2*Math.atan(Math.exp((my-z/cos)/R))-Math.PI/2)/rad]}
function local(lon,lat){return[(R*lon-mx)*cos,(my-R*Math.log(Math.tan(Math.PI/4+lat/2)))*cos]}
function heightLocal(x,z){if(Math.abs(x)>data.width/2||Math.abs(z)>data.height/2)return 0;const u=C.Math.clamp((x/data.width+.5)*dem.width-.5,0,dem.width-1),v=C.Math.clamp((z/data.height+.5)*dem.height-.5,0,dem.height-1),i=Math.floor(u),j=Math.floor(v),a=u-i,b=v-j,at=(xx,zz)=>dem.values[Math.min(zz,dem.height-1)*dem.width+Math.min(xx,dem.width-1)];return C.Math.lerp(C.Math.lerp(at(i,j),at(i+1,j),a),C.Math.lerp(at(i,j+1),at(i+1,j+1),a),b)}
function point(x,z,h){return C.Cartesian3.fromDegrees(...ll(x,z),h??heightLocal(x,z))}
const scheme=new C.GeographicTilingScheme();const terrain=new C.CustomHeightmapTerrainProvider({width:65,height:65,tilingScheme:scheme,credit:new C.Credit('Relieve local: <a href="https://www.usgs.gov/3d-elevation-program">USGS 3DEP</a>',true),callback(x,y,level){const rect=scheme.tileXYToRectangle(x,y,level),buffer=new Float32Array(65*65);for(let row=0;row<65;row++)for(let col=0;col<65;col++){const lon=C.Math.lerp(rect.west,rect.east,col/64),lat=C.Math.lerp(rect.north,rect.south,row/64);buffer[row*65+col]=heightLocal(...local(lon,lat))}return buffer}});
viewer.terrainProvider=terrain;
let houseKey='a';
let imagery,detailImagery,tileset,photoMode=false,worldTerrain,activeLot=null,currentState='aerial',factor=1,proposal=[],config={};
try{const provider=await C.ArcGisMapServerImageryProvider.fromUrl('https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer',{enablePickFeatures:false});imagery=viewer.imageryLayers.addImageryProvider(provider);imagery.saturation=1.25;imagery.contrast=1.06;imagery.brightness=1.03}catch{const [west,south]=ll(-data.width/2,data.height/2),[east,north]=ll(data.width/2,-data.height/2);const provider=await C.SingleTileImageryProvider.fromUrl('assets/geography/collection-aerial.jpg',{rectangle:C.Rectangle.fromDegrees(west,south,east,north),credit:'USDA / USGS The National Map'});imagery=viewer.imageryLayers.addImageryProvider(provider);onStatus('Cesium activo · Imagen local de respaldo')}
try{const [west,south]=ll(-data.width/2,data.height/2),[east,north]=ll(data.width/2,-data.height/2);const detail=await C.SingleTileImageryProvider.fromUrl('assets/geography/collection-aerial.jpg',{rectangle:C.Rectangle.fromDegrees(west,south,east,north),credit:new C.Credit('Imagen local: USDA / USGS',true)});detailImagery=viewer.imageryLayers.addImageryProvider(detail);detailImagery.saturation=1.25;detailImagery.contrast=1.06;detailImagery.brightness=1.03}catch{}
const root=document.querySelector('#lot-explorer');root.dataset.engine='cesium';
const polygons=new Map();
for(const lot of lots){lot.coordinates=[(lot.visualCenter||lot.center).lon,(lot.visualCenter||lot.center).lat];const coord=local(lot.coordinates[0]*rad,lot.coordinates[1]*rad);lot.x=coord[0];lot.z=coord[1];const ring=(lot.visualPolygon||lot.parcelPolygon).coordinates[0];const corners=ring.map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat));const entity=viewer.entities.add({id:'collection-lot-'+lot.id,polygon:{hierarchy:new C.PolygonHierarchy(corners),material:C.Color.fromCssColorString(lot.groupedParcel?'#f1c886':'#e0ef9d').withAlpha(.24),classificationType:C.ClassificationType.BOTH},polyline:{positions:corners,clampToGround:true,width:2,material:C.Color.fromCssColorString(lot.groupedParcel?'#e7b869':'#edf6ba')}});entity.sampleLot=lot.id;polygons.set(lot.id,entity);if(lot.provisionalBoundary)viewer.entities.add({polyline:{positions:lot.parcelPolygon.coordinates[0].map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat)),clampToGround:true,width:1,material:C.Color.fromCssColorString('#e0ae69').withAlpha(.6)}})}
const collectionSphere=C.BoundingSphere.fromPoints(lots.map(l=>point(l.x,l.z)));
const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
// Only sourced geographic boundaries are shaded; never infer a boundary from a radius.
let regionalAreas=[];
const regionalOverlay=document.createElement('div');regionalOverlay.className='zone-regional-labels';regionalOverlay.setAttribute('aria-label','Lugares del entorno');container.append(regionalOverlay);
const regionalNote=document.createElement('p');regionalNote.className='zone-regional-note';regionalNote.hidden=true;
regionalNote.textContent='Áreas: comunidades Rainbow Park y Rainbow Springs (US Census), aeropuerto (EPA). Selecciona un pin para saber más.';
root.querySelector('.zone-world').append(regionalNote);
const regionalInfo=document.createElement('section');regionalInfo.className='zone-place-info';regionalInfo.hidden=true;regionalInfo.setAttribute('aria-live','polite');root.append(regionalInfo);
const regionalKey=document.createElement('div');regionalKey.className='zone-poi-key';regionalKey.setAttribute('aria-label','Lugares del entorno');regionalInfo.before(regionalKey);
const poiIcons={airport:'<path d="m12 3 2 7 6 4v2l-6-2v5l2 2v1l-4-1-4 1v-1l2-2v-5l-6 2v-2l6-4 2-7Z"/>',community:'<path d="m3 11 9-8 9 8M5 10v11h14V10M10 21v-7h4v7"/>',city:'<path d="M3 21h18M5 21V8h6v13M13 21V3h6v18M7 11h2m-2 4h2m6-8h2m-2 4h2m-2 4h2"/>',horse:'<path class="poi-horse-silhouette" transform="scale(.375)" d="M5 22C1 23 0 30 2 36L5 34C4 29 6 27 9 27L10 37 7 54H13L17 40 21 54H27L23 35C29 38 35 38 40 35L42 43 40 54H46L48 41 46 32 51 23 58 25 63 21 59 16 54 12 53 5 49 9 45 6 44 14C40 17 40 22 37 24L22 22C16 19 10 19 5 22Z"/>'};
function describePlace(area){
 regionalInfo.replaceChildren();const title=document.createElement('h3');title.textContent=area.name;const copy=document.createElement('p');copy.textContent=area.description;const source=document.createElement('a');source.href=area.source;source.target='_blank';source.rel='noopener';source.textContent='Consultar fuente';const maps=document.createElement('a');maps.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(area.name+' Ocala Florida');maps.target='_blank';maps.rel='noopener';maps.textContent='Abrir ubicación en Google Maps';regionalInfo.append(title,copy,source,maps);regionalInfo.hidden=false;
 for(const a of regionalAreas)a.label.setAttribute('aria-pressed',String(a.id===area.id));
}

const regionalButton=document.createElement('button');regionalButton.type='button';regionalButton.className='zone-region-button';regionalButton.textContent='Ver entorno';
root.querySelector('.zone-top-actions').prepend(regionalButton);
const overviewButton=document.querySelector('#zone-overview');overviewButton.textContent='Ver lotes';
if(document.body.classList.contains('embedded-lotes')){const toolbar=document.querySelector('.embedded-map-toolbar');if(toolbar){toolbar.append(regionalButton,overviewButton)}}
function regionalView(){
 if(!regionalAreas.length)return;
 const sphere=C.BoundingSphere.fromPoints(regionalAreas.map(a=>a.pos));
 const aspect=scene.canvas.clientHeight/Math.max(1,scene.canvas.clientWidth);
 const fit=scene.canvas.clientWidth<600?2.1:2.4;
 flyToPoint(sphere.center,sphere.radius*Math.max(fit,aspect*fit),0,-Math.PI/2);
}
regionalButton.addEventListener('click',regionalView);
fetch(new URL('./assets/geography/regional-context.json',import.meta.url)).then(r=>{if(!r.ok)throw Error('Regional context unavailable');return r.json()}).then(areas=>{
 regionalAreas=areas.map(area=>{
  const pos=C.Cartesian3.fromDegrees(area.lon,area.lat,10),entities=[];
  const shapes=area.geometry?.type==='MultiPolygon'?area.geometry.coordinates:area.geometry?.type==='Polygon'?[area.geometry.coordinates]:[];
  for(const rings of shapes){
   const positions=ring=>ring.map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat));
   entities.push(viewer.entities.add({show:false,polygon:{hierarchy:new C.PolygonHierarchy(positions(rings[0]),rings.slice(1).map(r=>new C.PolygonHierarchy(positions(r)))),material:C.Color.fromCssColorString(area.color).withAlpha(.25),classificationType:C.ClassificationType.BOTH}}));
   for(const ring of rings)entities.push(viewer.entities.add({show:false,polyline:{positions:positions(ring),clampToGround:true,width:3,material:new C.PolylineDashMaterialProperty({color:C.Color.fromCssColorString(area.color),dashLength:14})}}));
  }
  const label=document.createElement('button');label.type='button';label.className='zone-regional-label zone-poi';label.dataset.place=area.id;label.setAttribute('aria-label',area.name);label.setAttribute('aria-pressed','false');
  label.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+poiIcons[area.kind||'community']+'</svg><span><strong></strong><small></small></span>';
  label.querySelector('strong').textContent=area.name;label.querySelector('small').textContent=area.category;label.hidden=true;regionalOverlay.append(label);
  const selectPlace=()=>{describePlace({...area,label});flyToPoint(pos,area.kind==='community'?7000:2200,0,-Math.PI/2)};label.addEventListener('click',selectPlace);
  const keyButton=document.createElement('button');keyButton.type='button';keyButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true">'+poiIcons[area.kind||'community']+'</svg><span></span>';keyButton.querySelector('span').textContent=area.name;keyButton.addEventListener('click',selectPlace);regionalKey.append(keyButton);
  return {...area,pos,entities,label};
 });scene.requestRender();
}).catch(()=>{regionalButton.hidden=true});
function renderRegionalAreas(){
 const distance=C.Cartesian3.distance(camera.positionWC,collectionSphere.center);
 const show=distance<180000;
 regionalNote.hidden=distance<3500||!show;regionalKey.hidden=!show;
 for(const entity of accessEntities)if(entity.show!==(distance<8000))entity.show=distance<8000;
 for(const area of regionalAreas){
  area.entities.forEach(entity=>{if(entity.show!==show)entity.show=show});
  const p=show&&C.SceneTransforms.worldToWindowCoordinates(scene,area.pos);
  const facing=C.Cartesian3.dot(C.Cartesian3.subtract(area.pos,camera.positionWC,new C.Cartesian3()),camera.directionWC)>0;
  area.label.hidden=!p||!facing||p.x<18||p.x>scene.canvas.clientWidth-18||p.y<45||p.y>scene.canvas.clientHeight-85;
  if(p){area.label.style.left=p.x+'px';area.label.style.top=p.y+'px'}
 }
}

function anchor(){const ray=camera.getPickRay(new C.Cartesian2(scene.canvas.clientWidth/2,scene.canvas.clientHeight/2));return scene.globe.show?scene.globe.pick(ray,scene):scene.pickPosition(new C.Cartesian2(scene.canvas.clientWidth/2,scene.canvas.clientHeight/2))}
function flyToPoint(target,range,heading=0,pitch=-.68,duration){camera.cancelFlight();camera.flyToBoundingSphere(new C.BoundingSphere(target,1),{offset:new C.HeadingPitchRange(heading,pitch,range),duration:duration??(reduced?0:1.35),complete:()=>scene.requestRender()});scene.requestRender()}
function overview(duration){flyToPoint(collectionSphere.center,Math.max(1800,collectionSphere.radius*2.8)*(scene.canvas.clientWidth<600?1.35:1),0,-.78,duration)}
const collectionPin=document.createElement('button');collectionPin.type='button';collectionPin.className='zone-collection-pin';collectionPin.setAttribute('aria-label','Lotes Rainbow Park');collectionPin.innerHTML='<svg viewBox="0 0 24 32" aria-hidden="true"><path d="M12 30S2 18 2 12a10 10 0 0 1 20 0c0 6-10 18-10 18Z" fill="#6b5733" stroke="#fff" stroke-width="2"/><circle cx="12" cy="12" r="3.5" fill="#fff"/></svg><span>Lotes Rainbow Park</span>';collectionPin.hidden=true;document.querySelector('#zone-pins').append(collectionPin);collectionPin.addEventListener('click',()=>overview());
const clusterButtons=new Map();
let openCluster=null;
const picker=document.createElement('div');
picker.className='zone-cluster-choices';picker.hidden=true;
document.querySelector('#zone-pins').append(picker);
function closeCluster(){openCluster?.setAttribute('aria-expanded','false');openCluster=null;picker.hidden=true;picker.replaceChildren()}
function toggleCluster(button){
 const same=openCluster===button;closeCluster();if(same)return;
 openCluster=button;button.setAttribute('aria-expanded','true');
 for(const {lot} of [...button.clusterPoints].sort((a,b)=>a.lot.id-b.lot.id)){
  const choice=document.createElement('button');choice.type='button';
  choice.textContent=tr('Lote')+' '+String(lot.id).padStart(2,'0');
  choice.setAttribute('aria-pressed',String(lot===activeLot));
  choice.onclick=()=>{closeCluster();onSelect(lot.id)};picker.append(choice);
 }
 picker.hidden=false;picker.firstElementChild.focus({preventScroll:true});
}
document.addEventListener('pointerdown',e=>{if(openCluster&&!picker.contains(e.target)&&!openCluster.contains(e.target))closeCluster()});
picker.addEventListener('keydown',e=>{if(e.key==='Escape'){const trigger=openCluster;closeCluster();trigger?.focus()}});
function renderPins(){
 renderRegionalAreas();
 const visible=[];
 const regionalDistance=C.Cartesian3.distance(camera.positionWC,collectionSphere.center);
 const regionalScale=regionalDistance>12000;
 const cp=C.SceneTransforms.worldToWindowCoordinates(scene,collectionSphere.center);
 const facing=C.Cartesian3.dot(C.Cartesian3.subtract(collectionSphere.center,camera.positionWC,new C.Cartesian3()),camera.directionWC)>0;
 collectionPin.hidden=!regionalScale||!facing||!cp||cp.x<0||cp.x>scene.canvas.clientWidth||cp.y<0||cp.y>scene.canvas.clientHeight;
 if(cp){collectionPin.style.left=cp.x+'px';collectionPin.style.top=cp.y+'px'}
 for(const lot of lots){
  const cart=C.Cartographic.fromDegrees(...lot.coordinates);let h=heightLocal(lot.x,lot.z)*factor;
  if(photoMode){try{h=scene.sampleHeight(cart)||h}catch{}}
  const pos=C.Cartesian3.fromDegrees(...lot.coordinates,h+2);
  const p=C.SceneTransforms.worldToWindowCoordinates(scene,pos);
  const front=C.Cartesian3.dot(C.Cartesian3.subtract(pos,camera.positionWC,new C.Cartesian3()),camera.directionWC)>0;
  // Always keep individual leaders short; never stack numbers up the screen.
  lot.pin.style.setProperty('--pin-stem','14px');
  if(regionalScale||(currentState==='house'&&activeLot===lot)||!p||!front||p.x<38||p.x>scene.canvas.clientWidth-38||p.y<52||p.y>scene.canvas.clientHeight-14)continue;
  visible.push({x:p.x,y:p.y-14,lot,pos});
 }
 const used=new Set(),singles=new Set();
 for(const group of clusterPins(visible)){
  if(group.points.length===1){const {lot}=group.points[0];singles.add(lot);lot.pin.style.left=group.x+'px';lot.pin.style.top=group.y+'px';continue;}
  const key=group.points.map(p=>p.lot.id).sort((a,b)=>a-b).join('-');used.add(key);
  let button=clusterButtons.get(key);
  if(!button){
   button=document.createElement('button');button.type='button';button.className='zone-pin zone-pin-cluster';
   button.setAttribute('aria-expanded','false');
   button.addEventListener('click',()=>toggleCluster(button));
   document.querySelector('#zone-pins').append(button);clusterButtons.set(key,button);
  }
  button.clusterPoints=group.points;button.hidden=false;
  const text=group.points.length+' '+tr('lotes');
  if(button.textContent!==text)button.textContent=text;
  button.setAttribute('aria-label',text+': '+group.points.map(p=>String(p.lot.id).padStart(2,'0')).join(', '));
  button.classList.toggle('contains-selection',group.points.some(p=>p.lot===activeLot));
  button.style.left=Math.max(56,Math.min(scene.canvas.clientWidth-56,group.x))+'px';button.style.top=group.y+'px';
 }
 for(const lot of lots)lot.pin.hidden=!singles.has(lot);
 for(const [key,button]of clusterButtons)if(!used.has(key)){if(openCluster===button)closeCluster();button.remove();clusterButtons.delete(key)}
 document.querySelector('#zone-compass').style.transform=`rotate(${-camera.heading}rad)`;
 document.querySelector('#zone-topdown').setAttribute('aria-pressed',String(camera.pitch< -1.45));
}
scene.postRender.addEventListener(renderPins);
const clicks=new C.ScreenSpaceEventHandler(scene.canvas);clicks.setInputAction(e=>{const hit=scene.drillPick(e.position).find(hit=>hit.id?.sampleLot!=null);if(hit)onSelect(hit.id.sampleLot)},C.ScreenSpaceEventType.LEFT_CLICK);
function setMode(mode){const ctrl=scene.screenSpaceCameraController;ctrl.rotateEventTypes=mode==='orbit'?[]:[C.CameraEventType.LEFT_DRAG];ctrl.tiltEventTypes=mode==='orbit'?[C.CameraEventType.LEFT_DRAG,C.CameraEventType.MIDDLE_DRAG,C.CameraEventType.PINCH]:[C.CameraEventType.MIDDLE_DRAG,C.CameraEventType.PINCH,{eventType:C.CameraEventType.LEFT_DRAG,modifier:C.KeyboardEventModifier.CTRL}];scene.requestRender()}
function clearProposal(){for(const entity of proposal)viewer.entities.remove(entity);proposal=[];if(tileset?.clippingPolygons)tileset.clippingPolygons.removeAll()}
let stateTicket=0;
async function setState(state){currentState=state;const ticket=++stateTicket;clearProposal();if(!activeLot||state==='aerial'){scene.requestRender();return}const l=activeLot,house=houses[houseKey],ring=(l.visualPolygon||l.parcelPolygon).coordinates[0];const localRing=ring.map(([lon,lat])=>local(lon*rad,lat*rad));let base=Math.max(...localRing.map(([x,z])=>heightLocal(x,z)))*factor+.18;
if(photoMode){if(!worldTerrain){onStatus('Para colocar la vivienda hace falta validar la cota del suelo.');return}try{const pts=await C.sampleTerrainMostDetailed(worldTerrain,[C.Cartographic.fromDegrees(...l.coordinates)]);if(ticket!==stateTicket)return;base=pts[0].height+.18;if(!Number.isFinite(base))throw Error('height');if(!C.ClippingPolygonCollection.isSupported(scene)){onStatus('Este dispositivo no permite preparar la parcela sobre la capa fotorrealista.');return}if(!tileset.clippingPolygons)tileset.clippingPolygons=new C.ClippingPolygonCollection();tileset.clippingPolygons.add(new C.ClippingPolygon({positions:ring.map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat,base))}))}catch{onStatus('No se pudo validar la elevación de la propuesta.');return}}
const add=e=>{const out=viewer.entities.add(e);proposal.push(out);return out};
add({polygon:{hierarchy:new C.PolygonHierarchy(ring.map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat))),height:base,material:C.Color.fromCssColorString('#96aa72')}});
if(state==='house'){
 const front=l.front.coordinates,mid=local((front[0][0]+front[1][0])/2*rad,(front[0][1]+front[1][1])/2*rad),bearing=l.front.frontBearingDegrees*rad,out=[Math.sin(bearing),-Math.cos(bearing)],right=[-Math.cos(bearing),-Math.sin(bearing)];
 const origin=[mid[0]-out[0]*(6+house.frontZ),mid[1]-out[1]*(6+house.frontZ)];
 const toWorld=(x,z,y=0)=>point(origin[0]+right[0]*x+out[0]*z,origin[1]+right[1]*x+out[1]*z,base+y);
 add({name:house.name+' · Propuesta según plano',position:point(...origin,base),orientation:C.Transforms.headingPitchRollQuaternion(point(...origin,base),new C.HeadingPitchRoll(bearing-Math.PI/2,0,0)),model:{uri:house.model,scale:1,runAnimations:false,heightReference:C.HeightReference.NONE}});
 const gx=house.garageSide*5.3,z0=house.frontZ-1.4,z1=house.frontZ+6;
 add({polygon:{hierarchy:new C.PolygonHierarchy([[gx-1.7,z0],[gx+1.7,z0],[gx+1.7,z1],[gx-1.7,z1]].map(([x,z])=>toWorld(x,z,.04))),perPositionHeight:true,material:C.Color.fromCssColorString('#d7d1bf')}});
 add({polyline:{positions:front.map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat,base+.1)),width:5,material:C.Color.fromCssColorString('#f4db9c')}});
 for(const [z,text]of [[-house.depth*.5-4,'JARDÍN POSTERIOR']])add({position:toWorld(0,z,.7),label:{text:tr(text),font:'12px sans-serif',fillColor:C.Color.WHITE,showBackground:true,backgroundColor:C.Color.fromCssColorString('#203c30').withAlpha(.85),pixelOffset:new C.Cartesian2(0,-10),disableDepthTestDistance:Number.POSITIVE_INFINITY}})
}scene.requestRender()}
let accessEntities=[];
function showRoadFront(lot){for(const e of accessEntities)viewer.entities.remove(e);accessEntities=[];const add=e=>accessEntities.push(viewer.entities.add(e));
 const front=lot.front.coordinates,mid=local((front[0][0]+front[1][0])/2*rad,(front[0][1]+front[1][1])/2*rad);
 add({polyline:{positions:front.map(([lon,lat])=>C.Cartesian3.fromDegrees(lon,lat)),clampToGround:true,width:6,material:C.Color.fromCssColorString('#f5c778')}});
 let nearest=null;
 for(const road of data.roads.filter(r=>r.name===lot.front.nearestStreet))for(let i=1;i<road.points.length;i++){const a=road.points[i-1],b=road.points[i],dx=b[0]-a[0],dz=b[1]-a[1],t=C.Math.clamp(((mid[0]-a[0])*dx+(mid[1]-a[1])*dz)/(dx*dx+dz*dz),0,1),x=a[0]+t*dx,z=a[1]+t*dz,dist=Math.hypot(x-mid[0],z-mid[1]);if(!nearest||dist<nearest.dist)nearest={road,x,z,dist}}
 if(nearest){add({polyline:{positions:nearest.road.points.map(([x,z])=>point(x,z)),clampToGround:true,width:3,material:C.Color.fromCssColorString('#f6e7c8').withAlpha(.65)}});add({position:point(nearest.x,nearest.z,heightLocal(nearest.x,nearest.z)+1),label:{text:lot.front.nearestStreet+' · '+tr('ACCESO'),font:'12px sans-serif',fillColor:C.Color.WHITE,showBackground:true,backgroundColor:C.Color.fromCssColorString('#233c30').withAlpha(.9),pixelOffset:new C.Cartesian2(0,25),disableDepthTestDistance:Number.POSITIVE_INFINITY}})}
 scene.requestRender();
}
function select(lot,move){activeLot=lot;showRoadFront(lot);for(const l of lots)polygons.get(l.id).polygon.material=C.Color.fromCssColorString(l===lot?'#f1f8b9':'#d8e998').withAlpha(l===lot ? .35 : .18);setState(currentState);if(move)focus(lot,220)}
function focus(lot,range){let h=heightLocal(lot.x,lot.z)*factor;if(photoMode){try{h=scene.sampleHeight(C.Cartographic.fromDegrees(...lot.coordinates))||h}catch{}}flyToPoint(point(lot.x,lot.z,h),range*(scene.canvas.clientWidth<600?1.4:1),((lot.front?.frontBearingDegrees||0)-180)*rad,-.7)}
function reframe({heading=camera.heading,pitch=camera.pitch,scale=1,duration=.65}){const target=anchor()||point(activeLot?.x||60,activeLot?.z||40);const dist=C.Cartesian3.distance(camera.positionWC,target);flyToPoint(target,C.Math.clamp(dist*scale,45,20000000),heading,pitch,duration)}

function setColor(value){for(const layer of [imagery,detailImagery])if(layer){layer.saturation=value?1.25:1;layer.contrast=value?1.06:1;layer.brightness=value?1.03:1}scene.requestRender()}
async function connectPhotorealistic(){if(!config.ionAccessToken)return false;C.Ion.defaultAccessToken=config.ionAccessToken;onStatus('Conectando la capa fotorrealista…');try{tileset=await C.createGooglePhotorealistic3DTileset({onlyUsingWithGoogleGeocoder:true},{maximumScreenSpaceError:scene.canvas.clientWidth<600?24:16,cacheBytes:256*1024*1024,maximumCacheOverflowBytes:128*1024*1024});scene.primitives.add(tileset);photoMode=true;scene.globe.show=false;factor=1;scene.verticalExaggeration=1;viewer.imageryLayers.removeAll();imagery=null;detailImagery=null;document.querySelector('#zone-engine-status').textContent='CESIUM · 3D FOTORREALISTA';document.querySelector('#zone-photoreal-note').textContent='Capa fotorrealista conectada. El detalle depende de la cobertura de la zona.';document.querySelector('#zone-vivid').hidden=true;onStatus('Cesium · 3D fotorrealista');try{worldTerrain=await C.createWorldTerrainAsync()}catch{}overview();return true}catch{onStatus('Cesium activo · La capa fotorrealista no está disponible con esta conexión');return false}}
try{const r=await fetch('config/cesium.json',{cache:'no-store'});if(r.ok)config=await r.json()}catch{}
const controller={setHouse(key){houseKey=key;setState(currentState)},resize(){viewer.resize();scene.requestRender()},setMode,select,focus,setState,setColor,overview(){overview()},zoom(scale){reframe({scale})},north(){reframe({heading:0,duration:0})},tilt(){reframe({pitch:camera.pitch>-.5?-.9:-.4})},top(){reframe({pitch:camera.pitch< -1.45?-.75:-Math.PI/2})}};
document.addEventListener('rpc:language',()=>{if(activeLot)showRoadFront(activeLot);setState(currentState);scene.requestRender()});
container.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','a','d','+','=','-'].includes(e.key))return;e.preventDefault();camera.cancelFlight();if(e.key==='a')reframe({heading:camera.heading-.18});else if(e.key==='d')reframe({heading:camera.heading+.18});else if(['+','='].includes(e.key))controller.zoom(.8);else if(e.key==='-')controller.zoom(1.25);else{const step=Math.max(5,camera.positionCartographic.height*.06);if(e.key==='ArrowLeft')camera.moveLeft(step);if(e.key==='ArrowRight')camera.moveRight(step);if(e.key==='ArrowUp')camera.moveForward(step);if(e.key==='ArrowDown')camera.moveBackward(step);scene.requestRender()}});
scene.canvas.addEventListener('pointerdown',()=>container.focus({preventScroll:true}));new ResizeObserver(()=>controller.resize()).observe(container);setMode('pan');overview(0);if(config.ionAccessToken&&config.photorealistic)await connectPhotorealistic();return controller;
}

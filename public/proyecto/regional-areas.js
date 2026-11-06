window.addRegionalAreas = function(map, select) {
 const keys = {'classic-mile':'classic','rainbow-community':'rainbow',springs:'nature'};
 const outlines = new Map();
 let pending;
 function focus(key) {
  pending = key;
  const area = outlines.get(key);
  if(area) map.fitBounds(area.getBounds(), {padding:[38,38],maxZoom:16,animate:false});
 }
 fetch('/assets/geography/regional-context.json')
  .then(response=>{if(!response.ok) throw Error(response.status);return response.json()})
  .then(areas=>{
   for(const area of areas) {
    if(!area.geometry) continue;
    const key = keys[area.id] || area.id;
    const layer = L.geoJSON(area.geometry,{
     attribution:area.id==='wec'?'&copy; OpenStreetMap contributors':null,
     style:{color:area.color,fillColor:area.color,fillOpacity:.22,weight:2,dashArray:'5 5'}
    }).addTo(map);
    layer.on('click',()=>select(key));
    outlines.set(key,layer);
   }
   if(pending) focus(pending);
  }).catch(error=>console.warn('Regional outlines unavailable',error));
 return {focus};
};

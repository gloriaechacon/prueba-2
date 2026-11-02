(() => {
 const $=s=>document.querySelector(s), reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const params=new URLSearchParams(location.search), embed=params.get('embed');
 addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='rainbow-palette')return;document.querySelectorAll('.parcel-frame,.editorial-opening,.inline-house-stage iframe').forEach(frame=>frame.contentWindow.postMessage(e.data,location.origin));});
 const fade=el=>{if(el&&!reduced.matches)el.animate([{opacity:.3},{opacity:1}],{duration:650,easing:'ease-out'});};
 // Keep labels explicit even when the original translation/model scripts update them.
 function clean(node){
  if(node.nodeType===3){if(/[↗↖⤴]/.test(node.data))node.data=node.data.replace(/[↗↖⤴]/g,'').trimEnd();return;}
  if(node.nodeType!==1||node.matches('script,style,canvas,svg'))return;
  [...node.childNodes].forEach(clean);
  if(node.matches('a,button')&&!node.textContent.trim()&&node.getAttribute('aria-label'))node.append(document.createTextNode(node.getAttribute('aria-label')));
 }
 clean(document.body);
 new MutationObserver(records=>records.forEach(r=>r.type==='characterData'?clean(r.target):r.addedNodes.forEach(clean))).observe(document.body,{subtree:true,childList:true,characterData:true});
 document.querySelectorAll('.circle-link').forEach(a=>{a.textContent=a.getAttribute('aria-label')||'Ver detalles';a.classList.add('explicit-action');});
 const zone=$('#lot-explorer');
 function pickLot(id){const n=Number(String(id).replace('RP-',''));const button=document.querySelector('#zone-list [data-zone-lot="'+n+'"]');if(button)button.click();else pendingLot=n;}
 let pendingLot=null;
 if(zone){
  const intro=$('.zone-intro h2');if(intro)intro.innerHTML='Conoce los lotes<br><em>de Rainbow Park.</em>';
  const description=$('.zone-intro>p');if(description)description.textContent='Primero elige una ubicación. Después podrás acercarte al terreno y explorar una vivienda sobre él.';
  const help=document.createElement('div');help.className='parcel-guide';
  help.innerHTML='<div><h3>Estás viendo Rainbow Park desde el aire</h3><p>Los números señalan los lotes de la colección. Selecciona uno para acercarte a su ubicación.</p></div><label>Elige el lote que quieres conocer<select id="guided-lot"><option value="">Ver las 13 ubicaciones</option></select></label><ol><li>Elige un lote</li><li>Revisa su ubicación y superficie</li><li>Prueba la vista con vivienda</li></ol><details><summary>Cómo mover la vista</summary><p>Arrastra para moverte. Usa + y − para acercarte o alejarte. En teléfono, utiliza dos dedos. Las opciones de giro y vista aérea están dentro del explorador.</p></details>';
  zone.before(help);
  fetch('/assets/geography/collection-lots.json').then(r=>r.json()).then(data=>{data.lots.forEach(l=>$('#guided-lot').add(new Option('Lote '+String(l.pinIndex).padStart(2,'0')+' · '+l.front.nearestStreet,l.id)));if(pendingLot)pickLot(pendingLot);}).catch(()=>{});
  $('#guided-lot').addEventListener('change',e=>{if(e.target.value)pickLot(e.target.value);else $('#zone-overview')?.click();});
  document.addEventListener('rpc:lot',event=>{const id='RP-'+String(event.detail).padStart(2,'0');$('#guided-lot').value=id;if(parent!==window)parent.postMessage({type:'parcel-selected',lot:id},location.origin);});
  const watch=new MutationObserver(()=>{if(pendingLot){const n=pendingLot;pendingLot=null;pickLot(n);}});watch.observe($('#zone-list'),{childList:true});
  addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent)return;if(e.data?.type==='rainbow-lot')pickLot(e.data.lot);});
 }
 if(embed){
  document.body.classList.add('embedded-'+embed);
  if(embed==='lotes'){
   zone.querySelectorAll('[data-zone-state="clean"]').forEach(button=>button.remove());
   const toolbar=document.createElement('div');toolbar.className='embedded-map-toolbar';toolbar.setAttribute('aria-label','Controles del mapa');
   ['.zone-modes'].forEach(selector=>{const control=zone.querySelector(selector);if(control)toolbar.append(control);});
   zone.querySelector('.zone-layout').before(toolbar);
   const poster=$('.zone-poster');if(poster){poster.loading='eager';poster.fetchPriority='high';}const actions=document.createElement('div');actions.className='embedded-plot-actions';actions.innerHTML='<strong>Explora este terreno</strong>';['.zone-states','#zone-house-choice','#zone-state-note'].forEach(sel=>{const el=$(sel);if(el)actions.append(el);});zone.append(actions);new ResizeObserver(()=>parent.postMessage({type:'parcel-height',height:Math.ceil(zone.getBoundingClientRect().height)+4},location.origin)).observe(zone);}
  if(embed==='hero')document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#"]');if(link){e.preventDefault();parent.postMessage({type:'rainbow-destination',section:link.hash.slice(1)},location.origin);}});
 }
 // Reuse the actual aerial/3D explorer, not a second symbolic street map.
 const map=$('#c-map');
 if(map){
  const frame=document.createElement('iframe');frame.className='parcel-frame';frame.title='Vista aérea y exploración de los lotes de Rainbow Park';frame.loading='lazy';frame.src='/a/?embed=lotes&lang='+(new URLSearchParams(location.search).get('lang')||'en')+'&revision=layout2&palette='+(document.body.dataset.palette||'champagne');map.replaceChildren(frame);
  const send=()=>{const lot=$('#c-lot')?.value;if(lot)frame.contentWindow.postMessage({type:'rainbow-lot',lot},location.origin);};frame.addEventListener('load',send);addEventListener('rpc:lots-ready',send);$('#c-lot')?.addEventListener('change',send);
  addEventListener('message',e=>{if(e.origin===location.origin&&e.source===frame.contentWindow&&e.data?.type==='parcel-height'&&Number.isFinite(e.data.height))frame.style.height=Math.max(600,Math.min(1400,e.data.height))+'px';});
  addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='parcel-selected')return;const select=$('#c-lot');if(select?.options.length&&select.value!==e.data.lot){select.value=e.data.lot;select.dispatchEvent(new Event('change'));}});
  const heading=$('body[data-page=lotes] .c-heading h1');if(heading)heading.textContent='Explora los lotes desde el aire';
  const btitle=$('.salon-lots .section-opening h2');if(btitle)btitle.innerHTML='Conoce los lotes<br>de Rainbow Park.';
 }
 // House models are visible inline; the full-screen button remains available.
 const houses=$('.c-house-grid');
 if(houses){
  const stage=document.createElement('div');stage.className='inline-house-stage';stage.innerHTML='<iframe title="Vivienda del proyecto en 3D" loading="lazy" allow="fullscreen"></iframe><p>Modelo conceptual del proyecto. Arrastra para girar; utiliza los controles para cambiar de vista.</p>';houses.before(stage);
  let current='';const render=house=>{if(current===house)return;current=house;stage.querySelector('iframe').src='/utah/?house='+house+'&view=exterior&embed=vivienda&lang='+(window.rpcI18n?.language||localStorage.getItem('rpc-language')||'en');};
  const visible=()=>{const article=[...houses.children].find(el=>!el.hidden);return article?.querySelector('[data-house]')?.dataset.house||'utah';};
  render(visible());
  $('.atlas-models')?.addEventListener('click',()=>render(visible()));
  if(document.body.classList.contains('salon')){const tabs=document.createElement('div');tabs.className='inline-model-tabs';tabs.setAttribute('aria-label','Vivienda que se muestra en 3D');['utah','bell'].forEach(h=>{const b=document.createElement('button');b.textContent=h==='utah'?'Ver Utah en 3D':'Ver Bell en 3D';b.setAttribute('aria-pressed',h==='utah');b.addEventListener('click',()=>{render(h);tabs.querySelectorAll('button').forEach(t=>t.setAttribute('aria-pressed',t===b));});tabs.append(b);});stage.before(tabs);}
  houses.querySelectorAll('[data-house]').forEach(b=>b.textContent='Abrir '+(b.dataset.house==='utah'?'Utah':'Bell')+' en pantalla completa');
 }
 // Combine A's editorial opening with C's independent-page navigation.
 const home=$('body.c-page[data-page=inicio] .c-home');
 if(home){const frame=document.createElement('iframe');frame.className='editorial-opening';frame.title='Rainbow Park: un lugar para imaginar';frame.src='/a/?embed=hero&palette='+(document.body.dataset.palette||'champagne');home.replaceWith(frame);addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==frame.contentWindow||e.data?.type!=='rainbow-destination')return;const section=e.data.section;if(['lotes','entorno','viviendas','inversion','contacto'].includes(section))location.href='/c/'+section+'/?palette='+(document.body.dataset.palette||'champagne');});}
 // Give surroundings a clear, photographic entry before the itinerary.
 const destinations=$('body.c-page[data-page=entorno] .c-destinations');
 if(destinations&&!document.body.classList.contains('final-detail')){const chooser=document.createElement('div');chooser.className='destination-choices';chooser.setAttribute('aria-label','Elige qué quieres conocer de Ocala');const items=[['wec','Mundo ecuestre','Eventos y encuentros','territory-wec.jpg'],['downtown','El centro de Ocala','Calles y vida urbana','territory-downtown.jpg'],['nature','Rainbow Springs','Agua y naturaleza','territory-nature.jpg']];items.forEach(([key,title,copy,img])=>{const b=document.createElement('button');b.innerHTML='<img src="/assets/'+img+'" alt="" loading="lazy"><span><strong>'+title+'</strong><small>'+copy+'</small><b>Conocer este lugar</b></span>';b.addEventListener('click',()=>{destinations.querySelector('[data-place="'+key+'"]').click();$('.c-destination').scrollIntoView({block:'center',behavior:reduced.matches?'instant':'smooth'});});chooser.append(b);});destinations.before(chooser);}
 // A browsable guide rather than one very long investment document.
 const dossier=$('.dossier-main');
 if(dossier){
  document.body.classList.add('guided-investment');
  const intro=$('.dossier-intro'),summary=$('.dossier-summary'),thesis=$('#tesis'),atlas=$('#mapa-inversiones');
  const overview=document.createElement('section');overview.id='resumen-guiado';overview.className='tour-view';
  if(intro)overview.append(intro);if(summary&&!overview.contains(summary))overview.append(summary);if(thesis)overview.append(thesis);
  dossier.prepend(overview);if(atlas)dossier.append(atlas);
  const entries=[[overview,'Qué está cambiando'],[atlas,'Dónde ocurre'],[$('#proyectos'),'Los proyectos'],[$('#datos'),'Los datos'],[$('#documentos'),'Las fuentes'],[$('#decision'),'Tu lote']].filter(([el])=>el);
  $('.dossier-index')?.remove();const heading=document.createElement('header');heading.className='tour-heading-bar';heading.innerHTML='<h1>Invertir en Ocala</h1><p>Conoce los cambios de la región, revisa los proyectos y consulta sus fuentes.</p>';dossier.prepend(heading);
  const nav=document.createElement('nav');nav.className='tour-index';nav.setAttribute('aria-label','Recorrido de inversión');heading.after(nav);
  const controls=document.createElement('div');controls.className='tour-controls';controls.innerHTML='<button class="tour-prev">Anterior</button><p role="status" aria-live="polite"></p><button class="tour-next"></button>';dossier.append(controls);
  let active=0;
  function show(index,scroll=true){active=Math.max(0,Math.min(entries.length-1,index));entries.forEach(([el],i)=>{el.hidden=i!==active;el.classList.add('tour-view');});[...nav.children].forEach((b,i)=>b.setAttribute('aria-current',i===active?'step':'false'));controls.querySelector('p').textContent=(active+1)+' de '+entries.length+' · '+entries[active][1];controls.querySelector('.tour-prev').disabled=active===0;controls.querySelector('.tour-next').textContent=active===entries.length-1?'Volver al comienzo':'Siguiente: '+entries[active+1][1];dispatchEvent(new Event('resize'));fade(entries[active][0]);if(scroll)heading.scrollIntoView({block:'start',behavior:'instant'});}
  function go(index){const i=Math.max(0,Math.min(entries.length-1,index));history.replaceState(null,'','#'+entries[i][0].id);show(i);}
  entries.forEach(([el,label],i)=>{const b=document.createElement('button');b.textContent=label;b.addEventListener('click',()=>go(i));nav.append(b);});controls.querySelector('.tour-prev').addEventListener('click',()=>go(active-1));controls.querySelector('.tour-next').addEventListener('click',()=>go(active===entries.length-1?0:active+1));
  const projects=[...dossier.querySelectorAll('#proyectos .investment-project')];
  if(projects.length){const content=projects[0].querySelector('.project-content');const gallery=$('.investment-gallery'),program=$('.sports-program');if(gallery)content.prepend(gallery);if(program){const detail=document.createElement('details');detail.innerHTML='<summary>Ver el programa deportivo propuesto</summary>';detail.append(program);content.append(detail);}}
  if(projects.length){const select=document.createElement('select');select.id='guided-project';const label=document.createElement('label');label.htmlFor=select.id;label.className='guided-project-label';label.textContent='Proyecto que quieres conocer';projects.forEach((p,i)=>select.add(new Option(p.querySelector('.project-name strong')?.textContent||'Proyecto '+(i+1),String(i))));label.append(select);projects[0].before(label);const reveal=()=>projects.forEach((p,i)=>{p.hidden=i!==Number(select.value);p.open=i===Number(select.value);});select.addEventListener('change',()=>{reveal();fade(projects[Number(select.value)]);});reveal();}
  function syncHash(){const id=location.hash.slice(1);const target=document.getElementById(id);const i=entries.findIndex(([el])=>el===target||(target&&el.contains(target)));if(i>=0)show(i,false);const project=target?.closest('.investment-project');if(project){const index=projects.indexOf(project);const select=$('#guided-project');if(index>=0&&select){select.value=String(index);select.dispatchEvent(new Event('change'));}}}
  show(0,false);syncHash();
  // Legacy dossier filters also respond to hashes; restore one-project selection after them.
  addEventListener('hashchange',()=>queueMicrotask(syncHash));
  addEventListener('DOMContentLoaded',()=>queueMicrotask(syncHash),{once:true});
  addEventListener('beforeprint',()=>entries.forEach(([el])=>el.hidden=false));addEventListener('afterprint',()=>queueMicrotask(()=>{show(active,false);$('#guided-project')?.dispatchEvent(new Event('change'));}));
 }
})();

// Demonstration inventory only; values must be replaced by confirmed commercial data.
(()=>{
 const status=n=>n<=5?'Disponible':n<=7?'Reservado':'Vendido';
 const translate=s=>window.rpcI18n?.t(s)||s;
 function refresh(){
  document.querySelectorAll('#guided-lot,#c-lot').forEach(select=>{
   for(const option of select.options){const n=Number(option.value.replace('RP-',''));if(!n)continue;
    if(!option.dataset.baseLabel)option.dataset.baseLabel=option.textContent.split(' · '+translate('Disponible'))[0];
    const street=option.dataset.baseLabel.split(' · ').slice(1).join(' · ');const text=String(n).padStart(2,'0')+' — '+translate(status(n))+' · '+street+' ('+translate('Ejemplo')+')';if(option.textContent!==text)option.textContent=text;
   }
   let note=select.parentElement.querySelector('.availability-note');if(!note){note=document.createElement('p');note.className='availability-note';select.after(note)}
   const text=translate('Estados de ejemplo · Pendientes de confirmación');if(note.textContent!==text)note.textContent=text;
  });
  document.querySelectorAll('[data-zone-lot]').forEach(button=>{const n=Number(button.dataset.zoneLot);if(!n)return;button.dataset.availability=n<=5?'available':n<=7?'reserved':'sold';button.title=translate('Lote')+' '+n+' · '+translate(status(n))+' ('+translate('Ejemplo')+')';});
  document.querySelectorAll('#zone-title,#c-lot-title').forEach(title=>{
   const raw=title.id==='c-lot-title'?document.querySelector('#c-lot')?.value:document.querySelector('#lot-explorer')?.dataset.selectedLot;
   const n=Number(String(raw||'').replace('RP-',''));let badge=title.parentElement.querySelector('.availability-badge');if(!badge){badge=document.createElement('span');badge.className='availability-badge';title.after(badge)}
   badge.hidden=!n;if(n){badge.dataset.availability=n<=5?'available':n<=7?'reserved':'sold';const text=translate(status(n))+' · '+translate('Ejemplo');if(badge.textContent!==text)badge.textContent=text;}
  });
  const north=document.querySelector('#zone-north small');if(north&&north.textContent!==translate('Norte'))north.textContent=translate('Norte');
 }
 const observer=new MutationObserver(()=>{observer.disconnect();refresh();observer.observe(document.body,{childList:true,subtree:true})});
 observer.observe(document.body,{childList:true,subtree:true});
 document.addEventListener('rpc:lot',()=>queueMicrotask(refresh));addEventListener('rpc:lots-ready',refresh);document.addEventListener('change',refresh);addEventListener('rpc:language',refresh);refresh();
})();

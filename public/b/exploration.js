(() => {
 const body=document.body;body.classList.add('exploration');
 const intro=document.querySelector('.project-introduction');
 const paths=document.createElement('nav');paths.className='explore-paths';paths.setAttribute('aria-label','Elige cómo explorar');
 paths.innerHTML='<a href="#lotes"><span>Un lugar propio</span><strong>El terreno</strong></a><a href="#viviendas"><span>Una forma de vivir</span><strong>La casa</strong></a><a href="#entorno"><span>Lo que te rodea</span><strong>Ocala</strong></a>';
 intro.append(paths);
 function studio(sectionId,toolSelector,image,title,description,label){
  const section=document.getElementById(sectionId),tool=section.querySelector(toolSelector);
  const stage=document.createElement('div');stage.className='explore-scene';
  stage.innerHTML=`<img src="${image}" alt="${description}" loading="lazy"><div class="scene-copy"><p>${description}</p><h2>${title}</h2><button type="button" aria-expanded="false" aria-controls="${sectionId}-workspace">${label}</button></div>`;
  const workspace=document.createElement('div');workspace.className='explore-workspace';workspace.id=sectionId+'-workspace';workspace.hidden=true;
  const close=document.createElement('button');close.type='button';close.className='workspace-close';close.textContent='Cerrar explorador';workspace.append(close,tool);
  section.prepend(stage);stage.after(workspace);
  const toggle=stage.querySelector('button');
  function set(open){workspace.hidden=!open;toggle.setAttribute('aria-expanded',String(open));dispatchEvent(new Event('resize'));if(open){workspace.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});close.focus({preventScroll:true});}else toggle.focus();}
  toggle.addEventListener('click',()=>set(workspace.hidden));close.addEventListener('click',()=>set(false));
 }
 studio('lotes','.zone-explorer','assets/geography/collection-aerial.jpg','Elige dónde empieza.','13 ubicaciones en Rainbow Park. Imagen aérea de referencia.','Entrar a los lotes');
 studio('viviendas','.showroom','utah/acabados-concepto.png','Imagina la vida aquí.','Utah y Bell. Arquitectura y acabados conceptuales.','Explorar las viviendas');
 // A map is available on demand; the destination photograph leads this journey.
 const map=document.querySelector('.territory-map-wrap');
 const mapDetail=document.createElement('details');mapDetail.className='explore-map';
 mapDetail.innerHTML='<summary>Ubicar estos lugares en el mapa</summary>';map.before(mapDetail);mapDetail.append(map);
 mapDetail.addEventListener('toggle',()=>dispatchEvent(new Event('resize')));
 document.querySelectorAll('.explore-scene,.project-introduction,.territory-opening,.destination-story,#inversion,.contact-layout').forEach(e=>e.dataset.motion='reveal');
})();

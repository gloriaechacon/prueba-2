(() => {
 document.body.dataset.palette='champagne';
 const consultation=document.querySelector('#c-consultation textarea');if(consultation){try{const question=sessionStorage.getItem('rpc-question');if(question&&!consultation.value){consultation.value=question;sessionStorage.removeItem('rpc-question');}}catch{}}
 const home=document.body.classList.contains('final-home');
 const housing=document.body.classList.contains('final-housing');
 const routes={lotes:'lotes',entorno:'entorno',inversion:'inversion',dossier:'inversion',viviendas:'viviendas',casas:'viviendas',contacto:'contacto',consulta:'contacto'};
 const nav=document.querySelector('.final-nav'),menu=nav?.querySelector('.final-menu');
 const links=nav?.querySelector('#final-links');
 if(menu&&links){
  const drawer=document.createElement('dialog'),close=document.createElement('button'),slot=document.createComment('navigation');
  drawer.className='site-drawer';drawer.setAttribute('aria-label','Menu');close.type='button';close.className='drawer-close';close.textContent='×';drawer.append(close);document.body.append(drawer);links.before(slot);
  menu.onclick=()=>{const lang=document.documentElement.lang.slice(0,2);close.setAttribute('aria-label',({es:'Cerrar menú',pt:'Fechar menu'})[lang]||'Close menu');drawer.append(links);drawer.showModal();menu.setAttribute('aria-expanded','true');close.focus();};
  close.onclick=()=>drawer.close();drawer.onclick=e=>{if(e.target===drawer&&e.clientX>=drawer.getBoundingClientRect().right)drawer.close();};
  drawer.addEventListener('close',()=>{slot.after(links);menu.setAttribute('aria-expanded','false');if(menu.offsetWidth)menu.focus({preventScroll:true});});
  matchMedia('(max-width:1100px)').addEventListener('change',e=>{if(!e.matches&&drawer.open)drawer.close();});
  new ResizeObserver(()=>document.documentElement.style.setProperty('--nav-height',nav.getBoundingClientRect().height+'px')).observe(nav);
 }
 function linkPage(key){return '/proyecto/'+key+'/';}
 function correctLinks(){document.querySelectorAll('a[href]').forEach(a=>{
  if(a.matches('.scroll-link,.skip,.c-skip')||a.closest('.zone-viewport'))return;
  const raw=a.getAttribute('href');
  if(housing&&raw==='#inicio'){a.href='/';return;}
  if(housing&&routes[raw.slice(1)]&&raw[0]==='#'){a.href=linkPage(routes[raw.slice(1)]);return;}
  const u=new URL(a.href,location.href);
  if(u.origin!==location.origin)return;
  if(/\/(a|b|c)\/inversion\//.test(u.pathname)){a.href=linkPage('inversion');return;}
  if(u.pathname==='/c/'||u.pathname==='/a/'){if(routes[u.hash.slice(1)])a.href=linkPage(routes[u.hash.slice(1)]);else if(!u.hash)a.href='/';}
  if(u.pathname.startsWith('/c/'))a.href=u.pathname.replace('/c/','/proyecto/')+u.search+u.hash;
 });}
 correctLinks();
 if(housing)new MutationObserver(correctLinks).observe(document.querySelector('#main'),{childList:true,subtree:true});
 // Preserve the home's model preview, but take deeper actions to the complete studio.
 if(home){
  document.addEventListener('click',event=>{if(event.target.closest('#compare-homes,[data-open-placement],[data-open-tour]')){event.preventDefault();event.stopImmediatePropagation();location.href=linkPage('viviendas');}},true);
  document.querySelector('#home-back-top')?.addEventListener('click',event=>{
   event.preventDefault();
   const hero=document.getElementById('inicio');
   hero.setAttribute('tabindex','-1');
   hero.focus({preventScroll:true});
   window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'});
  });
  for(const [id,label] of [['lotes','Ver los lotes y sus detalles'],['entorno','Conocer el entorno de Ocala'],['viviendas','Ver fichas y recorridos de Utah y Bell']]){
   const section=document.getElementById(id);if(!section)continue;
   const a=document.createElement('a');a.href=linkPage(id);a.className='final-section-link';a.textContent=label;
   section.append(a);
  }
 }
 if(home){
  const heading=document.querySelector('#viviendas .home-heading');
  const specs=document.querySelector('#viviendas .home-specs');
  const link=heading?.querySelector('.final-section-link');
  if(heading&&specs)heading.append(specs);
 }
 if(home){
  const investment=document.querySelector('#inversion');
  const investmentLink=investment?.querySelector('.investment-button');
  if(investmentLink){investmentLink.removeAttribute('target');investment.append(investmentLink);}
  document.querySelectorAll('.enter-orbit,.intro-link,.final-section-link,.investment-button').forEach(a=>{
   a.classList.add('home-cta');
   if(!a.classList.contains('enter-orbit')){const row=document.createElement('div');row.className='home-cta-row';a.before(row);row.append(a);}
  });
  const buttons=document.querySelectorAll('.home-cta');
  const active=new IntersectionObserver(entries=>entries.forEach(e=>e.target.classList.toggle('cta-visible',e.isIntersecting)),{threshold:.8});buttons.forEach(b=>active.observe(b));
 }
 if(home){
  const guide=document.querySelector('.parcel-guide');
  const picker=guide?.querySelector('label');
  const panel=document.querySelector('#lot-explorer .zone-panel');
  if(picker&&panel){picker.className='integrated-lot-picker';panel.querySelector('.eyebrow')?.after(picker);picker.firstChild.textContent='';picker.querySelector('select').setAttribute('aria-label','Choose a lot');guide.remove();}
 }
 const houseChoice=document.querySelector('#zone-house-choice');
 if(houseChoice){const title=document.createElement('strong');title.className='house-choice-title';title.textContent='Choose a home';houseChoice.prepend(title);}
 // Give the aerial explorer its own toolbar instead of layering controls over the terrain.
 if(home){const explorer=document.querySelector('#lot-explorer');if(explorer){
  const toolbar=document.createElement('div');toolbar.className='final-map-toolbar';toolbar.setAttribute('aria-label','Controles del mapa');
  ['.zone-modes','.zone-landscape'].forEach(selector=>{const el=explorer.querySelector(selector);if(el)toolbar.append(el);});
  explorer.querySelector('.zone-layout').before(toolbar);
  const landscape=toolbar.querySelector('details');if(landscape){landscape.open=false;landscape.querySelector('summary').textContent='Opciones de imagen';}
  const note=explorer.querySelector('#zone-initial-note');if(note){note.innerHTML='<p>Selecciona un número en el mapa o en la lista para ver la ubicación y los detalles del lote.</p>';}
  const eyebrow=explorer.querySelector('.zone-panel>.eyebrow');if(eyebrow)eyebrow.textContent='Elige un lote';
 }}
 if(home){
  const explorer=document.querySelector('#lot-explorer');
  const picker=explorer.querySelector('.integrated-lot-picker');
  const compact=document.createElement('div');
  compact.className='mobile-lot-controls';
  explorer.querySelector('.zone-layout').before(compact);
  const pickerCaption=document.createElement('span');pickerCaption.className='mobile-picker-caption';pickerCaption.textContent='Elige un lote';picker.prepend(pickerCaption);
  const controls=[picker,explorer.querySelector('.zone-state-heading'),explorer.querySelector('.zone-states'),houseChoice];
  const anchors=controls.map(el=>{const marker=document.createComment('lot control');el.before(marker);return marker});
  const narrow=matchMedia('(max-width:750px)');
  function arrangeControls(){
   controls.forEach((el,i)=>{if(narrow.matches)compact.append(el);else anchors[i].after(el)});
   compact.hidden=!narrow.matches;
  }
  arrangeControls();narrow.addEventListener('change',arrangeControls);
  const scene=document.querySelector('#home-scene');
  const tip=document.createElement('span');
  tip.className='home-rotate-tip';tip.dataset.noTranslate='';
  scene.after(tip);
  function showTip(){
   const labels={en:'Drag to rotate',es:'Arrastra para girar',pt:'Arraste para girar'};
   tip.textContent=(labels[window.rpcI18n?.language]||labels.en);
   tip.hidden=false;
  }
  showTip();document.addEventListener('rpc:language',showTip);
  scene.addEventListener('pointermove',event=>{if(event.buttons)tip.hidden=true});
  document.querySelector('.showroom').addEventListener('click',event=>{if(event.target.closest('[data-home-view],[data-home]'))showTip()});
 }
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 function updateHeader(){if(!home||!nav)return;const progress=Math.min(1,Math.max(0,scrollY/Math.max(200,(document.querySelector('.hero')?.offsetHeight||700)*.65)));nav.style.setProperty('--header-progress',String(progress));nav.style.setProperty('--header-blur',(progress*18)+'px');nav.classList.toggle('is-solid',progress>.55);}
 addEventListener('scroll',updateHeader,{passive:true});updateHeader();
 // Repeated reveals at viewport boundaries; never gate the 3D/map controls on animation.
 let observer;function motion(){observer?.disconnect();const targets=[...document.querySelectorAll('.final-home .project-introduction>*,.final-home .zone-intro,.final-home .chapter-heading,.final-home .territory-opening,.final-home .destination-tabs,.final-home .investment-intro,.final-home .home-heading,.final-home .home-selector,.final-home .home-specs,.final-home .contact-layout>*,.final-home .final-section-link')];
  if(reduced.matches){targets.forEach(el=>el.classList.remove('scroll-reveal','reveal-out','reveal-in'));return;}
  observer=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>{target.classList.toggle('reveal-in',isIntersecting);target.classList.toggle('reveal-out',!isIntersecting);}),{rootMargin:'-70px 0px -45px 0px',threshold:0});
  targets.forEach(el=>{el.classList.add('scroll-reveal');observer.observe(el);});
 }
 motion();reduced.addEventListener('change',motion);
})();

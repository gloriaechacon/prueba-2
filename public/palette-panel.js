(() => {
 const frame=document.getElementById('preview');
 const palettes={champagne:{name:'Champaña',description:'Grafito y dorado suave',colors:['#26272b','#efe8d9','#d2b77e','#9f895d']},navy:{name:'Azul noche',description:'Azul profundo y piedra',colors:['#142b49','#f0f1f3','#334f70','#c7b58d']}};
 const params=new URLSearchParams(location.search);
 let currentC=null;
 const cPath=id=>'/c/'+(['inicio','project-intro-title'].includes(id)?'':id+'/');
 let palette=Object.hasOwn(palettes,params.get('palette'))?params.get('palette'):'champagne';
 const workspace=document.createElement('div');workspace.className='review-workspace';
 const stage=document.getElementById('stage');stage.before(workspace);
 const panel=document.createElement('aside');panel.className='palette-panel';panel.setAttribute('aria-label','Secciones y colores');
 panel.innerHTML='<h2>Compara la propuesta</h2><p>El estilo y la paleta acompañan todo el recorrido.</p><label for="review-section">Sección que estamos revisando</label><select id="review-section"><option value="inicio">Portada</option><option value="project-intro-title">Qué es Rainbow Park</option><option value="lotes">Lotes</option><option value="entorno">Entorno</option><option value="inversion">Inversión</option><option value="viviendas">Viviendas</option><option value="contacto">Contacto</option></select><div class="palette-options" role="group" aria-label="Paleta de color"></div><p class="palette-status" role="status" aria-live="polite"></p><p class="palette-scope">Arriba eliges A, B, C o D. Aquí eliges los colores, sin perder la sección.</p>';
 workspace.append(panel,stage);
 const section=panel.querySelector('#review-section');
 if([...section.options].some(o=>o.value===params.get('section')))section.value=params.get('section');
 function navigateSection(){const selected=document.querySelector('[data-version][aria-pressed="true"]').dataset.version;if(selected==='c'){const desired=['inicio','project-intro-title'].includes(section.value)?'inicio':section.value;if(currentC!==desired){currentC=desired;frame.src=cPath(section.value)+'?palette='+palette;}return;}if(selected==='d'){frame.contentWindow.postMessage({type:'rainbow-section',section:section.value},location.origin);return;}if(selected==='original'){frame.src='/original/?lang=es#'+(section.value==='project-intro-title'?'lotes':section.value);}else frame.contentWindow.postMessage({type:'rainbow-section',section:section.value},location.origin);}
 section.addEventListener('change',()=>{navigateSection();apply();});
 document.querySelectorAll('[data-width]').forEach(button=>button.addEventListener('click',()=>requestAnimationFrame(()=>requestAnimationFrame(navigateSection))));
 const buttons=[];
 for(const [key,p] of Object.entries(palettes)){const button=document.createElement('button');button.className='palette-choice';button.dataset.palette=key;button.type='button';button.setAttribute('aria-pressed','false');button.innerHTML='<span class="palette-swatches" aria-hidden="true">'+p.colors.map(color=>'<i style="--swatch:'+color+'"></i>').join('')+'</span><strong>'+p.name+'</strong><small>'+p.description+'</small>';button.addEventListener('click',()=>{palette=key;apply();});panel.querySelector('.palette-options').append(button);buttons.push(button);}
 function apply(){
   const selected=document.querySelector('[data-version][aria-pressed="true"]').dataset.version;
   const isOriginal=selected==='original';
   buttons.forEach(b=>{b.setAttribute('aria-pressed',!isOriginal&&b.dataset.palette===palette);b.disabled=isOriginal;});
   panel.querySelector('.palette-status').textContent=isOriginal?'La versión actual conserva sus colores. Elige A, B, C o D para probar paletas.':'Seleccionada: '+palettes[palette].name;
   if(!isOriginal)frame.contentWindow.postMessage({type:'rainbow-palette',palette},location.origin);
   const href=new URL(selected==='c'?cPath(section.value):frame.src,location.origin);if(!isOriginal)href.searchParams.set('palette',palette);if(selected!=='c')href.hash=selected==='d'?({viviendas:'casas',inversion:'dossier',contacto:'consulta','project-intro-title':'inicio'}[section.value]||section.value):section.value;document.getElementById('open').href=href.href;
   const url=new URL(location.href);url.searchParams.set('version',selected);url.searchParams.set('palette',palette);url.searchParams.set('section',section.value);history.replaceState(null,'',url);
 }
 frame.addEventListener('load',()=>{apply();if(['a','b','d'].includes(document.querySelector('[data-version][aria-pressed="true"]').dataset.version))navigateSection();});
 document.querySelectorAll('[data-version]').forEach(button=>button.addEventListener('click',()=>{apply();if(button.dataset.version==='c'){currentC=null;navigateSection();}}));
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==frame.contentWindow||event.data?.type!=='rainbow-page')return;currentC=event.data.section;section.value=currentC;apply();section.dispatchEvent(new Event('review-page'));});
 if(['a','b','c','d','original'].includes(params.get('version')))document.querySelector('[data-version="'+params.get('version')+'"]').click();
 const phone=matchMedia('(max-width:650px)');
 const selectPhone=()=>{if(phone.matches)document.querySelector('[data-width="390"]').click();};
 selectPhone();phone.addEventListener('change',selectPhone);
 apply();
})();

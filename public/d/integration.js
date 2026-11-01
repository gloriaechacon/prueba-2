(() => {
 const routes={inicio:'inicio','project-intro-title':'inicio',entorno:'entorno',lotes:'lotes',viviendas:'casas',inversion:'dossier',contacto:'consulta'};
 const sections={inicio:'inicio',entorno:'entorno',lotes:'lotes',casas:'viviendas',dossier:'inversion',consulta:'contacto'};
 function palette(value){if(['champagne','navy'].includes(value))document.documentElement.dataset.palette=value;}
 palette(new URLSearchParams(location.search).get('palette')||'champagne');
 addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==parent)return;const data=event.data;if(data?.type==='rainbow-palette')palette(data.palette);if(data?.type==='rainbow-section'&&routes[data.section])location.hash=routes[data.section];});
 addEventListener('hashchange',()=>parent.postMessage({type:'rainbow-page',section:sections[location.hash.slice(1)]||'inicio'},location.origin));
})();

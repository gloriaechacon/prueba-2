import {dossier} from '/d/dossier.js?v=20261101-explore';
const main=document.querySelector('#main');
try {
 const [evidence,map]=await Promise.all(['/d/recursos/inversion/evidencia-ocala.json','/d/recursos/inversion/project-map.json'].map(async url=>{const response=await fetch(url);if(!response.ok)throw new Error('No se pudo cargar '+url);return response.json();}));
 dossier(main,evidence,map,question=>{try{sessionStorage.setItem('rpc-question',question);}catch{}location.href='/proyecto/contacto/';});
 document.querySelector('.dossier-head h1').textContent='Invertir en Ocala';
 document.querySelector('#download-dossier').textContent='Descargar dossier en texto';
} catch(error){main.innerHTML='<section class="dossier-shell"><h1>No pudimos cargar el dossier.</h1><p>Recarga la página para volver a intentarlo.</p></section>';console.error(error);}

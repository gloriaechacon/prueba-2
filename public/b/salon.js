(() => {
 const menu=document.querySelector('.salon-menu'),nav=document.querySelector('#salon-links');
 menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',open);nav.classList.toggle('open',open);});
 nav.addEventListener('click',e=>{if(e.target.closest('a')){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');}});
 addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.type!=='rainbow-section')return;document.getElementById(e.data.section)?.scrollIntoView({behavior:'instant',block:'start'});});
 // Fade only the photographic moments; no sliding, scaling or scroll hijacking.
 document.querySelectorAll('.place img,.c-house-grid article>img').forEach(el=>el.dataset.motion='reveal');
})();

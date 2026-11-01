(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const contactTitle=document.querySelector('.contact h2');
 function naturalTitle(){contactTitle?.querySelectorAll('br').forEach(br=>br.replaceWith(document.createTextNode(' ')));}
 naturalTitle();
 if(contactTitle)new MutationObserver(naturalTitle).observe(contactTitle,{childList:true,subtree:true});
 // Motion explains a user-triggered content change; there are no scroll reveals.
 function transition(target){
  if(reduced.matches||!target)return;
  target.getAnimations().forEach(animation=>animation.cancel());
  target.animate([{opacity:.25},{opacity:1}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});
 }
 document.querySelectorAll('[data-destination]').forEach(button=>button.addEventListener('click',()=>transition(document.querySelector('.destination-story'))));
 document.querySelectorAll('[data-home]').forEach(button=>button.addEventListener('click',()=>{transition(document.querySelector('.home-heading'));transition(document.querySelector('.home-specs'));}));
 document.querySelectorAll('.interest-picker button').forEach(button=>button.addEventListener('click',()=>transition(document.querySelector('.consultation-fields'))));
})();

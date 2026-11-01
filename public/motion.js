(() => {
 const load=src=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=src;script.onload=resolve;script.onerror=reject;document.head.append(script);});
 async function start(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try{
   if(!window.gsap)await load('/vendor/gsap.min.js');
   if(!window.ScrollTrigger)await load('/vendor/ScrollTrigger.min.js');
   gsap.registerPlugin(ScrollTrigger);
   gsap.matchMedia().add('(prefers-reduced-motion: no-preference)',()=>{
    document.querySelectorAll('[data-motion="reveal"]').forEach(element=>{
     ScrollTrigger.create({trigger:element,start:'top 92%',once:true,onEnter:()=>gsap.fromTo(element,{opacity:.35},{opacity:1,duration:1.1,ease:'sine.out',clearProps:'opacity'})});
    });
   });
   document.addEventListener('toggle',()=>ScrollTrigger.refresh(),true);
   document.fonts.ready.then(()=>ScrollTrigger.refresh());
  }catch(error){console.info('Motion unavailable; content remains readable.');}
 }
 start();
})();

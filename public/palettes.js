(() => {
 const choices=['champagne','navy'];
 const apply=value=>{document.body.dataset.palette=choices.includes(value)?value:'champagne';};
 apply(new URLSearchParams(location.search).get('palette')||'champagne');
 addEventListener('message',event=>{
   if(event.origin!==location.origin||event.source!==parent)return;
   if(event.data?.type==='rainbow-palette')apply(event.data.palette);
   if(event.data?.type==='rainbow-section'){
     const id=event.data.section;
     if(!['inicio','project-intro-title','lotes','entorno','inversion','viviendas','contacto'].includes(id))return;
     const target=id==='project-intro-title'?document.querySelector('.project-introduction'):document.getElementById(id);
     if(target){const header=document.querySelector('header').getBoundingClientRect().height;window.scrollTo({top:window.scrollY+target.getBoundingClientRect().top-header,behavior:'instant'});}
   }
 });
})();

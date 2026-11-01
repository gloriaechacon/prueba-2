(() => {
 const reduced=matchMedia('(prefers-reduced-motion:reduce)');
 const houses=document.querySelector('.c-house-grid');
 if(houses){
  const choices=document.createElement('div');choices.className='atlas-models';choices.setAttribute('role','group');choices.setAttribute('aria-label','Elegir vivienda');
  const articles=[...houses.children];let choice={};try{choice=JSON.parse(sessionStorage.getItem('rpc-choice')||'{}');}catch{}
  const selected=choice.house==='bell'?1:0;
  articles.forEach((article,index)=>{const button=document.createElement('button');button.textContent=article.querySelector('h2').textContent;button.setAttribute('aria-pressed',String(index===selected));choices.append(button);article.hidden=index!==selected;button.addEventListener('click',()=>{articles.forEach((a,i)=>a.hidden=i!==index);[...choices.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));try{const state=JSON.parse(sessionStorage.getItem('rpc-choice')||'{}');state.house=index===1?'bell':'utah';sessionStorage.setItem('rpc-choice',JSON.stringify(state));}catch{}if(!reduced.matches)article.animate([{opacity:.25},{opacity:1}],{duration:700,easing:'ease-out'});});});
  houses.before(choices);
 }
 const pause=document.querySelector('#c-video');if(pause)document.querySelector('.c-home-copy')?.append(pause);
 // A short dissolve on document entry, matching the outgoing page fade.
 if(!document.body.classList.contains('final-detail')&&!reduced.matches)document.querySelector('main')?.animate([{opacity:.4},{opacity:1}],{duration:650,easing:'ease-out'});
})();

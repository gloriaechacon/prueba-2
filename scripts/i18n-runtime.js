const normalize=s=>s.replace(/\s+/g,' ').trim();
const byKey=new Map();
for(const [es,[en,pt]] of Object.entries(catalog).reverse())for(const value of [en,pt,es])if(!byKey.has(normalize(value).toLowerCase()))byKey.set(normalize(value).toLowerCase(),{es,en,pt});
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrases=[...byKey.keys()].filter(s=>s.length>2).sort((a,b)=>b.length-a.length);
const fragments=new RegExp('(?<![\\p{L}\\p{N}])(?:'+phrases.map(escape).join('|')+')(?![\\p{L}\\p{N}])','giu');
let lang='en';try{lang=new URLSearchParams(location.search).get('lang')||'en'}catch{}
if(!['es','en','pt'].includes(lang))lang='en';
const original=new WeakMap(),attributes=new WeakMap();let observer;
function translated(source){

 const sourceKey=normalize(source),hit=byKey.get(sourceKey.toLowerCase());
 const pick=(s,v)=>/[a-záéíóúñãõç]/i.test(s)&&s===s.toUpperCase()?v.toUpperCase():v;
 if(hit)return source.replace(source.trim(),pick(sourceKey,hit[lang]));
 return source.replace(fragments,s=>pick(s,byKey.get(normalize(s).toLowerCase())[lang]));
}
function blocked(el){return !el||Boolean(el.closest('script,style,textarea,input,[data-no-translate],.rpc-language-control,canvas,svg defs'))}
function textNode(node){
 if(blocked(node.parentElement)||!node.textContent.trim())return;
 let state=original.get(node);if(!state||node.data!==state.rendered)state={source:node.data,rendered:node.data};
 const output=translated(state.source);if(node.data!==output)node.data=output;state.rendered=output;original.set(node,state);
}
function attrs(el){
 if(el.closest('script,style,[data-no-translate],.rpc-language-control'))return;let states=attributes.get(el)||{};
 for(const key of ['aria-label','title','alt','placeholder']){
  if(!el.hasAttribute(key))continue;const current=el.getAttribute(key);let state=states[key];
  if(!state||current!==state.rendered)state={source:current,rendered:current};
  const output=translated(state.source);if(output!==current)el.setAttribute(key,output);state.rendered=output;states[key]=state;
 }attributes.set(el,states);
}
function walk(root){
 if(root.nodeType===3){textNode(root);return}if(root.nodeType!==1||blocked(root))return;
 if(root.matches('option')&&!root.hasAttribute('value'))root.value=root.textContent;
 attrs(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT);
 while(walker.nextNode()){if(walker.currentNode.nodeType===3)textNode(walker.currentNode);else {const el=walker.currentNode;if(el.matches('option')&&!el.hasAttribute('value'))el.value=el.textContent;attrs(el)}}
}
function observe(){observer.observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','alt','placeholder']})}
observer=new MutationObserver(records=>{
 observer.disconnect();const roots=new Set();
 for(const record of records){if(record.type==='characterData')textNode(record.target);else if(record.type==='attributes')attrs(record.target);else for(const n of record.addedNodes)roots.add(n)}
 roots.forEach(walk);observe();
});
const controls=[];const names={es:'Español',pt:'Português',en:'English'};
function control(host,before=null){
 if(!host)return;const label=document.createElement('label');label.className='rpc-language-control';label.dataset.noTranslate='';label.innerHTML='<span aria-hidden="true">◎</span><select aria-label="Idioma / Language / Idioma"><option value="en">English</option><option value="pt">Português</option><option value="es">Español</option></select>';
 const select=label.querySelector('select');select.value=lang;select.addEventListener('change',()=>setLanguage(select.value));controls.push(select);host.insertBefore(label,before);
}
function setLanguage(next){
 lang=next;try{localStorage.setItem('rpc-language',lang)}catch{}
 const u=new URL(location.href);u.searchParams.set('lang',lang);history.replaceState(history.state,'',u);
 document.documentElement.lang=lang==='pt'?'pt-BR':lang;
 observer.disconnect();walk(document.body);walk(document.querySelector('title'));controls.forEach(c=>c.value=lang);observe();
 const meta=document.querySelector('meta[name="description"]');if(meta){meta.dataset.originalDescription??=meta.content;meta.content=translated(meta.dataset.originalDescription)}
 document.querySelectorAll('iframe').forEach(frame=>{try{if(new URL(frame.src,location.href).origin===location.origin)frame.contentWindow?.postMessage({type:'rpc-language',language:lang},location.origin)}catch{}});
 document.dispatchEvent(new CustomEvent('rpc:language',{detail:{language:lang,name:names[lang]}}));
}
// Preserve the chosen language in links and shared viewer URLs, while leaving original PDFs intact.
document.addEventListener('click',event=>{
 const a=event.target.closest('a[href]');if(!a||a.hasAttribute('download'))return;
 const url=new URL(a.href,location.href);if(url.origin!==location.origin||!(/\/$|\.html$/.test(url.pathname)))return;
 url.searchParams.set('lang',lang);a.href=url.href;
},true);
window.rpcI18n={t:translated,get language(){return lang},setLanguage};
document.documentElement.lang=lang==='pt'?'pt-BR':lang;
observe();
function initialize(){
if(document.querySelector('.final-nav'))control(document.querySelector('.final-nav'),document.querySelector('.final-menu'));
else control(document.querySelector('.topbar'),document.querySelector('.menu-toggle'));
if(!document.querySelector('.unified-header'))control(document.querySelector('.chapter-dock'));
if(!document.querySelector('.topbar')&&!document.querySelector('.final-nav')){const header=document.querySelector('body>header');control(header,header?.lastElementChild)}
setLanguage(lang);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initialize,{once:true});else initialize();

addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='rpc-language'&&['en','es','pt'].includes(event.data.language))setLanguage(event.data.language)});

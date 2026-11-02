const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../public');
const catalog={...JSON.parse(fs.readFileSync(path.join(root,'locales/catalog.json'))),...JSON.parse(fs.readFileSync(path.join(root,'locales/final.json')))};
const normalize=s=>s.replace(/\s+/g,' ').trim();
const byKey=new Map(Object.entries(catalog).map(([k,v])=>[normalize(k).toLowerCase(),v]));
const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const phrases=Object.keys(catalog).filter(s=>s.length>2&&catalog[s].some(t=>t!==s)).sort((a,b)=>b.length-a.length);
const fragments=new RegExp('(?<![\\p{L}\\p{N}])(?:'+phrases.map(escape).join('|')+')(?![\\p{L}\\p{N}])','giu');
const pick=(s,v)=>/[a-záéíóúñãõç]/i.test(s)&&s===s.toUpperCase()?v.toUpperCase():v;
function translate(source){const key=normalize(source),hit=byKey.get(key.toLowerCase());return hit?source.replace(source.trim(),pick(key,hit[0])):source.replace(fragments,s=>pick(s,byKey.get(normalize(s).toLowerCase())[0]));}
function visit(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(e.name==='vendor')continue;const file=path.join(dir,e.name);if(e.isDirectory()){visit(file);continue}if(!file.endsWith('.html'))continue;let html=fs.readFileSync(file,'utf8');if(!html.includes('i18n.js')||html.includes('data-source-language="en"'))continue;
html=html.replace(/<script\b[\s\S]*?<\/script>|<style\b[\s\S]*?<\/style>|<!--[\s\S]*?-->|<[^>]+>|[^<]+/gi,token=>{
if(/^<(script|style)\b|^<!--/i.test(token))return token;
if(token.startsWith('<'))return token.replace(/\b(aria-label|title|alt|placeholder|content)="([^"]*)"/g,(m,k,v)=>k+'="'+translate(v).replace(/"/g,'&quot;')+'"');
return translate(token);
});
html=html.replace(/<html\b[^>]*>/,tag=>tag.replace(/lang="[^"]*"/,'lang="en"').replace('>',' data-source-language="en">'));
html=html.replace(/<script\b[^>]*src="([^"]*i18n\.js)[^"]*"[^>]*><\/script>/g,'');
html=html.replace(/<head>/i,'<head><script src="/i18n.js?v=english-first2"></script>');
fs.writeFileSync(file,html);console.log(path.relative(root,file));
}}
visit(root);
const runtime=fs.readFileSync(path.join(__dirname,'i18n-runtime.js'),'utf8');
fs.writeFileSync(path.join(root,'i18n.js'),'(()=>{\nconst catalog='+JSON.stringify(catalog)+';\n'+runtime+'\n})();\n');

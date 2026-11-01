const fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'dist');fs.mkdirSync(out,{recursive:true});
for(const name of ['index.html','styles.css','experience.css','app.js','scenes.js','dossier.js','locales.js','viewer.js','recursos','datos'])fs.cpSync(path.join(__dirname,name),path.join(out,name),{recursive:true});
for(const name of ['index.html','styles.css','experience.css']){const file=path.join(out,name);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replaceAll('node_modules/','vendor/'));}
for(const folder of ['build','examples/jsm','src'])fs.cpSync(path.join(__dirname,'node_modules/three',folder),path.join(out,'vendor/three',folder),{recursive:true});
for(const name of ['styles.css','experience.css']){const css=fs.readFileSync(path.join(__dirname,name),'utf8');for(const m of css.matchAll(/node_modules\/([^'" )]+\.woff2)/g)){const dest=path.join(out,'vendor',m[1]);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(__dirname,'node_modules',m[1]),dest);}}
console.log('Static site built in dist with 3D models and vendor dependencies.');

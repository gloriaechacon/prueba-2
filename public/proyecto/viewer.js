import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export async function createViewer(host,id){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e8e1');
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:false});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;
 const camera=new THREE.PerspectiveCamera(35,1,.1,2000);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=8;controls.maxDistance=85;
 scene.add(new THREE.HemisphereLight(0xf5f6ff,0xaaa294,1.15));const sun=new THREE.DirectionalLight(0xfff1d6,2.4);sun.position.set(12,22,17);scene.add(sun);const fill=new THREE.DirectionalLight(0xffffff,.25);fill.position.set(-15,12,-10);scene.add(fill);
 let model;try{model=(await new GLTFLoader().loadAsync(`/${id}/${id}-baked.glb`)).scene}catch(e){renderer.dispose();controls.dispose();throw e}
 renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;
 sun.castShadow=true;sun.position.set(-14,25,20);sun.shadow.mapSize.set(1024,1024);
 Object.assign(sun.shadow.camera,{left:-24,right:24,top:24,bottom:-24,far:110});sun.shadow.normalBias=.015;
 model.traverse(o=>{if(o.isMesh){o.castShadow=!o.material.transparent;if(o.material.isMeshBasicMaterial)o.material.toneMapped=false}});
 renderer.shadowMap.needsUpdate=true;scene.add(model);const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());model.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:0x777b7c,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;floor.receiveShadow=true;scene.add(floor);
 host.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-label',`Modelo 3D de ${id}. Usa los controles de fachada, distribución y cubierta para explorar con teclado.`);renderer.domElement.setAttribute('role','img');
 const roofNodes=[];model.traverse(n=>{if(n.userData.roof===true)roofNodes.push(n)});
 const render=()=>renderer.render(scene,camera);const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render()};const obs=new ResizeObserver(resize);obs.observe(host);controls.addEventListener('change',render);
 const views={front:[size.x*1.05,size.y*1.8,size.z*1.7],above:[size.x*.35,Math.max(size.x,size.z)*1.7,size.z*.6],back:[-size.x*.9,size.y*1.7,-size.z*1.7]};
 const setCamera=name=>{camera.position.set(...views[name]);controls.target.set(0,name==='above'?0:size.y*.35,0);controls.update();render()};setCamera('front');resize();
 return {camera:setCamera,roof:visible=>{roofNodes.forEach(n=>n.visible=visible);renderer.shadowMap.needsUpdate=true;render()},dispose:()=>{obs.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()}}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
}

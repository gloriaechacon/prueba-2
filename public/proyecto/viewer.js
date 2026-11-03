import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
export async function createViewer(host,id){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#e8e1d3');
 const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;
 const camera=new THREE.PerspectiveCamera(35,1,.1,2000);const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=false;controls.maxPolarAngle=Math.PI*.49;controls.minDistance=8;controls.maxDistance=85;
 scene.add(new THREE.HemisphereLight(0xffffff,0xb5c4af,2.5));const sun=new THREE.DirectionalLight(0xfff7e8,3.8);sun.position.set(12,22,17);scene.add(sun);const fill=new THREE.DirectionalLight(0xffffff,1.7);fill.position.set(-15,12,-10);scene.add(fill);
 let model;try{model=(await new GLTFLoader().loadAsync(`/${id}/${id}-finished-v4.glb`)).scene}catch(e){renderer.dispose();controls.dispose();throw e}
 scene.add(model);const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3());model.position.sub(new THREE.Vector3(center.x,box.min.y,center.z));
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(150,150),new THREE.MeshStandardMaterial({color:0xe8e1d3,roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;scene.add(floor);
 host.replaceChildren(renderer.domElement);renderer.domElement.setAttribute('aria-label',`Modelo 3D de ${id}. Usa los controles de fachada, distribución y cubierta para explorar con teclado.`);renderer.domElement.setAttribute('role','img');
 const roofNodes=[];model.traverse(n=>{if(n.userData.roof===true)roofNodes.push(n)});
 const render=()=>renderer.render(scene,camera);const resize=()=>{const w=host.clientWidth,h=host.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();render()};const obs=new ResizeObserver(resize);obs.observe(host);controls.addEventListener('change',render);
 const views={front:[size.x*1.05,size.y*1.8,size.z*1.7],above:[size.x*.35,Math.max(size.x,size.z)*1.7,size.z*.6],back:[-size.x*.9,size.y*1.7,-size.z*1.7]};
 const setCamera=name=>{camera.position.set(...views[name]);controls.target.set(0,name==='above'?0:size.y*.35,0);controls.update();render()};setCamera('front');resize();
 return {camera:setCamera,roof:visible=>{roofNodes.forEach(n=>n.visible=visible);render()},dispose:()=>{obs.disconnect();controls.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material]){Object.values(m).forEach(v=>{if(v?.isTexture)v.dispose()});m.dispose()}}});renderer.dispose();renderer.forceContextLoss();renderer.domElement.remove()}};
}

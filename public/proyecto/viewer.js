import {houses} from '/house-data.js';
import * as THREE from '/vendor/three.module.js';
import {loadHouse, daylight} from '/utah/model-loader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createSceneRenderer, addHouseStage} from '/exterior-atmosphere.js';

export async function createViewer(host, id) {
  const scene = new THREE.Scene();
  const renderer = createSceneRenderer(THREE);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 250);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI * .49;
  controls.minDistance = 8;
  controls.maxDistance = 85;
  addHouseStage(THREE,scene);
  let model;
  try {
    const house = Object.values(houses).find(entry => entry.slug === id);
    if (!house) throw new Error('Modelo desconocido: '+id);
    model = await loadHouse('/'+house.model);
  } catch(error) {
    controls.dispose();
    renderer.dispose();
    throw error;
  }
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const size = box.getSize(new THREE.Vector3());
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Modelo 3D de '+id+'. Arrastra para girar o usa los controles de cámara.');
  renderer.domElement.setAttribute('role', 'img');
  const disposeDaylight = daylight(scene, renderer);
  const roofNodes = [];
  model.traverse(node => {if(node.userData.roof === true) roofNodes.push(node)});
  const render = () => renderer.render(scene, camera);
  const resize = () => {
    const width=host.clientWidth, height=host.clientHeight;
    if(!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect=width/height;
    camera.zoom=Math.min(1,camera.aspect/1.2);
    camera.updateProjectionMatrix();
    render();
  };
  const observer=new ResizeObserver(resize);
  observer.observe(host);
  controls.addEventListener('change', render);
  const views={
    front:[Math.sin(.20)*26, 6, Math.cos(.20)*26],
    above:[0, Math.max(size.x,size.z)*2, .001],
    back:[-size.x*.9, size.y*1.7, -size.z*1.7]
  };
  const setCamera = name => {
    camera.position.set(...views[name]);
    controls.target.set(0, name==='above'?0:1.6, 0);
    controls.update();
    render();
  };
  setCamera('front');
  resize();
  return {
    camera:setCamera,
    roof:visible => {
      roofNodes.forEach(node => {node.visible=visible});
      renderer.shadowMap.needsUpdate=true;
      render();
    },
    dispose:() => {
      observer.disconnect();
      controls.dispose();
      disposeDaylight();
      const textures=new Set(), materials=new Set(), geometries=new Set();
      scene.traverse(object => {
        if(object.geometry)geometries.add(object.geometry);
        if(object.material)for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);
      });
      materials.forEach(material => {
        Object.values(material).forEach(value => {if(value?.isTexture)textures.add(value)});
        material.dispose();
      });
      textures.forEach(texture => texture.dispose());
      geometries.forEach(geometry => geometry.dispose());
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    }
  };
}

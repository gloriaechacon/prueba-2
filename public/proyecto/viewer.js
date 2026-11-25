import {houses} from '/house-data.js';
import * as THREE from '/vendor/three.module.js';
import {loadHouse, daylight} from '/utah/model-loader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {createSceneRenderer, addHouseStage} from '/exterior-atmosphere.js';
import {compileInSlices} from '/three-compile.js';
import {isV3, loadV3, balanceLights} from '/proyecto/glb-v3.js?v=bellref1';

export async function createViewer(host, id, opts = {}) {
  const scene = new THREE.Scene();
  const renderer = createSceneRenderer(THREE);
  const camera = new THREE.PerspectiveCamera(40, 1, .1, 250);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.maxPolarAngle = Math.PI * .49;
  controls.enablePan = false;
  controls.minDistance = 18;
  controls.maxDistance = 85;
  const ground = addHouseStage(THREE,scene);
  ground.material.color.set('#b5b393');
  const lawn=document.createElement('canvas'); lawn.width=lawn.height=256;
  const gx=lawn.getContext('2d'); gx.fillStyle='#828064'; gx.fillRect(0,0,256,256);
  let seed=71; const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
  for(let i=0;i<22000;i++){const x=random()*256,y=random()*256;gx.strokeStyle=['#939376','#6e7559','#a0a080','#7c8261'][i%4];gx.lineWidth=.5;gx.beginPath();gx.moveTo(x,y);gx.lineTo(x+random()*2-1,y-1-random()*3);gx.stroke();}
  const lawnMap=new THREE.CanvasTexture(lawn); lawnMap.colorSpace=THREE.SRGBColorSpace;
  lawnMap.wrapS=lawnMap.wrapT=THREE.RepeatWrapping; lawnMap.repeat.set(32,32); lawnMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  ground.material.map=lawnMap; ground.material.needsUpdate=true;
  scene.background = new THREE.Color('#d8e8ed');
  let model, metadata, lit = false, bellPlan = false;
  try {
    const house = Object.values(houses).find(entry => entry.slug === id);
    if (!house) throw new Error('Modelo desconocido: '+id);
    const url = opts.model || ('/'+house.model);
    bellPlan = id === 'bell' && /bell-plan-v[345]\.glb/.test(url);
    if (isV3(url)) ({model, lit, metadata} = await loadV3(url));
    else model = await loadHouse(url);
    if (id === 'utah' && metadata?.camera) {
      const { model: kitchen } = await loadV3('/utah/utah-kitchen-repair-v4.glb?v=1');
      // Replace only the damaged kitchen group. Keep all architecture and furniture.
      model.traverse(node => {
        if (node.userData.source === 'R/19_Sin+título (44)') node.visible = false;
      });
      kitchen.traverse(node => { if (node.isMesh) node.layers.enable(1); });
      model.add(kitchen);
      // New solids have no old irradiance atlas; give them their own soft fill.
      const kitchenFill = new THREE.HemisphereLight(0xffffff, 0xb9ac99, .85);
      kitchenFill.layers.set(1);
      kitchenFill.userData.unbakedFill = true;
      scene.add(kitchenFill);
      camera.layers.enable(1);
    }
  } catch(error) {
    controls.dispose();
    renderer.dispose();
    throw error;
  }
  if (bellPlan) {
    model.traverse(node => {
      if (!node.isMesh) return;
      for (const material of [].concat(node.material)) {
        // The embedded atlas is exported as AO only to retain its UV channel.
        // loadV3 applies it as actual baked illumination instead.
        material.aoMap = null;
        if (/Bell white satin doors|Utah white interior doors/.test(material.name)) {
          material.color.set('#ffffff'); material.map=null; material.lightMap=null;
          material.emissive.set('#ffffff'); material.emissiveIntensity=.35;
          material.metalness=0; material.roughness=.48; material.side=THREE.DoubleSide;
        }
        if (material.name === '70006203') node.visible = false;
        material.needsUpdate = true;
      }
      node.castShadow = false;
      node.receiveShadow = false;
    });
  }
  if (bellPlan && !opts.model?.includes('bell-plan-v5')) {
    const {model: sofa} = await loadV3('/bell/bell-sofa-baked-v4.glb');
    model.add(sofa);
  }
  scene.add(model);
  const planCamera = metadata?.camera ? structuredClone(metadata.camera) : null;
  let lot = null;
  if (planCamera) {
    // Keep the delivered geometry intact; this tab displays the house alone.
    model.traverse(node => { if (node.userData.category === 'lote') node.visible = false; });
    planCamera.initial = { position: [0, 30, 11], target: [0, 0, 0], fov: 40 };
    planCamera.distance = [8, 45];
    planCamera.panLimit = { x: [-8, 8], z: [-8, 8] };
  } else if (id === 'utah' || (id === 'bell' && !bellPlan)) {
    ({ model: lot } = await loadV3('/'+id+'/'+id+'-lot-v4.glb?v=5'));
    scene.add(lot);
    ground.visible = false;
  }
  if (bellPlan) ground.visible = false;
  if (planCamera) {
    ground.visible = false;
    controls.minPolarAngle = THREE.MathUtils.degToRad(planCamera.polarAngleDeg[0]);
    controls.maxPolarAngle = THREE.MathUtils.degToRad(planCamera.polarAngleDeg[1]);
    controls.maxDistance = planCamera.distance[1];
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.addEventListener('change', () => {
      const before = controls.target.clone(), lim = planCamera.panLimit;
      controls.target.x = THREE.MathUtils.clamp(controls.target.x, ...lim.x);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z, ...lim.z);
      controls.target.y = THREE.MathUtils.clamp(controls.target.y, 0, 1);
      camera.position.add(controls.target.clone().sub(before));
    });
  }
  const box = new THREE.Box3();
  model.updateMatrixWorld(true);
  model.traverseVisible(node => {
    if (node.isMesh) box.union(new THREE.Box3().setFromObject(node));
  });
  const size = box.getSize(new THREE.Vector3());
  controls.minDistance = new THREE.Vector3(Math.max(Math.abs(box.min.x),Math.abs(box.max.x)),Math.max(Math.abs(box.min.y),Math.abs(box.max.y)),Math.max(Math.abs(box.min.z),Math.abs(box.max.z))).length() + 2.5;
  if (planCamera) controls.minDistance = planCamera.distance[0];
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-label', 'Modelo 3D de '+id+'. Arrastra para girar o usa los controles de cámara.');
  renderer.domElement.setAttribute('role', 'img');
  const disposeDaylight = daylight(scene, renderer);
  if (bellPlan) {
    scene.environmentIntensity = .45;
    scene.traverse(light => { if (light.isLight) light.intensity *= .12; });
  } else if (planCamera && lit) {
    scene.traverse(o => { if (o.isLight && !o.userData.unbakedFill) o.intensity *= .15; });
    scene.environmentIntensity = .65;
  } else balanceLights(scene, lit);
  renderer.toneMappingExposure = planCamera ? 1 : 1.08;
  const roofNodes = [];
  model.traverse(node => {if(node.userData.roof === true) roofNodes.push(node)});
  let compiled = false;
  const render = () => { if (compiled) renderer.render(scene, camera); };
  const resize = () => {
    const width=host.clientWidth, height=host.clientHeight;
    if(!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect=width/height;
    camera.zoom=Math.min(1,camera.aspect/(planCamera ? 1 : 1.2));
    camera.updateProjectionMatrix();
    render();
  };
  const observer=new ResizeObserver(resize);
  observer.observe(host);
  controls.addEventListener('change', render);
  const views={
    front:lot ? [12, 28, 44] : [Math.sin(.20)*26, 6, Math.cos(.20)*26],
    above:[0, Math.max(size.x,size.z)*2, .001],
    back:[-size.x*.9, size.y*1.7, -size.z*1.7]
  };
  const setCamera = name => {
    if (planCamera) {
      camera.fov = planCamera.initial.fov;
      camera.position.fromArray(planCamera.initial.position);
      controls.target.fromArray(planCamera.initial.target);
      camera.updateProjectionMatrix();
    } else {
      camera.position.set(...views[name]);
      controls.target.set(0, name==='above'?0:1.6, 0);
    }
    controls.update();
    render();
  };
  setCamera('front');
  resize();
  await disposeDaylight.ready;
  await compileInSlices(renderer, scene, camera);
  compiled = true;
  render();
  const listeners = new Set();
  controls.addEventListener('change', () => listeners.forEach(fn => fn(controls.getAzimuthalAngle())));
  return {
    camera:setCamera,
    onRotate:fn => { listeners.add(fn); return () => listeners.delete(fn); },
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

/* 3D arrival hero: a scroll-driven approach to Casa Utah.
 * Reuses the shared render setup (house-data, model-loader, exterior-atmosphere,
 * lot-environment) and only adds the hero's own sunset light and camera path.
 * The GLB and its materials are used as shipped. */
import * as T from './vendor/three.module.js';
import { houses, lotExample, lotOffset } from './house-data.js';
import { loadHouse } from './utah/model-loader.js';
import { attachSky, exteriorLight, createSceneRenderer } from './exterior-atmosphere.js';
import { createLotEnvironment } from './utah/lot-environment.js';
import { keyframes, fov, door } from './hero-path.js';
import { compileInSlices } from './three-compile.js';

// Clear sunset sky (CSS gradient, no clouds, no HDRI). Its lower stop matches the fog colour.
const SUNSET_SKY = 'linear-gradient(180deg,#8fa9c2 0%,#c3c6c4 30%,#ecc9a0 58%,#f0b783 74%,#e9c49c 100%)';
const HORIZON = '#e7c29a';

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

export function mountArrival(host, { mobile = false, debug = null } = {}) {
  const home = houses.a;
  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(mobile ? fov.mobile : fov.desktop, 1, 0.05, 400);
  const renderer = createSceneRenderer(T);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.domElement.className = 'arrival-canvas';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  host.append(renderer.domElement);
  attachSky(scene, renderer, host, SUNSET_SKY);
  const disposeEnv = exteriorLight(T, scene, renderer);
  renderer.toneMappingExposure = 1.0;
  scene.environmentIntensity = 0.45;
  scene.fog = new T.Fog(HORIZON, 38, 120);

  // Warm, low sunset key from the front-left so the facade reads clearly.
  scene.add(new T.HemisphereLight(0xf6d2ac, 0x5d5444, 0.55));
  const sun = new T.DirectionalLight(0xffb27a, 3.9);
  sun.position.set(-36, 11, 34);
  sun.target.position.set(0, 0, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 140 });
  sun.shadow.normalBias = 0.01;
  sun.shadow.bias = -0.0001;
  scene.add(sun, sun.target);

  const environment = createLotEnvironment();
  environment.scale.set(lotExample.width / 23, 1, lotExample.depth / 44);
  environment.userData.setGarageSide?.(home.garageSide);
  // The hero is not a measured plan: hide the survey border and ground captions.
  environment.traverse(o => {
    if (o.isLine) o.visible = false;
    if (o.isMesh && o.material?.isMeshBasicMaterial && o.material.transparent) o.visible = false;
  });
  scene.add(environment);

  const positions = new T.CatmullRomCurve3(keyframes.map(k => new T.Vector3(...k.position)), false, 'catmullrom', 0.5);
  const targets = new T.CatmullRomCurve3(keyframes.map(k => new T.Vector3(...k.target)), false, 'catmullrom', 0.5);
  const eye = new T.Vector3(), look = new T.Vector3();
  let progress = 0, visible = true, pivot = null, frame = 0;

  let compiled = false;
  function render() {
    frame = 0;
    if (!visible || !compiled) return;
    positions.getPoint(progress, eye);
    targets.getPoint(progress, look);
    camera.position.copy(eye);
    camera.lookAt(look);
    if (pivot) {
      const k = T.MathUtils.clamp((progress - door.start) / (door.end - door.start), 0, 1);
      pivot.rotation.y = door.angle * (k * k * (3 - 2 * k));
    }
    renderer.render(scene, camera);
    if (debug) debug.textContent = `progress ${progress.toFixed(3)}\ncamera  ${eye.toArray().map(v => v.toFixed(2)).join(', ')}\ntarget  ${look.toArray().map(v => v.toFixed(2)).join(', ')}`;
  }
  const request = () => { if (!frame) frame = requestAnimationFrame(render); };

  function resize() {
    const w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    request();
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) request(); }).observe(host);
  resize();

  function hingeDoor(model) {
    const leaf = model.children.filter(part => {
      const box = new T.Box3().setFromObject(part);
      return box.min.x > -0.2 && box.max.x < 0.7 && box.min.z > 4.9 && box.max.z < 5.1;
    });
    if (!leaf.length) return false;
    pivot = new T.Group();
    pivot.name = 'Front door hinge';
    pivot.position.set(...door.hinge);
    model.add(pivot);
    leaf.forEach(part => { model.remove(part); part.position.set(-door.hinge[0], -door.hinge[1], -door.hinge[2]); pivot.add(part); });
    return true;
  }

  const ready = loadHouse('/' + home.model).then(async model => {
    model.position.z = lotOffset(home);
    const hinged = hingeDoor(model);
    scene.add(model);
    renderer.shadowMap.needsUpdate = true;
    positions.getPoint(progress, eye); targets.getPoint(progress, look); camera.position.copy(eye); camera.lookAt(look);
    await disposeEnv.ready;
    await compileInSlices(renderer, scene, camera);
    compiled = true;
    render();
    return { hinged };
  });

  return {
    ready,
    setProgress(p) { progress = T.MathUtils.clamp(p, 0, 1); request(); },
    renderNow: render,
    dispose() { disposeEnv(); renderer.dispose(); }
  };
}

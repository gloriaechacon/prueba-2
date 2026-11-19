/* House models v3 (Blender): standard glTF with Draco, WebP textures, AO and a baked lightmap on
   TEXCOORD_1. The site's own reader (utah/model-loader.js) cannot open them, so these go through
   three.js GLTFLoader + DRACOLoader (report.md, "Integración"). Used only by proyecto/viewer.js
   for files named *-v3.glb; the hero and the v2 files keep the old reader. */
import * as THREE from '/vendor/three.module.js';
import { GLTFLoader } from '/d/vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '/d/vendor/three/examples/jsm/loaders/DRACOLoader.js';

let loader = null;
const getLoader = () => loader ||= new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/d/vendor/three/examples/jsm/libs/draco/gltf/'));

/* Tuned against glb/_checks/*_lightmap.png with this site's light (ACES 0.9, studio IBL):
   the bake already carries sun + sky + bounce, so the real-time lights drop to LIGHTS and
   the lightmap goes in at the file's intensity × LM. */
export const TUNE = { LIGHTS: 0.15, ENV: 0.6, LM: 1.3 };

export const isV3 = url => /-v3\.glb(\?|$)/.test(url);

export async function loadV3(url) {
  const gltf = await getLoader().loadAsync(url);
  const model = gltf.scene;
  const info = gltf.parser.json.asset?.extras?.rainbowPark?.lightMap;
  let lit = false;
  if (info?.file) {
    try {
      const lm = await new THREE.TextureLoader().loadAsync(url.replace(/[^/]+$/, info.file));
      lm.flipY = false; lm.channel = 1; lm.colorSpace = THREE.SRGBColorSpace;
      model.traverse(o => {
        if (!o.isMesh || !o.geometry.attributes.uv1) return;
        for (const m of [].concat(o.material)) { m.lightMap = lm; m.lightMapIntensity = info.intensity * TUNE.LM; m.needsUpdate = true; }
      });
      lit = true;
    } catch (e) { console.info('Lightmap unavailable, real-time light only.', e?.message || ''); }
  }
  model.traverse(o => {
    if (!o.isMesh) return;
    const transparent = [].concat(o.material).some(m => m.transparent || m.transmission > 0);
    o.castShadow = !transparent; o.receiveShadow = true;
  });
  // GLTFLoader keeps node extras in userData, so extras.roof drives the cut exactly as before.
  return { model, lit };
}

/* With the bake on, dim the real-time lights and the IBL so light is not counted twice. */
export function balanceLights(scene, lit) {
  if (!lit) return;
  scene.traverse(o => { if (o.isLight) o.intensity *= TUNE.LIGHTS; });
  scene.environmentIntensity = TUNE.ENV;
}

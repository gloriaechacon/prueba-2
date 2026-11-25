/* House models v3 (Blender): standard glTF with Draco, WebP textures, AO and a baked lightmap on
   TEXCOORD_1. The site's own reader (utah/model-loader.js) cannot open them, so these go through
   three.js GLTFLoader + DRACOLoader (report.md, "Integración"). Used only by proyecto/viewer.js
   for files named *-v3.glb; the hero and the v2 files keep the old reader. */
import * as THREE from '/vendor/three.module.js';
import { repairUtahPlanMaterials } from '/proyecto/utah-plan-materials.js?v=white1';
import { GLTFLoader } from '/d/vendor/three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from '/d/vendor/three/examples/jsm/loaders/DRACOLoader.js';

let loader = null;
const getLoader = () => loader ||= new GLTFLoader().setDRACOLoader(new DRACOLoader().setDecoderPath('/d/vendor/three/examples/jsm/libs/draco/gltf/'));

/* Tuned against glb/_checks/*_lightmap.png with this site's light (ACES 0.9, studio IBL):
   the bake already carries sun + sky + bounce, so the real-time lights drop to LIGHTS and
   the lightmap goes in at the file's intensity × LM. */
export const TUNE = { LIGHTS: 0.35, ENV: 0.85, LM: 1.3 };

export const isV3 = url => /-v[34]\.glb(\?|$)/.test(url);

export async function loadV3(url) {
  const gltf = await getLoader().loadAsync(url);
  const model = gltf.scene;
  const metadata = gltf.parser.json.asset?.extras?.rainbowPark;
  const info = metadata?.lightMap;
  const nativePlan = Boolean(metadata?.camera);
  let lit = false;
  if (info?.file) {
    try {
      const lm = await new THREE.TextureLoader().loadAsync(url.replace(/[^/]+$/, info.file));
      lm.flipY = false; lm.channel = 1; lm.colorSpace = THREE.SRGBColorSpace;
      model.traverse(o => {
        if (!o.isMesh || !o.geometry.attributes.uv1) return;
        for (const m of [].concat(o.material)) { m.lightMap = lm; m.lightMapIntensity = info.intensity * (nativePlan ? 1 : TUNE.LM); m.needsUpdate = true; }
      });
      lit = true;
    } catch (e) { console.info('Lightmap unavailable, real-time light only.', e?.message || ''); }
  }
  model.traverse(o => {
    if (!o.isMesh) return;
    for (const m of [].concat(o.material)) {
      // Baked color already contains illumination: do not filmically dim it a second time.
      if (m.isMeshBasicMaterial) m.toneMapped = false;
      if (m.aoMap) m.aoMapIntensity = nativePlan ? .45 : .65;
      if (/teja|roof/i.test(m.name)) m.color.multiplyScalar(1.2);
      if (/puerta.*caoba/i.test(m.name)) m.color.setRGB(1.35, 1.18, .95);
      if (/garaje.*oscuro/i.test(m.name)) m.color.set('#8e877a');
    }
    const transparent = [].concat(o.material).some(m => m.transparent || m.transmission > 0);
    // The cutaway already contains baked direct shadows. A second shadow pass
    // creates dark self-shadow patches on doors, fabric and the detailed car.
    o.castShadow = !nativePlan && !transparent;
    o.receiveShadow = !nativePlan;
  });
  if (nativePlan && /utah-plan-v4\.glb/.test(url)) repairUtahPlanMaterials(model);
  // GLTFLoader keeps node extras in userData, so extras.roof drives the cut exactly as before.
  return { model, lit, metadata };
}

/* With the bake on, dim the real-time lights and the IBL so light is not counted twice. */
export function balanceLights(scene, lit) {
  if (!lit) return;
  scene.traverse(o => { if (o.isLight) o.intensity *= TUNE.LIGHTS; });
  scene.environmentIntensity = TUNE.ENV;
}

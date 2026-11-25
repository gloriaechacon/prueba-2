/* Material repairs scoped to the delivered Utah cutaway, never the exterior.
 * Door base texture is white, but its old irradiance atlas darkens one face.
 * Toilets mix three source materials, including grey default faces.
 */
import * as THREE from '/vendor/three.module.js';

export function repairUtahPlanMaterials(model) {
  const replacements = new Map();
  model.traverse(mesh => {
    if (!mesh.isMesh) return;
    let node = mesh, kind = null;
    while (node && node !== model) {
      if (/^Puerta interior/.test(node.name)) { kind = 'door'; break; }
      if (/^VASO SANITARIO/.test(node.name)) { kind = 'porcelain'; break; }
      node = node.parent;
    }
    if (!kind) return;
    const original = [].concat(mesh.material);
    const fixed = original.map(material => {
      const key = material.uuid + ':' + kind;
      if (!replacements.has(key)) {
        const replacement = material.clone();
        replacement.name = kind === 'door' ? 'Utah interior door — white, both faces' : 'Utah sanitary porcelain — white';
        replacement.color.set('#ffffff');
        replacement.map = null;
        replacement.lightMap = null;
        replacement.aoMap = null;
        replacement.metalness = 0;
        replacement.roughness = kind === 'door' ? .48 : .23;
        replacement.envMapIntensity = 1.5;
        replacement.side = THREE.DoubleSide;
        replacement.transparent = false;
        replacement.opacity = 1;
        replacement.needsUpdate = true;
        replacements.set(key, replacement);
      }
      return replacements.get(key);
    });
    mesh.material = Array.isArray(mesh.material) ? fixed : fixed[0];
  });
}

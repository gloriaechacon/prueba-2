/* Compile a scene's shaders without long main-thread tasks: one material at a time, yielding to
   the browser between them (idle time when available), so clicks are answered while the 3D
   scene warms up. Shared by the hero and the House models viewer. */
export async function compileInSlices(renderer, scene, camera, { budget = 40 } = {}) {
  const byMaterial = new Map();
  scene.traverse(o => {
    if (!o.isMesh && !o.isLine && !o.isPoints) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && !byMaterial.has(m)) byMaterial.set(m, o);
  });
  const idle = () => new Promise(r => (window.requestIdleCallback ? requestIdleCallback(r, { timeout: 120 }) : setTimeout(r, 16)));
  let t0 = performance.now();
  for (const obj of byMaterial.values()) {
    try { renderer.compile(obj, camera, scene); } catch { /* compiled later on first render */ }
    if (performance.now() - t0 > budget) { await idle(); t0 = performance.now(); }
  }
  // Links were only requested; wait (without blocking) until the GPU reports them complete
  // (KHR_parallel_shader_compile), so the first render does not stall on uniform reflection.
  try { await renderer.compileAsync(scene, camera); } catch { /* not supported: first render waits */ }
  await idle();
}

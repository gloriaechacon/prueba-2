// `gradient` is optional; the default keeps every existing viewer unchanged.
export function attachSky(scene, renderer, host, gradient = 'linear-gradient(#c9e0ec 0%,#e8eef0 55%,#e8e8e1 85%)') {
  scene.background = null;
  renderer.setClearColor(0, 0);
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;background:' + gradient + ';z-index:0';
  host.prepend(layer);
  renderer.domElement.style.position = 'relative';
  renderer.domElement.style.zIndex = 'auto';
  return () => layer.remove();
}

export function exteriorLight(T, scene, renderer) {
  const image = document.createElement('canvas');
  image.width = 512;
  image.height = 256;
  const ctx = image.getContext('2d');
  const gradient = ctx.createLinearGradient(0,0,0,256);
  gradient.addColorStop(0, '#9ebfd3');
  gradient.addColorStop(.45, '#eef2f3');
  gradient.addColorStop(.51, '#737b74');
  gradient.addColorStop(.53, '#babbb3');
  gradient.addColorStop(1, '#777a70');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#ffffff';
  ctx.filter='blur(10px)';
  ctx.fillRect(80,35,90,24);
  ctx.fillRect(330,68,115,18);
  // Narrow studio reflections describe bevels and glazing as the camera orbits.
  ctx.filter='blur(3px)';
  ctx.fillStyle='#f9f8ef';
  ctx.fillRect(114,60,13,76);
  ctx.fillRect(335,56,24,79);
  ctx.fillStyle='#596361';
  ctx.fillRect(354,104,45,39);
  ctx.filter='none';
  const sidelight=ctx.createRadialGradient(377,116,1,377,116,26);
  sidelight.addColorStop(0,'rgba(255,248,225,.88)');
  sidelight.addColorStop(1,'rgba(255,248,225,0)');
  ctx.fillStyle=sidelight;
  ctx.fillRect(351,90,52,52);
  const texture = new T.CanvasTexture(image);
  texture.colorSpace=T.SRGBColorSpace;
  texture.mapping=T.EquirectangularReflectionMapping;
  // The PMREM bake compiles its own shaders and blocks the main thread for a moment, so it runs
  // in a quiet idle period (no input in the last 700 ms). Viewers await .ready before their
  // first render; the poster / loading state stays up meanwhile.
  let environment = null, disposed = false;
  // Pre-baked PMREM of this exact studio sky (assets/env, gzip, half float 384x512): no shader
  // compilation and no GPU bake on the main thread. The live bake below is only the fallback.
  const ready = loadBaked(T).then(tex => {
    if (disposed) return;
    environment = { texture: tex, dispose: () => tex.dispose() };
    scene.environment = tex;
    texture.dispose();
  }).catch(() => quietIdle().then(() => {
    if (disposed) return;
    const pmrem = new T.PMREMGenerator(renderer);
    environment = pmrem.fromEquirectangular(texture);
    scene.environment = environment.texture;
    dispose.target = environment;
    texture.dispose();
    pmrem.dispose();
  }));
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.9;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
  const dispose = () => { disposed = true; environment?.dispose(); };
  dispose.ready = ready;
  return dispose;
}
async function loadBaked(T) {
  const r = await fetch('/assets/env/exterior-pmrem-384x512-half.gz');
  if (!r.ok || !('DecompressionStream' in window)) throw Error('no baked env');
  const buf = await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const tex = new T.DataTexture(new Uint16Array(buf), 384, 512, T.RGBAFormat, T.HalfFloatType);
  tex.mapping = T.CubeUVReflectionMapping;
  tex.minFilter = tex.magFilter = T.LinearFilter;
  tex.generateMipmaps = false;
  tex.colorSpace = T.LinearSRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
let lastInput = 0;
['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => addEventListener(t, () => { lastInput = performance.now(); }, { passive: true, capture: true }));
function quietIdle() {
  return new Promise(resolve => {
    const tick = () => (window.requestIdleCallback || setTimeout)(() => { if (performance.now() - lastInput > 700) resolve(); else setTimeout(tick, 250); }, { timeout: 1500 });
    tick();
  });
}

export function finishExterior(T, model) {
  model.traverse(object => {
    if(!object.isMesh)return;
    object.castShadow=true;
    object.receiveShadow=true;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials) {
      if(material.isMeshBasicMaterial){material.toneMapped=false;continue;}
      material.envMapIntensity=.85;
      const name=material.name.toLowerCase();
      if(material.userData.textureKind==='roof'){
        material.color.set('#cccccc');
        material.normalScale.setScalar(1.85);
        material.roughness=.94;
        material.envMapIntensity=.45;
        // Match the twelve staggered courses in the asphalt texture. A narrow
        // contact shadow and a worn lip keep adjacent tabs readable at midrange.
        material.onBeforeCompile=shader=>{
          shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>', `
            #include <map_fragment>
            vec2 courses = vMapUv * vec2(6.0, 12.0);
            float row = floor(courses.y);
            float tab = floor(courses.x - 0.5 * mod(row, 2.0));
            vec2 tile = mod(vec2(tab, row), vec2(6.0, 12.0));
            float tone = fract(sin(dot(tile, vec2(17.13, 61.79))) * 4375.12);
            float heightInRow = fract(courses.y);
            float detail = 1.0 - smoothstep(0.08, 0.55, fwidth(courses.y));
            float seam = 1.0 - smoothstep(0.0, 0.17, heightInRow);
            float lip = smoothstep(0.89, 0.98, heightInRow);
            diffuseColor.rgb *= mix(1.0, 0.85 + 0.31 * tone - 0.29 * seam + 0.09 * lip, detail);
          `);
        };
      }else if(material.userData.textureKind==='stucco'){
        material.color.set('#fff9ee');
        material.roughness=.92;
        material.normalScale.setScalar(.34);
      }else if(name==='concrete_02_1k'){
        material.color.set('#bcbab4');
        material.roughness=.98;
        material.metalness=0;
      }else if(name==='exterior / asphalt shingle edges'){
        material.color.set('#35393a');
      }else if(name==='exterior / satin garage panels' || (name.includes('garaje') && name.includes('acero pintado'))){
        material.color.set(name==='exterior / satin garage panels'?'#958d80':'#797366');
        material.roughness=.49;
      }else if(material.userData.textureKind==='oak'){
        // Both exterior models use this wood surface on the principal entry leaf.
        material.color.set('#a65c42');
        material.normalScale.setScalar(.48);
        material.roughness=.58;
      }else if(name.includes('graphite window rebates') || name.includes('aluminio bronce')){
        material.metalness=.78;
        material.roughness=.29;
        material.envMapIntensity=1.2;
      }else if(!material.transparent && name.includes('vidrio') && !name.includes('luminaria')){
        material.color.set('#859ba1');
        material.metalness=.88;
        material.roughness=.075;
        material.envMapIntensity=1.38;
      }
    }
  });
}


// Include the sky when the existing download button captures a WebGL view.
export function captureExterior(T, scene, renderer, draw) {
  const canvas=document.createElement('canvas');
  canvas.width=renderer.domElement.width;
  canvas.height=renderer.domElement.height;
  const ctx=canvas.getContext('2d');
  const gradient=ctx.createLinearGradient(0,0,0,canvas.height);
  gradient.addColorStop(0,'#c9e0ec');
  gradient.addColorStop(.55,'#e8eef0');
  gradient.addColorStop(.85,'#e8e8e1');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.globalAlpha=.85;
  const background=new T.CanvasTexture(canvas);
  background.colorSpace=T.SRGBColorSpace;
  const original=scene.background;
  try {
    scene.background=background;
    draw();
    return renderer.domElement.toDataURL('image/png');
  } finally {
    scene.background=original;
    background.dispose();
    draw();
  }
}

export function createSceneRenderer(THREE) {
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.75));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.05;
  // Shader link checks force a synchronous wait on the GPU compiler (seconds of main-thread block).
  renderer.debug.checkShaderErrors=false;
  return renderer;
}

export function addHouseStage(THREE, scene) {
  scene.add(new THREE.HemisphereLight(0xf5f6ff, 0xaaa294, 1.15));
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(25, 80),
    new THREE.MeshStandardMaterial({color:0x777b7c, roughness:.92})
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.18;
  ground.receiveShadow = true;
  scene.add(ground);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.4);
  sun.position.set(-14, 25, 20);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {left:-24, right:24, top:24, bottom:-24, near:1, far:110});
  sun.shadow.normalBias = .008;
  sun.shadow.bias = -.00006;
  scene.add(sun);
  return ground;
}

export function attachSky(scene, renderer, host) {
  scene.background = null;
  renderer.setClearColor(0, 0);
  if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  layer.style.cssText = 'position:absolute;inset:0;overflow:hidden;pointer-events:none;background:linear-gradient(#c9e0ec 0%,#e8eef0 55%,#e8e8e1 85%);z-index:0';
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
  gradient.addColorStop(.48, '#f0f3f2');
  gradient.addColorStop(.53, '#babbb3');
  gradient.addColorStop(1, '#777a70');
  ctx.fillStyle=gradient;
  ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#ffffff';
  ctx.filter='blur(10px)';
  ctx.fillRect(80,35,90,24);
  ctx.fillRect(330,68,115,18);
  ctx.filter='none';
  const texture = new T.CanvasTexture(image);
  texture.colorSpace=T.SRGBColorSpace;
  texture.mapping=T.EquirectangularReflectionMapping;
  const pmrem = new T.PMREMGenerator(renderer);
  const environment = pmrem.fromEquirectangular(texture);
  scene.environment = environment.texture;
  texture.dispose();
  pmrem.dispose();
  renderer.toneMapping=T.ACESFilmicToneMapping;
  renderer.toneMappingExposure=.9;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=T.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  renderer.shadowMap.needsUpdate=true;
  return () => environment.dispose();
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
      if(!material.transparent && material.name.toLowerCase().includes('vidrio') && !material.name.toLowerCase().includes('luminaria')) {
        material.color.set('#9bafb8');
        material.metalness=.95;
        material.roughness=.07;
        material.envMapIntensity=1.35;
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

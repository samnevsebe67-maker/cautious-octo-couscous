/* KINETIA / Beauty — emerald portrait installation (2.5D)
   The supplied photograph is the immutable visual source. Every pixel of the
   800x800 reference is mapped 1:1 onto a camera-facing plane (unlit, no tone
   mapping, no crop, no colour grade). Only the surrounding architecture,
   lighting, atmosphere and camera orbit are animated. */
(function () {
  'use strict';

  var host = document.getElementById('bt3d');
  var canvas = document.getElementById('btCrystal');
  if (!host || !canvas) return;

  var THREE = window.THREE;
  var SOURCE = '/industries/assets/beauty-reference.jpg';
  var mqReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduced = mqReduced.matches;

  function useFallback() {
    host.classList.remove('is-live', 'is-start', 'is-dragging');
    host.classList.add('bt-no3d');
  }

  if (!THREE) { useFallback(); return; }

  var probe = document.createElement('canvas');
  if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { useFallback(); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
  } catch (err) {
    useFallback();
    return;
  }

  var MAX_DPR = 2;
  var dprCap = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  var DPR = dprCap;

  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;
  renderer.setClearColor(0x020504, 1);

  var scene = new THREE.Scene();
  var FOV = 36;
  var TAN = Math.tan(THREE.MathUtils.degToRad(FOV * 0.5));
  var camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 80);

  /* panel geometry: 2 x 2 world units, resting on the floor */
  var PANEL = 2;
  var FLOOR_Y = -0.05;
  var CENTER_Y = 1 + FLOOR_Y;
  var RADIUS = 7.5;
  var W = 1, H = 1;

  var stage = new THREE.Group();
  stage.position.set(0, CENTER_Y, 0);
  scene.add(stage);

  /* ------------------------------------------------------------------ helpers */
  function radialMaterial(color, power) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 1 },
        uPower: { value: power || 2.2 }
      },
      vertexShader:
        'varying vec2 vUv;' +
        'void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;uniform float uPower;' +
        'void main(){float d=length(vUv-0.5)*2.0;float a=pow(max(0.0,1.0-d),uPower);' +
        'gl_FragColor=vec4(uColor,a*uOpacity);}',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  function radialPlane(color, size, power) {
    var m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), radialMaterial(color, power));
    m.scale.set(size, size, 1);
    m.renderOrder = 2;
    return m;
  }

  function beamMaterial(color) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(color) },
        uOpacity: { value: 0.06 }
      },
      vertexShader:
        'varying vec2 vUv;' +
        'void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader:
        'varying vec2 vUv;uniform vec3 uColor;uniform float uOpacity;' +
        'void main(){' +
        'float edge=smoothstep(0.5,0.05,abs(vUv.x-0.5));' +
        'float fall=pow(sin(3.14159265*clamp(vUv.y,0.0,1.0)),1.35);' +
        'gl_FragColor=vec4(uColor,edge*fall*uOpacity);}',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }

  /* --------------------------------------------------------------- backdrop */
  function backdropTexture() {
    var c = document.createElement('canvas');
    c.width = 1024;
    c.height = 512;
    var g = c.getContext('2d');
    var lin = g.createLinearGradient(0, 0, 0, 512);
    lin.addColorStop(0, '#010302');
    lin.addColorStop(0.42, '#03100c');
    lin.addColorStop(0.72, '#041510');
    lin.addColorStop(1, '#010403');
    g.fillStyle = lin;
    g.fillRect(0, 0, 1024, 512);

    var glow = g.createRadialGradient(560, 268, 8, 560, 268, 420);
    glow.addColorStop(0, 'rgba(22,150,108,0.5)');
    glow.addColorStop(0.4, 'rgba(10,88,64,0.22)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 1024, 512);

    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return t;
  }

  var backdropTex = backdropTexture();
  var backdropMat = new THREE.MeshBasicMaterial({ map: backdropTex, toneMapped: false, depthWrite: true });
  var backdrop = new THREE.Mesh(new THREE.PlaneGeometry(64, 40), backdropMat);
  backdrop.position.set(0, 6.2, -11);
  scene.add(backdrop);

  /* ------------------------------------------------------------ environment */
  function envTexture() {
    var c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    var g = c.getContext('2d');
    var lin = g.createLinearGradient(0, 0, 0, 256);
    lin.addColorStop(0, '#010302');
    lin.addColorStop(0.4, '#03120d');
    lin.addColorStop(0.55, '#0a5c44');
    lin.addColorStop(0.62, '#052b21');
    lin.addColorStop(1, '#010403');
    g.fillStyle = lin;
    g.fillRect(0, 0, 512, 256);
    var glow = g.createRadialGradient(330, 140, 4, 330, 140, 190);
    glow.addColorStop(0, 'rgba(44,230,175,0.85)');
    glow.addColorStop(0.35, 'rgba(16,140,100,0.35)');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = glow;
    g.fillRect(0, 0, 512, 256);
    var t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.mapping = THREE.EquirectangularReflectionMapping;
    return t;
  }

  var pmrem = new THREE.PMREMGenerator(renderer);
  var equirect = new THREE.Texture();
  var envRT = null;
  var envMap = null;
  try {
    equirect = envTexture();
    envRT = pmrem.fromEquirectangular(equirect);
    envMap = envRT.texture;
    scene.environment = envMap;
  } catch (err) {
    envMap = null;
  }
  pmrem.dispose();
  if (equirect && equirect.dispose) equirect.dispose();

  var floorMat = new THREE.MeshStandardMaterial({
    color: 0x040a08,
    roughness: 0.24,
    metalness: 0.72,
    envMapIntensity: 1.5
  });
  var floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR_Y, 6);
  scene.add(floor);

  var poolMat = radialMaterial(0x1ccb98, 1.9);
  poolMat.uniforms.uOpacity.value = 0.24;
  var pool = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), poolMat);
  pool.rotation.x = -Math.PI / 2;
  pool.scale.set(7.8, 8.8, 1);
  pool.position.set(0, FLOOR_Y + 0.004, 0.9);
  scene.add(pool);

  var baseGlowMat = radialMaterial(0x27e0ad, 2.4);
  baseGlowMat.uniforms.uOpacity.value = 0.2;
  var baseGlow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), baseGlowMat);
  baseGlow.rotation.x = -Math.PI / 2;
  baseGlow.scale.set(3.6, 2.2, 1);
  baseGlow.position.set(0, FLOOR_Y - CENTER_Y + 0.007, 0.48);
  stage.add(baseGlow);

  /* portal architecture */
  var portal = new THREE.Group();
  portal.position.set(0, 0, -4.4);
  scene.add(portal);

  var frameMat = new THREE.MeshStandardMaterial({
    color: 0x060f0c,
    roughness: 0.3,
    metalness: 0.9,
    envMapIntensity: 1.3
  });
  var stripMat = new THREE.MeshStandardMaterial({
    color: 0x04100c,
    emissive: 0x0a3c2c,
    emissiveIntensity: 0.85,
    roughness: 0.28,
    metalness: 0.7
  });

  function portalBar(w, h, d, x, y, mat) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, 0);
    portal.add(m);
    return m;
  }

  portalBar(0.16, 7.2, 0.16, -3.05, 3.1, frameMat);
  portalBar(0.16, 7.2, 0.16, 3.05, 3.1, frameMat);
  portalBar(6.26, 0.16, 0.16, 0, 6.65, frameMat);
  portalBar(0.035, 5.4, 0.02, -2.86, 3.05, stripMat);
  portalBar(0.035, 5.4, 0.02, 2.86, 3.05, stripMat);
  portalBar(5.76, 0.035, 0.02, 0, 5.76, stripMat);

  var portalGlowL = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 6.2), beamMaterial(0x18c894));
  portalGlowL.material.uniforms.uOpacity.value = 0.1;
  portalGlowL.position.set(-2.86, 3.05, 0.02);
  portal.add(portalGlowL);
  var portalGlowR = portalGlowL.clone();
  portalGlowR.material = portalGlowL.material;
  portalGlowR.position.x = 2.86;
  portal.add(portalGlowR);

  /* volumetric shafts */
  var beams = [];
  var beamSpecs = [
    { x: -3.6, y: 4.6, z: -3.6, w: 1.6, h: 9.2, rot: 0.16, op: 0.05 },
    { x: 3.4, y: 4.9, z: -4.2, w: 1.9, h: 9.8, rot: -0.13, op: 0.045 },
    { x: -0.4, y: 5.4, z: -6.4, w: 3.2, h: 10.4, rot: 0.05, op: 0.03 }
  ];
  for (var bs = 0; bs < beamSpecs.length; bs++) {
    var spec = beamSpecs[bs];
    var bm = new THREE.Mesh(new THREE.PlaneGeometry(spec.w, spec.h), beamMaterial(0x18c894));
    bm.material.uniforms.uOpacity.value = spec.op;
    bm.position.set(spec.x, spec.y, spec.z);
    bm.rotation.z = spec.rot;
    bm.userData.base = spec.op;
    scene.add(bm);
    beams.push(bm);
  }

  /* ------------------------------------------------------------ the portrait */
  var panel = null;
  var frameGroup = new THREE.Group();
  stage.add(frameGroup);

  var backing = new THREE.Mesh(
    new THREE.BoxGeometry(PANEL + 0.16, PANEL + 0.16, 0.11),
    new THREE.MeshStandardMaterial({
      color: 0x07110e,
      roughness: 0.32,
      metalness: 0.88,
      envMapIntensity: 1.35
    })
  );
  backing.position.z = -0.075;
  stage.add(backing);

  var edgeMat = new THREE.MeshStandardMaterial({
    color: 0x05100c,
    emissive: 0x0d4a36,
    emissiveIntensity: 0.9,
    roughness: 0.24,
    metalness: 0.85
  });
  var EDGE = 0.055;
  var EDGE_POS = PANEL / 2 + EDGE / 2 + 0.004;
  function edgeBar(w, h, x, y) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), edgeMat);
    m.position.set(x, y, 0.008);
    stage.add(m);
    return m;
  }
  edgeBar(PANEL + EDGE * 2, EDGE, 0, EDGE_POS);
  edgeBar(PANEL + EDGE * 2, EDGE, 0, -EDGE_POS);
  edgeBar(EDGE, PANEL, EDGE_POS, 0);
  edgeBar(EDGE, PANEL, -EDGE_POS, 0);

  var haloMat = radialMaterial(0x17c793, 2.0);
  haloMat.uniforms.uOpacity.value = 0.3;
  var halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), haloMat);
  halo.scale.set(4.4, 4.4, 1);
  halo.position.z = -0.42;
  halo.renderOrder = 1;
  stage.add(halo);

  var rimMat = radialMaterial(0x2ae6ae, 3.2);
  rimMat.uniforms.uOpacity.value = 0.22;
  var rim = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rimMat);
  rim.scale.set(2.55, 2.55, 1);
  rim.position.z = -0.26;
  rim.renderOrder = 1;
  stage.add(rim);

  /* reflection on the polished floor */
  var reflectionMat = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: null },
      uOpacity: { value: 0.19 },
      uTint: { value: new THREE.Color(0x27d7a2) }
    },
    vertexShader:
      'varying vec2 vUv;' +
      'void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:
      'varying vec2 vUv;uniform sampler2D uMap;uniform float uOpacity;uniform vec3 uTint;' +
      'void main(){' +
      'vec2 uv=vec2(vUv.x,0.02+(1.0-vUv.y)*0.72);' +
      'vec3 c=texture2D(uMap,uv).rgb;' +
      'float a=pow(clamp(vUv.y,0.0,1.0),1.7)*uOpacity;' +
      'gl_FragColor=vec4(mix(c,c*uTint,0.35),a);}',
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  var reflection = new THREE.Mesh(new THREE.PlaneGeometry(PANEL, 2.4), reflectionMat);
  reflection.rotation.x = -Math.PI / 2;
  reflection.position.set(0, FLOOR_Y - CENTER_Y + 0.006, 1.2);
  reflection.renderOrder = 1;
  stage.add(reflection);

  /* ------------------------------------------------------------------ lights */
  var ambient = new THREE.AmbientLight(0x0a2a20, 1.05);
  scene.add(ambient);

  var keyLight = new THREE.PointLight(0x2fe6ad, 14, 20, 2);
  keyLight.position.set(3.2, 4.2, 2.4);
  scene.add(keyLight);

  var fillLight = new THREE.PointLight(0x0f9c70, 9, 16, 2);
  fillLight.position.set(-3.4, 1.6, -1.4);
  scene.add(fillLight);

  var backLight = new THREE.PointLight(0x1bbf8c, 8, 14, 2);
  backLight.position.set(0, 3.4, -3.8);
  scene.add(backLight);

  /* --------------------------------------------------------------- particles */
  function particleMaterial(size, opacity, color) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: size },
        uOpacity: { value: opacity },
        uColor: { value: new THREE.Color(color) },
        uPR: { value: DPR }
      },
      vertexShader:
        'uniform float uTime;uniform float uSize;uniform float uPR;varying float vA;' +
        'void main(){' +
        'vec3 p=position;' +
        'p.y+=sin(uTime*0.22+position.x*1.3+position.z*0.7)*0.16;' +
        'p.x+=sin(uTime*0.15+position.y*0.9)*0.1;' +
        'vec4 mv=modelViewMatrix*vec4(p,1.0);' +
        'gl_PointSize=uSize*uPR*(220.0/max(1.0,-mv.z));' +
        'gl_Position=projectionMatrix*mv;' +
        'vA=0.42+0.58*sin(uTime*0.75+position.x*3.1+position.y*2.3);}',
      fragmentShader:
        'uniform vec3 uColor;uniform float uOpacity;varying float vA;' +
        'void main(){float d=length(gl_PointCoord-0.5)*2.0;' +
        'float a=pow(max(0.0,1.0-d),2.0);' +
        'gl_FragColor=vec4(uColor,a*vA*uOpacity);}',
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }

  function makePoints(count, box, size, opacity, color, attached) {
    var geo = new THREE.BufferGeometry();
    var arr = new Float32Array(count * 3);
    var n = 0;
    var guard = 0;
    while (n < count && guard < count * 40) {
      guard++;
      var x = box.x[0] + Math.random() * (box.x[1] - box.x[0]);
      var y = box.y[0] + Math.random() * (box.y[1] - box.y[0]);
      var z = box.z[0] + Math.random() * (box.z[1] - box.z[0]);
      if (box.skip && Math.abs(x) < box.skip.x && Math.abs(y - CENTER_Y) < box.skip.y) continue;
      arr[n * 3] = x;
      arr[n * 3 + 1] = y;
      arr[n * 3 + 2] = z;
      n++;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(arr.subarray(0, n * 3), 3));
    var pts = new THREE.Points(geo, particleMaterial(size, opacity, color));
    pts.frustumCulled = false;
    if (attached) stage.add(pts); else scene.add(pts);
    return pts;
  }

  var dustWorld = makePoints(240, {
    x: [-10, 10], y: [-0.4, 7.6], z: [-8.5, -1.8],
    skip: { x: 1.55, y: 1.15 }
  }, 2.1, 0.5, 0x2fe6ad, false);

  var dustStage = makePoints(90, {
    x: [-2.5, 2.5], y: [-2.4, 2.6], z: [-2.3, -0.65]
  }, 1.7, 0.42, 0x37efb8, true);

  /* --------------------------------------------------------------- lifecycle */
  var loading = true;
  var texture = null;
  var disposed = false;

  var loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  loader.load(SOURCE, function (tex) {
    if (disposed) { tex.dispose(); return; }
    texture = tex;
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.needsUpdate = true;

    var panelMat = new THREE.MeshBasicMaterial({
      map: texture,
      toneMapped: false,
      transparent: false,
      depthWrite: true,
      depthTest: true
    });
    panel = new THREE.Mesh(new THREE.PlaneGeometry(PANEL, PANEL), panelMat);
    panel.position.z = 0;
    panel.frustumCulled = false;
    stage.add(panel);

    reflectionMat.uniforms.uMap.value = texture;
    loading = false;

    resize();
    measureScroll();
    renderer.compile(scene, camera);
    startTime = performance.now();
    updateScene(startTime);

    if (reduced) {
      host.classList.add('is-live');
      host.classList.remove('is-start');
    } else {
      requestAnimationFrame(function () {
        host.classList.remove('is-start');
        host.classList.add('is-live');
      });
    }

    start();
  }, undefined, function () {
    if (!disposed) useFallback();
  });

  /* ------------------------------------------------------------------- state */
  var last = 0;
  var startTime = 0;
  var rafId = 0;
  var running = false;
  var visible = true;
  var fps = 60;
  var frames = 0;
  var fpsClock = 0;
  var perfChecked = false;

  var theta = 0;
  var thetaTarget = 0;
  var pointerX = 0;
  var pointerXTarget = 0;
  var hover = 0;
  var hoverTarget = 0;
  var scrollSmooth = 0.5;
  var scrollTarget = 0.5;
  var reveal = reduced ? 1 : 0;

  var dragging = false;
  var dragStartX = 0;
  var dragStartOffset = 0;
  var dragTarget = 0;

  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  function measureScroll() {
    var r = host.getBoundingClientRect();
    var vh = window.innerHeight || 1;
    scrollTarget = clamp((vh - r.top) / (vh + r.height), 0, 1);
  }

  function resize() {
    W = Math.max(1, Math.round(canvas.clientWidth || host.clientWidth));
    H = Math.max(1, Math.round(canvas.clientHeight || host.clientHeight));
    var aspect = W / H;

    renderer.setPixelRatio(DPR);
    renderer.setSize(W, H, false);
    camera.aspect = aspect;
    camera.updateProjectionMatrix();

    var fillH, fillW;
    if (aspect >= 1.4) { fillH = 0.84; fillW = 0.9; }
    else if (aspect >= 0.9) { fillH = 0.78; fillW = 0.9; }
    else { fillH = 0.74; fillW = 0.9; }

    var rh = (PANEL) / (2 * fillH * TAN);
    var rw = (PANEL) / (2 * fillW * TAN * aspect);
    RADIUS = Math.max(rh, rw);

    if (dustWorld && dustWorld.material) dustWorld.material.uniforms.uPR.value = DPR;
    if (dustStage && dustStage.material) dustStage.material.uniforms.uPR.value = DPR;

    camera.position.set(Math.sin(theta) * RADIUS, CENTER_Y, Math.cos(theta) * RADIUS);
    camera.lookAt(0, CENTER_Y, 0);
    camera.updateMatrixWorld();

    if (reduced && !loading && scene) {
      updateScene(performance.now());
      renderer.render(scene, camera);
    }
  }

  window.addEventListener('resize', resize, { passive: true });

  function onPointerMove(e) {
    if (reduced) return;
    var r = host.getBoundingClientRect();
    if (!r.width) return;
    pointerXTarget = clamp(((e.clientX - r.left) / r.width - 0.5) * 2, -1, 1);
    hoverTarget = 1;
    if (dragging) {
      dragTarget = clamp(dragStartOffset + (e.clientX - dragStartX) * 0.0022, -0.1, 0.1);
    }
  }

  function onPointerDown(e) {
    if (reduced || (e.pointerType && e.pointerType === 'touch')) return;
    dragging = true;
    dragStartX = e.clientX;
    dragStartOffset = dragTarget;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    host.classList.add('is-dragging');
  }

  function endDrag() {
    dragging = false;
    dragTarget = 0;
    host.classList.remove('is-dragging');
  }

  function onPointerUp() {
    if (!dragging) return;
    endDrag();
  }

  function onPointerLeave() {
    hoverTarget = 0;
    if (dragging) endDrag();
  }

  canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
  host.addEventListener('pointermove', onPointerMove, { passive: true });
  host.addEventListener('pointerup', onPointerUp, { passive: true });
  host.addEventListener('pointercancel', onPointerUp, { passive: true });
  host.addEventListener('pointerleave', onPointerLeave, { passive: true });
  window.addEventListener('scroll', measureScroll, { passive: true });

  /* -------------------------------------------------------------------- loop */
  function updateScene(now) {
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    var t = (now - startTime) / 1000;
    if (!isFinite(t) || t < 0) t = 0;
    var at = reduced ? 0 : t;

    reveal += (1 - reveal) * Math.min(1, dt * 1.1);
    if (reveal > 0.999) reveal = 1;

    scrollSmooth += (scrollTarget - scrollSmooth) * Math.min(1, dt * 3.2);
    pointerX += (pointerXTarget - pointerX) * Math.min(1, dt * 3.6);
    hover += (hoverTarget - hover) * Math.min(1, dt * 3);
    dragTarget += (0 - dragTarget) * (dragging ? 0 : Math.min(1, dt * 2.6));

    if (!reduced) {
      thetaTarget = (scrollSmooth - 0.5) * 0.11 + pointerX * 0.055 + dragTarget + Math.sin(at * 0.07) * 0.012;
      theta += (thetaTarget - theta) * Math.min(1, dt * 2.2);
    } else {
      theta = 0;
    }

    stage.rotation.y = theta;
    camera.position.set(Math.sin(theta) * RADIUS, CENTER_Y, Math.cos(theta) * RADIUS);
    camera.lookAt(0, CENTER_Y, 0);

    var breathe = 0.5 + 0.5 * Math.sin(at * 0.4);
    var breathe2 = 0.5 + 0.5 * Math.sin(at * 0.23 + 1.4);

    keyLight.position.set(3.2 + Math.sin(at * 0.17) * 2.1, 4.2, 2.4 + Math.cos(at * 0.13) * 1.2);
    fillLight.position.set(-3.4 + Math.cos(at * 0.11 + 1.2) * 1.8, 1.6, -1.4);
    backLight.position.set(Math.sin(at * 0.14) * 2.2, 3.4, -3.8);

    keyLight.intensity = (11 + breathe * 4 + hover * 5) * reveal;
    fillLight.intensity = (7 + breathe2 * 3) * reveal;
    backLight.intensity = (6 + breathe * 3) * reveal;
    ambient.intensity = 0.9 + breathe * 0.12;

    haloMat.uniforms.uOpacity.value = (0.26 + breathe * 0.07 + hover * 0.06) * reveal;
    rimMat.uniforms.uOpacity.value = (0.17 + breathe2 * 0.07 + hover * 0.05) * reveal;
    poolMat.uniforms.uOpacity.value = (0.19 + breathe * 0.05 + hover * 0.04) * reveal;
    baseGlowMat.uniforms.uOpacity.value = (0.15 + breathe2 * 0.06 + hover * 0.05) * reveal;
    reflectionMat.uniforms.uOpacity.value = (0.2 + breathe2 * 0.06 + hover * 0.04) * reveal;

    edgeMat.emissiveIntensity = (0.72 + breathe * 0.34 + hover * 0.4) * reveal;
    frameMat.envMapIntensity = 1.1 + breathe * 0.3;

    for (var b = 0; b < beams.length; b++) {
      beams[b].material.uniforms.uOpacity.value = beams[b].userData.base * (0.55 + reveal * 0.55 + breathe * 0.2);
    }

    dustWorld.material.uniforms.uTime.value = at;
    dustWorld.material.uniforms.uOpacity.value = (0.34 + breathe * 0.18 + hover * 0.08) * reveal;
    dustStage.material.uniforms.uTime.value = at;
    dustStage.material.uniforms.uOpacity.value = (0.28 + breathe2 * 0.16) * reveal;

    portalGlowL.material.uniforms.uOpacity.value = (0.07 + breathe * 0.05) * reveal;

    if (panel) panel.visible = texture !== null;
  }

  function loop(now) {
    if (!running) return;
    rafId = requestAnimationFrame(loop);
    updateScene(now);
    renderer.render(scene, camera);

    frames++;
    if (!fpsClock) fpsClock = now;
    else if (now - fpsClock > 900) {
      fps = (frames * 1000) / (now - fpsClock);
      frames = 0;
      fpsClock = now;
      if (!perfChecked && !reduced && fps < 42 && DPR > 1.25) {
        perfChecked = true;
        DPR = 1.25;
        resize();
      }
    }
  }

  function start() {
    if (running || !visible || document.hidden || loading || disposed) return;
    if (reduced) {
      updateScene(performance.now());
      renderer.render(scene, camera);
      return;
    }
    running = true;
    last = 0;
    fpsClock = 0;
    frames = 0;
    rafId = requestAnimationFrame(loop);
  }

  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  var io = null;
  var ro = null;

  if ('ResizeObserver' in window) {
    ro = new ResizeObserver(function () {
      resize();
      measureScroll();
    });
    ro.observe(host);
  }

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) start(); else stop();
    }, { rootMargin: '140px' });
    io.observe(host);
  } else {
    visible = true;
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop(); else start();
  });

  var onReducedChange = function () {
    reduced = mqReduced.matches;
    if (reduced) {
      stop();
      theta = 0;
      dragTarget = 0;
      reveal = 1;
      host.classList.add('is-live');
      host.classList.remove('is-start');
      if (renderer && !loading) {
        updateScene(performance.now());
        renderer.render(scene, camera);
      }
    } else {
      start();
    }
  };
  if (mqReduced.addEventListener) mqReduced.addEventListener('change', onReducedChange);
  else if (mqReduced.addListener) mqReduced.addListener(onReducedChange);

  if (!reduced) host.classList.add('is-start');

  canvas.addEventListener('webglcontextlost', function (e) {
    e.preventDefault();
    stop();
    useFallback();
  }, false);

  resize();
  measureScroll();

  /* ------------------------------------------------------------------ QA hook */
  function projectBox(obj) {
    if (!obj || !camera) return null;
    camera.updateMatrixWorld();
    obj.updateWorldMatrix(true, true);
    var pos = obj.geometry && obj.geometry.attributes ? obj.geometry.attributes.position : null;
    if (!pos) return null;
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    var v = new THREE.Vector3();
    for (var i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      v.applyMatrix4(obj.matrixWorld).project(camera);
      var nx = v.x * 0.5 + 0.5;
      var ny = -v.y * 0.5 + 0.5;
      if (nx < minX) minX = nx;
      if (nx > maxX) maxX = nx;
      if (ny < minY) minY = ny;
      if (ny > maxY) maxY = ny;
    }
    if (!isFinite(minX) || !isFinite(minY)) return null;
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  window.KINETIA_BEAUTY_3D = {
    renderer: renderer,
    scene: scene,
    camera: camera,
    stage: stage,
    get panel() { return panel; },
    get texture() { return texture; },
    reduced: reduced,
    get fps() { return Math.round(fps); },
    get yaw() { return Math.round(theta * 1000) / 1000; },
    metrics: function () {
      var box = projectBox(panel);
      return {
        width: W,
        height: H,
        panel: box,
        head: box,
        bust: box,
        imageLoaded: texture !== null,
        radius: Math.round(RADIUS * 1000) / 1000,
        dpr: Math.round(DPR * 100) / 100,
        hover: Math.round(hover * 100) / 100,
        yaw: Math.round(theta * 1000) / 1000,
        scroll: Math.round(scrollSmooth * 100) / 100,
        reveal: Math.round(reveal * 100) / 100,
        running: running
      };
    }
  };

  /* ---------------------------------------------------------------- teardown */
  function dispose() {
    if (disposed) return;
    disposed = true;
    stop();
    if (io) io.disconnect();
    if (ro) ro.disconnect();
    window.removeEventListener('scroll', measureScroll);
    window.removeEventListener('resize', resize);
    canvas.removeEventListener('pointerdown', onPointerDown);
    host.removeEventListener('pointermove', onPointerMove);
    host.removeEventListener('pointerup', onPointerUp);
    host.removeEventListener('pointercancel', onPointerUp);
    host.removeEventListener('pointerleave', onPointerLeave);
    if (mqReduced.removeEventListener) mqReduced.removeEventListener('change', onReducedChange);
    else if (mqReduced.removeListener) mqReduced.removeListener(onReducedChange);
    host.classList.remove('is-dragging');

    var geos = [], mats = [], texs = [backdropTex];
    scene.traverse(function (o) {
      if (o.geometry) geos.push(o.geometry);
      if (o.material) {
        var list = Array.isArray(o.material) ? o.material : [o.material];
        list.forEach(function (m) {
          mats.push(m);
          if (m.map) texs.push(m.map);
        });
      }
    });
    if (texture) texs.push(texture);
    geos.forEach(function (g) { g.dispose(); });
    mats.forEach(function (m) { m.dispose(); });
    texs.forEach(function (x) { if (x && x.dispose) x.dispose(); });
    if (envRT) envRT.dispose();
    renderer.dispose();
    delete window.KINETIA_BEAUTY_3D;
  }
  window.addEventListener('pagehide', dispose, { once: true });
})();

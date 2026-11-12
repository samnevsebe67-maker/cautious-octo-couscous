/* KINETIA — Traffic Flow: interactive 3D customer-journey installation.
   Scope: the «Путь от рекламы до повторной записи.» section only.
   All geometry is generated at runtime. No external images. */

import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const BASE = 1240;
const PERIOD = 'мес';

const SOURCES = [
  { n: 'Instagram / Meta', d: 'Показ работ и офферов рядом с салоном.', share: .38 },
  { n: 'Google Ads / Карты', d: 'Поиск услуги и салона по району.', share: .24 },
  { n: 'Organic', d: 'Страницы услуг и мастеров в поиске.', share: .17 },
  { n: 'Social', d: 'Контент мастеров и отзывы клиентов.', share: .11 },
  { n: 'Ретаргетинг', d: 'Возврат тех, кто смотрел услуги и ушёл.', share: .10 }
];

const STAGES = [
  { n: 'Сайт', d: 'Страница салона: услуги, мастера, окна для записи.', conv: 1, metric: 'визитов' },
  { n: 'Услуга', d: 'Клиент открывает процедуру, цену и свободное время.', conv: .42, metric: 'просмотров услуги' },
  { n: 'Запись', d: 'Заявка создаётся сразу с услугой, мастером и контактом.', conv: .31, metric: 'заявок' },
  { n: 'CRM', d: 'Заявка попадает администратору со статусом и источником.', conv: .97, metric: 'заявок в работе' },
  { n: 'Менеджер', d: 'Администратор подтверждает визит и отвечает клиенту.', val: '12 мин', metric: 'среднее время ответа' },
  { n: 'Визит', d: 'Клиент приходит в салон, мастер закрывает визит.', conv: .78, metric: 'визитов' },
  { n: 'Повторный визит', d: 'Система предлагает следующий визит к мастеру.', conv: .46, metric: 'повторных визитов' }
];

const LAYOUT = {
  desktop: {
    center: -.2,
    halfW: 14.0,
    source: { x: -12.6, z: 1.0 },
    pos: [
      { x: -8.9, z: .9 },
      { x: -6.0, z: -1.9 },
      { x: -3.3, z: 1.9 },
      { x: 0, z: 0 },
      { x: 3.5, z: -1.9 },
      { x: 6.7, z: 1.9 },
      { x: 11.0, z: -.9 }
    ]
  },
  mobile: {
    center: -.7,
    halfW: 9.4,
    source: { x: -8.4, z: 1.2 },
    pos: [
      { x: -6.3, z: 1.2 },
      { x: -4.1, z: -3.2 },
      { x: -1.95, z: 3.0 },
      { x: 0, z: 0 },
      { x: 2.1, z: -3.0 },
      { x: 4.4, z: 3.0 },
      { x: 6.9, z: -1.2 }
    ]
  }
};

const stageEl = document.querySelector('.jm-stage[data-journey]');
if (stageEl) boot();

function boot() {
  const canvas = stageEl.querySelector('canvas');
  const tip = stageEl.querySelector('.jm-tip');
  const readout = stageEl.querySelector('.jm-readout');
  const meterBar = stageEl.querySelector('.jm-meter i');
  const liveEl = stageEl.querySelector('.jm-live');
  const panel = stageEl.parentNode.querySelector('.jm-panel');
  const copyEl = panel ? panel.querySelector('.jm-copy') : null;
  const steps = panel ? Array.prototype.slice.call(panel.querySelectorAll('.jm-step')) : [];
  const srcBtns = Array.prototype.slice.call(stageEl.querySelectorAll('.jm-src'));
  const launchBtn = panel ? panel.querySelector('.jm-launch') : null;
  const pauseBtn = panel ? panel.querySelector('.jm-pause') : null;
  const resetBtn = panel ? panel.querySelector('.jm-reset') : null;

  const RM = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Static, DOM-only fallback when WebGL is unavailable. Keeps every control usable. */
  function fallbackUI() {
    const fb = stageEl.querySelector('.jm-fallback');
    if (fb) fb.classList.add('on');
    stageEl.classList.remove('jm-ready');
    let cur = 0, src = -1, timer = 0;

    function paint() {
      const s = STAGES[cur];
      if (copyEl) {
        copyEl.innerHTML =
          '<b>' + s.n + '</b>' +
          '<p>' + s.d + '</p>' +
          '<div class="jm-kpi"><b>' + metricFor(cur, src) + '</b><span>демо-показатель</span></div>' +
          '<p class="jm-next">' + transitionFor(cur) + '</p>' +
          '<em>Этап ' + (cur + 1) + ' из ' + STAGES.length + ' · данные условные</em>';
      }
      steps.forEach(function (b, idx) { b.setAttribute('aria-pressed', String(idx === cur)); });
      if (readout) {
        readout.querySelector('b').textContent = String(cur + 1).padStart(2, '0');
        readout.querySelector('span').textContent = s.n;
      }
      if (liveEl) liveEl.textContent = 'demo · ' + (src < 0 ? 'все источники' : SOURCES[src].n);
      if (meterBar) meterBar.style.width = ((cur + 1) / STAGES.length * 100).toFixed(1) + '%';
    }

    steps.forEach(function (b) {
      b.addEventListener('click', function () { cur = +b.getAttribute('data-stage'); paint(); });
    });
    srcBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        const i = +b.getAttribute('data-src');
        src = src === i ? -1 : i;
        srcBtns.forEach(function (x, idx) { x.setAttribute('aria-pressed', String(idx === src)); });
        paint();
      });
    });
    if (launchBtn) launchBtn.addEventListener('click', function () {
      if (timer) { clearInterval(timer); timer = 0; launchBtn.setAttribute('aria-pressed', 'false'); return; }
      cur = 0; paint();
      launchBtn.setAttribute('aria-pressed', 'true');
      timer = setInterval(function () {
        cur++;
        if (cur >= STAGES.length) { clearInterval(timer); timer = 0; launchBtn.setAttribute('aria-pressed', 'false'); cur = STAGES.length - 1; paint(); return; }
        paint();
      }, 900);
    });
    if (pauseBtn) pauseBtn.addEventListener('click', function () {
      if (timer) { clearInterval(timer); timer = 0; pauseBtn.setAttribute('aria-pressed', 'true'); }
      else { pauseBtn.setAttribute('aria-pressed', 'false'); }
    });
    if (resetBtn) resetBtn.addEventListener('click', function () {
      if (timer) { clearInterval(timer); timer = 0; }
      cur = 0; paint();
      if (launchBtn) launchBtn.setAttribute('aria-pressed', 'false');
    });
    paint();
    return false;
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  } catch (err) { return fallbackUI(); }
  if (!renderer || !renderer.getContext()) return fallbackUI();

  let mode = window.innerWidth <= 760 ? 'mobile' : 'desktop';
  let pr = Math.min(window.devicePixelRatio || 1, mode === 'mobile' ? 1.6 : 1.8);

  renderer.setPixelRatio(pr);
  renderer.setSize(stageEl.clientWidth || 1, stageEl.clientHeight || 1, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.26;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x040706);
  scene.fog = new THREE.FogExp2(0x040706, 0.0135);

  const camera = new THREE.PerspectiveCamera(40, 1, .1, 140);
  const look = new THREE.Vector3(-1.2, 2.8, 0);
  const camBase = new THREE.Vector3(0, 6.4, 32);

  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(pr);
  composer.setSize(stageEl.clientWidth || 1, stageEl.clientHeight || 1);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), .56, .7, .66);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ---------------- textures ---------------- */
  function radialTexture(inner, mid) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, inner);
    g.addColorStop(.32, mid);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const GLOW = radialTexture('rgba(235,255,248,1)', 'rgba(25,223,160,.42)');
  const HALO = radialTexture('rgba(25,223,160,.85)', 'rgba(8,122,88,.2)');

  function envTexture() {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 512;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, '#010302');
    g.addColorStop(.38, '#06110d');
    g.addColorStop(.72, '#0a241b');
    g.addColorStop(1, '#020604');
    x.fillStyle = g; x.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 8; i++) {
      const bx = 40 + i * 128, w = 26 + Math.random() * 74;
      const lg = x.createLinearGradient(bx, 0, bx + w, 0);
      lg.addColorStop(0, 'rgba(25,223,160,0)');
      lg.addColorStop(.5, 'rgba(25,223,160,' + (.06 + Math.random() * .13).toFixed(3) + ')');
      lg.addColorStop(1, 'rgba(25,223,160,0)');
      x.fillStyle = lg; x.fillRect(bx, 0, w, 512);
    }
    const rg = x.createRadialGradient(620, 108, 0, 620, 108, 190);
    rg.addColorStop(0, 'rgba(160,255,224,.55)');
    rg.addColorStop(.5, 'rgba(25,223,160,.16)');
    rg.addColorStop(1, 'rgba(25,223,160,0)');
    x.fillStyle = rg; x.fillRect(0, 0, 1024, 512);
    const t = new THREE.CanvasTexture(c);
    t.mapping = THREE.EquirectangularReflectionMapping;
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const ENV = envTexture();
  scene.environment = ENV;

  function marbleTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = '#060a09'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2400; i++) {
      const v = Math.random();
      x.fillStyle = 'rgba(' + (9 + v * 22) + ',' + (16 + v * 26) + ',' + (14 + v * 22) + ',.55)';
      x.fillRect(Math.random() * 256, Math.random() * 256, 1, 1);
    }
    for (let i = 0; i < 8; i++) {
      let px = Math.random() * 256, py = -10;
      x.beginPath(); x.moveTo(px, py);
      for (let s = 0; s < 9; s++) { px += (Math.random() - .5) * 46; py += 30; x.lineTo(px, py); }
      x.strokeStyle = 'rgba(96,158,136,' + (.05 + Math.random() * .08).toFixed(3) + ')';
      x.lineWidth = .5 + Math.random() * 1.1;
      x.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1.6, 1.6);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }
  const MARBLE = marbleTexture();

  /* ---------------- lights ---------------- */
  const amb = new THREE.AmbientLight(0x7fb9a8, .62);
  scene.add(amb);
  const hemi = new THREE.HemisphereLight(0x8be7c9, 0x05100c, .78);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xa6ffe0, 1.65);
  key.position.set(-7, 12, 9);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x19dfa0, .95);
  rim.position.set(9, 7, -8);
  scene.add(rim);
  const crmLight = new THREE.PointLight(0x19dfa0, 26, 22, 2);
  crmLight.position.set(0, 3.1, 1.6);
  scene.add(crmLight);
  const warmLight = new THREE.PointLight(0xffb27a, 9, 9, 2);
  warmLight.position.set(6.7, 2.2, 3.2);
  scene.add(warmLight);
  const fillLight = new THREE.PointLight(0x7affcb, 6, 16, 2);
  fillLight.position.set(-8, 3.6, 4);
  scene.add(fillLight);

  /* ---------------- shared helpers ---------------- */
  const tmpVec = new THREE.Vector3();

  function newMaterials() {
    return {
      black: new THREE.MeshPhysicalMaterial({ color: 0x050a08, metalness: .95, roughness: .23, envMapIntensity: 1.35 }),
      chrome: new THREE.MeshPhysicalMaterial({ color: 0x0c1713, metalness: 1, roughness: .11, envMapIntensity: 2.1 }),
      glass: new THREE.MeshPhysicalMaterial({ color: 0x0d4a39, metalness: .12, roughness: .05, transparent: true, opacity: .23, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2.2, emissive: 0x062a20, emissiveIntensity: .55 }),
      glass2: new THREE.MeshPhysicalMaterial({ color: 0x125a45, metalness: .1, roughness: .04, transparent: true, opacity: .14, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 2.4, emissive: 0x083b2c, emissiveIntensity: .5 }),
      accent: new THREE.MeshStandardMaterial({ color: 0x0a3d2e, metalness: .35, roughness: .3, emissive: 0x19dfa0, emissiveIntensity: .9 }),
      mint: new THREE.MeshStandardMaterial({ color: 0x0e4b39, metalness: .2, roughness: .25, emissive: 0x7affcb, emissiveIntensity: 1.6 }),
      warm: new THREE.MeshStandardMaterial({ color: 0x1b120c, metalness: .35, roughness: .55, emissive: 0xffb27a, emissiveIntensity: .5 }),
      marble: new THREE.MeshPhysicalMaterial({ map: MARBLE, color: 0xffffff, metalness: .42, roughness: .3, envMapIntensity: 1.2 })
    };
  }

  function box(parent, mat, w, h, d, x, y, z, rot) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    if (rot) m.rotation.set(rot[0] || 0, rot[1] || 0, rot[2] || 0);
    parent.add(m);
    return m;
  }

  function rbox(parent, mat, w, h, d, x, y, z, r) {
    const geo = new RoundedBoxGeometry(w, h, d, 2, Math.min(r || .04, Math.min(w, h, d) * .24));
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    return m;
  }

  function edges(mesh, opacity, color) {
    const e = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry, 32),
      new THREE.LineBasicMaterial({ color: color || 0x45e8b8, transparent: true, opacity: opacity == null ? .24 : opacity, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    e.position.copy(mesh.position);
    e.rotation.copy(mesh.rotation);
    e.scale.copy(mesh.scale);
    if (mesh.parent) mesh.parent.add(e);
    return e;
  }

  function sprite(map, color, size, opacity) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({
      map: map, color: color, transparent: true, opacity: opacity,
      blending: THREE.AdditiveBlending, depthWrite: false
    }));
    s.scale.set(size, size, 1);
    return s;
  }

  function platform(mod, w, d, h, material) {
    const g = new THREE.Group();
    const p = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, .05), material || mod.M.black);
    p.position.y = h / 2;
    g.add(p);
    const rim = new THREE.Mesh(
      new THREE.BoxGeometry(w * .93, .013, d * .9),
      new THREE.MeshStandardMaterial({ color: 0x0a2e24, metalness: .5, roughness: .4, emissive: 0x19dfa0, emissiveIntensity: .32 })
    );
    rim.position.y = h + .002;
    g.add(rim);
    mod.accents.push({ mat: rim.material, base: 1.1 });
    const pool = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 2.05, d * 3.4),
      new THREE.MeshBasicMaterial({ map: HALO, color: 0x0f8b69, transparent: true, opacity: .12, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = .02;
    g.add(pool);
    mod.pools.push({ s: pool, base: .22 });
    return g;
  }

  function pickTarget(mod, w, h, d, y) {
    const mat = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.y = y;
    m.userData.stage = mod.index;
    mod.g.add(m);
    pickables.push(m);
    return m;
  }

  function glowPart(mod, x, y, z, size, opacity, map) {
    const s = sprite(map || HALO, 0x19dfa0, size, opacity == null ? .5 : opacity);
    s.position.set(x, y, z);
    mod.g.add(s);
    mod.halos.push({ s: s, base: opacity == null ? .5 : opacity });
    return s;
  }

  /* ---------------- modules ---------------- */
  const modules = [];
  const pickables = [];
  const sources = [];
  const netGroup = new THREE.Group();
  scene.add(netGroup);
  const sourceGroup = new THREE.Group();
  scene.add(sourceGroup);

  function buildSite() {
    const mod = { index: 0, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], anchor: new THREE.Vector3(0, 2.35, .15) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M, y = .42;
    g.add(platform(mod, 3.5, 2.6, .42));
    const back = box(g, M.glass, 2.6, 3.0, .06, 0, y + 1.6, -.6);
    edges(back, .18);
    box(g, M.black, .3, 3.3, .5, -1.42, y + 1.65, .05);
    box(g, M.black, .3, 3.3, .5, 1.42, y + 1.65, .05);
    box(g, M.black, 3.14, .26, .54, 0, y + 3.42, .05);
    box(g, M.glass2, 2.42, 2.86, .03, 0, y + 1.7, .04);
    for (let i = 0; i < 4; i++) {
      box(g, M.accent, 1.5 - i * .2, .018, .02, -.34 + i * .07, y + 1.12 + i * .5, .1);
    }
    box(g, M.accent, .06, 2.56, .03, 0, y + 1.62, .13);
    for (let i = 0; i < 3; i++) {
      const pl = box(g, M.glass2, 2.5 - i * .22, 2.15 - i * .16, .025, 0, y + 1.85, -.92 - i * .42);
      pl.rotation.y = (i - 1) * .06;
      pl.rotation.x = -.03 + i * .02;
    }
    const crown = box(g, M.mint, 1.9, .03, .03, 0, y + 3.58, .05);
    edges(crown, .5);
    mod.accents.push({ mat: M.glass, base: .55 }, { mat: M.accent, base: .9 }, { mat: M.mint, base: 1.5 });
    glowPart(mod, 0, y + 1.85, 0, 2.9, .34);
    mod.anchor.set(0, y + 1.85, .15);
    pickTarget(mod, 3.6, 4.0, 3.1, y + 1.9);
    return mod;
  }

  function buildService() {
    const mod = { index: 1, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], anchor: new THREE.Vector3(0, 2.25, .1) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M, y = .4;
    g.add(platform(mod, 2.78, 2.2, .4));
    const board = box(g, M.glass, 2.0, 1.6, .05, 0, y + 1.95, -.05, [-.2, 0, 0]);
    edges(board, .26);
    box(g, M.black, 2.2, .1, .16, 0, y + 2.72, -.05);
    box(g, M.black, 2.2, .1, .16, 0, y + 1.2, .08);
    for (let i = 0; i < 3; i++) {
      box(g, M.accent, 1.1 - i * .22, .02, .02, -.2, y + 1.62 + i * .42, .07, [-.2, 0, 0]);
    }
    for (let i = 0; i < 3; i++) {
      const tile = box(g, M.glass2, .62, .78, .03, -.72 + i * .72, y + 1.0 + i * .2, .74 - i * .08, [0, 0, 0]);
      edges(tile, .3);
      const dot = box(g, M.mint, .1, .1, .02, -.72 + i * .72, y + 1.0 + i * .2, .77 - i * .08);
      mod.accents.push({ mat: dot.material, base: 1.4 });
    }
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.14, 20, 16), M.mint);
    orb.position.set(0, y + .85, .62);
    g.add(orb);
    mod.accents.push({ mat: M.glass, base: .5 }, { mat: M.glass2, base: .5 }, { mat: M.accent, base: .9 }, { mat: M.mint, base: 1.5 });
    glowPart(mod, 0, y + 1.55, .1, 2.4, .3);
    mod.anchor.set(0, y + 1.7, .1);
    pickTarget(mod, 3.2, 3.4, 2.8, y + 1.6);
    return mod;
  }

  function buildBooking() {
    const mod = { index: 2, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], slots: [], anchor: new THREE.Vector3(0, 1.95, .1) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M, y = .42;
    g.add(platform(mod, 2.82, 2.3, .42));
    [-1.08, 1.08].forEach(function (x) {
      [-.86, .86].forEach(function (z) { box(g, M.black, .1, 2.5, .1, x, y + 1.25, z); });
    });
    const wall = box(g, M.glass, 2.3, 2.36, .04, 0, y + 1.26, -.9);
    edges(wall, .2);
    box(g, M.glass, .04, 2.36, 1.8, -1.1, y + 1.26, 0);
    box(g, M.black, 2.5, .1, 2.05, 0, y + 2.58, 0);
    box(g, M.accent, 2.2, .025, .025, 0, y + 2.52, .92);
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 2; c++) {
        const slot = box(g, M.glass2, .4, .4, .05, c ? .48 : -.48, y + .92 + r * .46, .28 - r * .04);
        edges(slot, .34);
        mod.slots.push(slot);
      }
    }
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.16, 0), M.mint);
    core.position.set(0, y + 1.12, .62);
    g.add(core);
    mod.pulses.push(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.46, .014, 8, 48), M.accent);
    ring.position.copy(core.position);
    ring.rotation.x = Math.PI / 2;
    g.add(ring);
    mod.pulses.push(ring);
    mod.accents.push({ mat: M.glass, base: .55 }, { mat: M.glass2, base: .55 }, { mat: M.accent, base: 1.0 }, { mat: M.mint, base: 1.7 });
    glowPart(mod, 0, y + 1.4, 0, 2.6, .32);
    mod.anchor.set(0, y + 1.7, .1);
    pickTarget(mod, 3.2, 3.3, 2.9, y + 1.6);
    return mod;
  }

  function buildCrm() {
    const mod = { index: 3, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], orbiters: [], anchor: new THREE.Vector3(0, 2.5, 0) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M;
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.62, .44, 64), M.black);
    base.position.y = .22;
    g.add(base);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.46, .022, 8, 96), M.accent);
    rim.position.y = .45;
    rim.rotation.x = Math.PI / 2;
    g.add(rim);
    mod.accents.push({ mat: rim.material, base: 1.1 });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ map: HALO, color: 0x0f8b69, transparent: true, opacity: .3, blending: THREE.AdditiveBlending, depthWrite: false }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = .02;
    g.add(pool);
    mod.pools.push({ s: pool, base: .3 });

    const coreG = new THREE.Group();
    coreG.position.y = 2.55;
    g.add(coreG);
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.18, 1),
      new THREE.MeshPhysicalMaterial({ color: 0x0b4c39, metalness: .15, roughness: .06, transparent: true, opacity: .5, envMapIntensity: 2.4, emissive: 0x0d7a5a, emissiveIntensity: .9, flatShading: true })
    );
    coreG.add(core);
    mod.accents.push({ mat: core.material, base: .95 });
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(.56, 0), M.mint);
    coreG.add(inner);
    mod.accents.push({ mat: M.mint, base: 1.7 });
    mod.spin.push({ o: inner, sx: .16, sy: .26, sz: 0 });
    const haloSprite = sprite(HALO, 0x19dfa0, 6.4, .5);
    haloSprite.position.y = 2.55;
    g.add(haloSprite);
    mod.halos.push({ s: haloSprite, base: .5 });

    [1.55, 2.0, 2.42].forEach(function (r, i) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(r, i === 1 ? .045 : .024, 8, 96), i === 1 ? M.chrome : M.accent);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = (i - 1) * .5;
      coreG.add(ring);
      if (i !== 1) mod.accents.push({ mat: ring.material, base: 1.1 });
      mod.spin.push({ o: ring, sx: 0, sy: (i % 2 ? 1 : -1) * (.08 + i * .03), sz: 0 });
    });

    [0, Math.PI / 2].forEach(function (rot, i) {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(2.05, .026, 8, 72, Math.PI * 1.06), M.accent);
      arc.rotation.y = rot;
      arc.rotation.z = -.02;
      coreG.add(arc);
      mod.accents.push({ mat: arc.material, base: .9 });
      mod.spin.push({ o: arc, sx: 0, sy: 0, sz: (i ? -1 : 1) * .04 });
    });

    const pivot = new THREE.Group();
    coreG.add(pivot);
    for (let i = 0; i < 6; i++) {
      const shard = new THREE.Mesh(new THREE.OctahedronGeometry(.1 + (i % 3) * .035, 0), M.mint);
      const a = (i / 6) * Math.PI * 2;
      shard.position.set(Math.cos(a) * 1.9, (i % 2 ? .34 : -.34), Math.sin(a) * 1.9);
      pivot.add(shard);
      mod.accents.push({ mat: shard.material, base: 1.4 });
    }
    mod.spin.push({ o: pivot, sx: 0, sy: .12, sz: 0 });

    for (let i = 0; i < 3; i++) {
      const plate = new THREE.Mesh(new RoundedBoxGeometry(1.5 - i * .18, .05, 1.05 - i * .1, 2, .02), M.glass2);
      plate.position.y = 3.8 + i * .52;
      plate.rotation.y = (i * Math.PI) / 3;
      g.add(plate);
      edges(plate, .22);
      mod.spin.push({ o: plate, sx: 0, sy: (i % 2 ? -.05 : .06), sz: 0 });
    }

    const spire = new THREE.Mesh(new THREE.CylinderGeometry(.03, .1, 1.3, 10), M.chrome);
    spire.position.y = 5.2;
    g.add(spire);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(.1, 16, 12), M.mint);
    tip.position.y = 5.88;
    g.add(tip);
    mod.accents.push({ mat: M.mint, base: 1.6 });

    const haze = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 2.5, 7.2, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x0d6b4f, transparent: true, opacity: .035, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    haze.position.y = 3.6;
    g.add(haze);

    glowPart(mod, 0, 2.55, 0, 6.2, .3);
    mod.anchor.set(0, 2.5, 0);
    pickTarget(mod, 5.4, 6.2, 5.1, 3.0);
    return mod;
  }

  function buildManager() {
    const mod = { index: 4, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], anchor: new THREE.Vector3(0, 1.7, 0) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M, y = .4;
    g.add(platform(mod, 3.1, 2.2, .4));
    box(g, M.black, 2.3, .1, 1.25, 0, y + .92, 0);
    box(g, M.chrome, .07, .9, .07, -.9, y + .48, -.4);
    box(g, M.chrome, .07, .9, .07, .9, y + .48, -.4);
    [-.62, .62].forEach(function (x, i) {
      const scr = box(g, M.glass, .95, .64, .03, x, y + 1.42, .05, [-.24, i ? -.26 : .26, i ? -.05 : .05]);
      edges(scr, .3);
    });
    const orb = new THREE.Mesh(new THREE.SphereGeometry(.17, 22, 16), M.mint);
    orb.position.set(0, y + 1.12, .5);
    g.add(orb);
    mod.pulses.push(orb);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.36, .014, 8, 48), M.accent);
    ring.position.copy(orb.position);
    ring.rotation.x = 1.2;
    g.add(ring);
    mod.spin.push({ o: ring, sx: .06, sy: 0, sz: .1 });
    const tower = box(g, M.glass2, .5, 1.85, .2, 1.12, y + 1.32, -.45);
    edges(tower, .28);
    box(g, M.accent, .03, 1.4, .02, 1.12, y + 1.32, -.33);
    mod.accents.push({ mat: M.glass, base: .55 }, { mat: M.glass2, base: .55 }, { mat: M.accent, base: .95 }, { mat: M.mint, base: 1.6 });
    glowPart(mod, 0, y + 1.2, .2, 2.6, .3);
    mod.anchor.set(0, y + 1.35, 0);
    pickTarget(mod, 3.3, 3.2, 2.6, y + 1.5);
    return mod;
  }

  function buildVisit() {
    const mod = { index: 5, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], anchor: new THREE.Vector3(0, 1.65, .2) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M, y = .44;
    g.add(platform(mod, 3.45, 2.7, .44, M.marble));
    const mirror = box(g, new THREE.MeshPhysicalMaterial({ color: 0x9db5ab, metalness: 1, roughness: .04, envMapIntensity: 2.6 }), 1.55, 2.15, .06, .82, y + 1.5, -.92);
    edges(mirror, .16, 0x7affcb);
    box(g, M.black, 1.78, 2.4, .05, .82, y + 1.5, -.99);
    const arch = new THREE.Mesh(new THREE.TorusGeometry(.89, .035, 8, 48, Math.PI), M.chrome);
    arch.position.set(.82, y + 2.62, -.93);
    g.add(arch);
    const archGlow = new THREE.Mesh(new THREE.TorusGeometry(.9, .012, 8, 48, Math.PI), M.mint);
    archGlow.position.set(.82, y + 2.62, -.9);
    g.add(archGlow);
    mod.accents.push({ mat: M.mint, base: 1.2 });

    const chairX = -.72, chairZ = .35;
    const cBase = new THREE.Mesh(new THREE.CylinderGeometry(.4, .46, .05, 32), M.chrome);
    cBase.position.set(chairX, y + .03, chairZ);
    g.add(cBase);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.07, .09, .4, 16), M.chrome);
    stem.position.set(chairX, y + .26, chairZ);
    g.add(stem);
    const seat = rbox(g, M.black, .92, .15, .78, chairX, y + .56, chairZ, .05);
    edges(seat, .14);
    const back = rbox(g, M.black, .86, .82, .14, chairX, y + 1.0, chairZ - .3, .06);
    back.rotation.x = -.17;
    const warmMat = M.warm;
    const cushion = rbox(g, warmMat, .74, .1, .6, chairX, y + .64, chairZ, .04);
    mod.accents.push({ mat: warmMat, base: .55 });
    [-.46, .46].forEach(function (dx) {
      box(g, M.chrome, .07, .06, .56, chairX + dx, y + .78, chairZ + .06);
    });
    const table = new THREE.Mesh(new THREE.CylinderGeometry(.2, .22, .52, 20), M.black);
    table.position.set(1.05, y + .26, .55);
    g.add(table);
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(.16, 20, 14), M.glass2);
    bowl.position.set(1.05, y + .58, .55);
    g.add(bowl);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 10), M.warm);
    lamp.position.set(.82, y + 2.2, -.85);
    g.add(lamp);

    glowPart(mod, .25, y + 1.1, .2, 2.8, .26, GLOW);
    mod.anchor.set(0, y + 1.55, .2);
    pickTarget(mod, 4.0, 3.5, 3.0, y + 1.6);
    return mod;
  }

  function buildRebook() {
    const mod = { index: 6, M: newMaterials(), accents: [], halos: [], pools: [], spin: [], pulses: [], anchor: new THREE.Vector3(0, 2.05, 0) };
    mod.g = new THREE.Group();
    const g = mod.g, M = mod.M, y = .42;
    g.add(platform(mod, 3.7, 2.7, .42));
    const big = new THREE.Mesh(new THREE.TorusGeometry(1.55, .11, 12, 96), M.chrome);
    big.position.y = y + 2.15;
    big.rotation.x = -.18;
    g.add(big);
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(1.55, .026, 8, 96), M.accent);
    glowRing.position.copy(big.position);
    glowRing.rotation.copy(big.rotation);
    g.add(glowRing);
    mod.accents.push({ mat: M.accent, base: 1.3 });
    const inner = new THREE.Mesh(new THREE.TorusGeometry(1.2, .04, 8, 80), M.mint);
    inner.position.copy(big.position);
    inner.rotation.x = 1.25;
    g.add(inner);
    mod.accents.push({ mat: M.mint, base: 1.5 });
    mod.spin.push({ o: inner, sx: .05, sy: 0, sz: .07 });
    const back = new THREE.Mesh(new THREE.TorusGeometry(1.62, .028, 8, 96), M.accent);
    back.position.copy(big.position);
    back.rotation.x = .95;
    back.rotation.y = .35;
    g.add(back);
    mod.accents.push({ mat: back.material, base: 1.0 });
    mod.spin.push({ o: back, sx: 0, sy: -.06, sz: 0 });
    const hub = new THREE.Mesh(new THREE.TorusGeometry(.52, .035, 8, 56), M.glass2);
    hub.position.copy(big.position);
    hub.rotation.y = .4;
    g.add(hub);
    edges(hub, .28);
    const heart = new THREE.Mesh(new THREE.OctahedronGeometry(.18, 0), M.mint);
    heart.position.copy(big.position);
    g.add(heart);
    mod.pulses.push(heart);
    mod.spin.push({ o: heart, sx: .1, sy: .2, sz: 0 });
    const pivot = new THREE.Group();
    pivot.position.copy(big.position);
    g.add(pivot);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(.035, 10, 8), M.mint);
      dot.position.set(Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0);
      pivot.add(dot);
    }
    mod.spin.push({ o: pivot, sx: 0, sy: 0, sz: .16 });
    mod.accents.push({ mat: M.mint, base: 1.5 }, { mat: M.glass2, base: .55 });
    glowPart(mod, 0, y + 1.55, 0, 4.0, .34);
    mod.anchor.set(0, y + 1.9, 0);
    pickTarget(mod, 4.4, 4.4, 3.2, y + 2.0);
    return mod;
  }

  const builders = [buildSite, buildService, buildBooking, buildCrm, buildManager, buildVisit, buildRebook];
  builders.forEach(function (build) {
    const mod = build();
    mod.baseScale = 1;
    mod.glow = .55;
    if (!mod.slots) mod.slots = [];
    if (!mod.pulses) mod.pulses = [];
    if (!mod.pools) mod.pools = [];
    modules.push(mod);
    scene.add(mod.g);
  });

  /* ---------------- traffic sources ---------------- */
  function buildSources() {
    const pk = new THREE.Group();
    const base = new THREE.Mesh(new RoundedBoxGeometry(3.5, .34, 3.4, 2, .05), new THREE.MeshPhysicalMaterial({ color: 0x050a08, metalness: .95, roughness: .26, envMapIntensity: 1.3 }));
    base.position.y = .17;
    pk.add(base);
    sourceGroup.add(pk);

    const heights = [2.2, 2.85, 1.95, 2.5, 2.35];
    const offs = [[-1.1, .25, -.9], [-.5, .45, -.35], [.55, .2, -.75], [.95, .35, .35], [-.35, .3, .85]];
    for (let i = 0; i < SOURCES.length; i++) {
      const M = newMaterials();
      const sg = new THREE.Group();
      sg.position.set(offs[i][0], 0, offs[i][2]);
      const h = heights[i];
      const slab = new THREE.Mesh(new RoundedBoxGeometry(.46, h, .17, 2, .03), M.glass);
      slab.position.y = .34 + h / 2;
      sg.add(slab);
      edges(slab, .3);
      const foot = new THREE.Mesh(new RoundedBoxGeometry(.62, .3, .32, 2, .03), M.black);
      foot.position.y = .49;
      sg.add(foot);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(.035, h - .35, .025), M.mint);
      strip.position.set(0, .42 + h / 2, .1);
      sg.add(strip);
      const cap = new THREE.Mesh(new THREE.OctahedronGeometry(.09, 0), M.mint);
      cap.position.y = .34 + h + .1;
      sg.add(cap);
      const halo = sprite(HALO, 0x19dfa0, .95, .42);
      halo.position.y = .34 + h + .1;
      sg.add(halo);
      const pick = new THREE.Mesh(new THREE.BoxGeometry(.8, h + .5, .7), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }));
      pick.position.y = .3 + h / 2;
      pick.userData.src = i;
      sg.add(pick);
      pickables.push(pick);
      sourceGroup.add(sg);
      sources.push({
        i: i, g: sg, M: M, halo: halo, strip: strip.material, cap: cap.material,
        accentMats: [
          { mat: M.glass, base: .5 },
          { mat: M.mint, base: 1.35 }
        ],
        glow: .55, target: .55,
        local: new THREE.Vector3(offs[i][0], .34 + h + .1, offs[i][2])
      });
    }
  }
  buildSources();

  /* ---------------- backdrop + floor ---------------- */
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(90, 46),
    new THREE.MeshPhysicalMaterial({ color: 0x030705, metalness: .72, roughness: .34, envMapIntensity: .85 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.02;
  scene.add(floor);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(110, 52),
    new THREE.ShaderMaterial({
      depthWrite: false,
      fog: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uTime;',
        'void main(){',
        '  vec2 p=vUv-.5;',
        '  float d=length(vec2(p.x*1.18,p.y*.92));',
        '  float glow=smoothstep(.56,0.02,d);',
        '  vec3 col=vec3(0.0011,0.0024,0.0020);',
        '  col+=vec3(0.0040,0.0128,0.0100)*glow*glow;',
        '  float halo=exp(-pow(length(p-vec2(-.29,.05))*3.6,2.0));',
        '  col+=vec3(0.0060,0.0215,0.0162)*halo;',
        '  float band=exp(-pow((p.y+.34)*11.0,2.0));',
        '  col+=vec3(0.0029,0.0108,0.0084)*band;',
        '  float vig=smoothstep(.80,.18,length(p*vec2(1.0,1.18)));',
        '  col*=vig;',
        '  gl_FragColor=vec4(col,1.0);',
        '}'
      ].join('\n')
    })
  );
  backdrop.position.set(-1.2, 10, -16);
  scene.add(backdrop);

  const dustCount = mode === 'mobile' ? 90 : 260;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - .5) * 42;
    dustPos[i * 3 + 1] = Math.random() * 11;
    dustPos[i * 3 + 2] = -6 + Math.random() * 18;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ color: 0x2fbf95, size: .035, map: GLOW, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true }));
  dust.frustumCulled = false;
  scene.add(dust);

  // vertical light shafts (distant architecture, very dim)
  [[-8.9, 0, .9], [0, 0, 0], [8.4, 0, -.9]].forEach(function (p, i) {
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(.5 + i * .16, 1.9 + i * .3, 10, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0x0d6b4f, transparent: true, opacity: i === 1 ? .011 : .007, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
    );
    shaft.position.set(p[0] * 1.06, 4.6, p[2] - 12);
    scene.add(shaft);
  });

  // broad ground glow that anchors the module row
  const groundGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 21),
    new THREE.MeshBasicMaterial({ map: HALO, color: 0x0b7a58, transparent: true, opacity: .27, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  groundGlow.rotation.x = -Math.PI / 2;
  groundGlow.position.set(-.4, .012, 1.2);
  scene.add(groundGlow);

  /* ---------------- network ---------------- */
  const stageLinks = [];
  let sourceLinks = [];
  let returnLink = null;
  let cycleLink = null;
  let linkParticles = [];

  function energyMat(a, b, speed) {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uActive: { value: .3 },
        uSpeed: { value: speed },
        uA: { value: new THREE.Color(a) },
        uB: { value: new THREE.Color(b) }
      },
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: [
        'varying vec2 vUv;',
        'uniform float uTime,uActive,uSpeed;',
        'uniform vec3 uA,uB;',
        'void main(){',
        '  float t=fract(vUv.x*1.65-uTime*uSpeed);',
        '  float band=smoothstep(0.0,0.1,t)*(1.0-smoothstep(0.1,0.46,t));',
        '  float a=(0.075+band*0.78)*(0.22+uActive*0.98);',
        '  vec3 col=mix(uA,uB,band);',
        '  gl_FragColor=vec4(col,a);',
        '}'
      ].join('\n'),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide
    });
  }

  function stageCurve(a, b) {
    const mid = a.clone().add(b).multiplyScalar(.5);
    mid.y += .95;
    mid.z += .55;
    const q1 = a.clone().lerp(mid, .5); q1.y += .25;
    const q2 = mid.clone().lerp(b, .5); q2.y += .2;
    return new THREE.CatmullRomCurve3([a.clone(), q1, mid, q2, b.clone()], false, 'catmullrom', .4);
  }

  function makeTube(curve, radius, a, b, speed, active) {
    const geo = new THREE.TubeGeometry(curve, 110, radius, 7, false);
    const mat = energyMat(a, b, speed);
    mat.uniforms.uActive.value = active == null ? .3 : active;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    netGroup.add(mesh);
    return { mesh: mesh, mat: mat };
  }

  function makeParticles(list, index, count, color, size) {
    const pos = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) seeds[i] = i / count;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: color, size: size, map: GLOW, transparent: true, opacity: .9, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    netGroup.add(pts);
    const entry = { pts: pts, geo: geo, mat: mat, pos: pos, seeds: seeds, curve: list.curve, speed: .12 + index * .012, glow: 1 };
    linkParticles.push(entry);
    return entry;
  }

  function purgeGroup(group) {
    group.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
        else o.material.dispose();
      }
    });
    while (group.children.length) group.remove(group.children[0]);
  }

  function worldAnchor(mod) {
    return mod.anchor.clone().add(mod.g.position);
  }

  function rebuildNetwork() {
    purgeGroup(netGroup);
    stageLinks.length = 0;
    sourceLinks = [];
    linkParticles = [];
    returnLink = null;
    cycleLink = null;

    for (let i = 0; i < 6; i++) {
      const a = worldAnchor(modules[i]);
      const b = worldAnchor(modules[i + 1]);
      const curve = stageCurve(a, b);
      const tube = makeTube(curve, .042, 0x0b8f6a, 0x9dffdd, .34, .32);
      const wide = makeTube(curve, .13, 0x07543f, 0x19dfa0, .28, .16);
      wing(wide.mesh, tube.mesh);
      const link = { from: i, to: i + 1, curve: curve, mat: tube.mat, glowMat: wide.mat, a: a, b: b };
      stageLinks.push(link);
      makeParticles(link, i, mode === 'mobile' ? 8 : 16, 0x7affcb, mode === 'mobile' ? .11 : .1);
    }

    const siteAnchor = worldAnchor(modules[0]);
    sources.forEach(function (src, i) {
      const from = src.local.clone().add(sourceGroup.position);
      const mid = from.clone().lerp(siteAnchor, .5);
      mid.y += .7 + i * .12;
      mid.z += .9;
      const curve = new THREE.CatmullRomCurve3([from, mid, siteAnchor.clone()], false, 'catmullrom', .4);
      const tube = makeTube(curve, .028, 0x0a7a58, 0x7affcb, .3, .25);
      const link = { src: i, curve: curve, mat: tube.mat, active: false };
      sourceLinks.push(link);
      makeParticles(link, i, 6, 0x19dfa0, .085);
    });

    const last = worldAnchor(modules[6]);
    const crm = worldAnchor(modules[3]);
    const rCurve = new THREE.CatmullRomCurve3([
      last.clone(),
      last.clone().add(new THREE.Vector3(2.4, 2.6, -4.6)),
      new THREE.Vector3(6, 6.4, -6.2),
      new THREE.Vector3(0, 6.6, -5.4),
      crm.clone().add(new THREE.Vector3(-2.6, 1.4, -3.6)),
      crm.clone()
    ], false, 'catmullrom', .45);
    const rTube = makeTube(rCurve, .03, 0x0a7a58, 0x7affcb, .22, .2);
    returnLink = { curve: rCurve, mat: rTube.mat };
    makeParticles(returnLink, 7, mode === 'mobile' ? 8 : 14, 0x2fbf95, .085);

    const srcA = sourceGroup.position.clone().add(new THREE.Vector3(-1.2, .28, 2.2));
    const cycleCurve = new THREE.CatmullRomCurve3([
      last.clone(),
      new THREE.Vector3(9.6, .3, 5.6),
      new THREE.Vector3(0, .26, 6.6),
      new THREE.Vector3(-8, .3, 5.4),
      srcA
    ], false, 'catmullrom', .45);
    const cTube = makeTube(cycleCurve, .026, 0x064d3a, 0x19dfa0, .16, .12);
    cycleLink = { curve: cycleCurve, mat: cTube.mat };
    makeParticles(cycleLink, 8, mode === 'mobile' ? 8 : 14, 0x19dfa0, .08);
  }

  function wing(a, b) {
    // keep both tubes visible: wide glow sits slightly lower
    a.renderOrder = 1;
    b.renderOrder = 2;
  }

  /* ---------------- layout ---------------- */
  const anchorsUpdated = [];

  function applyLayout(initial) {
    const L = LAYOUT[mode];
    sourceGroup.position.set(L.source.x, 0, L.source.z);
    modules.forEach(function (mod, i) {
      mod.g.position.set(L.pos[i].x, 0, L.pos[i].z);
      mod.baseScale = mode === 'mobile' ? .68 : .8;
      mod.g.scale.setScalar(mod.baseScale);
      mod.g.position.x = L.pos[i].x;
      mod.g.position.z = L.pos[i].z;
    });
    rebuildNetwork();
    if (!initial) fitCamera();
  }

  function fitCamera() {
    const L = LAYOUT[mode];
    const w = stageEl.clientWidth || 1, h = stageEl.clientHeight || 1;
    const aspect = w / h;
    const fov = aspect < .95 ? 46 : 40;
    camera.fov = fov;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    const vFov = THREE.MathUtils.degToRad(fov);
    const halfW = L.halfW;
    const halfH = 3.6;
    const dW = halfW / (Math.tan(vFov / 2) * aspect);
    const dH = halfH / Math.tan(vFov / 2);
    const dist = Math.max(dW, dH) * 1.015;
    lookY = mode === 'mobile' ? 2.25 : 2.2;
    camBase.set(L.center * .55, mode === 'mobile' ? 5.4 : 5.0, dist);
    look.set(L.center, lookY, 0);
    camera.position.copy(camBase);
    camera.lookAt(look);
  }

  /* ---------------- journey pulse ---------------- */
  const pulse = new THREE.Mesh(
    new THREE.SphereGeometry(.13, 18, 14),
    new THREE.MeshBasicMaterial({ color: 0xe6fff7 })
  );
  const pulseGlow = sprite(GLOW, 0x7affcb, 1.7, .95);
  pulse.add(pulseGlow);
  pulse.visible = false;
  scene.add(pulse);

  /* ---------------- state ---------------- */
  const state = {
    stage: 0,
    source: -1,
    playing: true,
    hover: -1,
    hoverSrc: -1,
    time: 0,
    reveal: RM ? 1 : 0,
    revealDone: RM,
    intensity: 1,
    journey: null,
    meter: 0,
    focusX: 0,
    pointerX: 0,
    pointerY: 0
  };

  /* ---------------- UI ---------------- */
  function fmtNum(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  function metricFor(i, srcIdx) {
    const s = STAGES[i];
    if (s.val) return s.val + ' ' + s.metric;
    let n = BASE;
    if (srcIdx >= 0) n *= SOURCES[srcIdx].share;
    for (let j = 0; j <= i; j++) {
      if (STAGES[j].conv != null) n *= STAGES[j].conv;
    }
    return fmtNum(Math.max(1, n)) + ' ' + s.metric + ' / ' + PERIOD;
  }

  function transitionFor(i) {
    if (i >= STAGES.length - 1) return 'Цикл замыкается · возврат в CRM';
    const next = STAGES[i + 1];
    const pct = next.conv != null ? Math.round(next.conv * 100) + '% перехода' : 'поток продолжается';
    return 'Дальше: ' + next.n + ' · ' + pct;
  }

  function refreshLive() {
    if (!liveEl) return;
    if (state.journey) {
      liveEl.textContent = (state.playing ? 'поток · ' : 'пауза · ') + STAGES[state.stage].n.toLowerCase();
    } else {
      liveEl.textContent = 'demo · ' + (state.source < 0 ? 'все источники' : SOURCES[state.source].n);
    }
  }

  function updateCopy(i) {
    if (!copyEl) return;
    const s = STAGES[i];
    copyEl.innerHTML =
      '<b>' + s.n + '</b>' +
      '<p>' + s.d + '</p>' +
      '<div class="jm-kpi"><b>' + metricFor(i, state.source) + '</b><span>демо-показатель</span></div>' +
      '<p class="jm-next">' + transitionFor(i) + '</p>' +
      '<em>Этап ' + (i + 1) + ' из ' + STAGES.length + ' · данные условные</em>';
  }

  function updateReadout() {
    if (!readout) return;
    readout.querySelector('b').textContent = String(state.stage + 1).padStart(2, '0');
    readout.querySelector('span').textContent = STAGES[state.stage].n;
    readout.classList.toggle('is-live', !!state.journey);
  }

  function selectStage(i, fromJourney) {
    if (i < 0 || i >= STAGES.length) return;
    state.stage = i;
    steps.forEach(function (b, idx) { b.setAttribute('aria-pressed', String(idx === i)); });
    updateCopy(i);
    updateReadout();
    if (!fromJourney) state.meter = 0;
    refreshLive();
    if (!RM) ensureLoop();
  }

  function setSource(i, opts) {
    state.source = i;
    srcBtns.forEach(function (b, idx) { b.setAttribute('aria-pressed', String(idx === i)); });
    updateCopy(state.stage);
    refreshLive();
    if (!opts || !opts.silent) {
      const src = i >= 0 ? sources[i] : null;
      if (src && !RM) travelFromSource(i);
    }
    if (!RM) ensureLoop();
  }

  steps.forEach(function (b) {
    b.addEventListener('click', function () { selectStage(+b.getAttribute('data-stage')); });
  });
  srcBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      const i = +b.getAttribute('data-src');
      setSource(state.source === i ? -1 : i);
    });
  });

  /* ---------------- pause / launch / reset ---------------- */
  function setPlaying(p) {
    state.playing = p;
    if (pauseBtn) {
      pauseBtn.setAttribute('aria-pressed', String(!p));
      const txt = pauseBtn.querySelector('.jm-pause-txt');
      if (txt) txt.textContent = p ? 'Пауза' : 'Запуск';
    }
    refreshLive();
    if (p) ensureLoop();
    else { stopLoop(); renderFrame(); }
  }

  function travelFromSource(i) {
    const link = sourceLinks[i];
    if (!link) return;
    state.journey = {
      steps: [{ curve: link.curve, stage: 0, dur: .85, hold: .1 }],
      index: 0, t: 0, hold: 0,
      fromSource: true, totalDone: 0
    };
    pulse.visible = true;
    refreshLive();
  }

  function buildJourneySteps() {
    const stepsArr = [];
    if (state.source >= 0 && sourceLinks[state.source]) {
      stepsArr.push({ curve: sourceLinks[state.source].curve, stage: 0, dur: .85, hold: .08 });
    }
    for (let i = 0; i < stageLinks.length; i++) {
      stepsArr.push({ curve: stageLinks[i].curve, stage: i + 1, dur: 1.15, hold: .16, link: i });
    }
    if (returnLink) stepsArr.push({ curve: returnLink.curve, stage: 6, dur: 1.2, hold: .1, loop: true });
    return stepsArr;
  }

  function launchJourney() {
    if (RM) {
      selectStage(6);
      state.journey = null;
      pulse.visible = false;
      state.meter = 1;
      if (meterBar) meterBar.style.width = '100%';
      renderFrame();
      return;
    }
    setPlaying(true);
    const stepsArr = buildJourneySteps();
    state.journey = { steps: stepsArr, index: 0, t: 0, hold: 0, totalDone: 0 };
    state.meter = 0;
    selectStage(0, true);
    pulse.visible = true;
    if (launchBtn) launchBtn.setAttribute('aria-pressed', 'true');
    refreshLive();
    ensureLoop();
  }

  function endJourney() {
    state.journey = null;
    pulse.visible = false;
    state.meter = 0;
    if (meterBar) meterBar.style.width = '0%';
    if (launchBtn) launchBtn.setAttribute('aria-pressed', 'false');
    refreshLive();
  }

  function resetJourney() {
    endJourney();
    if (sourceLinks.length && state.source >= 0) { /* keep source */ }
    setPlaying(true);
    selectStage(0);
    camFocus = 0;
    if (!RM) ensureLoop();
    else renderFrame();
  }

  if (launchBtn) launchBtn.addEventListener('click', launchJourney);
  if (pauseBtn) pauseBtn.addEventListener('click', function () { setPlaying(!state.playing); });
  if (resetBtn) resetBtn.addEventListener('click', resetJourney);

  /* ---------------- raycast + hover ---------------- */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let pointerDown = false;

  function hitTest(cx, cy) {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return null;
    ndc.x = ((cx - r.left) / r.width) * 2 - 1;
    ndc.y = -((cy - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(pickables, false);
    return hits.length ? hits[0].object : null;
  }

  function showTip(obj, cx, cy) {
    if (!tip) return;
    const r = stageEl.getBoundingClientRect();
    let title = '', text = '', extra = '';
    if (obj.userData.stage != null) {
      const s = STAGES[obj.userData.stage];
      title = s.n;
      text = s.d;
      extra = metricFor(obj.userData.stage, state.source);
    } else if (obj.userData.src != null) {
      const s = SOURCES[obj.userData.src];
      title = s.n;
      text = s.d;
      extra = Math.round(s.share * 100) + '% трафика · демо';
    } else return;
    tip.innerHTML = '<b>' + title + '</b><span>' + text + '</span><i>' + extra + '</i>';
    const x = Math.max(90, Math.min(r.width - 90, cx - r.left));
    const y = Math.max(70, Math.min(r.height - 20, cy - r.top));
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('show');
  }

  canvas.addEventListener('pointermove', function (ev) {
    if (ev.pointerType === 'touch') return;
    const obj = hitTest(ev.clientX, ev.clientY);
    state.hover = obj && obj.userData.stage != null ? obj.userData.stage : -1;
    state.hoverSrc = obj && obj.userData.src != null ? obj.userData.src : -1;
    canvas.style.cursor = obj ? 'pointer' : '';
    if (obj) showTip(obj, ev.clientX, ev.clientY);
    else if (tip) tip.classList.remove('show');
    if (!state.playing) { update(0); renderFrame(); }
  });
  canvas.addEventListener('pointerleave', function () {
    state.hover = -1;
    state.hoverSrc = -1;
    canvas.style.cursor = '';
    if (tip) tip.classList.remove('show');
  });
  canvas.addEventListener('click', function (ev) {
    const obj = hitTest(ev.clientX, ev.clientY);
    if (!obj) return;
    if (obj.userData.stage != null) selectStage(obj.userData.stage);
    else if (obj.userData.src != null) setSource(state.source === obj.userData.src ? -1 : obj.userData.src);
  });

  stageEl.addEventListener('pointermove', function (ev) {
    const r = stageEl.getBoundingClientRect();
    state.pointerX = ((ev.clientX - r.left) / r.width - .5) * 2;
    state.pointerY = ((ev.clientY - r.top) / r.height - .5) * 2;
  });
  stageEl.addEventListener('pointerleave', function () { state.pointerX = 0; state.pointerY = 0; });

  /* ---------------- camera ---------------- */
  let camFocus = 0;
  let lookY = 2.2;

  /* ---------------- render loop ---------------- */
  let raf = 0, last = 0, running = false, frames = 0, fpsTime = 0, degraded = false;
  const clockStart = performance.now();

  function ensureLoop() {
    if (RM) return;
    if (!running) { running = true; last = 0; raf = requestAnimationFrame(loop); }
  }
  function stopLoop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    const raw = last ? (now - last) / 1000 : .016;
    last = now;
    const dt = Math.min(.05, raw);
    if (!state.playing) return;
    state.time += dt;
    update(dt, raw);
    renderFrame();

    frames++;
    fpsTime += raw;
    if (fpsTime > 4) {
      const fps = frames / fpsTime;
      if (!degraded && fps < 26) {
        degraded = true;
        bloom.strength = .42;
        if (pr > 1.2) { pr = 1.2; renderer.setPixelRatio(pr); composer.setPixelRatio(pr); resize(); }
      }
      frames = 0; fpsTime = 0;
    }
  }

  function renderFrame() {
    composer.render();
  }

  function update(dt, raw) {
    const t = state.time;
    const rdt = raw || dt;
    if (!RM && !state.revealDone) {
      state.reveal = Math.min(1, state.reveal + rdt / 2.1);
      if (state.reveal >= 1) state.revealDone = true;
    }
    const revealEase = 1 - Math.pow(1 - state.reveal, 3);

    // scroll intensity
    if (frames % 6 === 0) {
      const r = stageEl.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
      const raw = Math.min(1, visible / Math.max(1, Math.min(r.height, vh)));
      state.intensity += (raw - state.intensity) * .08;
    }
    const vis = state.intensity;

    // backdrop + dust
    backdrop.material.uniforms.uTime.value = t;
    dust.rotation.y = Math.sin(t * .02) * .03;
    dust.position.y = Math.sin(t * .11) * .12;

    amb.intensity = .16 + .3 * vis;
    hemi.intensity = .25 + .38 * vis;
    key.intensity = .5 + .75 * vis;
    rim.intensity = .28 + .5 * vis;
    crmLight.intensity = (state.revealDone ? 16 : 6) + 12 * vis;
    warmLight.intensity = 4 + 5 * vis;
    fillLight.intensity = 2.5 + 4 * vis;
    bloom.strength = .3 + .34 * vis;

    // journey
    if (state.journey) updateJourney(dt);

    // modules
    const active = state.stage;
    for (let i = 0; i < modules.length; i++) {
      const mod = modules[i];
      let target = .28;
      if (i === active) target = 1;
      else if (Math.abs(i - active) === 1) target = .46;
      if (state.hover === i) target = Math.max(target, 1.15);
      if (state.journey && state.journey.currentStage === i) target = 1.2;
      mod.glow += (target - mod.glow) * Math.min(1, dt * 5);

      const appear = RM ? 1 : Math.min(1, Math.max(0, (state.reveal * 1.55 - i * .07)));
      const ap = 1 - Math.pow(1 - appear, 3);
      const sc = mod.baseScale * (.86 + .14 * ap) * (1 + (mod.glow - .3) * .012);
      mod.g.scale.setScalar(sc);
      mod.g.position.y = (1 - ap) * -.55;
      if (i === active) mod.g.position.y += Math.sin(t * .7) * .035;

      for (let a = 0; a < mod.accents.length; a++) {
        const it = mod.accents[a];
        it.mat.emissiveIntensity = it.base * (.22 + 1.5 * mod.glow);
      }
      for (let h = 0; h < mod.halos.length; h++) {
        const it = mod.halos[h];
        it.s.material.opacity = it.base * (.12 + 1.05 * mod.glow);
        const pulseS = 1 + Math.sin(t * .8 + i) * .03;
        it.s.scale.setScalar(it.s.userData.baseSize || (it.s.userData.baseSize = it.s.scale.x)) ;
        it.s.scale.multiplyScalar(pulseS);
      }
      for (let p = 0; p < mod.pools.length; p++) {
        mod.pools[p].s.material.opacity = mod.pools[p].base * (.25 + .9 * mod.glow);
      }
      for (let s = 0; s < mod.spin.length; s++) {
        const sp = mod.spin[s];
        sp.o.rotation.x += sp.sx * dt;
        sp.o.rotation.y += sp.sy * dt;
        sp.o.rotation.z += sp.sz * dt;
      }
      if (mod.slots && mod.slots.length) {
        for (let s = 0; s < mod.slots.length; s++) {
          const slot = mod.slots[s];
          slot.position.y += Math.sin(t * 1.2 + s * .9) * .0012;
        }
      }
      if (mod.pulses && mod.pulses.length) {
        for (let p = 0; p < mod.pulses.length; p++) {
          const o = mod.pulses[p];
          const k = 1 + Math.sin(t * 2.2 + p * 1.7) * (.06 + .08 * mod.glow);
          o.scale.setScalar(k);
        }
      }
    }

    // sources
    for (let i = 0; i < sources.length; i++) {
      const src = sources[i];
      let target = state.source < 0 ? .55 : (state.source === i ? 1.15 : .12);
      if (state.hoverSrc === i) target = 1.3;
      src.glow += (target - src.glow) * Math.min(1, dt * 6);
      src.halo.material.opacity = .18 + .55 * Math.min(1.4, src.glow);
      src.strip.emissiveIntensity = .6 + 1.7 * src.glow;
      src.cap.emissiveIntensity = .8 + 1.8 * src.glow;
      for (let a = 0; a < src.accentMats.length; a++) {
        const it = src.accentMats[a];
        it.mat.emissiveIntensity = it.base * (.3 + 1.2 * src.glow);
      }
      src.g.scale.setScalar(.94 + .06 * Math.min(1.3, src.glow));
    }

    // network activation
    for (let i = 0; i < stageLinks.length; i++) {
      const l = stageLinks[i];
      let a = .16;
      if (state.journey && state.journey.currentStage != null) a = .22;
      if (l.from === active || l.to === active) a = 1;
      else if (i < active) a = .42;
      l.mat.uniforms.uActive.value += (a - l.mat.uniforms.uActive.value) * Math.min(1, dt * 4);
      l.glowMat.uniforms.uActive.value = l.mat.uniforms.uActive.value * .55;
      l.mat.uniforms.uTime.value = t;
      l.glowMat.uniforms.uTime.value = t;
    }
    for (let i = 0; i < sourceLinks.length; i++) {
      const l = sourceLinks[i];
      const a = state.source < 0 ? .42 : (state.source === i ? 1 : .05);
      l.mat.uniforms.uActive.value += (a - l.mat.uniforms.uActive.value) * Math.min(1, dt * 5);
      l.mat.uniforms.uTime.value = t;
    }
    if (returnLink) { returnLink.mat.uniforms.uTime.value = t; }
    if (cycleLink) { cycleLink.mat.uniforms.uTime.value = t; }

    // particles
    for (let i = 0; i < linkParticles.length; i++) {
      const pg = linkParticles[i];
      const count = pg.seeds.length;
      const speed = pg.speed * (pg.curve === (stageLinks[active] && stageLinks[active].curve) ? 1.8 : 1);
      for (let p = 0; p < count; p++) {
        let tt = (pg.seeds[p] + t * speed) % 1;
        pg.curve.getPoint(tt, tmpVec);
        pg.pos[p * 3] = tmpVec.x;
        pg.pos[p * 3 + 1] = tmpVec.y;
        pg.pos[p * 3 + 2] = tmpVec.z;
      }
      pg.geo.attributes.position.needsUpdate = true;
    }

    // camera focus + parallax
    const focusTarget = (modules[active].g.position.x - LAYOUT[mode].center) * .12 + state.hoverSrc * 0;
    camFocus += (focusTarget - camFocus) * Math.min(1, dt * 2.2);
    const intro = RM ? 1 : Math.min(1, state.reveal / 1);
    const px = state.pointerX * .55;
    const py = state.pointerY * .26;
    camera.position.x = camBase.x + camFocus + px;
    camera.position.y = camBase.y + py + Math.sin(t * .18) * .12 + (1 - intro) * 1.4;
    camera.position.z = camBase.z + (1 - intro) * 4.5;
    look.x = LAYOUT[mode].center + camFocus * .55 + state.pointerX * .12;
    look.y = lookY + state.pointerY * .05;
    camera.lookAt(look);

    // HUD meter
    const m = state.journey ? state.journey.meter : state.meter;
    if (meterBar) meterBar.style.width = (m * 100).toFixed(1) + '%';

    // live readout pulse
    if (readout) readout.classList.toggle('is-live', !!state.journey);
  }

  function updateJourney(dt) {
    const J = state.journey;
    const stepsArr = J.steps;
    if (J.hold > 0) {
      J.hold -= dt;
      if (J.hold <= 0) {
        J.index++;
        J.totalDone++;
        J.t = 0;
        if (J.index >= stepsArr.length) { finishJourney(); return; }
      }
      // keep pulse parked at the start of the next step
      const step = stepsArr[Math.min(J.index, stepsArr.length - 1)];
      if (step) {
        step.curve.getPoint(0, pulse.position);
      }
      updateJourneyMeter();
      return;
    }
    const step = stepsArr[J.index];
    if (!step) { finishJourney(); return; }
    J.t += dt / step.dur;
    if (J.t >= 1) {
      J.t = 1;
      step.curve.getPoint(1, pulse.position);
      if (step.stage != null) {
        J.currentStage = step.stage;
        if (step.stage > 0) selectStage(step.stage, true);
      }
      if (step.loop) {
        J.hold = .8;
        J.t = 0;
        J.index = stepsArr.length; // end after hold
        updateJourneyMeter();
        return;
      }
      J.hold = step.hold == null ? .12 : step.hold;
      updateJourneyMeter();
      return;
    }
    step.curve.getPoint(J.t, pulse.position);
    if (step.link != null && J.currentStage == null) {
      // flag upcoming stage so the module starts warming while the pulse is in flight
      J.currentStage = step.stage - 1;
    }
    updateJourneyMeter();
  }

  function updateJourneyMeter() {
    const J = state.journey;
    if (!J) return;
    const total = J.steps.length;
    const done = Math.min(total, J.totalDone + (J.hold > 0 ? 0 : J.t));
    J.meter = Math.min(1, done / total);
    state.meter = J.meter;
  }

  function finishJourney() {
    const J = state.journey;
    if (!J) return;
    state.journey = null;
    pulse.visible = false;
    state.meter = 0;
    if (meterBar) meterBar.style.width = '0%';
    if (launchBtn) launchBtn.setAttribute('aria-pressed', 'false');
    if (J.steps.length && J.steps[J.steps.length - 1].stage === 6) selectStage(6, true);
    refreshLive();
  }

  /* ---------------- resize + lifecycle ---------------- */
  function resize() {
    const w = stageEl.clientWidth || 1, h = stageEl.clientHeight || 1;
    renderer.setPixelRatio(pr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(pr);
    composer.setSize(w, h);
    fitCamera();
    if (!running) renderFrame();
  }

  let resizeT = 0;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(function () {
      const nextMode = window.innerWidth <= 760 ? 'mobile' : 'desktop';
      const changed = nextMode !== mode;
      mode = nextMode;
      pr = Math.min(window.devicePixelRatio || 1, mode === 'mobile' ? 1.6 : 1.8);
      if (changed) applyLayout(false);
      resize();
    }, 160);
  }
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', onResize);

  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(function () { if (!running) resize(); });
    ro.observe(stageEl);
  }

  let visible = false;
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        visible = en.isIntersecting;
        if (visible && !document.hidden) { ensureLoop(); }
        else { stopLoop(); }
      });
    }, { rootMargin: '220px 0px', threshold: 0 });
    io.observe(stageEl);

    if (!RM) {
      const rio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting && en.intersectionRatio > .12) {
            state.reveal = Math.max(state.reveal, .001);
            rio.disconnect();
          }
        });
      }, { threshold: [0, .12, .4] });
      rio.observe(stageEl);
    }
  } else {
    visible = true;
    ensureLoop();
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stopLoop();
    else if (visible) ensureLoop();
  });

  let lost = false;
  canvas.addEventListener('webglcontextlost', function (ev) {
    ev.preventDefault();
    lost = true;
    stopLoop();
    stageEl.classList.remove('jm-ready');
    const fb = stageEl.querySelector('.jm-fallback');
    if (fb) fb.classList.add('on');
  });

  window.addEventListener('pagehide', function () {
    stopLoop();
    scene.traverse(function (o) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach(function (m) { m.dispose(); });
        else o.material.dispose();
      }
    });
    ENV.dispose(); GLOW.dispose(); HALO.dispose(); MARBLE.dispose();
    composer.dispose();
    renderer.dispose();
  });

  /* ---------------- start ---------------- */
  applyLayout(true);
  fitCamera();
  selectStage(0);
  setSource(-1, { silent: true });
  if (pauseBtn) { pauseBtn.setAttribute('aria-pressed', 'false'); }
  state.meter = 0;
  update(0);
  renderFrame();
  stageEl.classList.add('jm-ready');
  const fb = stageEl.querySelector('.jm-fallback');
  if (fb) fb.classList.remove('on');

  if (RM) {
    state.reveal = 1;
    state.revealDone = true;
    update(0);
    renderFrame();
  } else if (visible) {
    ensureLoop();
  }

  window.KINETIA_FLOW = {
    setStage: function (i) { selectStage(i); renderFrame(); },
    setSource: function (i) { setSource(i, { silent: true }); renderFrame(); },
    launch: launchJourney,
    pause: function (p) { setPlaying(!p); },
    tick: function (dt) { state.time += dt; update(dt, dt); renderFrame(); },
    state: state,
    modules: modules,
    renderer: renderer,
    scene: scene,
    camera: camera
  };
}

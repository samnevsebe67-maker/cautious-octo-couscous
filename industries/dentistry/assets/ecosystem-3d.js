/* ============================================================
   KINETIA · Dentistry growth ecosystem — procedural WebGL scene
   Real geometry only: boxes, cylinders, spheres, tori, lines,
   particles. No images, no libraries.
   Palette: #050807 / #087A58 / #19DFA0 / #7AFFCB
   ============================================================ */
(function (global) {
  'use strict';

  var M = {
    ident: function () { return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
    mul: function (a, b) {
      var o = new Float32Array(16);
      for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
          o[i * 4 + j] = a[0 * 4 + j] * b[i * 4 + 0] + a[1 * 4 + j] * b[i * 4 + 1] + a[2 * 4 + j] * b[i * 4 + 2] + a[3 * 4 + j] * b[i * 4 + 3];
        }
      }
      return o;
    },
    trans: function (x, y, z) { var o = M.ident(); o[12] = x; o[13] = y; o[14] = z; return o; },
    scale: function (x, y, z) { var o = M.ident(); o[0] = x; o[5] = y; o[10] = z; return o; },
    rx: function (a) { var o = M.ident(), c = Math.cos(a), s = Math.sin(a); o[5] = c; o[6] = s; o[9] = -s; o[10] = c; return o; },
    ry: function (a) { var o = M.ident(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[2] = -s; o[8] = s; o[10] = c; return o; },
    rz: function (a) { var o = M.ident(), c = Math.cos(a), s = Math.sin(a); o[0] = c; o[1] = s; o[4] = -s; o[5] = c; return o; },
    perspective: function (fov, asp, n, f) {
      var t = 1 / Math.tan(fov / 2), o = new Float32Array(16);
      o[0] = t / asp; o[5] = t; o[10] = (f + n) / (n - f); o[11] = -1; o[14] = 2 * f * n / (n - f);
      return o;
    },
    lookAt: function (e, c, u) {
      var zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2];
      var zl = Math.sqrt(zx * zx + zy * zy + zz * zz) || 1; zx /= zl; zy /= zl; zz /= zl;
      var xx = u[1] * zz - u[2] * zy, xy = u[2] * zx - u[0] * zz, xz = u[0] * zy - u[1] * zx;
      var xl = Math.sqrt(xx * xx + xy * xy + xz * xz) || 1; xx /= xl; xy /= xl; xz /= xl;
      var yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
      return new Float32Array([
        xx, yx, zx, 0,
        xy, yy, zy, 0,
        xz, yz, zz, 0,
        -(xx * e[0] + xy * e[1] + xz * e[2]),
        -(yx * e[0] + yy * e[1] + yz * e[2]),
        -(zx * e[0] + zy * e[1] + zz * e[2]), 1
      ]);
    }
  };

  /* ---------------- geometry ---------------- */
  function mesh(positions, normals, indices) {
    return { pos: new Float32Array(positions), nrm: new Float32Array(normals), idx: new Uint16Array(indices) };
  }

  function box(w, h, d) {
    var x = w / 2, y = h / 2, z = d / 2;
    var p = [
      -x, -y, z, x, -y, z, x, y, z, -x, y, z,
      x, -y, -z, -x, -y, -z, -x, y, -z, x, y, -z,
      -x, y, z, x, y, z, x, y, -z, -x, y, -z,
      -x, -y, -z, x, -y, -z, x, -y, z, -x, -y, z,
      x, -y, z, x, -y, -z, x, y, -z, x, y, z,
      -x, -y, -z, -x, -y, z, -x, y, z, -x, y, -z
    ];
    var n = [];
    for (var i = 0; i < 6; i++) {
      for (var k = 0; k < 4; k++) {
        n.push(i === 0 ? 0 : i === 1 ? 0 : i === 2 ? 0 : i === 3 ? 0 : i === 4 ? 1 : -1,
          i === 0 ? 0 : i === 1 ? 0 : i === 2 ? 1 : i === 3 ? -1 : 0, i === 0 ? 1 : i === 1 ? -1 : 0);
      }
    }
    var idx = [];
    for (var f = 0; f < 6; f++) {
      var b = f * 4;
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    }
    return mesh(p, n, idx);
  }

  function plane(size) {
    var s = size / 2;
    return mesh(
      [-s, 0, s, s, 0, s, s, 0, -s, -s, 0, -s],
      [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0],
      [0, 1, 2, 0, 2, 3]
    );
  }

  function cylinder(r, h, seg, rTop) {
    seg = seg || 20; rTop = rTop == null ? r : rTop;
    var p = [], n = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var a = (i / seg) * Math.PI * 2, cx = Math.cos(a), sz = Math.sin(a);
      p.push(r * cx, -h / 2, r * sz, rTop * cx, h / 2, rTop * sz);
      n.push(cx, 0, sz, cx, 0, sz);
    }
    for (var s = 0; s < seg; s++) {
      var b = s * 2;
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    /* caps */
    var base = p.length / 3;
    p.push(0, h / 2, 0); n.push(0, 1, 0);
    for (var c = 0; c <= seg; c++) {
      var aa = (c / seg) * Math.PI * 2;
      p.push(Math.cos(aa) * rTop, h / 2, Math.sin(aa) * rTop); n.push(0, 1, 0);
    }
    for (var q = 0; q < seg; q++) idx.push(base, base + 1 + q, base + 2 + q);
    var base2 = p.length / 3;
    p.push(0, -h / 2, 0); n.push(0, -1, 0);
    for (var c2 = 0; c2 <= seg; c2++) {
      var aa2 = (c2 / seg) * Math.PI * 2;
      p.push(Math.cos(aa2) * r, -h / 2, Math.sin(aa2) * r); n.push(0, -1, 0);
    }
    for (var q2 = 0; q2 < seg; q2++) idx.push(base2, base2 + 2 + q2, base2 + 1 + q2);
    return mesh(p, n, idx);
  }

  function sphere(r, seg) {
    seg = seg || 18;
    var p = [], n = [], idx = [];
    for (var y = 0; y <= seg; y++) {
      var v = y / seg, phi = v * Math.PI;
      for (var x = 0; x <= seg; x++) {
        var u = x / seg, th = u * Math.PI * 2;
        var nx = Math.sin(phi) * Math.cos(th), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(th);
        p.push(nx * r, ny * r, nz * r); n.push(nx, ny, nz);
      }
    }
    for (var yy = 0; yy < seg; yy++) {
      for (var xx = 0; xx < seg; xx++) {
        var a = yy * (seg + 1) + xx, b = a + seg + 1;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    return mesh(p, n, idx);
  }

  function torus(R, r, seg, ring) {
    seg = seg || 40; ring = ring || 12;
    var p = [], n = [], idx = [];
    for (var i = 0; i <= seg; i++) {
      var u = (i / seg) * Math.PI * 2, cu = Math.cos(u), su = Math.sin(u);
      for (var j = 0; j <= ring; j++) {
        var v = (j / ring) * Math.PI * 2, cv = Math.cos(v), sv = Math.sin(v);
        var nx = cu * cv, ny = sv, nz = su * cv;
        p.push((R + r * cv) * cu, r * sv, (R + r * cv) * su);
        n.push(nx, ny, nz);
      }
    }
    for (var a = 0; a < seg; a++) {
      for (var b = 0; b < ring; b++) {
        var i0 = a * (ring + 1) + b, i1 = i0 + ring + 1;
        idx.push(i0, i1, i0 + 1, i1, i1 + 1, i0 + 1);
      }
    }
    return mesh(p, n, idx);
  }

  function edges(m) {
    var seen = {}, out = [];
    for (var i = 0; i < m.idx.length; i += 3) {
      var tri = [m.idx[i], m.idx[i + 1], m.idx[i + 2]];
      for (var e = 0; e < 3; e++) {
        var a = tri[e], b = tri[(e + 1) % 3];
        var key = a < b ? a + '_' + b : b + '_' + a;
        if (seen[key]) continue;
        seen[key] = 1;
        out.push(m.pos[a * 3], m.pos[a * 3 + 1], m.pos[a * 3 + 2], m.pos[b * 3], m.pos[b * 3 + 1], m.pos[b * 3 + 2]);
      }
    }
    return new Float32Array(out);
  }

  /* ---------------- shaders ---------------- */
  var VS = [
    'attribute vec3 aPos;attribute vec3 aNrm;',
    'uniform mat4 uMVP;uniform mat4 uModel;',
    'varying vec3 vN;varying vec3 vW;',
    'void main(){vec4 w=uModel*vec4(aPos,1.0);vW=w.xyz;vN=mat3(uModel)*aNrm;gl_Position=uMVP*vec4(aPos,1.0);}'
  ].join('\n');

  var FS = [
    'precision mediump float;',
    'uniform vec3 uColor;uniform float uAlpha;uniform float uGlow;uniform float uFlat;',
    'varying vec3 vN;varying vec3 vW;',
    'void main(){',
    'if(uFlat>0.5){gl_FragColor=vec4(uColor,uAlpha);return;}',
    'vec3 n=normalize(vN);',
    'vec3 v=normalize(vec3(0.0,1.2,7.0)-vW);',
    'float diff=max(dot(n,normalize(vec3(0.45,0.9,0.6))),0.0);',
    'float back=max(dot(n,normalize(vec3(-0.4,-0.2,-0.6))),0.0);',
    'float rim=pow(1.0-max(dot(n,v),0.0),2.0);',
    'vec3 c=uColor*(0.20+diff*0.72)+uColor*rim*uGlow+vec3(0.02,0.09,0.07)*back;',
    'gl_FragColor=vec4(c,uAlpha);}'
  ].join('\n');

  var PVS = [
    'attribute vec3 aPos;attribute float aSize;attribute float aAlpha;',
    'uniform mat4 uVP;uniform float uDpr;',
    'varying float vA;',
    'void main(){vec4 p=uVP*vec4(aPos,1.0);gl_Position=p;gl_PointSize=max(1.2,aSize*uDpr*(6.0/max(1.0,p.w)));vA=aAlpha;}'
  ].join('\n');

  var PFS = [
    'precision mediump float;uniform vec3 uColor;varying float vA;',
    'void main(){vec2 c=gl_PointCoord-0.5;float d=length(c);if(d>0.5)discard;float a=smoothstep(0.5,0.0,d);gl_FragColor=vec4(uColor,a*vA);}'
  ].join('\n');

  function compile(gl, type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { gl.deleteShader(s); return null; }
    return s;
  }

  function program(gl, vs, fs) {
    var v = compile(gl, gl.VERTEX_SHADER, vs), f = compile(gl, gl.FRAGMENT_SHADER, fs);
    if (!v || !f) return null;
    var p = gl.createProgram();
    gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
    return p;
  }

  /* ---------------- scene definitions ---------------- */
  function buildScene(variant) {
    var compact = variant === 'hub';
    var S = [];
    function add(o) { o.phase = o.phase == null ? 0 : o.phase; o.spin = o.spin || 0; S.push(o); return o; }

    var E = '#19DFA0', E2 = '#087A58', MINT = '#7AFFCB', DARK = '#0C2A21', GLASS = '#0F6B4F';

    /* ground */
    add({ g: 'plane', pos: [0, -1.32, 0], scale: [11, 1, 11], color: '#08120E', alpha: .72, flat: 1, anchor: '', static: true });
    for (var r = 1; r < 5; r++) {
      add({ g: 'torus', pos: [0, -1.3, 0], rot: [Math.PI / 2, 0, 0], scale: [r * 0.72, 1, r * 0.72], color: E2, alpha: .16 - r * .018, flat: 1, wire: 0, anchor: '' });
    }

    /* --- central CRM core --- */
    add({ g: 'sphere', pos: [0, 0.25, 0], scale: [.62, .62, .62], color: E, alpha: .9, glow: 2.4, anchor: 'crm', key: 1 });
    add({ g: 'sphere', pos: [0, 0.25, 0], scale: [.44, .44, .44], color: MINT, alpha: .55, glow: 3.2, anchor: 'crm' });
    add({ g: 'sphere', pos: [0, 0.25, 0], scale: [1.02, 1.02, 1.02], color: E, alpha: .16, wire: 1, flat: 1, anchor: 'crm' });
    add({ g: 'torus', pos: [0, 0.25, 0], rot: [1.35, .2, .4], scale: [1.28, 1.28, 1.28], color: MINT, alpha: .5, glow: 2.2, anchor: 'crm', spin: .12 });
    add({ g: 'torus', pos: [0, 0.25, 0], rot: [.4, 1.1, -.5], scale: [1.5, 1.5, 1.5], color: E2, alpha: .34, anchor: 'crm', spin: -.08 });
    /* core data facets */
    for (var k = 0; k < 6; k++) {
      var aa = k / 6 * Math.PI * 2;
      add({
        g: 'box', pos: [Math.cos(aa) * .8, 0.25 + Math.sin(k) * .22, Math.sin(aa) * .8],
        rot: [0, -aa, 0], scale: [.13, .13, .13], color: MINT, alpha: .8, glow: 1.4, anchor: 'crm', spin: .5
      });
    }

    /* --- clinic module (architecture) --- */
    add({ g: 'box', pos: [-2.55, -1.12, .25], scale: [2.2, .12, 1.5], color: DARK, alpha: 1, anchor: 'clinic' });
    add({ g: 'box', pos: [-2.55, -.55, -.35], scale: [1.7, 1.05, .1], color: '#0E241D', alpha: .95, anchor: 'clinic' });
    add({ g: 'box', pos: [-2.55, -.5, -.34], scale: [1.58, .82, .04], color: E2, alpha: .5, glow: 1.4, anchor: 'clinic' });
    for (var c = 0; c < 4; c++) {
      add({ g: 'cylinder', pos: [-3.32 + c * .52, -.66, .42], scale: [.055, .85, .055], color: '#1B4D3D', alpha: 1, anchor: 'clinic' });
    }
    add({ g: 'box', pos: [-2.55, -.2, .42], scale: [1.75, .09, .32], color: E2, alpha: .9, anchor: 'clinic' });
    add({ g: 'box', pos: [-2.55, -.49, .42], scale: [1.55, .04, .2], color: MINT, alpha: .35, glow: 2, anchor: 'clinic' });
    add({ g: 'torus', pos: [-2.55, .35, -.34], rot: [0, 0, 0], scale: [.56, .56, .56], color: MINT, alpha: .42, glow: 2, anchor: 'clinic', spin: .18 });
    for (var w = 0; w < 3; w++) {
      add({ g: 'box', pos: [-3.1 + w * .56, -.38, -.28], scale: [.16, .28, .03], color: MINT, alpha: .55, glow: 1.6, anchor: 'clinic' });
    }

    /* --- booking module (stacked cards) --- */
    add({ g: 'box', pos: [2.38, -.92, .95], scale: [1.3, .05, .86], color: E2, alpha: .85, anchor: 'booking' });
    add({ g: 'box', pos: [2.38, -.75, 1.0], rot: [0, -.18, 0], scale: [1.14, .28, .76], color: '#0C231B', alpha: .95, anchor: 'booking' });
    add({ g: 'box', pos: [2.38, -.71, 1.0], rot: [0, -.18, 0], scale: [.86, .06, .04], color: MINT, alpha: .75, glow: 2, anchor: 'booking' });
    add({ g: 'box', pos: [2.38, -.62, 1.0], rot: [0, -.18, 0], scale: [.5, .04, .03], color: E, alpha: .7, glow: 1.6, anchor: 'booking' });
    add({ g: 'torus', pos: [2.38, -.28, 1.0], rot: [1.2, -.18, 0], scale: [.32, .32, .32], color: E, alpha: .6, glow: 2.4, anchor: 'booking', spin: .3 });
    add({ g: 'sphere', pos: [2.38, -.28, 1.0], scale: [.07, .07, .07], color: MINT, alpha: .95, glow: 2, anchor: 'booking' });

    /* --- communication module (orbiting nodes) --- */
    add({ g: 'cylinder', pos: [2.4, -.3, -1.62], scale: [.5, .04, .5], color: DARK, alpha: 1, anchor: 'comm' });
    add({ g: 'sphere', pos: [2.4, .12, -1.62], scale: [.22, .22, .22], color: E, alpha: .9, glow: 2.4, anchor: 'comm' });
    add({ g: 'torus', pos: [2.4, .12, -1.62], rot: [1.45, .2, .2], scale: [.62, .62, .62], color: MINT, alpha: .45, anchor: 'comm', spin: .22 });
    add({ g: 'torus', pos: [2.4, .12, -1.62], rot: [.5, .9, .4], scale: [.8, .8, .8], color: E2, alpha: .3, anchor: 'comm', spin: -.16 });
    for (var m = 0; m < 4; m++) {
      var ma = m / 4 * Math.PI * 2;
      add({ g: 'box', pos: [2.4 + Math.cos(ma) * .68, .12 + Math.sin(ma * 1.7) * .3, -1.62 + Math.sin(ma) * .68], scale: [.1, .1, .1], color: MINT, alpha: .85, glow: 1.5, anchor: 'comm', spin: .4 });
    }

    /* --- acquisition source structures (arc of pillars) --- */
    var src = [
      ['google', -60], ['maps', -38], ['seo', -16], ['meta', 6], ['social', 28], ['video', 50], ['referral', 72]
    ];
    src.forEach(function (s, i) {
      var ang = (s[1] * Math.PI) / 180;
      var rr = compact ? 3.1 : 3.55;
      var x = Math.sin(ang) * rr, z = -Math.cos(ang) * rr * .72 - .2;
      var hh = .5 + (i % 3) * .16;
      add({ g: 'cylinder', pos: [x, -1.05 + hh / 2, z], scale: [.05, hh, .05], color: '#1B4D3D', alpha: 1, anchor: 'ads' });
      add({ g: 'box', pos: [x, -1.05 + hh, z], rot: [0, -ang, 0], scale: [.3, .04, .3], color: E2, alpha: .9, anchor: 'ads' });
      add({ g: 'sphere', pos: [x, -0.98 + hh + .06, z], scale: [.05, .05, .05], color: MINT, alpha: .95, glow: 2.4, anchor: 'ads' });
    });

    /* --- retention loop --- */
    add({ g: 'torus', pos: [.2, .62, -1.9], rot: [1.15, .35, .1], scale: [2.15, 2.15, 2.15], color: E, alpha: .38, glow: 1.6, anchor: 'retention', spin: .05 });
    add({ g: 'torus', pos: [.2, .62, -1.9], rot: [1.15, .35, .1], scale: [2.32, 2.32, 2.32], color: E2, alpha: .2, anchor: 'retention', spin: -.03 });

    /* --- journey path ring/platform --- */
    add({ g: 'torus', pos: [0, -1.26, 0], rot: [Math.PI / 2, 0, 0], scale: [2.9, 2.9, 2.9], color: E2, alpha: .35, flat: 1, anchor: 'journey' });

    return S;
  }

  function curves() {
    /* [start, cp1, cp2, end] */
    return [
      { a: 'ads', pts: [[-2.2, -.7, -1.9], [-1.4, .05, -1.2], [-.55, .22, -.5], [0, .25, 0]] },
      { a: 'ads', pts: [[1.9, -.7, -1.6], [1.5, .0, -1.1], [.7, .25, -.5], [.1, .25, 0]] },
      { a: 'clinic', pts: [[-1.65, -.5, .1], [-1.25, -.05, .1], [-.55, .22, .05], [0, .25, 0]] },
      { a: 'booking', pts: [[1.7, -.62, .8], [1.25, -.18, .55], [.6, .18, .3], [.05, .25, 0]] },
      { a: 'comm', pts: [[1.9, .05, -1.25], [1.35, .18, -.85], [.6, .3, -.4], [0, .25, 0]] },
      { a: 'retention', pts: [[.2, .6, -1.9], [-.4, .7, -1.3], [-.6, .45, -.5], [0, .25, 0]] },
      { a: 'journey', pts: [[-2.55, -1.1, .5], [-1.4, -1.05, 1.6], [1.4, -1.05, 1.6], [2.38, -.86, 1.0]] }
    ];
  }

  function sampleCurve(pts, t) {
    var p0 = pts[0], p1 = pts[1], p2 = pts[2], p3 = pts[3];
    var u = 1 - t;
    var x = u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0];
    var y = u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1];
    var z = u * u * u * p0[2] + 3 * u * u * t * p1[2] + 3 * u * t * t * p2[2] + t * t * t * p3[2];
    return [x, y, z];
  }

  /* ---------------- renderer ---------------- */
  function create(canvas, opts) {
    opts = opts || {};
    var variant = opts.variant || 'hero';
    var reduced = false;
    try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    var gl = null;
    try {
      gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });
      if (!gl) gl = canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
    } catch (e) { gl = null; }
    if (!gl) return null;

    var prog = program(gl, VS, FS);
    var pprog = program(gl, PVS, PFS);
    if (!prog) return null;

    var U = {};
    ['uMVP', 'uModel', 'uColor', 'uAlpha', 'uGlow', 'uFlat'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
    var PU = {};
    ['uVP', 'uDpr', 'uColor'].forEach(function (n) { PU[n] = gl.getUniformLocation(pprog, n); });
    var aPos = gl.getAttribLocation(prog, 'aPos'), aNrm = gl.getAttribLocation(prog, 'aNrm');
    var pPos = gl.getAttribLocation(pprog, 'aPos'), pSize = gl.getAttribLocation(pprog, 'aSize'), pAlpha = gl.getAttribLocation(pprog, 'aAlpha');

    var geo = {
      box: box(1, 1, 1),
      plane: plane(1),
      cylinder: cylinder(1, 1, 18),
      sphere: sphere(1, 18),
      torus: torus(1, .055, 42, 10)
    };
    var buffers = {};
    Object.keys(geo).forEach(function (name) {
      var m = geo[name];
      var p = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, p); gl.bufferData(gl.ARRAY_BUFFER, m.pos, gl.STATIC_DRAW);
      var n = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, n); gl.bufferData(gl.ARRAY_BUFFER, m.nrm, gl.STATIC_DRAW);
      var i = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, i); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, m.idx, gl.STATIC_DRAW);
      var e = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, e); gl.bufferData(gl.ARRAY_BUFFER, edges(m), gl.STATIC_DRAW);
      buffers[name] = { p: p, n: n, i: i, e: e, count: m.idx.length, ecount: edges(m).length / 3 };
    });

    var objects = buildScene(variant);
    var paths = curves();
    var anchors = [
      { id: 'crm', label: 'CRM core', x: 0, y: .25, z: 0 },
      { id: 'clinic', label: 'Clinic platform', x: -2.55, y: -.15, z: .2 },
      { id: 'ads', label: 'Acquisition', x: -1.6, y: .1, z: -2.4 },
      { id: 'booking', label: 'Booking', x: 2.38, y: .05, z: 1.0 },
      { id: 'comm', label: 'Communication', x: 2.4, y: .55, z: -1.62 },
      { id: 'retention', label: 'Retention loop', x: 1.4, y: 1.2, z: -1.8 },
      { id: 'journey', label: 'Patient journey', x: 0, y: -1.15, z: 1.5 }
    ];
    if (variant === 'hub') anchors = anchors.filter(function (a) { return a.id === 'crm' || a.id === 'booking' || a.id === 'retention' || a.id === 'ads'; });

    /* particles */
    var PCOUNT = variant === 'hub' ? 46 : 96;
    var particles = [];
    for (var i = 0; i < PCOUNT; i++) {
      particles.push({
        path: paths[i % paths.length],
        t: Math.random(),
        sp: .045 + Math.random() * .075,
        size: .9 + Math.random() * 1.7,
        alpha: .4 + Math.random() * .6,
        off: Math.random() * 2 - 1
      });
    }
    var pArr = new Float32Array(PCOUNT * 3), sArr = new Float32Array(PCOUNT), aArr = new Float32Array(PCOUNT);
    var pBuf = gl.createBuffer(), sBuf = gl.createBuffer(), aBuf = gl.createBuffer();

    var state = {
      w: 1, h: 1, dpr: 1, t0: performance.now(),
      yaw: .48, pitch: .18, dist: variant === 'hub' ? 10.2 : 9.2,
      target: [0, 0, 0], targetGoal: [0, 0, 0],
      zoom: 1, hover: null, focus: null, active: null,
      progress: 0, running: true, destroyed: false
    };

    function resize() {
      var r = canvas.getBoundingClientRect();
      var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      state.w = w; state.h = h; state.dpr = dpr;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resize();

    var ro = null;
    if ('ResizeObserver' in window) { ro = new ResizeObserver(resize); ro.observe(canvas); }
    else window.addEventListener('resize', resize);

    var pointer = { x: 0, y: 0, nx: 0, ny: 0 };
    function onMove(e) {
      var r = canvas.getBoundingClientRect();
      var px = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      var py = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
      pointer.x = px; pointer.y = py;
      pointer.nx = px / r.width * 2 - 1; pointer.ny = py / r.height * 2 - 1;
      var best = null, bd = 46;
      anchors.forEach(function (a) {
        var p = project(a);
        if (!p || p[2] < 0) return;
        var d = Math.sqrt(Math.pow(p[0] - px, 2) + Math.pow(p[1] - py, 2));
        if (d < bd) { bd = d; best = a.id; }
      });
      state.hover = best;
      canvas.style.cursor = best ? 'pointer' : 'default';
    }
    function onLeave() { state.hover = null; pointer.nx = 0; pointer.ny = 0; }
    function onClick() {
      if (state.hover) {
        state.focus = state.focus === state.hover ? null : state.hover;
        var a = anchors.filter(function (x) { return x.id === state.focus; })[0];
        state.targetGoal = a ? [a.x * .55, a.y * .55, a.z * .35] : [0, 0, 0];
        state.active = state.focus;
      } else {
        state.focus = null; state.active = null; state.targetGoal = [0, 0, 0];
      }
      if (opts.onFocus) opts.onFocus(state.focus);
    }
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    canvas.addEventListener('click', onClick);
    canvas.addEventListener('touchmove', onMove, { passive: true });

    var lastProject = {};
    function project(a) {
      return lastProject[a.id] || null;
    }

    function frame(now) {
      if (state.destroyed) return;
      var dt = Math.min(.05, (now - state.t0) / 1000);
      state.t0 = now;
      var t = now / 1000;

      resize();

      if (!reduced) {
        state.yaw += dt * .055;
      }
      var yaw = state.yaw + pointer.nx * .22;
      var pitch = state.pitch - pointer.ny * .14 + Math.sin(t * .16) * .02;
      var dist = state.dist * state.zoom;
      var eye = [
        Math.sin(yaw) * Math.cos(pitch) * dist,
        Math.sin(pitch) * dist + 1.1,
        Math.cos(yaw) * Math.cos(pitch) * dist
      ];
      state.target[0] += (state.targetGoal[0] - state.target[0]) * .06;
      state.target[1] += (state.targetGoal[1] - state.target[1]) * .06;
      state.target[2] += (state.targetGoal[2] - state.target[2]) * .06;
      state.zoom += ((state.focus ? .84 : 1) - state.zoom) * .05;

      var view = M.lookAt(eye, state.target, [0, 1, 0]);
      var proj = M.perspective(38 * Math.PI / 180, state.w / state.h, .1, 60);
      var vp = M.mul(proj, view);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      /* project anchors for labels */
      anchors.forEach(function (a) {
        var mvp = M.mul(vp, M.trans(a.x, a.y, a.z));
        var x = mvp[12], y = mvp[13], z = mvp[14], w = mvp[15] || 1;
        var nx = x / w, ny = y / w;
        lastProject[a.id] = {
          id: a.id, label: a.label,
          x: (nx * .5 + .5) * state.w, y: (-ny * .5 + .5) * state.h, z: w,
          visible: w > .1 && Math.abs(nx) < 1.25 && Math.abs(ny) < 1.3
        };
      });

      gl.useProgram(prog);
      var scrollTilt = state.progress * .35;
      objects.forEach(function (o, idx) {
        var local = [o.pos[0], o.pos[1], o.pos[2]];
        var rot = o.rot || [0, 0, 0];
        var sc = o.scale || [1, 1, 1];
        var delay = (idx / objects.length) * 1.2;
        var act = reduced ? 1 : Math.min(1, Math.max(0, (t - .25 - delay) / .9));
        var ease = 1 - Math.pow(1 - act, 3);
        var s = (o.g === 'plane' ? 1 : .55 + .45 * ease);
        var model = M.mul(M.trans(local[0], local[1], local[2]), M.mul(M.ry(rot[1] + (o.spin ? t * o.spin * .4 : 0) + scrollTilt * .15), M.mul(M.rx(rot[0]), M.mul(M.rz(rot[2]), M.scale(sc[0] * s, sc[1] * s, sc[2] * s)))));
        var mvp = M.mul(vp, model);
        gl.uniformMatrix4fv(U.uMVP, false, mvp);
        gl.uniformMatrix4fv(U.uModel, false, model);
        var col = hex(o.color);
        var boost = 0;
        if (state.active && o.anchor === state.active) boost = .5;
        if (state.hover && o.anchor === state.hover) boost = Math.max(boost, .3);
        gl.uniform3f(U.uColor, Math.min(1, col[0] + boost * .25), Math.min(1, col[1] + boost * .2), Math.min(1, col[2] + boost * .15));
        gl.uniform1f(U.uAlpha, (o.alpha == null ? 1 : o.alpha) * (o.g === 'plane' ? 1 : ease) * (o.static ? 1 : 1));
        gl.uniform1f(U.uGlow, o.glow || .8);
        gl.uniform1f(U.uFlat, o.flat ? 1 : 0);

        var b = buffers[o.g];
        gl.bindBuffer(gl.ARRAY_BUFFER, b.p);
        gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, b.n);
        gl.enableVertexAttribArray(aNrm); gl.vertexAttribPointer(aNrm, 3, gl.FLOAT, false, 0, 0);
        if (o.wire) {
          gl.bindBuffer(gl.ARRAY_BUFFER, b.e);
          gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
          gl.drawArrays(gl.LINES, 0, b.ecount);
        } else {
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.i);
          gl.drawElements(gl.TRIANGLES, b.count, gl.UNSIGNED_SHORT, 0);
        }
      });

      /* pathways */
      gl.uniform1f(U.uFlat, 1);
      paths.forEach(function (path, pi) {
        var arr = [];
        for (var i = 0; i <= 44; i++) {
          var p = sampleCurve(path.pts, i / 44);
          arr.push(p[0], p[1], p[2]);
        }
        var buf = path._buf;
        if (!buf) { buf = gl.createBuffer(); path._buf = buf; }
        gl.bindBuffer(gl.ARRAY_BUFFER, buf);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(arr), gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(aPos); gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
        var mvp = vp;
        gl.uniformMatrix4fv(U.uMVP, false, mvp);
        gl.uniformMatrix4fv(U.uModel, false, M.ident());
        var active = state.active && (path.a === state.active || state.active === 'journey');
        gl.uniform3f(U.uColor, active ? .48 : .1, active ? 1 : .62, active ? .8 : .42);
        gl.uniform1f(U.uAlpha, active ? .85 : .38);
        gl.drawArrays(gl.LINE_STRIP, 0, 45);
      });

      /* particles */
      if (pprog) {
        var k = 0;
        particles.forEach(function (p, pi) {
          if (!reduced) p.t += dt * p.sp;
          if (p.t > 1) p.t -= 1;
          var pt = sampleCurve(p.path.pts, p.t);
          pArr[pi * 3] = pt[0] + p.off * .02;
          pArr[pi * 3 + 1] = pt[1] + p.off * .03;
          pArr[pi * 3 + 2] = pt[2];
          sArr[pi] = p.size * (state.active && p.path.a === state.active ? 1.8 : 1);
          aArr[pi] = p.alpha * (state.active && p.path.a !== state.active ? .45 : 1);
          k++;
        });
        gl.useProgram(pprog);
        gl.uniformMatrix4fv(PU.uVP, false, vp);
        gl.uniform1f(PU.uDpr, state.dpr);
        gl.uniform3f(PU.uColor, .48, 1, .8);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        gl.depthMask(false);
        gl.bindBuffer(gl.ARRAY_BUFFER, pBuf); gl.bufferData(gl.ARRAY_BUFFER, pArr, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(pPos); gl.vertexAttribPointer(pPos, 3, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, sBuf); gl.bufferData(gl.ARRAY_BUFFER, sArr, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(pSize); gl.vertexAttribPointer(pSize, 1, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, aBuf); gl.bufferData(gl.ARRAY_BUFFER, aArr, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(pAlpha); gl.vertexAttribPointer(pAlpha, 1, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.POINTS, 0, PCOUNT);
        gl.depthMask(true);
      }

      if (opts.onFrame) opts.onFrame(lastProject);

      if (state.running) requestAnimationFrame(frame);
    }

    function hex(h) {
      h = h.replace('#', '');
      return [parseInt(h.slice(0, 2), 16) / 255, parseInt(h.slice(2, 4), 16) / 255, parseInt(h.slice(4, 6), 16) / 255];
    }

    /* intersection observer pause */
    var io = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting && !state.running) { state.running = true; state.t0 = performance.now(); requestAnimationFrame(frame); }
          else if (!e.isIntersecting) state.running = false;
        });
      }, { rootMargin: '120px' });
      io.observe(canvas);
    }

    /* scroll progress relative to viewport */
    function onScroll() {
      var r = canvas.getBoundingClientRect();
      var p = 1 - Math.min(1, Math.max(0, (r.top + r.height * .5) / (window.innerHeight + r.height)));
      state.progress = p;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    requestAnimationFrame(frame);

    return {
      anchors: anchors,
      focus: function (id) {
        state.focus = state.focus === id ? null : id;
        state.active = state.focus;
        var a = anchors.filter(function (x) { return x.id === state.focus; })[0];
        state.targetGoal = a ? [a.x * .55, a.y * .55, a.z * .35] : [0, 0, 0];
      },
      setFocus: function (id) {
        state.focus = id || null;
        state.active = state.focus;
        var a = anchors.filter(function (x) { return x.id === state.focus; })[0];
        state.targetGoal = a ? [a.x * .55, a.y * .55, a.z * .35] : [0, 0, 0];
      },
      getFocus: function () { return state.focus; },
      destroy: function () {
        state.destroyed = true;
        if (ro) ro.disconnect();
        if (io) io.disconnect();
        window.removeEventListener('scroll', onScroll);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
        canvas.removeEventListener('click', onClick);
      }
    };
  }

  global.DentalScene = { create: create };
})(window);

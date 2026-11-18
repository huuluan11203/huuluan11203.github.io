/* =========================================================
   Aurora — tấm sáng óng ánh kiểu Stitch (WebGL shader)
   Hình ảnh: tấm sáng mịn, mép trên hồng-tím → tím → xanh dương →
   xanh ngọc → tím đậm; nếp gấp tối; lớp mờ phía sau tạo chiều sâu.

   Chuyển động như KHÓI: toàn bộ tấm sáng bị cuốn theo một trường xoáy
   (domain warping 2 tầng) trôi chậm lên trên & sang phải → cuộn, phình,
   mép tan thành sợi, mật độ chỗ đặc chỗ loãng.
   Khung hình dạng lớn (dựng theo video quay màn hình Stitch):
   - "Khung" hình dạng do JS điều khiển ngẫu nhiên mượt: độ sâu chỗ
     trũng (gần phẳng ↔ chữ V sâu), vị trí chỗ trũng (trái/giữa/phải),
     độ nghiêng (chéo trái/phải), độ cao → lần lượt thành V, U, đường
     chéo, dải nằm thấp… như video
   - Chi tiết nhỏ (gợn, nếp gấp) trôi từ TRÁI sang PHẢI
   - Chu kỳ tắt–sáng: tắt dần → tối ~1s → hiện lại với HÌNH DẠNG MỚI,
     lúc đầu là dải tím đơn giản rồi mới thêm nếp gấp & màu
   Vẽ ở nửa độ phân giải (ánh sáng vốn mềm) → nhẹ.
   ========================================================= */
(function () {
  const canvas = document.getElementById("auroraBg");
  if (!canvas) return;

  // ---------------- Tuỳ chỉnh ----------------
  const CFG = {
    level: 0.55, // độ cao trung bình của dải (0 = trên, 1 = dưới màn hình)
    depthMin: 0.04, // chỗ trũng nông nhất (gần như dải phẳng)
    depthMax: 0.5, // chỗ trũng sâu nhất (chữ V sâu, hai cánh lên tới góc trên)
    tiltMax: 0.32, // độ nghiêng tối đa (dải chạy chéo)
    shapeTime: 8, // số giây trung bình để hình dạng lớn đổi hẳn (nhỏ = đổi nhanh)
    ripple: 0.2, // độ gợn của mép (chi tiết nhỏ trôi trái → phải)
    flow: 0.08, // tốc độ chi tiết nhỏ trôi sang phải
    thickness: 0.3, // độ dày trung bình của tấm sáng
    morph: 1, // tốc độ biến hình / gấp nếp
    smoke: 0.5, // độ cuộn xoáy như khói (0 = tắt, 0.2 = cuộn rất mạnh)
    smokeDensity: 0.6, // mật độ khói không đều: chỗ đặc chỗ loãng (0 = đều)
    smokeSpeed: 0.5, // tốc độ khói trôi & cuộn
    cycle: 0, // mỗi bao nhiêu giây thì tắt rồi hiện lại với hình mới (0 = không bao giờ tắt)
    fadeOut: 1.2, // thời gian tắt dần (giây)
    dark: 0.9, // thời gian tối hẳn (giây)
    fadeIn: 1.8, // thời gian hiện lại (giây)
    speed: 0.5, // tốc độ chung (2 = nhanh gấp đôi)
    intensity: 1, // độ sáng tổng
    scrollDim: 0.8, // giảm sáng khi cuộn khỏi hero (0 = không giảm)
    resolution: 0.8, // tỉ lệ độ phân giải vẽ
  };
  // -------------------------------------------

  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) {
    canvas.classList.add("aurora-fallback");
    return;
  }

  const vert = `
    attribute vec2 p;
    void main() { gl_Position = vec4(p, 0.0, 1.0); }
  `;

  const frag = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif
    uniform vec2 uRes;
    uniform float uTime;
    uniform float uTop;      // y of the arms' top
    uniform float uDepth;    // how deep the dip is
    uniform float uDip;      // x of the dip
    uniform float uTilt;     // diagonal tilt
    uniform float uRound;    // roundness of the dip bottom (small = V, large = U)
    uniform float uRipple;
    uniform float uFlow;
    uniform float uThick;
    uniform float uMorph;
    uniform float uDetail;   // 0 = plain violet band, 1 = full folds & colours
    uniform float uSeed;
    uniform float uIntensity;
    uniform float uSmoke;
    uniform float uSmokeDensity;
    uniform float uSmokeSpeed;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                 mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
      return v;
    }

    // smooth low-detail noise for the smoke field (big soft curls, no crinkles)
    float fbm2(vec2 p) { return 0.65 * noise(p) + 0.35 * noise(p * 2.03 + 3.1); }

    // Stitch palette
    const vec3 PINK   = vec3(0.86, 0.45, 1.00);
    const vec3 VIOLET = vec3(0.60, 0.48, 1.00);
    const vec3 BLUE   = vec3(0.42, 0.62, 1.00);
    const vec3 TEAL   = vec3(0.32, 0.95, 0.88);
    const vec3 DEEP   = vec3(0.50, 0.40, 0.95);

    // iridescent bands, indexed by depth inside the sheet (0 = top edge)
    vec3 palette(float h, float detail, float streak) {
      vec3 c = mix(PINK, VIOLET, smoothstep(0.02, 0.12, h));
      c = mix(c, BLUE, smoothstep(0.14, 0.34, h));
      c = mix(c, TEAL, smoothstep(0.36, 0.55, h) * (1.0 - smoothstep(0.62, 0.85, h)) * detail * streak);
      c = mix(c, DEEP, smoothstep(0.75, 1.0, h));
      // while a new aurora is still forming it is a plain violet band
      return mix(mix(VIOLET, DEEP, h), c, detail);
    }

    // One sheet of light. y: 0 = top, 1 = bottom.
    vec3 sheet(float x, float y, float aspect, float t, float s,
               float top, float depth, float dip, float tilt, float thick, float rimK) {
      vec2 p = vec2(x * aspect, y);
      float m = t * uMorph;
      float det = uDetail;

      // domain warp → organic folding / morphing
      vec2 q = vec2(
        fbm(p * 0.9 + vec2(-m * 0.16, m * 0.05) + s),
        fbm(p * 0.9 + vec2(5.2 - m * 0.13, 1.3 + m * 0.07) + s)
      );

      // big shape: a dip (V / U / flat) at x = dip, plus a tilt
      // straight arms + rounded bottom (hyperbola) → no kinks; uRound: V ↔ U
      float dx = x - dip;
      float valley = 1.0 - (sqrt(dx * dx + uRound * uRound) - uRound) / 0.55;
      float edge = top + depth * valley + tilt * (x - 0.5)
        // small details travelling LEFT -> RIGHT
        + uRipple * (fbm(vec2(x * 1.1 - t * uFlow, s)) - 0.5) * 2.0
        + 0.025 * sin(x * 4.0 - t * 0.6 + s)
        + 0.14 * (q.x - 0.5) * det;

      float d = y - edge;                                    // > 0 inside the sheet

      // thickness swings between a thin ribbon and a wide sheet
      float th = thick * (0.35 + 1.4 * fbm(vec2(x * 1.1 - t * uFlow * 1.4, s + 3.0) + q * 0.6));

      float topEdge = smoothstep(-0.05, 0.05, d);            // soft, smoky upper edge
      float bottom = 1.0 - smoothstep(th * 0.55, th * 1.35, d);
      float body = topEdge * bottom;

      // folds: darker creases that open and close inside the sheet
      float crease = fbm(vec2(x * 1.7 - t * uFlow * 2.0, d * 3.2) + q * 1.6 + s * 0.3);
      body *= mix(1.0, mix(0.62, 1.05, smoothstep(0.3, 0.62, crease)), det);

      // brighter toward the upper part
      body *= 0.75 + 0.45 * exp(-max(d, 0.0) / (th * 0.6));

      // iridescent colour bands following the edge, drifting with the warp
      float h = clamp(d / max(th, 0.02), 0.0, 1.2) + (q.y - 0.5) * 0.3 * det;
      // teal appears as broken streaks drifting along the band (front sheet only)
      float streak = smoothstep(0.42, 0.68, fbm(vec2(x * 1.3 - t * uFlow * 2.5, d * 7.0) + q * 1.2 + s)) * rimK;
      vec3 col = palette(clamp(h, 0.0, 1.0), det, streak);

      // thin bright pink-violet line right on the top edge
      float rim = exp(-abs(d - 0.004) / 0.024);
      col = mix(col, PINK * 1.15, rim * 0.45 * rimK * det);

      return col * body;
    }

    void main() {
      vec2 uv = gl_FragCoord.xy / uRes;
      float x = uv.x;
      float y = 1.0 - uv.y;
      float aspect = uRes.x / uRes.y;
      float t = uTime;

      // --- SMOKE FIELD: two-level domain warp (noise fed into noise) that
      //     slowly rises and drifts right. Everything is displaced through it,
      //     so the sheet billows, curls and frays into wisps like smoke.
      vec2 sp = vec2(x * aspect, y) * 0.85;
      float st = t * uSmokeSpeed;
      vec2 sq = vec2(
        fbm2(sp + vec2(-st * 0.10, st * 0.16) + uSeed),
        fbm2(sp + vec2(5.2 - st * 0.08, 1.3 + st * 0.12) + uSeed)
      );
      vec2 sr = vec2(
        fbm2(sp + 2.6 * sq + vec2(1.7 - st * 0.07, 9.2 + st * 0.15)),
        fbm2(sp + 2.6 * sq + vec2(8.3 - st * 0.06, 2.8 + st * 0.13))
      );
      vec2 w = (sr - 0.5) * 2.0 * uSmoke;
      float xw = x + w.x / aspect;
      float yw = y + w.y;

      // dimmer sheet behind (depth), then the main sheet in front — both carried by the smoke
      vec3 back = sheet(xw, yw, aspect, t * 0.75, uSeed + 23.0,
                        uTop + 0.12, uDepth * 0.8, 1.0 - uDip, -uTilt * 0.6, uThick * 1.3, 0.0);
      vec3 front = sheet(xw, yw, aspect, t, uSeed,
                         uTop, uDepth, uDip, uTilt, uThick, 1.0);
      vec3 c = (back * 0.14 + front) * uIntensity;

      // uneven smoke density: thick clumps and thin gaps that drift and morph
      float dens = 0.3 + 1.1 * fbm2(sp * 1.4 + sr * 2.2 + vec2(-st * 0.1, st * 0.12));
      c *= mix(1.0, dens, uSmokeDensity);

      // hue-preserving tone-map: compress by the brightest channel so colours stay saturated
      float mx = max(c.r, max(c.g, c.b));
      c *= (1.0 - exp(-mx * 2.4)) / max(mx, 0.0001);
      c *= 1.0 - smoothstep(0.9, 1.0, y);                    // fade at the very bottom
      gl_FragColor = vec4(c, 1.0);
    }
  `;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn("Aurora shader:", gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }
  const vs = compile(gl.VERTEX_SHADER, vert);
  const fs = compile(gl.FRAGMENT_SHADER, frag);
  if (!vs || !fs) {
    canvas.classList.add("aurora-fallback");
    return;
  }
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    canvas.classList.add("aurora-fallback");
    return;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const U = {};
  [
    "uRes", "uTime", "uTop", "uDepth", "uDip", "uTilt", "uRound", "uRipple", "uFlow",
    "uThick", "uMorph", "uDetail", "uSeed", "uIntensity",
    "uSmoke", "uSmokeDensity", "uSmokeSpeed",
  ].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  function resize() {
    const s = CFG.resolution;
    canvas.width = Math.max(1, Math.round(window.innerWidth * s));
    canvas.height = Math.max(1, Math.round(window.innerHeight * s));
    gl.viewport(0, 0, canvas.width, canvas.height);
  }

  /* ---------- smooth random signals that drive the big shape ---------- */
  const TAU = Math.PI * 2;
  const rand = (a, b) => a + Math.random() * (b - a);
  // sum of 3 sines with random periods around `period` → smooth value in [0, 1]
  function signal(period) {
    const w = [0.5, 0.3, 0.2].map((amp) => ({
      amp,
      f: TAU / (period * rand(0.7, 1.6)),
      p: rand(0, TAU),
    }));
    return (t) => 0.5 + 0.5 * w.reduce((s, v) => s + v.amp * Math.sin(v.f * t + v.p), 0);
  }
  const sDepth = signal(CFG.shapeTime);
  const sDip = signal(CFG.shapeTime * 1.3);
  const sTilt = signal(CFG.shapeTime * 1.1);
  const sLevel = signal(CFG.shapeTime * 1.7);
  const sRound = signal(CFG.shapeTime * 0.9);

  const smooth = (e0, e1, v) => {
    const k = Math.min(1, Math.max(0, (v - e0) / (e1 - e0)));
    return k * k * (3 - 2 * k);
  };

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const baseSeed = Math.random() * 100;
  let scrollK = 1;

  function render(now) {
    const sec = ((now - start) / 1000) * CFG.speed;
    const t = sec + 20.0;

    // --- fade cycle: fade in → visible → fade out → dark → new shape
    let env = 1;
    let detail = 1;
    let cycleIdx = 0;
    if (!reduce && CFG.cycle > 0) {
      cycleIdx = Math.floor(sec / CFG.cycle);
      const ph = sec - cycleIdx * CFG.cycle; // seconds into this cycle
      const outStart = CFG.cycle - CFG.dark - CFG.fadeOut;
      env = smooth(0, CFG.fadeIn, ph) * (1 - smooth(outStart, outStart + CFG.fadeOut, ph));
      // a new aurora starts as a plain band, folds & colours grow in afterwards
      detail = smooth(CFG.fadeIn * 0.3, CFG.fadeIn * 1.8, ph);
    } else if (!reduce) {
      env = smooth(0, CFG.fadeIn, sec);
    }
    // new random shape after every blackout
    const seed = baseSeed + cycleIdx * 17.31;
    const shapeT = sec + cycleIdx * 37.7;

    // --- big shape from the smooth random signals
    const dep = Math.pow(sDepth(shapeT), 0.8);
    const depth = CFG.depthMin + (CFG.depthMax - CFG.depthMin) * dep;
    const level = CFG.level + (sLevel(shapeT) - 0.5) * 0.12;
    const top = level - depth * 0.85; // deeper dip → arms rise toward the top corners
    const dip = 0.5 + (sDip(shapeT) - 0.5) * 0.5;
    const tilt = (sTilt(shapeT) - 0.5) * 2 * CFG.tiltMax;
    const round = 0.05 + 0.25 * sRound(shapeT);

    // --- dim while scrolled past the hero
    const scrolled = Math.min(1, window.scrollY / window.innerHeight);
    scrollK += (1 - CFG.scrollDim * scrolled - scrollK) * 0.08;

    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uTop, top);
    gl.uniform1f(U.uDepth, depth);
    gl.uniform1f(U.uDip, dip);
    gl.uniform1f(U.uTilt, tilt);
    gl.uniform1f(U.uRound, round);
    gl.uniform1f(U.uRipple, CFG.ripple);
    gl.uniform1f(U.uFlow, CFG.flow);
    gl.uniform1f(U.uThick, CFG.thickness);
    gl.uniform1f(U.uMorph, CFG.morph);
    gl.uniform1f(U.uSmoke, CFG.smoke);
    gl.uniform1f(U.uSmokeDensity, CFG.smokeDensity);
    gl.uniform1f(U.uSmokeSpeed, CFG.smokeSpeed);
    gl.uniform1f(U.uDetail, detail);
    gl.uniform1f(U.uSeed, seed);
    gl.uniform1f(U.uIntensity, CFG.intensity * env * scrollK * (0.5 + 0.5 * detail));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function loop(now) {
    render(now);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    resize();
    if (reduce) render(start + 5000);
  });
  resize();
  if (reduce) render(start + 5000);
  else requestAnimationFrame(loop);
})();

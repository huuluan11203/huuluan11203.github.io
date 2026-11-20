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
    resolution: 0.5, // tỉ lệ độ phân giải vẽ (cực quang mềm nên 0.5 giữ nguyên độ mượt hình mà giảm ~61% GPU)
    paletteInterval: 6, // mỗi bao nhiêu giây thì đổi sang bộ màu kế tiếp (0 = cố định bộ đầu)
    paletteFade: 4, // thời gian chuyển màu mượt giữa hai bộ (giây)
    lightStrength: 0.55, // chế độ sáng: độ đậm của cực quang trên nền trắng (0 → 1)
    lightColor: 1, // chế độ sáng: 0 = mực đơn sắc, 1 = nhiều màu pastel, 0.5 = màu trầm pha mực
    themeEase: 0.08, // tốc độ chuyển sáng ↔ tối (lớn = nhanh)
    // --- hiệu năng ---
    adaptive: true, // máy yếu (rớt dưới ~50fps liên tục 2 giây) → tự giảm độ phân giải vẽ
    minResolution: 0.35, // độ phân giải thấp nhất khi tự giảm
  };

  // Các bộ màu mát lạnh, dịu mắt (sắp theo vòng sắc độ lạnh liền mạch; mỗi bộ kèm màu mực hợp tông)
  const PALETTES = [
    {
      name: "Nordic Mist",
      pink: [0.68, 0.86, 0.96],
      violet: [0.45, 0.72, 0.92],
      blue: [0.30, 0.56, 0.82],
      teal: [0.38, 0.84, 0.76],
      deep: [0.22, 0.36, 0.62],
      ink: [0.16, 0.24, 0.36],
      inkK: 0.48,
    },
    {
      name: "Glacier Mint",
      pink: [0.74, 0.94, 0.96],
      violet: [0.46, 0.84, 0.90],
      blue: [0.28, 0.66, 0.80],
      teal: [0.56, 0.94, 0.84],
      deep: [0.18, 0.42, 0.58],
      ink: [0.14, 0.27, 0.32],
      inkK: 0.46,
    },
    {
      name: "Moonlit Sage",
      pink: [0.76, 0.92, 0.84],
      violet: [0.46, 0.78, 0.70],
      blue: [0.28, 0.60, 0.66],
      teal: [0.62, 0.88, 0.74],
      deep: [0.18, 0.36, 0.44],
      ink: [0.15, 0.28, 0.26],
      inkK: 0.46,
    },
    {
      name: "Fjord Emerald",
      pink: [0.62, 0.90, 0.86],
      violet: [0.32, 0.76, 0.72],
      blue: [0.20, 0.56, 0.68],
      teal: [0.48, 0.92, 0.78],
      deep: [0.14, 0.34, 0.48],
      ink: [0.12, 0.26, 0.28],
      inkK: 0.47,
    },
    {
      name: "Botanical Watercolor",
      pink: [0.68, 0.88, 0.82],
      violet: [0.48, 0.78, 0.74],
      blue: [0.42, 0.66, 0.78],
      teal: [0.58, 0.84, 0.70],
      deep: [0.36, 0.54, 0.66],
      ink: [0.16, 0.27, 0.25],
      inkK: 0.45,
    },
    {
      name: "Misty Pine",
      pink: [0.74, 0.84, 0.82],
      violet: [0.48, 0.64, 0.64],
      blue: [0.32, 0.48, 0.52],
      teal: [0.54, 0.74, 0.72],
      deep: [0.20, 0.30, 0.34],
      ink: [0.15, 0.23, 0.24],
      inkK: 0.45,
    },
    {
      name: "Arctic Lagoon",
      pink: [0.64, 0.88, 0.96],
      violet: [0.34, 0.74, 0.90],
      blue: [0.22, 0.54, 0.80],
      teal: [0.42, 0.88, 0.86],
      deep: [0.16, 0.34, 0.58],
      ink: [0.13, 0.25, 0.35],
      inkK: 0.47,
    },
    {
      name: "Cobalt Frost",
      pink: [0.70, 0.86, 0.96],
      violet: [0.40, 0.64, 0.92],
      blue: [0.24, 0.46, 0.78],
      teal: [0.36, 0.80, 0.90],
      deep: [0.16, 0.28, 0.54],
      ink: [0.13, 0.22, 0.36],
      inkK: 0.47,
    },
    {
      name: "Ocean Velvet",
      pink: [0.58, 0.76, 0.95],
      violet: [0.38, 0.54, 0.86],
      blue: [0.26, 0.42, 0.74],
      teal: [0.34, 0.76, 0.84],
      deep: [0.22, 0.24, 0.56],
      ink: [0.13, 0.21, 0.36],
      inkK: 0.48,
    },
    {
      name: "Frosted Periwinkle",
      pink: [0.74, 0.82, 0.96],
      violet: [0.52, 0.64, 0.92],
      blue: [0.36, 0.50, 0.84],
      teal: [0.54, 0.82, 0.92],
      deep: [0.24, 0.32, 0.62],
      ink: [0.18, 0.23, 0.38],
      inkK: 0.46,
    },
    {
      name: "Polar Indigo",
      pink: [0.68, 0.78, 0.96],
      violet: [0.46, 0.52, 0.88],
      blue: [0.30, 0.42, 0.78],
      teal: [0.42, 0.80, 0.88],
      deep: [0.20, 0.24, 0.54],
      ink: [0.16, 0.20, 0.36],
      inkK: 0.47,
    },
    {
      name: "Smoky Slate",
      pink: [0.78, 0.81, 0.86],
      violet: [0.56, 0.60, 0.67],
      blue: [0.40, 0.44, 0.52],
      teal: [0.66, 0.72, 0.78],
      deep: [0.24, 0.27, 0.34],
      ink: [0.18, 0.20, 0.24],
      inkK: 0.45,
    },
    {
      name: "Ash & Ice",
      pink: [0.80, 0.86, 0.90],
      violet: [0.54, 0.64, 0.72],
      blue: [0.38, 0.48, 0.58],
      teal: [0.58, 0.76, 0.80],
      deep: [0.22, 0.29, 0.38],
      ink: [0.16, 0.21, 0.27],
      inkK: 0.45,
    },
    {
      name: "Silver Silk",
      pink: [0.86, 0.90, 0.96],
      violet: [0.64, 0.70, 0.80],
      blue: [0.44, 0.52, 0.64],
      teal: [0.72, 0.80, 0.90],
      deep: [0.26, 0.31, 0.42],
      ink: [0.20, 0.22, 0.27],
      inkK: 0.44,
    },
  ];
  // -------------------------------------------

  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    premultipliedAlpha: false,
    depth: false, // shader 2D không cần bộ đệm độ sâu / stencil → đỡ bộ nhớ GPU
    stencil: false,
  });
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
    uniform float uLight;    // 0 = chế độ tối (cực quang màu), 1 = chế độ sáng
    uniform vec3 uPaper;     // màu nền chế độ sáng (= biến CSS --paper)
    uniform vec3 uInk;       // màu cực quang ở chế độ sáng
    uniform float uInkK;     // độ đậm cực quang ở chế độ sáng
    uniform float uLightColor; // 0 = mực đơn sắc, 1 = nhiều màu pastel trên nền sáng
    uniform vec3 uPink;
    uniform vec3 uViolet;
    uniform vec3 uBlue;
    uniform vec3 uTeal;
    uniform vec3 uDeep;

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

    // iridescent bands, indexed by depth inside the sheet (0 = top edge)
    vec3 palette(float h, float detail, float streak) {
      vec3 c = mix(uPink, uViolet, smoothstep(0.02, 0.12, h));
      c = mix(c, uBlue, smoothstep(0.14, 0.34, h));
      c = mix(c, uTeal, smoothstep(0.36, 0.55, h) * (1.0 - smoothstep(0.62, 0.85, h)) * detail * streak);
      c = mix(c, uDeep, smoothstep(0.75, 1.0, h));
      // while a new aurora is still forming it is a plain violet band
      return mix(mix(uViolet, uDeep, h), c, detail);
    }

    // One sheet of light. y: 0 = top, 1 = bottom.
    vec3 sheet(float x, float y, float aspect, float t, float s,
               float top, float depth, float dip, float tilt, float thick, float rimK) {
      // big shape: a dip (V / U / flat) at x = dip, plus a tilt
      // straight arms + rounded bottom (hyperbola) → no kinks; uRound: V ↔ U
      float dx = x - dip;
      float valley = 1.0 - (sqrt(dx * dx + uRound * uRound) - uRound) / 0.55;
      float baseEdge = top + depth * valley + tilt * (x - 0.5);

      // Loại sớm theo khung bao toán học TRƯỚC khi tính bất kỳ fbm() nào (giống hệt pixel đầu ra)
      float edgeMargin = uRipple + 0.10;
      if (y <= baseEdge - edgeMargin - 0.05 || y >= baseEdge + edgeMargin + thick * 2.38) {
        return vec3(0.0);
      }

      vec2 p = vec2(x * aspect, y);
      float m = t * uMorph;
      float det = uDetail;

      // domain warp X (dùng cho biên trên); chỉ tính q.y sau khi chắc chắn nằm trong dải
      float qx = fbm(p * 0.9 + vec2(-m * 0.16, m * 0.05) + s);
      float edge = baseEdge
        // small details travelling LEFT -> RIGHT
        + uRipple * (fbm(vec2(x * 1.1 - t * uFlow, s)) - 0.5) * 2.0
        + 0.025 * sin(x * 4.0 - t * 0.6 + s)
        + 0.14 * (qx - 0.5) * det;

      float d = y - edge;                                    // > 0 inside the sheet
      if (d <= -0.05) return vec3(0.0);                      // ngoài mép trên → topEdge = 0

      vec2 q = vec2(qx, fbm(p * 0.9 + vec2(5.2 - m * 0.13, 1.3 + m * 0.07) + s));

      // thickness swings between a thin ribbon and a wide sheet
      float th = thick * (0.35 + 1.4 * fbm(vec2(x * 1.1 - t * uFlow * 1.4, s + 3.0) + q * 0.6));
      if (d >= th * 1.35) return vec3(0.0);                  // ngoài mép dưới → bottom = 0

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
      // teal appears as broken streaks drifting along the band (front sheet only; back sheet skips fbm)
      float streak = rimK > 0.0
        ? smoothstep(0.42, 0.68, fbm(vec2(x * 1.3 - t * uFlow * 2.5, d * 7.0) + q * 1.2 + s)) * rimK
        : 0.0;
      vec3 col = palette(clamp(h, 0.0, 1.0), det, streak);

      // thin bright pink-violet line right on the top edge (front sheet only)
      if (rimK > 0.0) {
        float rim = exp(-abs(d - 0.004) / 0.024);
        col = mix(col, uPink * 1.15, rim * 0.45 * rimK * det);
      }

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
      // Vùng trời trống (không có cực quang): bỏ qua dens fbm2, exp() và pha màu nền sáng
      if (max(c.r, max(c.g, c.b)) <= 0.0005) {
        gl_FragColor = vec4(mix(vec3(0.0), uPaper, uLight), 1.0);
        return;
      }

      // uneven smoke density: thick clumps and thin gaps that drift and morph
      float dens = 0.3 + 1.1 * fbm2(sp * 1.4 + sr * 2.2 + vec2(-st * 0.1, st * 0.12));
      c *= mix(1.0, dens, uSmokeDensity);

      // hue-preserving tone-map: compress by the brightest channel so colours stay saturated
      float mx = max(c.r, max(c.g, c.b));
      c *= (1.0 - exp(-mx * 2.4)) / max(mx, 0.0001);
      c *= 1.0 - smoothstep(0.9, 1.0, y);                    // fade at the very bottom

      // chế độ sáng: nền --paper, chuyển mượt giữa mực đơn sắc (uLightColor = 0) ↔ nhiều màu pastel (uLightColor = 1)
      float lum = clamp(max(c.r, max(c.g, c.b)), 0.0, 1.0);
      vec3 tint = c / max(lum, 0.001);
      float tintLum = dot(tint, vec3(0.299, 0.587, 0.114));
      vec3 pigment = clamp(mix(vec3(tintLum), tint, 1.35), 0.0, 1.0) * 0.76;
      vec3 lightTone = mix(uInk, pigment, uLightColor);
      vec3 inked = mix(uPaper, lightTone, lum * uInkK);
      gl_FragColor = vec4(mix(c, inked, uLight), 1.0);
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
    "uLight", "uPaper", "uInk", "uInkK", "uLightColor",
    "uPink", "uViolet", "uBlue", "uTeal", "uDeep",
  ].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  let resolution = CFG.resolution; // có thể tự giảm trên máy yếu (xem loop)
  let winH = window.innerHeight || 1;
  let scrollYCached = window.scrollY || 0;
  function resize() {
    const s = resolution;
    winH = window.innerHeight || 1;
    canvas.width = Math.max(1, Math.round(window.innerWidth * s));
    canvas.height = Math.max(1, Math.round(winH * s));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
  }
  window.addEventListener("scroll", () => {
    scrollYCached = window.scrollY || 0;
  }, { passive: true });

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

  /* ---------- chế độ sáng / tối (main.js phát sự kiện "themechange") ---------- */
  const isLight = () => document.documentElement.getAttribute("data-theme") === "light";
  let lightTarget = isLight() ? 1 : 0;
  let light = lightTarget;
  function readPaper() {
    const hex = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim().replace("#", "");
    const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
    const n = parseInt(full, 16);
    return Number.isNaN(n) || full.length !== 6 ? [0.906, 0.906, 0.918] : [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const paper = readPaper();
  // Gửi các uniform hằng số 1 lần duy nhất thay vì mỗi khung hình
  gl.uniform1f(U.uRipple, CFG.ripple);
  gl.uniform1f(U.uFlow, CFG.flow);
  gl.uniform1f(U.uThick, CFG.thickness);
  gl.uniform1f(U.uMorph, CFG.morph);
  gl.uniform1f(U.uSmoke, CFG.smoke);
  gl.uniform1f(U.uSmokeDensity, CFG.smokeDensity);
  gl.uniform1f(U.uSmokeSpeed, CFG.smokeSpeed);
  gl.uniform3f(U.uPaper, paper[0], paper[1], paper[2]);
  gl.uniform1f(U.uInkK, CFG.lightStrength);
  gl.uniform1f(U.uLightColor, CFG.lightColor);
  window.addEventListener("themechange", () => {
    lightTarget = isLight() ? 1 : 0;
    if (reduce) {
      light = lightTarget;
      render(start + 5000);
    }
  });

  function setMix3(loc, a, b, k) {
    gl.uniform3f(loc, a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  }

  function render(now) {
    const elapsed = Math.max(0, (now - start) / 1000);
    const sec = elapsed * CFG.speed;
    const t = sec + 20.0;

    // --- xoay vòng các bộ màu mỗi CFG.paletteInterval giây (chuyển mượt ở cuối chu kỳ)
    let pA = PALETTES[0];
    let pB = PALETTES[0];
    let pK = 0;
    if (!reduce && CFG.paletteInterval > 0 && PALETTES.length > 1) {
      const step = CFG.paletteInterval;
      const idx = Math.floor(elapsed / step) % PALETTES.length;
      const ph = elapsed % step;
      const fade = Math.min(CFG.paletteFade, step);
      pA = PALETTES[idx];
      pB = PALETTES[(idx + 1) % PALETTES.length];
      pK = fade > 0 ? smooth(step - fade, step, ph) : 0;
    }

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

    // --- dim while scrolled past the hero (dùng scrollYCached tránh ép layout sync)
    const scrolled = Math.min(1, scrollYCached / winH);
    scrollK += (1 - CFG.scrollDim * scrolled - scrollK) * 0.08;
    light += (lightTarget - light) * CFG.themeEase;
    if (Math.abs(lightTarget - light) < 0.001) light = lightTarget;

    gl.uniform1f(U.uTime, t);
    gl.uniform1f(U.uTop, top);
    gl.uniform1f(U.uDepth, depth);
    gl.uniform1f(U.uDip, dip);
    gl.uniform1f(U.uTilt, tilt);
    gl.uniform1f(U.uRound, round);
    gl.uniform1f(U.uDetail, detail);
    gl.uniform1f(U.uSeed, seed);
    gl.uniform1f(U.uLight, light);
    setMix3(U.uPink, pA.pink, pB.pink, pK);
    setMix3(U.uViolet, pA.violet, pB.violet, pK);
    setMix3(U.uBlue, pA.blue, pB.blue, pK);
    setMix3(U.uTeal, pA.teal, pB.teal, pK);
    setMix3(U.uDeep, pA.deep, pB.deep, pK);
    setMix3(U.uInk, pA.ink, pB.ink, pK);
    gl.uniform1f(U.uIntensity, CFG.intensity * env * scrollK * (0.5 + 0.5 * detail));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ---------- tự giảm độ phân giải trên máy yếu ----------
     Máy không kham nổi (rớt dưới ~50fps liên tục 2 giây) → giảm độ phân giải vẽ từng bước 20%,
     thấp nhất CFG.minResolution. Máy đủ mạnh giữ nguyên CFG.resolution.
     (Đã thử giới hạn 60 lần vẽ/giây trên màn 120Hz: đo được làm Chrome tính style gấp 3 lần
     lúc cuộn trang → bỏ.) */
  let frameMs = 16.7; // khoảng cách trung bình giữa các khung hình (ms)
  let minFrameMs = Infinity; // ≈ chu kỳ quét của màn hình
  let lastNow = 0;
  let slowSince = 0;
  let rafId = 0;

  function loop(now) {
    rafId = 0;
    if (document.visibilityState === "hidden") return;
    const dt = now - lastNow;
    lastNow = now;
    if (dt > 3 && dt < 100) {
      frameMs += (dt - frameMs) * 0.05;
      minFrameMs = Math.min(minFrameMs, dt);
    }

    render(now);

    if (CFG.adaptive && resolution > CFG.minResolution) {
      const slow = frameMs > Math.max(minFrameMs * 1.6, 20);
      if (!slow) slowSince = 0;
      else if (!slowSince) slowSince = now;
      else if (now - slowSince > 2000) {
        resolution = Math.max(CFG.minResolution, resolution * 0.8);
        resize();
        slowSince = now;
      }
    }

    rafId = requestAnimationFrame(loop);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !reduce && !rafId) {
      lastNow = performance.now();
      rafId = requestAnimationFrame(loop);
    }
  });

  window.addEventListener("resize", () => {
    resize();
    if (reduce) render(start + 5000);
  });
  resize();
  if (reduce) render(start + 5000);
  else rafId = requestAnimationFrame(loop);
})();

/* =========================================================
   Liquid glass: khúc xạ vật lý bằng SVG filter trong backdrop-filter.
   Cùng thuật toán với bản mẫu "Liquid Glass — khúc xạ vật lý + dự phòng":
   A. Phát hiện hỗ trợ (chỉ Chromium render SVG trong backdrop-filter)
   B. Profile mặt kính (squircle lồi)
   C. Dò tia theo định luật Snell → bảng độ lệch 1D
   D. Áp lên hình chữ nhật bo góc bằng SDF → displacement map + specular map
   E. Chuỗi SVG filter: blur → 3× displacement (tán sắc) → saturate; specular là lớp nền CSS
   F. Gắn vào phần tử

   Tối ưu cho mượt:
   - Map dựng + mã hóa PNG trong Web Worker → luồng chính không bị khựng
   - Cache theo kích thước: các thẻ cùng cỡ dùng chung một map
   - Chỉ dựng khi phần tử gần màn hình; resize được gom (debounce)
   - Ảnh được giải mã xong mới gắn vào filter → không chớp
   - Specular cố định (không theo chuột) → không có việc gì chạy mỗi khung hình
   Trình duyệt khác giữ kính blur() của CSS (chế độ dự phòng).
   ========================================================= */
(function () {
  "use strict";

  const SELECTOR = [
    ".nav-pill",
    ".lang-pill",
    ".burger-btn",
    ".cta-btn",
    ".mobile-sheet",
    ".mobile-lang-btn",
    ".mobile-signin-btn",
    ".skill-block",
    ".bento-card",
    ".contact-form-glass",
    ".submit-pill",
    ".copy-btn",
    ".dark-action-pill",
    // .about-photo-wrap cố ý bỏ qua: ảnh che kín, chỉ lộ viền 3px → khúc xạ chỉ tốn GPU
  ].join(",");

  // ---------------- Thông số (mặc định của bản mẫu) ----------------
  const PARAMS = {
    ior: 1.87, // chiết suất kính n₂ (1.0 = không bẻ cong)
    bezel: 35, // độ rộng viền cong (px)
    thickness: 50, // độ dày kính (px)
    dispersion: 0.35, // tán sắc 0 → 1: nút nhỏ tách 3 kênh RGB thật; tấm lớn nướng tán sắc vào --lg-spec
    blur: 1.5, // blur nền trước khi khúc xạ (px)
    saturate: 1.9,
    specAngle: 135, // góc nguồn sáng (độ), cố định
    specOpacity: 0.35,
  };
  const RESIZE_DEBOUNCE_MS = 150;
  // Tấm kính lớn (> 60k px², vd. hồ sơ, form liên hệ): giữ khúc xạ SVG 1 lượt (feDisplacementMap)
  // + nướng tán sắc lăng kính vào lớp --lg-spec tĩnh (0 chi phí GPU thêm) thay vì 3 lượt tách kênh.
  const DISPERSION_MAX_AREA = 60000; // px² (vd. 245×245)
  // -----------------------------------------------------------------

  // ---------- A. Phát hiện hỗ trợ ----------
  // CSS.supports('backdrop-filter','url(#a)') chỉ kiểm tra cú pháp nên Firefox/Safari
  // cũng trả về true → phải kiểm tra thêm engine Chromium.
  function supportsSvgBackdrop() {
    if (!window.CSS || !CSS.supports("backdrop-filter", "url(#a)")) return false;
    const brands = navigator.userAgentData && navigator.userAgentData.brands;
    return !!(brands && brands.some((b) => /Chromium/i.test(b.brand))); // Safari, Firefox, Chrome iOS → false
  }

  const elements = Array.from(document.querySelectorAll(SELECTOR));
  if (!elements.length || !supportsSvgBackdrop()) return;
  // Cố ý KHÔNG tôn trọng prefers-reduced-transparency: Windows tắt "Transparency effects"
  // hoặc bật Energy/Battery Saver sẽ báo "reduce" → trước đây tắt hẳn kính. Giữ kính luôn bật.

  // ---------- B–D. Nhân tính map: tự chứa, chạy được trong Worker lẫn luồng chính ----------
  function mapKernel() {
    // B. Profile mặt kính f(x), x: 0 = mép ngoài, 1 = hết viền cong
    const convexSquircle = (x) => Math.pow(1 - Math.pow(1 - x, 4), 1 / 4);

    // C. Dò tia: tia tới thẳng đứng I = (0, −1) trong mặt phẳng (u, z).
    //    h(u) = thickness · f(u / bezel), N = normalize(−h'(u), 1), η = n1/n2
    //    cosi = −I·N, k = 1 − η²(1 − cosi²), T = η·I + (η·cosi − √k)·N
    //    Δ(u) = h(u) · T.u / (−T.z)   (Δ > 0: nhìn thấy nền sâu hơn vào trong)
    function buildDisplacementTable(p, samples) {
      const f = convexSquircle;
      const eta = 1 / p.ior;
      const delta = 0.001;
      const table = new Float32Array(samples + 1);
      const slopes = new Float32Array(samples + 1);
      for (let i = 0; i <= samples; i++) {
        const x = Math.min(Math.max(i / samples, delta), 1 - delta);
        const dfdx = (f(Math.min(x + delta, 1)) - f(Math.max(x - delta, 0))) / (2 * delta);
        const slope = (p.thickness * dfdx) / p.bezel;
        const len = Math.hypot(slope, 1);
        const Nu = -slope / len;
        const Nz = 1 / len;
        const cosi = Nz; // I = (0, −1)
        const k = 1 - eta * eta * (1 - cosi * cosi);
        let disp = 0;
        if (k >= 0) {
          const a = eta * cosi - Math.sqrt(k);
          const Tu = a * Nu;
          const Tz = -eta + a * Nz;
          disp = Tz < 0 ? (p.thickness * f(x) * Tu) / -Tz : 0;
        }
        table[i] = disp;
        slopes[i] = slope;
      }
      table[samples] = 0; // phần phẳng bên trong: không lệch
      let max = 0;
      for (let i = 0; i <= samples; i++) max = Math.max(max, Math.abs(table[i]));
      return { table, slopes, max, samples };
    }

    // D. SDF hình chữ nhật bo góc: khoảng cách tới mép d (> 0 bên trong) + pháp tuyến hướng ra
    function roundedRectField(px, py, w, h, r) {
      const x = px - w / 2;
      const y = py - h / 2;
      const qx = Math.abs(x) - (w / 2 - r);
      const qy = Math.abs(y) - (h / 2 - r);
      const sd = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
      let nx;
      let ny;
      if (qx > 0 && qy > 0) {
        const l = Math.hypot(qx, qy) || 1;
        nx = (qx / l) * Math.sign(x);
        ny = (qy / l) * Math.sign(y);
      } else if (qx > qy) {
        nx = Math.sign(x) || 1;
        ny = 0;
      } else {
        nx = 0;
        ny = Math.sign(y) || 1;
      }
      return { d: -sd, nx, ny };
    }

    return function buildMaps(w, h, radius, params, prism, needDisp) {
      const minDim = Math.min(w, h);
      const r = Math.min(radius, w / 2, h / 2);
      // Giữ tỉ lệ thickness/bezel ổn định cho nút nhỏ (< 48px như nút Sao chép 30px)
      // để tia khúc xạ (kể cả kênh B) không vọt ra ngoài vùng filter gây sọc đỏ/vàng
      const p = Object.assign({}, params, {
        bezel: Math.min(params.bezel, minDim / 2),
        thickness: params.thickness * Math.min(1, minDim / 48),
      });
      const t = buildDisplacementTable(p, 128);
      const maxDisp = t.max || 1;
      const spec = new Uint8ClampedArray(w * h * 4);
      const la = (p.specAngle * Math.PI) / 180;
      const lx = Math.cos(la);
      const ly = Math.sin(la);
      const bakePrism = !!(prism && p.dispersion > 0);
      const halfDisp = needDisp && w * h > 60000;
      const dw = needDisp ? (halfDisp ? Math.max(4, Math.round(w * 0.5)) : w) : 0;
      const dh = needDisp ? (halfDisp ? Math.max(4, Math.round(h * 0.5)) : h) : 0;
      const disp = needDisp ? new Uint8ClampedArray(dw * dh * 4) : null;

      for (let py = 0; py < h; py++) {
        for (let px = 0; px < w; px++) {
          const i = (py * w + px) * 4;
          let R = 128;
          let G = 128;
          let sR = 255;
          let sG = 255;
          let sB = 255;
          let sA = 0;
          const field = roundedRectField(px + 0.5, py + 0.5, w, h, r);
          const d = field.d;
          if (d >= 0 && d < p.bezel) {
            const s = (d / p.bezel) * t.samples;
            const i0 = Math.floor(s);
            const fr = s - i0;
            const i1 = Math.min(i0 + 1, t.samples);
            if (needDisp && !halfDisp) {
              const mag = (t.table[i0] * (1 - fr) + t.table[i1] * fr) / maxDisp;
              // lệch về phía trong = ngược pháp tuyến hướng ra; R = 128 + x·127, G = 128 + y·127
              R = 128 - field.nx * mag * 127;
              G = 128 - field.ny * mag * 127;
            }

            // Specular: độ nghiêng mặt kính × mức hướng về nguồn sáng, góc đối diện yếu hơn
            const slope = t.slopes[i0] * (1 - fr) + t.slopes[i1] * fr;
            const tilt = slope / Math.hypot(slope, 1);
            const facing = field.nx * lx + field.ny * ly;
            const lit = Math.pow(Math.max(facing, 0), 2) + 0.45 * Math.pow(Math.max(-facing, 0), 2);
            const rim = Math.max(0, 1 - d / 1.5) * 0.35; // đường viền mảnh ~1.5px
            sA = Math.min(1, lit * Math.pow(tilt, 1.5) + rim * (0.5 + 0.5 * Math.abs(facing))) * p.specOpacity;

            // Tán sắc lăng kính nướng sẵn vào lớp specular cho tấm kính lớn (0 tốn GPU mỗi frame):
            // mép ngoài sáng ngả ấm nhẹ (đỏ/vàng), mép trong & góc đối diện ngả lam/lục lam
            if (bakePrism) {
              const u = d / p.bezel;
              const band = Math.pow(tilt, 1.2) * (1 - u) * p.dispersion;
              if (facing >= 0) {
                const warm = Math.max(0, 1 - u * 4.2) * facing;
                const cool = Math.max(0, 1 - Math.abs(u - 0.34) * 3.4) * facing;
                sR = Math.min(255, 255 - cool * 60);
                sG = Math.min(255, 255 - warm * 24 - cool * 18);
                sB = Math.min(255, 255 - warm * 54);
              } else {
                const opp = -facing;
                sR = Math.min(255, 255 - opp * 65 * (1 - u));
                sG = Math.min(255, 255 - opp * 38 * (1 - u));
                sB = 255;
              }
              sA = Math.min(1, sA + band * 0.14 * (0.35 + 0.65 * Math.abs(facing)));
            }
          }
          if (needDisp && !halfDisp) {
            disp[i] = R;
            disp[i + 1] = G;
            disp[i + 2] = 128; // kênh B bỏ qua
            disp[i + 3] = 255;
          }
          spec[i] = sR;
          spec[i + 1] = sG;
          spec[i + 2] = sB;
          spec[i + 3] = sA * 255;
        }
      }

      // Tấm kính lớn: dựng texture displacement ở 0.5× (viền cong 35px mượt nên GPU lọc song tuyến y hệt,
      // nhưng giảm 75% dung lượng & băng thông bộ nhớ texture mỗi khung hình cuộn)
      if (halfDisp) {
        for (let py = 0; py < dh; py++) {
          const oy = ((py + 0.5) / dh) * h;
          for (let px = 0; px < dw; px++) {
            const ox = ((px + 0.5) / dw) * w;
            const i = (py * dw + px) * 4;
            let R = 128;
            let G = 128;
            const field = roundedRectField(ox, oy, w, h, r);
            const d = field.d;
            if (d >= 0 && d < p.bezel) {
              const s = (d / p.bezel) * t.samples;
              const i0 = Math.floor(s);
              const fr = s - i0;
              const i1 = Math.min(i0 + 1, t.samples);
              const mag = (t.table[i0] * (1 - fr) + t.table[i1] * fr) / maxDisp;
              R = 128 - field.nx * mag * 127;
              G = 128 - field.ny * mag * 127;
            }
            disp[i] = R;
            disp[i + 1] = G;
            disp[i + 2] = 128;
            disp[i + 3] = 255;
          }
        }
      }
      // feDisplacementMap dịch = scale · (C/255 − 0.5) → tối đa ±scale/2, nên scale = 2·maxΔ
      return { disp, dw, dh, spec, scale: 2 * maxDisp };
    };
  }

  // ---------- Hàng đợi dựng map: Worker trước, luồng chính (lúc rảnh) nếu Worker lỗi ----------
  const WORKER_SOURCE =
    "const buildMaps = (" + mapKernel.toString() + ")();\n" +
    "self.onmessage = async (e) => {\n" +
    "  const { key, w, h, r, params, prism, needDisp } = e.data;\n" +
    "  try {\n" +
    "    const m = buildMaps(w, h, r, params, prism, needDisp);\n" +
    "    const encode = async (data, cw, ch) => {\n" +
    "      const canvas = new OffscreenCanvas(cw, ch);\n" +
    "      canvas.getContext('2d').putImageData(new ImageData(data, cw, ch), 0, 0);\n" +
    "      return new FileReaderSync().readAsDataURL(await canvas.convertToBlob({ type: 'image/png' }));\n" +
    "    };\n" +
    "    const dispURL = m.disp ? await encode(m.disp, m.dw, m.dh) : null;\n" +
    "    self.postMessage({ key, scale: m.scale, dispURL, specURL: await encode(m.spec, w, h) });\n" +
    "  } catch (error) {\n" +
    "    self.postMessage({ key, error: String(error) });\n" +
    "  }\n" +
    "};";

  const jobs = new Map(); // key → { w, h, r, prism, needDisp, resolve }
  let worker = null;
  let mainBuild = null;

  function buildOnMainThread(key) {
    const job = jobs.get(key);
    if (!job) return;
    const run = () => {
      jobs.delete(key);
      mainBuild = mainBuild || mapKernel();
      const m = mainBuild(job.w, job.h, job.r, PARAMS, job.prism, job.needDisp);
      const canvas = document.createElement("canvas");
      const encode = (data, cw, ch) => {
        canvas.width = cw;
        canvas.height = ch;
        canvas.getContext("2d").putImageData(new ImageData(data, cw, ch), 0, 0);
        return canvas.toDataURL("image/png");
      };
      const dispURL = m.disp ? encode(m.disp, m.dw, m.dh) : null;
      job.resolve({ scale: m.scale, dispURL, specURL: encode(m.spec, job.w, job.h) });
    };
    if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 500 });
    else setTimeout(run, 0);
  }

  function useMainThread() {
    if (worker) worker.terminate();
    worker = null;
    Array.from(jobs.keys()).forEach(buildOnMainThread);
  }

  try {
    const url = URL.createObjectURL(new Blob([WORKER_SOURCE], { type: "text/javascript" }));
    worker = new Worker(url);
    worker.onmessage = (event) => {
      const data = event.data;
      if (data.error) {
        buildOnMainThread(data.key);
        return;
      }
      const job = jobs.get(data.key);
      if (!job) return;
      jobs.delete(data.key);
      job.resolve(data);
    };
    worker.onerror = useMainThread;
  } catch (error) {
    worker = null;
  }

  // Ảnh giải mã sẵn → feImage hiện ngay khi gắn vào filter, không chớp một khung hình
  const decode = (src) => {
    const image = new Image();
    image.src = src;
    return image.decode().catch(() => {});
  };

  const mapCache = new Map(); // key → Promise<{ scale, dispURL, specURL }>

  function requestMaps(w, h, r, prism, needDisp) {
    const key = w + "x" + h + "r" + r + (prism ? "p" : "") + (needDisp ? "d" : "");
    if (mapCache.has(key)) return mapCache.get(key);
    if (mapCache.size >= 24) mapCache.delete(mapCache.keys().next().value);
    const promise = new Promise((resolve) => {
      jobs.set(key, { w, h, r, prism: !!prism, needDisp: !!needDisp, resolve });
      if (worker) worker.postMessage({ key, w, h, r, params: PARAMS, prism: !!prism, needDisp: !!needDisp });
      else buildOnMainThread(key);
    }).then((maps) => {
      const decodes = [decode(maps.specURL)];
      if (maps.dispURL) decodes.push(decode(maps.dispURL));
      return Promise.all(decodes).then(() => maps);
    });
    mapCache.set(key, promise);
    return promise;
  }

  // ---------- E. Dựng SVG filter ----------
  const SVG_NS = "http://www.w3.org/2000/svg";
  const defs = document.createElementNS(SVG_NS, "svg");
  defs.setAttribute("width", "0");
  defs.setAttribute("height", "0");
  defs.setAttribute("aria-hidden", "true");
  defs.setAttribute("focusable", "false");
  defs.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
  document.body.appendChild(defs);

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function buildFilter(id, w, h, maps, noDisperse) {
    // Vùng filter = đúng kích thước phần tử (px), map cũng đúng kích thước đó.
    // color-interpolation-filters="sRGB" là bắt buộc, nếu không map bị đọc theo linearRGB → lệch sai.
    const f = el("filter", {
      id,
      x: 0,
      y: 0,
      width: w,
      height: h,
      filterUnits: "userSpaceOnUse",
      "color-interpolation-filters": "sRGB",
    });
    el("feGaussianBlur", { in: "SourceGraphic", stdDeviation: PARAMS.blur, edgeMode: "duplicate", result: "blurred" }, f);
    el("feImage", { href: maps.dispURL, x: 0, y: 0, width: w, height: h, preserveAspectRatio: "none", result: "map" }, f);

    // Ánh sáng xanh có chiết suất cao hơn đỏ → bị bẻ mạnh hơn: R = scale×(1−d), B = scale×(1+d)
    // Tấm lớn hoặc nút nằm lồng trong tấm kính khác dùng 1 lượt displacement (giảm 70% GPU, nhìn y hệt)
    const d = noDisperse || w * h > DISPERSION_MAX_AREA ? 0 : PARAMS.dispersion * 0.12;
    if (d === 0) {
      el("feDisplacementMap", { in: "blurred", in2: "map", scale: maps.scale, xChannelSelector: "R", yChannelSelector: "G", result: "rgb" }, f);
    } else {
      const channels = [
        ["r", 1 - d, "1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"],
        ["g", 1, "0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"],
        ["b", 1 + d, "0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"],
      ];
      channels.forEach(([c, mul, matrix]) => {
        el("feDisplacementMap", { in: "blurred", in2: "map", scale: maps.scale * mul, xChannelSelector: "R", yChannelSelector: "G", result: "d" + c }, f);
        el("feColorMatrix", { in: "d" + c, type: "matrix", values: matrix, result: c }, f);
      });
      el("feComposite", { in: "r", in2: "g", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0, result: "rg" }, f);
      el("feComposite", { in: "rg", in2: "b", operator: "arithmetic", k1: 0, k2: 1, k3: 1, k4: 0, result: "rgb" }, f);
    }
    el("feColorMatrix", { in: "rgb", type: "saturate", values: PARAMS.saturate }, f);
    // Specular KHÔNG nằm trong filter: feImage thứ hai trong backdrop-filter bị vẽ lại mỗi
    // khung hình (form liên hệ: 120 → ~65fps). Nó được vẽ bằng lớp nền dưới cùng
    // (--lg-spec, xem styles.css) — cùng vị trí trong thứ tự chồng lớp, kết quả như nhau.
    return f;
  }

  // ---------- F. Gắn vào phần tử ----------
  const glasses = elements.map((node, index) => ({
    node,
    id: "lg-" + (index + 1),
    filter: null,
    key: null,
    token: 0,
    near: false,
    timer: 0,
  }));
  const byNode = new Map(glasses.map((g) => [g.node, g]));

  function readRadius(node, w, h) {
    const value = getComputedStyle(node).borderTopLeftRadius.split(" ")[0];
    const number = parseFloat(value) || 0;
    return Math.round(value.endsWith("%") ? (number / 100) * Math.min(w, h) : number);
  }

  function render(g) {
    if (!g.near) return;
    // offsetWidth/Height: kích thước layout, không bị transform/translate của hiệu ứng làm sai
    const w = g.node.offsetWidth;
    const h = g.node.offsetHeight;
    if (w < 4 || h < 4) return; // đang ẩn (vd. mobile-sheet [hidden]) → giữ nguyên, dựng khi hiện
    const r = Math.min(readRadius(g.node, w, h), Math.floor(Math.min(w, h) / 2));
    const key = w + "x" + h + "r" + r;
    if (key === g.key) return;
    const token = ++g.token;
    const nested = !!(g.node.parentElement && g.node.parentElement.closest(".mobile-sheet, .bento-card"));
    const large = w * h > DISPERSION_MAX_AREA;
    requestMaps(w, h, r, nested || large, !nested).then((maps) => {
      if (token !== g.token) return;
      g.key = key;
      g.nested = nested;
      g.node.style.setProperty("--lg-spec", 'url("' + maps.specURL + '")');
      if (nested) {
        if (g.filter) {
          g.filter.remove();
          g.filter = null;
        }
        g.node.style.removeProperty("--lg-filter");
        g.node.classList.remove("is-refract", "is-glass-panel");
        g.node.classList.add("is-glass-nested");
        return;
      }
      const filter = buildFilter(g.id, w, h, maps, large);
      if (g.filter) g.filter.replaceWith(filter);
      else defs.appendChild(filter);
      g.filter = filter;
      g.node.classList.remove("is-glass-panel", "is-glass-nested");
      setFilterActive(g, g.near);
    });
  }

  function setFilterActive(g, active) {
    if (!g.filter || g.nested) return;
    if (active) {
      g.node.style.setProperty("--lg-filter", "url(#" + g.id + ")");
      g.node.classList.add("is-refract");
    } else {
      g.node.style.setProperty("--lg-filter", "none");
      g.node.classList.remove("is-refract");
    }
  }

  // Đổi kích thước: lần đầu dựng ngay, các lần sau gom lại (kéo cửa sổ không dựng liên tục)
  const resizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => {
      const g = byNode.get(entry.target);
      if (!g) return;
      clearTimeout(g.timer);
      if (!g.key) render(g);
      else g.timer = setTimeout(() => render(g), RESIZE_DEBOUNCE_MS);
    });
  });

  // Chỉ bật SVG filter khi phần tử nằm gần khung nhìn; tạm ngắt khi cuộn ra khỏi màn hình
  // (giữ nguyên node <filter> trong bộ nhớ để bật lại tức thì không nháy)
  const nearObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const g = byNode.get(entry.target);
        if (!g) return;
        g.near = entry.isIntersecting;
        if (g.near) {
          if (g.key) setFilterActive(g, true);
          render(g);
        } else if (g.filter) {
          setFilterActive(g, false);
        }
      });
    },
    { rootMargin: "15% 0px" }
  );

  glasses.forEach((g) => {
    resizeObserver.observe(g.node);
    nearObserver.observe(g.node);
  });
})();

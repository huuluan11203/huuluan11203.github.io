(function () {
  const canvas = document.getElementById("dotBg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ---------------- Tuỳ chỉnh ----------------
  const GAP = 20; // khoảng cách chấm (px)
  const SIZE = 1.15; // cỡ chấm (px)
  const BASE = 0.2; // độ sáng chấm khi nghỉ
  const INTRO_MS = 1600; // thời gian chấm hiện lan ra

  const LENS_R = 0.24; // bán kính vùng hút (tỉ lệ cạnh ngắn màn hình)
  const LENS_MIN = 50; // bán kính tối thiểu (px)
  const LENS_MAX = 140; // bán kính tối đa (px)
  const PULL = 0.32; // lực hút (0 = tắt, 0.5 = rất mạnh)
  const FOLLOW = 0.075; // độ "trễ" khi theo chuột (nhỏ = mượt/chậm hơn)
  const IDLE_MS = 3500; // chuột đứng yên bao lâu thì hiệu ứng hút tan dần
  const GLOW = 0.8; // độ sáng thêm của chấm khi bị hút

  // Chế độ sáng: chấm chỉ hiện khi bị chuột hút, màu xám đen
  const LIGHT_BASE = 0; // độ đậm chấm khi nghỉ ở chế độ sáng (0 = ẩn hẳn)
  const LIGHT_GLOW = 0.7; // độ đậm chấm bị hút ở chế độ sáng
  const LIGHT_INK = [40, 40, 48]; // màu chấm ở chế độ sáng
  // -------------------------------------------

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0;
  let h = 0;
  let R = 300;
  const start = performance.now();

  const lens = { x: -9999, y: -9999, k: 0 }; // k = current strength 0..1
  const mouse = { x: 0, y: 0, last: -Infinity, inside: false };

  // 0 = chế độ tối, 1 = chế độ sáng; chuyển dần khi main.js phát "themechange"
  const isLight = () => document.documentElement.getAttribute("data-theme") === "light";
  let lightTarget = isLight() ? 1 : 0;
  let light = lightTarget;
  window.addEventListener("themechange", () => {
    lightTarget = isLight() ? 1 : 0;
    if (reduce) {
      light = lightTarget;
      setCanvasVisible(light < 1);
      if (light < 1) paint(start + INTRO_MS, null);
    } else {
      wake();
    }
  });

  /* ---------- Tối ưu: chỉ vẽ lại khi có thay đổi, và chỉ vùng thay đổi ----------
     - hiện lan lúc đầu / đổi chế độ sáng-tối / đổi kích thước → vẽ lại cả màn hình
     - chuột hút → chỉ xoá + vẽ lại ô vuông quanh vùng hút (cả vị trí khung trước)
     - không có gì đổi → không vẽ (trước đây vẽ lại ~5000 chấm mỗi khung hình)
     Hình ảnh giống hệt vẽ lại toàn bộ: chấm ngoài vùng hút không đổi gì. */
  let dpr = 1;
  let needFull = true;
  let introEnd = INTRO_MS * 2; // thời điểm (ms) mọi chấm đã hiện hết, tính lại trong paint()
  let prevBox = null; // vùng hút đã vẽ ở khung trước
  const last = { x: 0, y: 0, k: 0 };
  const LENS_OFF = 0.003; // lens.k nhỏ hơn mức này thì hút & sáng thêm đều < 1/255 → coi như tắt

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.max(LENS_MIN, Math.min(LENS_MAX, Math.min(w, h) * LENS_R));
    needFull = true;
    prevBox = null;
    if (reduce) paint(start + INTRO_MS, null);
  }

  // cập nhật trạng thái 1 khung hình; trả về true nếu chế độ sáng/tối đang chuyển
  function step(now) {
    // lens follows the mouse; strength fades in while moving, out when idle
    const active = mouse.inside && now - mouse.last < IDLE_MS;
    if (lens.x < -1000 && active) {
      lens.x = mouse.x;
      lens.y = mouse.y;
    }
    lens.x += (mouse.x - lens.x) * FOLLOW;
    lens.y += (mouse.y - lens.y) * FOLLOW;
    lens.k += ((active ? 1 : 0) - lens.k) * 0.05;
    const before = light;
    light += (lightTarget - light) * 0.08;
    if (Math.abs(lightTarget - light) < 0.001) light = lightTarget;
    return light !== before;
  }

  // ô vuông (px CSS, khớp lưới pixel thật) chứa toàn bộ vùng hút quanh lens
  function lensBox() {
    const r = R * 1.25 + SIZE + 1;
    const snap = (v, f) => f(v * dpr) / dpr;
    return {
      x0: Math.max(0, snap(lens.x - r, Math.floor)),
      y0: Math.max(0, snap(lens.y - r, Math.floor)),
      x1: Math.min(w, snap(lens.x + r, Math.ceil)),
      y1: Math.min(h, snap(lens.y + r, Math.ceil)),
    };
  }

  const union = (a, b) =>
    a ? { x0: Math.min(a.x0, b.x0), y0: Math.min(a.y0, b.y0), x1: Math.max(a.x1, b.x1), y1: Math.max(a.y1, b.y1) } : b;

  // vẽ chấm; box = null → cả màn hình, ngược lại chỉ trong ô box
  function paint(now, box) {
    const t = now - start;
    const base = BASE + (LIGHT_BASE - BASE) * light;
    const glow = GLOW + (LIGHT_GLOW - GLOW) * light;

    const cx = w / 2;
    const cy = h / 2;
    const maxD = Math.hypot(cx, cy);
    const introR = reduce ? Infinity : (t / INTRO_MS) * maxD * 1.15;
    introEnd = (INTRO_MS * (maxD + 140)) / (maxD * 1.15);
    const reach = R * 1.25;
    const reach2 = reach * reach;
    const pullK = PULL * lens.k;

    const offX = (w % GAP) / 2;
    const offY = (h % GAP) / 2;
    let gx0 = offX;
    let gy0 = offY;
    let gx1 = w;
    let gy1 = h;

    if (box) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
      ctx.clip();
      ctx.clearRect(box.x0, box.y0, box.x1 - box.x0, box.y1 - box.y0);
      // mọi chấm có thể chạm vào ô: lưới trong ô (nới thêm 1 chấm ở mép)
      gx0 = offX + Math.max(0, Math.ceil((box.x0 - SIZE - offX) / GAP)) * GAP;
      gy0 = offY + Math.max(0, Math.ceil((box.y0 - SIZE - offY) / GAP)) * GAP;
      gx1 = Math.min(w, box.x1 + SIZE);
      gy1 = Math.min(h, box.y1 + SIZE);
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    for (let gy = gy0; gy < gy1; gy += GAP) {
      for (let gx = gx0; gx < gx1; gx += GAP) {
        const dc = Math.hypot(gx - cx, gy - cy);
        const reveal = Math.min(1, Math.max(0, (introR - dc) / 140));
        if (reveal <= 0) continue;

        let x = gx;
        let y = gy;
        let near = 0;

        if (pullK > 0.001) {
          const vx = lens.x - gx;
          const vy = lens.y - gy;
          const d2 = vx * vx + vy * vy;
          if (d2 < reach2) {
            const k = 1 - Math.sqrt(d2) / reach;
            const pull = pullK * k * k * (3 - 2 * k); // smoothstep falloff
            x += vx * pull;
            y += vy * pull;
            near = k * lens.k;
          }
        }

        const vig = 1 - Math.pow(dc / maxD, 2.2) * 0.7;
        const a = base * vig * reveal + near * glow;
        if (a < 0.02) continue;

        // dark mode: dots pulled toward the cursor pick up a violet tint;
        // light mode: blend toward a dark grey ink
        const dr = 165 + 25 * near;
        const dg = 215 - 75 * near;
        const db = 210 + 45 * near;
        const r = Math.round(dr + (LIGHT_INK[0] - dr) * light);
        const g = Math.round(dg + (LIGHT_INK[1] - dg) * light);
        const b = Math.round(db + (LIGHT_INK[2] - db) * light);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, a)})`;
        ctx.fillRect(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);
      }
    }

    if (box) ctx.restore();
  }

  let rafId = 0;
  let canvasHidden = false;
  function setCanvasVisible(visible) {
    if (visible === !canvasHidden) return;
    canvasHidden = !visible;
    canvas.style.visibility = visible ? "" : "hidden";
  }

  function frame(now) {
    const themeMoving = step(now);
    const lensOn = lens.k > LENS_OFF;
    const introRunning = now - start < introEnd;
    const mouseActive = mouse.inside && now - mouse.last < IDLE_MS;

    // cả màn hình đổi: đang hiện lan, đang chuyển sáng/tối, vừa đổi kích thước
    if (needFull || themeMoving || introRunning) {
      setCanvasVisible(true);
      paint(now, null);
      needFull = false;
      prevBox = lensOn ? lensBox() : null;
    } else if (lensOn) {
      setCanvasVisible(true);
      // lens đứng yên hẳn (chuột không di chuyển) → hình không đổi, bỏ qua
      const still = Math.abs(lens.x - last.x) < 0.01 && Math.abs(lens.y - last.y) < 0.01 && Math.abs(lens.k - last.k) < 0.0005;
      if (!still) {
        const box = lensBox();
        paint(now, union(prevBox, box)); // xoá cả vị trí cũ của các chấm bị hút
        prevBox = box;
      }
    } else if (prevBox) {
      setCanvasVisible(true);
      paint(now, prevBox); // lens vừa tắt: trả vùng cũ về lưới chấm tĩnh
      prevBox = null;
    }
    last.x = lens.x;
    last.y = lens.y;
    last.k = lens.k;

    const busy = needFull || themeMoving || introRunning || lensOn || mouseActive || prevBox !== null;
    // Ở chế độ sáng khi đứng yên (LIGHT_BASE = 0): ẩn lớp canvas trống khỏi compositor GPU
    if (!busy && light >= 0.999 && LIGHT_BASE === 0) {
      setCanvasVisible(false);
    }
    return busy;
  }

  function loop(now) {
    rafId = 0;
    if (document.visibilityState === "hidden") return;
    if (frame(now)) {
      rafId = requestAnimationFrame(loop);
    }
  }

  function wake() {
    if (reduce || document.visibilityState === "hidden") return;
    if (!rafId) rafId = requestAnimationFrame(loop);
  }

  window.addEventListener("resize", () => {
    resize();
    wake();
  });
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.last = performance.now();
      mouse.inside = true;
      wake();
    },
    { passive: true }
  );
  document.documentElement.addEventListener("pointerleave", () => {
    mouse.inside = false;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") wake();
  });

  resize();
  if (reduce) {
    setCanvasVisible(light < 1);
  } else {
    wake();
  }
})();

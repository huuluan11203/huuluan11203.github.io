/* =========================================================
   Lưới chấm động (canvas cố định toàn trang, nằm trên cực quang)
   1. Chấm nhỏ, dày, hiện lan từ giữa khi tải trang
   2. Hiệu ứng "hút" theo con trỏ: chấm bị kéo về phía chuột
      → hàng chấm uốn thành vòng cung; hiện dần khi rê chuột,
      tan dần khi chuột đứng yên / rời trang
   ========================================================= */
(function () {
  const canvas = document.getElementById("dotBg");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // ---------------- Tuỳ chỉnh ----------------
  const GAP = 20; // khoảng cách chấm (px)
  const SIZE = 1.1; // cỡ chấm (px)
  const BASE = 0.3; // độ sáng chấm khi nghỉ
  const INTRO_MS = 1600; // thời gian chấm hiện lan ra

  const LENS_R = 0.24; // bán kính vùng hút (tỉ lệ cạnh ngắn màn hình)
  const LENS_MIN = 100; // bán kính tối thiểu (px)
  const LENS_MAX = 220; // bán kính tối đa (px)
  const PULL = 0.32; // lực hút (0 = tắt, 0.5 = rất mạnh)
  const FOLLOW = 0.075; // độ "trễ" khi theo chuột (nhỏ = mượt/chậm hơn)
  const IDLE_MS = 2500; // chuột đứng yên bao lâu thì hiệu ứng hút tan dần
  // -------------------------------------------

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let w = 0;
  let h = 0;
  let R = 300;
  const start = performance.now();

  const lens = { x: -9999, y: -9999, k: 0 }; // k = current strength 0..1
  const mouse = { x: 0, y: 0, last: -Infinity, inside: false };

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    R = Math.max(LENS_MIN, Math.min(LENS_MAX, Math.min(w, h) * LENS_R));
    if (reduce) draw(start + INTRO_MS);
  }

  function draw(now) {
    const t = now - start;
    ctx.clearRect(0, 0, w, h);

    // lens follows the mouse; strength fades in while moving, out when idle
    const active = mouse.inside && now - mouse.last < IDLE_MS;
    if (lens.x < -1000 && active) {
      lens.x = mouse.x;
      lens.y = mouse.y;
    }
    lens.x += (mouse.x - lens.x) * FOLLOW;
    lens.y += (mouse.y - lens.y) * FOLLOW;
    lens.k += ((active ? 1 : 0) - lens.k) * 0.05;

    const cx = w / 2;
    const cy = h / 2;
    const maxD = Math.hypot(cx, cy);
    const introR = reduce ? Infinity : (t / INTRO_MS) * maxD * 1.15;
    const reach = R * 1.25;
    const reach2 = reach * reach;
    const pullK = PULL * lens.k;

    const offX = (w % GAP) / 2;
    const offY = (h % GAP) / 2;

    for (let gy = offY; gy < h; gy += GAP) {
      for (let gx = offX; gx < w; gx += GAP) {
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
        const a = BASE * vig * reveal + near * 0.55;
        if (a < 0.02) continue;

        // dots pulled toward the cursor pick up a violet tint
        const r = Math.round(165 + 25 * near);
        const g = Math.round(215 - 75 * near);
        ctx.fillStyle = `rgba(${r},${g},${Math.round(210 + 45 * near)},${Math.min(1, a)})`;
        ctx.fillRect(x - SIZE / 2, y - SIZE / 2, SIZE, SIZE);
      }
    }
  }

  function loop(now) {
    draw(now);
    requestAnimationFrame(loop);
  }

  window.addEventListener("resize", resize);
  window.addEventListener(
    "pointermove",
    (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.last = performance.now();
      mouse.inside = true;
    },
    { passive: true }
  );
  document.documentElement.addEventListener("pointerleave", () => {
    mouse.inside = false;
  });

  resize();
  if (!reduce) requestAnimationFrame(loop);
})();

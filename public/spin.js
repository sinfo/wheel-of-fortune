(() => {
  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");

  const pointerEl = document.getElementById("pointer");

  const modal = document.getElementById("modal");
  const prizeText = document.getElementById("prize");
  const cancelBtn = document.getElementById("cancel_btn");
  const claimBtn = document.getElementById("claim_btn");
  const cardEl = modal ? modal.querySelector('.card') : null;

  const tickAudio = new Audio("assets/sounds/tick.mp3");
  tickAudio.preload = "auto";

  function startConfetti() {
    const end = Date.now() + 3000;

    (function frame() {
      const timeLeft = end - Date.now();
      if (timeLeft <= 0) return;

      const count = Math.round(50 * (timeLeft / 3000));
      const opts = { particleCount: count, startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };
      confetti({ ...opts, origin: { x: Math.random() * 0.2 + 0.1, y: Math.random() * 0.3 } });
      confetti({ ...opts, origin: { x: Math.random() * 0.2 + 0.7, y: Math.random() * 0.3 } });

      setTimeout(frame, 250);
    })();
  }

  function fsElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
  }

  function enterFullscreen() {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen({ navigationUI: "hide" });
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  }

  function exitFullscreen() {
    const d = document;
    if (d.exitFullscreen) d.exitFullscreen();
    else if (d.webkitExitFullscreen) d.webkitExitFullscreen();
    else if (d.msExitFullscreen) d.msExitFullscreen();
  }

  function toggleFullscreen() {
    if (fsElement()) exitFullscreen();
    else enterFullscreen();
  }

  let prizes = [];
  let isSpinning = false;
  let selected_prize = null;

  let angle = 0;
  let lastAngle = 0;
  let angleStart = 0;
  let targetDelta = 0;
  let spinStart = 0;
  let spinDuration = 0;
  let animReq = null;

  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  const R = Math.min(w, h) * 0.48;
  const innerR = R * 0.2;

  let currentSmudgeAlpha = 0.05;
  let currentEraseAlpha = 0.08;

  const TAU = Math.PI * 2;
  const SUBSTEP = 0.012;
  const MAX_SUBSTEPS = 90;

  let pointerBounce = 0;
  let pointerBounceVel = 0;

  const off = document.createElement("canvas");
  off.width = w;
  off.height = h;
  const offctx = off.getContext("2d");

  let wheelFontsReadyPromise = null;

  const normRad = r => (r %= TAU, r < 0 ? r + TAU : r);
  const easeOutCubic = t => 1 - Math.pow(1 - t, 3);

  function ensureWheelFontsReady() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    if (wheelFontsReadyPromise) return wheelFontsReadyPromise;

    wheelFontsReadyPromise = Promise.all([
      document.fonts.load("700 21px Obviously"),
      document.fonts.load("700 21px Mupen")
    ]).catch(() => {});

    return wheelFontsReadyPromise;
  }

  function play_tick() {
    try {
      const s = tickAudio.cloneNode();
      s.volume = 0.9;
      s.play().catch(() => {});
    } catch {}
  }

  function buildWheelBuffer() {
    offctx.clearRect(0, 0, w, h);

    if (!prizes.length) {
      offctx.beginPath();
      offctx.arc(cx, cy, R, 0, TAU);
      offctx.fillStyle = "#bbb";
      offctx.fill();
      return;
    }

    const n = prizes.length;
    const sliceRad = TAU / n;

    for (let i = 0; i < n; i++) {
      const start = i * sliceRad;
      const end = start + sliceRad;

      offctx.beginPath();
      offctx.moveTo(cx, cy);
      offctx.arc(cx, cy, R, start, end);
      offctx.closePath();
      offctx.fillStyle = prizes[i].color;
      offctx.fill();

      offctx.lineWidth = 3;
      offctx.strokeStyle = "#1c2b70";
      offctx.stroke();

      offctx.save();
      offctx.translate(cx, cy);
      offctx.rotate((start + end) / 2);
      offctx.textAlign = "right";
      offctx.fillStyle = "#ffffff";
      offctx.font = "700 21px Obviously";
      offctx.fillText(prizes[i].name, R - 10, 6);
      offctx.restore();
    }

    offctx.beginPath();
    offctx.fillStyle = "#1c2b70";
    offctx.arc(cx, cy, R + 20, 0, TAU);
    offctx.arc(cx, cy, R - 6, 0, TAU, true);
    offctx.closePath();
    offctx.fill();

    offctx.fillStyle = "#fff";
    offctx.lineWidth = 2;
    for (let k = 0; k < prizes.length; k++) {
      const b = k * sliceRad;
      const px = cx + Math.cos(b) * (R + 5);
      const py = cy + Math.sin(b) * (R + 5);
      offctx.beginPath();
      offctx.arc(px, py, 6, 0, TAU);
      offctx.fill();
      offctx.stroke();
    }

    offctx.beginPath();
    offctx.fillStyle = "#1c2b70";
    offctx.arc(cx, cy, innerR, 0, TAU);
    offctx.fill();
  }

  let lastTickCount = -1;
  function handleTicks() {
    if (!prizes.length) return;

    const n = prizes.length;
    const sliceRad = TAU / n;

    const tickCount = Math.floor(normRad(angle) / sliceRad);

    if (tickCount !== lastTickCount) {
      lastTickCount = tickCount;
      play_tick();
      pointerBounceVel = -0.22;
    }
  }

  function renderFrame() {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.globalAlpha = currentEraseAlpha;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();

    const d = angle - lastAngle;
    const ad = Math.abs(d);
    const steps = Math.max(1, Math.min(MAX_SUBSTEPS, Math.ceil(ad / SUBSTEP)));
    const step = d / steps;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.globalAlpha = currentSmudgeAlpha;

    for (let s = 1; s <= steps; s++) {
      const a = lastAngle + step * s;
      ctx.save();
      ctx.rotate(a);
      ctx.drawImage(off, -cx, -cy);
      ctx.restore();
    }

    ctx.restore();

    pointerBounce += pointerBounceVel;
    pointerBounceVel *= 0.55;
    pointerBounce *= 0.30;

    pointerEl.style.transform = `translateY(-50%) rotate(${pointerBounce}rad)`;

    lastAngle = angle;
    handleTicks();
  }

  function animate(now) {
    if (!isSpinning) return;

    const t = Math.min(1, (now - spinStart) / spinDuration);
    const ease = easeOutCubic(t);

    currentSmudgeAlpha = 0.05 + 0.95 * ease;
    currentEraseAlpha = 0.08 * (1 - ease);

    angle = normRad(angleStart + targetDelta * ease);
    renderFrame();

    if (t < 1) {
      animReq = requestAnimationFrame(animate);
    } else {
      angle = normRad(angleStart + targetDelta);

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      ctx.drawImage(off, -cx, -cy);
      ctx.restore();

      pointerBounce = 0;
      pointerBounceVel = 0;
      pointerEl.style.transform = `translateY(-50%) rotate(0rad)`;

      isSpinning = false;

      if (selected_prize) {
        startConfetti();
        show_modal(selected_prize.name);
      }
    }
  }

  async function fetch_prizes() {
    try {
      const res = await fetch("/api/get-prizes");
      if (!res.ok) throw new Error("Failed to load prizes");
      const newPrizes = await res.json();

      prizes = newPrizes;
      await ensureWheelFontsReady();

      if (!isSpinning) {
        buildWheelBuffer();
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.drawImage(off, -cx, -cy);
        ctx.restore();
      }
    } catch (err) {
      console.error("fetch_prizes", err);
    }
  }

  function show_modal(name) {
    prizeText.textContent = name;
    modal.style.display = "flex";
    modal.setAttribute("aria-hidden", "false");

    try {
      if (cardEl) {
        cardEl.style.position = 'absolute';
        const rect = canvas.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const left = rect.left + rect.width / 2 - cardRect.width / 2;
        const top = rect.top + rect.height / 2 - cardRect.height / 2;
        cardEl.style.left = `${Math.round(left)}px`;
        cardEl.style.top = `${Math.round(top)}px`;
        cardEl.style.zIndex = '10';
      }
    } catch (e) {
    }
  }

  function hide_modal() {
    modal.style.display = "none";
    modal.setAttribute("aria-hidden", "true");

    try {
      if (cardEl) {
        cardEl.style.left = '';
        cardEl.style.top = '';
        cardEl.style.position = '';
        cardEl.style.zIndex = '';
      }
    } catch (e) {}
  }

  async function claim_prize() {
    if (!selected_prize) return;
    try {
      const res = await fetch("/api/claim-prize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected_prize.id })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "claim failed");
      }

      hide_modal();
      selected_prize = null;
      await fetch_prizes();
    } catch (err) {
      console.error("claim_prize", err);
      hide_modal();
    }
  }

  async function start_spin() {
    if (isSpinning || !prizes.length || (modal && modal.getAttribute("aria-hidden") === "false")) return;

    try {
      const res = await fetch("/api/select-prize", { method: "POST" });
      if (!res.ok) throw new Error("select-prize failed");

      const data = await res.json();
      selected_prize = data;

      const index = prizes.findIndex(p => Number(p.id) === Number(data.id));
      if (index < 0) {
        await fetch_prizes();
        selected_prize = null;
        return;
      }

      const n = prizes.length;
      const sliceRad = TAU / n;

      const center = index * sliceRad + sliceRad / 2;
      const jitter = (Math.random() - 0.5) * (sliceRad * 0.9);

      const desiredFinal = normRad(-(center + jitter));
      angleStart = angle;
      const rel = normRad(desiredFinal - angleStart);

      const spins = 6;
      targetDelta = spins * TAU + rel;

      spinStart = performance.now();
      spinDuration = 6000;
      lastAngle = angle;
      isSpinning = true;

      if (animReq) cancelAnimationFrame(animReq);
      animReq = requestAnimationFrame(animate);
    } catch (err) {
      console.error("start_spin", err);
    }
  }

  canvas.addEventListener("click", start_spin);

  window.addEventListener("keydown", (e) => {
    const k = (e.key || "").toLowerCase();

    if (k === "enter") {
      start_spin();
    } else if (k === "f") {
      e.preventDefault();
      toggleFullscreen();
    } else if (k === "escape") {
      if (fsElement()) exitFullscreen();
    }
  });

  cancelBtn.addEventListener("click", hide_modal);
  claimBtn.addEventListener("click", claim_prize);

  (async () => {
    await fetch_prizes();
    buildWheelBuffer();
    ctx.clearRect(0, 0, w, h);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.drawImage(off, -cx, -cy);
    ctx.restore();
    try {
      if (pointerEl) pointerEl.style.transform = `translateY(-50%) rotate(0rad)`;
    } catch (e) {}
  })();
})();

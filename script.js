/**
 * ==========================================================================
 * AKKA'S BIRTHDAY - MODERN INSTAGRAM/PINTEREST SURPRISE ENGINE
 * Pure Vanilla JavaScript (No Frameworks)
 * ==========================================================================
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CONFIGURATION & STATE
  // ---------------------------------------------------------------------------
  const CONFIG = {
    audioPath: 'assets/Sivappu Manjal Pachai Bgm.mp3',
    fallbackAudioPath: 'assets/birthday-song.wav',
    volume: 0.35,
    storageKeys: {
      isPlaying: 'akka_modern_music_playing',
      currentTime: 'akka_modern_music_time',
      hasInteracted: 'akka_modern_interacted'
    }
  };

  // ---------------------------------------------------------------------------
  // 2. CURSOR GLOW (Desktop)
  // ---------------------------------------------------------------------------
  function initCursorGlow() {
    if (window.innerWidth < 900) return;

    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.appendChild(glow);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let currentX = mouseX;
    let currentY = mouseY;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderGlow() {
      currentX += (mouseX - currentX) * 0.15;
      currentY += (mouseY - currentY) * 0.15;
      glow.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) translate(-50%, -50%)`;
      requestAnimationFrame(renderGlow);
    }
    requestAnimationFrame(renderGlow);
  }

  // ---------------------------------------------------------------------------
  // 3. PAGE TRANSITIONS (Fade Out + Scale Down -> Fade In + Scale Up)
  // ---------------------------------------------------------------------------
  function initPageTransitions() {
    let curtain = document.querySelector('.page-transition-curtain');
    if (!curtain) {
      curtain = document.createElement('div');
      curtain.className = 'page-transition-curtain';
      document.body.appendChild(curtain);
    }

    // Smooth entrance
    requestAnimationFrame(() => {
      setTimeout(() => {
        curtain.classList.add('loaded');
      }, 50);
    });

    // Intercept internal links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (href && !href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('http') && href.endsWith('.html')) {
        e.preventDefault();
        saveMusicState();

        curtain.classList.remove('loaded');
        curtain.classList.add('exiting');

        setTimeout(() => {
          window.location.href = href;
        }, 550);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. MUSIC CONTROLLER (With Web Audio Synthesizer Fallback)
  // ---------------------------------------------------------------------------
  let audioEl = null;
  let audioCtx = null;
  let synthTimer = null;
  let isSynthRunning = false;

  function initAudioSystem() {
    audioEl = document.getElementById('bgMusic');
    if (!audioEl) {
      audioEl = document.createElement('audio');
      audioEl.id = 'bgMusic';
      audioEl.loop = true;
      audioEl.preload = 'auto';

      const src1 = document.createElement('source');
      src1.src = CONFIG.audioPath;
      src1.type = 'audio/mpeg';

      const src2 = document.createElement('source');
      src2.src = 'assets/birthday-song.mp3';
      src2.type = 'audio/mpeg';

      const src3 = document.createElement('source');
      src3.src = CONFIG.fallbackAudioPath;
      src3.type = 'audio/wav';

      audioEl.appendChild(src1);
      audioEl.appendChild(src2);
      audioEl.appendChild(src3);
      document.body.appendChild(audioEl);
    }

    audioEl.volume = CONFIG.volume;

    // Restore time
    const savedTime = sessionStorage.getItem(CONFIG.storageKeys.currentTime);
    if (savedTime && !isNaN(savedTime)) {
      audioEl.currentTime = parseFloat(savedTime);
    }

    setInterval(saveMusicState, 1000);
    setupMusicButton();

    // Check if was already playing
    const wasPlaying = sessionStorage.getItem(CONFIG.storageKeys.isPlaying) === 'true';
    if (wasPlaying) {
      attemptPlayAudio();
    }

    // Auto-start on first click anywhere
    const unlockAudio = () => {
      sessionStorage.setItem(CONFIG.storageKeys.hasInteracted, 'true');
      attemptPlayAudio();
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };

    if (sessionStorage.getItem(CONFIG.storageKeys.hasInteracted) !== 'true') {
      document.addEventListener('click', unlockAudio, { once: true });
      document.addEventListener('touchstart', unlockAudio, { once: true });
    }
  }

  function saveMusicState() {
    if (audioEl) {
      const isPlaying = !audioEl.paused || isSynthRunning;
      sessionStorage.setItem(CONFIG.storageKeys.isPlaying, isPlaying ? 'true' : 'false');
      sessionStorage.setItem(CONFIG.storageKeys.currentTime, audioEl.currentTime || 0);
    }
  }

  function attemptPlayAudio() {
    if (!audioEl) return;

    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => updateMusicUI(true))
        .catch(() => {
          if (sessionStorage.getItem(CONFIG.storageKeys.hasInteracted) === 'true') {
            startMelodicSynth();
            updateMusicUI(true);
          }
        });
    }
  }

  function pauseAudio() {
    if (audioEl) audioEl.pause();
    stopMelodicSynth();
    updateMusicUI(false);
    saveMusicState();
  }

  function toggleMusic() {
    const isPlaying = (!audioEl.paused) || isSynthRunning;
    if (isPlaying) {
      pauseAudio();
    } else {
      sessionStorage.setItem(CONFIG.storageKeys.hasInteracted, 'true');
      attemptPlayAudio();
    }
  }

  function updateMusicUI(isPlaying) {
    const btn = document.querySelector('.music-toggle-btn');
    if (!btn) return;

    const label = btn.querySelector('.music-status-text');
    if (isPlaying) {
      btn.classList.add('music-playing');
      if (label) label.textContent = 'Music On';
    } else {
      btn.classList.remove('music-playing');
      if (label) label.textContent = 'Music Off';
    }
  }

  function setupMusicButton() {
    let btn = document.querySelector('.music-toggle-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'music-toggle-btn';
      btn.setAttribute('aria-label', 'Toggle Background Music');
      btn.innerHTML = `
        <span class="music-icon">🎵</span>
        <div class="music-equalizer">
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
          <div class="eq-bar"></div>
        </div>
        <span class="music-status-text">Music Off</span>
      `;
      document.body.appendChild(btn);
    }

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      playSparkleTone();
      toggleMusic();
    });
  }

  // Web Audio Melodic Synth Fallback
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) audioCtx = new AudioCtxClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playSynthNote(freq, startTime, duration) {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.001, startTime);
    gain.gain.linearRampToValueAtTime(0.12, startTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  function playSparkleTone() {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    playSynthNote(523.25, now, 0.3); // C5
    playSynthNote(659.25, now + 0.08, 0.4); // E5
    playSynthNote(783.99, now + 0.16, 0.6); // G5
  }

  function startMelodicSynth() {
    if (isSynthRunning) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    isSynthRunning = true;
    const melody = [
      { f: 392.00, d: 0.35 }, { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.6 },
      { f: 392.00, d: 0.6 }, { f: 523.25, d: 0.6 }, { f: 493.88, d: 1.0 },
      { f: 392.00, d: 0.35 }, { f: 392.00, d: 0.25 }, { f: 440.00, d: 0.6 },
      { f: 392.00, d: 0.6 }, { f: 587.33, d: 0.6 }, { f: 523.25, d: 1.0 }
    ];

    let idx = 0;
    const loop = () => {
      if (!isSynthRunning) return;
      const cur = melody[idx];
      playSynthNote(cur.f, ctx.currentTime, cur.d);
      idx = (idx + 1) % melody.length;
      synthTimer = setTimeout(loop, cur.d * 1000 + 120);
    };
    loop();
  }

  function stopMelodicSynth() {
    isSynthRunning = false;
    if (synthTimer) {
      clearTimeout(synthTimer);
      synthTimer = null;
    }
  }

  // ---------------------------------------------------------------------------
  // 5. FLOATING SPARKLES & STARS CANVAS
  // ---------------------------------------------------------------------------
  function initSparklesCanvas() {
    let canvas = document.getElementById('particleCanvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.id = 'particleCanvas';
      document.body.appendChild(canvas);
    }

    const ctx = canvas.getContext('2d');
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const sparkles = [];
    const count = window.innerWidth < 768 ? 25 : 50;
    const colors = ['#f472b6', '#c084fc', '#fbcfe8', '#fed7aa', '#93c5fd', '#ffffff'];

    for (let i = 0; i < count; i++) {
      sparkles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 1.5 + Math.random() * 3,
        speedY: -0.2 - Math.random() * 0.6,
        speedX: -0.3 + Math.random() * 0.6,
        alpha: 0.2 + Math.random() * 0.8,
        alphaSpeed: 0.01 + Math.random() * 0.02,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function animateSparkles() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < sparkles.length; i++) {
        const s = sparkles[i];
        s.y += s.speedY;
        s.x += s.speedX;
        s.alpha += s.alphaSpeed;

        if (s.alpha > 0.9 || s.alpha < 0.1) {
          s.alphaSpeed = -s.alphaSpeed;
        }

        if (s.y < -10) {
          s.y = height + 10;
          s.x = Math.random() * width;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = s.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      requestAnimationFrame(animateSparkles);
    }
    requestAnimationFrame(animateSparkles);
  }

  // ---------------------------------------------------------------------------
  // 6. FIREWORKS & CONFETTI ENGINES
  // ---------------------------------------------------------------------------
  let fwCanvas = null;
  let fwCtx = null;
  let fwParticles = [];

  function initFireworksEngine() {
    fwCanvas = document.getElementById('fireworkCanvas');
    if (!fwCanvas) {
      fwCanvas = document.createElement('canvas');
      fwCanvas.id = 'fireworkCanvas';
      document.body.appendChild(fwCanvas);
    }
    fwCtx = fwCanvas.getContext('2d');
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      if (fwCanvas) {
        fwCanvas.width = window.innerWidth;
        fwCanvas.height = window.innerHeight;
      }
    });

    function loop() {
      if (fwParticles.length > 0) {
        fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);

        for (let i = fwParticles.length - 1; i >= 0; i--) {
          const p = fwParticles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.gravity;
          p.alpha -= p.fade;
          p.size *= 0.98;

          if (p.alpha <= 0.05 || p.size <= 0.4) {
            fwParticles.splice(i, 1);
            continue;
          }

          fwCtx.save();
          fwCtx.globalAlpha = p.alpha;
          fwCtx.fillStyle = p.color;
          fwCtx.shadowBlur = 12;
          fwCtx.shadowColor = p.color;
          fwCtx.beginPath();
          fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          fwCtx.fill();
          fwCtx.restore();
        }
      }
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function launchFirework(x, y, count = 55) {
    if (!fwCanvas) return;
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#f43f5e', '#fbbf24', '#a855f7', '#ffffff'];
    const col = colors[Math.floor(Math.random() * colors.length)];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2 + Math.random() * 6.5;
      fwParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.05,
        size: 3 + Math.random() * 3,
        alpha: 1,
        fade: 0.016 + Math.random() * 0.014,
        color: Math.random() > 0.4 ? col : colors[Math.floor(Math.random() * colors.length)]
      });
    }
  }

  function triggerCelebrationFireworks(durationMs = 3000) {
    const start = Date.now();
    const interval = setInterval(() => {
      const x = 0.2 * window.innerWidth + Math.random() * (0.6 * window.innerWidth);
      const y = 0.18 * window.innerHeight + Math.random() * (0.45 * window.innerHeight);
      launchFirework(x, y, 45);
      if (Date.now() - start > durationMs) {
        clearInterval(interval);
      }
    }, 280);
  }

  function launchConfetti(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    const colors = ['#ec4899', '#8b5cf6', '#3b82f6', '#fbbf24', '#f472b6', '#c084fc', '#6ee7b7'];
    const count = 50;

    for (let i = 0; i < count; i++) {
      const el = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const w = 7 + Math.random() * 8;
      const h = 10 + Math.random() * 12;

      el.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        width: ${w}px;
        height: ${h}px;
        background-color: ${color};
        z-index: 9999;
        pointer-events: none;
        border-radius: 3px;
        will-change: transform, opacity;
      `;
      document.body.appendChild(el);

      const destX = (Math.random() - 0.5) * window.innerWidth * 0.85;
      const destY = -120 - Math.random() * 350;
      const fallY = destY + 650 + Math.random() * 350;
      const rot = Math.random() * 720 - 360;

      el.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg) scale(1)', opacity: 1 },
          { transform: `translate(${destX * 0.4}px, ${destY}px) rotate(${rot * 0.4}deg) scale(1.2)`, opacity: 1, offset: 0.3 },
          { transform: `translate(${destX}px, ${fallY}px) rotate(${rot}deg) scale(0.6)`, opacity: 0 }
        ],
        {
          duration: 2200 + Math.random() * 800,
          easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
        }
      ).onfinish = () => el.remove();
    }
  }

  // ---------------------------------------------------------------------------
  // 7. MOBILE MENU DRAWER
  // ---------------------------------------------------------------------------
  function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const drawer = document.querySelector('.mobile-nav-drawer');
    const closeBtn = document.querySelector('.mobile-drawer-close');
    const backdrop = document.querySelector('.mobile-backdrop');

    if (!menuBtn || !drawer) return;

    function open() {
      drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    }
    function close() {
      drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
    }

    menuBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (backdrop) backdrop.addEventListener('click', close);
  }

  // ---------------------------------------------------------------------------
  // 8. PAGE CONTROLLER: index.html
  // ---------------------------------------------------------------------------
  function initIndexPage() {
    const btn = document.getElementById('startSurpriseBtn');
    if (!btn) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      playSparkleTone();
      attemptPlayAudio();

      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      launchConfetti(cx, cy);
      launchFirework(cx, cy, 60);

      setTimeout(() => {
        saveMusicState();
        const curtain = document.querySelector('.page-transition-curtain');
        if (curtain) {
          curtain.classList.remove('loaded');
          curtain.classList.add('exiting');
        }
        setTimeout(() => {
          window.location.href = 'birthday.html';
        }, 550);
      }, 700);
    });
  }

  // ---------------------------------------------------------------------------
  // 9. PAGE CONTROLLER: birthday.html
  // ---------------------------------------------------------------------------
  function initBirthdayPage() {
    const cakeBox = document.getElementById('interactiveCake');
    const wishCard = document.getElementById('wishCard');
    let blown = false;

    if (!cakeBox) return;

    cakeBox.addEventListener('click', () => {
      if (blown) return;
      blown = true;

      playSparkleTone();
      cakeBox.classList.add('cake-blown');

      // Confetti & Fireworks celebration
      const rect = cakeBox.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 3;

      launchConfetti(cx, cy);
      triggerCelebrationFireworks(2800);

      setTimeout(() => {
        if (wishCard) {
          wishCard.classList.add('show');
          wishCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 600);
    });
  }

  // ---------------------------------------------------------------------------
  // 10. PAGE CONTROLLER: message.html (Staggered Reveal)
  // ---------------------------------------------------------------------------
  function initMessagePage() {
    const paragraphs = document.querySelectorAll('.message-paragraph');
    const signoff = document.querySelector('.message-signoff');
    const closing = document.querySelector('.message-closing-section');

    if (!paragraphs.length) return;

    paragraphs.forEach((p, index) => {
      setTimeout(() => {
        p.classList.add('revealed');
      }, 350 + index * 550);
    });

    const totalDelay = 350 + paragraphs.length * 550;

    if (signoff) {
      setTimeout(() => {
        signoff.classList.add('revealed');
      }, totalDelay + 300);
    }

    if (closing) {
      setTimeout(() => {
        closing.classList.add('revealed');
      }, totalDelay + 700);
    }
  }

  // ---------------------------------------------------------------------------
  // 12. PAGE CONTROLLER: surprise.html (8-Step Grand Animation Sequence)
  // ---------------------------------------------------------------------------
  function initSurprisePage() {
    const openBtn = document.getElementById('openFinalSurpriseBtn');
    const teaserBox = document.querySelector('.teaser-box');
    const grandCard = document.querySelector('.grand-reveal-card');
    const replayBtn = document.getElementById('replayCelebrationBtn');

    if (!openBtn) return;

    openBtn.addEventListener('click', () => {
      playSparkleTone();
      attemptPlayAudio();

      openBtn.disabled = true;

      // Step 1: Screen flashes softly
      const flash = document.createElement('div');
      flash.className = 'screen-flash-overlay flash';
      document.body.appendChild(flash);

      setTimeout(() => {
        if (teaserBox) teaserBox.classList.add('hide');

        // Step 2 & 3: Confetti & Fireworks explode
        launchConfetti(window.innerWidth / 2, window.innerHeight / 2);
        triggerCelebrationFireworks(4500);

        setTimeout(() => {
          flash.classList.remove('flash');
          setTimeout(() => flash.remove(), 600);

          // Step 4, 5, 6, 7, 8: Grand reveal & rising balloons
          if (grandCard) {
            grandCard.classList.add('active');
            grandCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }, 400);
    });

    if (replayBtn) {
      replayBtn.addEventListener('click', () => {
        playSparkleTone();
        launchConfetti(window.innerWidth / 2, window.innerHeight / 3);
        triggerCelebrationFireworks(2500);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 12. DYNAMIC LIVE DATE & DAY DISPLAY
  // ---------------------------------------------------------------------------
  function initLiveDate() {
    const dateContainers = document.querySelectorAll('.live-date-text');
    if (!dateContainers.length) return;

    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('en-US', options);

    dateContainers.forEach((el) => {
      el.innerHTML = `📅 <strong>${dateStr}</strong> • Akka's Special Day ✨`;
    });
  }

  // ---------------------------------------------------------------------------
  // 13. DOM READY INITIALIZATION
  // ---------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initCursorGlow();
    initPageTransitions();
    initAudioSystem();
    initSparklesCanvas();
    initFireworksEngine();
    initMobileMenu();
    initLiveDate();

    const path = window.location.pathname.toLowerCase();
    if (path.includes('birthday.html')) {
      initBirthdayPage();
    } else if (path.includes('message.html')) {
      initMessagePage();
    } else if (path.includes('surprise.html')) {
      initSurprisePage();
    } else {
      initIndexPage();
    }
  });

})();


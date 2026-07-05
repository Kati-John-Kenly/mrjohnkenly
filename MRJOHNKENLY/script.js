// Small UI interactions for the mockup

// Responsive mobile navigation toggle
(function () {
  const menuToggle = document.querySelector('.menu-toggle');
  const headerActions = document.querySelector('.header-actions');
  const navLinks = Array.from(document.querySelectorAll('.site-nav .nav-link'));
  const body = document.body;
  let backgroundPauseTimer;

  function pauseBackground() {
    body.classList.add('background-paused');
    clearTimeout(backgroundPauseTimer);
    backgroundPauseTimer = window.setTimeout(() => body.classList.remove('background-paused'), 800);
  }

  if (!menuToggle || !headerActions) return;

  const closeMenu = () => {
    headerActions.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  menuToggle.addEventListener('click', () => {
    const isOpen = headerActions.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    if (isOpen) pauseBackground();
    else body.classList.remove('background-paused');
  });

  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      pauseBackground();
      if (window.innerWidth <= 900) closeMenu();
    });
  });

  document.addEventListener('click', (event) => {
    if (window.innerWidth > 900) return;
    if (!menuToggle.contains(event.target) && !headerActions.contains(event.target)) {
      closeMenu();
      body.classList.remove('background-paused');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) closeMenu();
  });
})();

// Single-page panel navigation
(function () {
  const pageLinks = Array.from(document.querySelectorAll('nav a[href^="#"], .cta a[href^="#"]'));
  const panels = Array.from(document.querySelectorAll('.page-panel'));

  function activatePanel(hash) {
    const panelId = (hash || '#home').replace('#', '') || 'home';
    const targetPanel = document.getElementById(panelId);
    if (!targetPanel) return;

    panels.forEach(panel => panel.classList.toggle('active', panel === targetPanel));

    pageLinks.forEach(link => {
      const href = link.getAttribute('href');
      const isActive = href === `#${panelId}`;
      link.classList.toggle('active', isActive);
      if (isActive) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (window.history.replaceState) {
      const url = new URL(window.location.href);
      url.hash = panelId === 'home' ? '' : `#${panelId}`;
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const targetPanel = document.getElementById(href.replace('#', ''));
    if (!targetPanel) return;

    event.preventDefault();
    activatePanel(href);
  });

  activatePanel(window.location.hash || '#home');
})();

// Keyboard focus outline for accessibility
(function() {
  function handleFirstTab(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('user-is-tabbing');
      window.removeEventListener('keydown', handleFirstTab);
    }
  }
  window.addEventListener('keydown', handleFirstTab);
})();

// Theme switching (single toggle switch)
(function() {
  const themeToggle = document.querySelector('.theme-toggle');
  const html = document.documentElement;

  if (!themeToggle) return;

  function applyTheme(theme){
    const isLight = theme === 'light';
    html.setAttribute('data-theme', isLight ? 'light' : '');
    themeToggle.setAttribute('aria-pressed', String(isLight));
    themeToggle.title = isLight ? 'Switch to dark theme' : 'Switch to light theme';
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  }

  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(initial);

  themeToggle.addEventListener('click', () => {
    const nextTheme = themeToggle.getAttribute('aria-pressed') === 'true' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });
})();

// Like button with local persistence (single-like toggle)
(function(){
  const likeBtn = document.querySelector('.like-btn');
  const countEl = likeBtn && likeBtn.querySelector('.like-count');
  if (!likeBtn || !countEl) return;

  let count = parseInt(localStorage.getItem('likeCount') || '0', 10);
  let liked = localStorage.getItem('liked') === 'true';

  function render(){
    countEl.textContent = count;
    likeBtn.classList.toggle('liked', liked);
    likeBtn.setAttribute('aria-pressed', liked);
  }

  likeBtn.addEventListener('click', () => {
    if (liked) { count = Math.max(0, count - 1); liked = false; }
    else { count += 1; liked = true; }
    localStorage.setItem('likeCount', String(count));
    localStorage.setItem('liked', String(liked));
    render();

    // small pop animation
    likeBtn.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.08)' },
      { transform: 'scale(1)' }
    ], { duration: 180, easing: 'ease-out' });
  });

  render();
})();

// Small click feedback animation for nav anchors (respects reduced-motion)
(function(){
  const navLinks = Array.from(document.querySelectorAll('nav a[href^="#"]'));
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!prefersReduced) {
    navLinks.forEach(a => {
      a.addEventListener('click', () => {
        a.classList.remove('clicked');
        void a.offsetWidth;
        a.classList.add('clicked');
        setTimeout(() => a.classList.remove('clicked'), 320);
      });
    });
  }
})();

// Viewer count (client-side demo only — requires a backend to be global)
(function(){
  const viewersEl = document.querySelector('.viewer-count');
  if (!viewersEl) return;

  const today = new Date().toISOString().slice(0,10);
  const seenKey = 'viewedAt';
  const countKey = 'viewerCount';

  let count = parseInt(localStorage.getItem(countKey) || '0', 10);
  const seen = localStorage.getItem(seenKey);

  // Only increment once per day per browser (client-side demo)
  if (seen !== today) {
    count = count + 1;
    localStorage.setItem(countKey, String(count));
    localStorage.setItem(seenKey, today);
  }

  viewersEl.textContent = String(count);

  // small pop animation on load to draw attention
  if (typeof viewersEl.animate === 'function') {
    viewersEl.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.08)' },
      { transform: 'scale(1)' }
    ], { duration: 260, easing: 'ease-out' });
  }

})();

// Skill bars (percentage visuals)
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const list = document.querySelector('.skills-list');
  if (!list) return;
  const skills = Array.from(list.querySelectorAll('.skill'));
  if (!skills.length) return;

  function applyWidths(animate = true){
    skills.forEach(s => {
      const pct = parseInt(s.dataset.percent || '0', 10);
      const fill = s.querySelector('.skill-fill');
      const bar = s.querySelector('.skill-bar');
      const value = s.querySelector('.skill-value');
      if (bar) bar.setAttribute('aria-valuenow', String(pct));
      if (!fill) return;
      if (!animate || prefersReduced){
        fill.style.width = pct + '%';
      } else {
        // ensure width change happens on the next frame so transitions apply
        requestAnimationFrame(() => { fill.style.width = pct + '%'; });
      }
      if (value) value.textContent = pct + '%';
    });
  }

  // Animate when the list scrolls into view (or set immediately if no observer)
  if ('IntersectionObserver' in window && !prefersReduced) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          applyWidths(true);
          o.disconnect();
        }
      });
    }, { threshold: 0.2 });
    obs.observe(list);
  } else {
    applyWidths(false);
  }
})();

// Ambient audio toggle with generated non-copyright lo-fi ambience
(function(){
  const audioToggle = document.querySelector('.audio-toggle');
  const audioControl = document.querySelector('.audio-control');
  if (!audioToggle) return;

  let audioContext;
  let masterGain;
  let oscillators = [];
  let isPlaying = false;

  function ensureAudio(){
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = audioContext.createGain();
      masterGain.gain.value = 0;

      const filterNode = audioContext.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 720;

      masterGain.connect(filterNode);
      filterNode.connect(audioContext.destination);

      const freqs = [432, 540, 648];
      oscillators = freqs.map((freq, index) => {
        const osc = audioContext.createOscillator();
        osc.type = index === 0 ? 'sine' : 'triangle';
        osc.frequency.value = freq;
        const gain = audioContext.createGain();
        gain.gain.value = 0;
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start();
        return { osc, gain };
      });
    }
  }

  audioToggle.addEventListener('click', async () => {
    isPlaying = !isPlaying;
    audioToggle.setAttribute('aria-pressed', String(isPlaying));
    audioControl && audioControl.classList.toggle('is-active', isPlaying);
    audioToggle.title = isPlaying ? 'Pause ambient sound' : 'Start ambient sound';

    ensureAudio();

    if (isPlaying) {
      if (audioContext.state === 'suspended') await audioContext.resume();
      const now = audioContext.currentTime;
      oscillators.forEach((node, index) => {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.setValueAtTime(0, now);
        node.gain.gain.linearRampToValueAtTime(index === 0 ? 0.028 : 0.018, now + 0.35 + index * 0.1);
      });
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.linearRampToValueAtTime(0.06, now + 0.35);
    } else {
      const now = audioContext.currentTime;
      oscillators.forEach(node => {
        node.gain.gain.cancelScheduledValues(now);
        node.gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
      });
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.25);
    }
  });
})();

// First-load animation trigger
window.addEventListener('load', () => {
  window.setTimeout(() => {
    document.body.classList.add('loaded');
  }, 650);
});

// Custom cursor and click sparkles
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (prefersReduced || isTouch || window.innerWidth < 640) return;

  const ring = document.createElement('div');
  ring.className = 'cursor-ring';
  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const symbol = document.createElement('div');
  symbol.className = 'cursor-symbol';
  document.body.append(ring, dot, symbol);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let dotX = mouseX;
  let dotY = mouseY;

  function moveCursor(x, y){
    mouseX = x;
    mouseY = y;
  }

  document.addEventListener('mousemove', (e) => moveCursor(e.clientX, e.clientY));
  document.addEventListener('mousedown', (e) => {
    symbol.textContent = ['♪', '♩', '◌', '✦'][Math.floor(Math.random() * 4)];
    symbol.style.opacity = '1';
    symbol.style.left = `${e.clientX}px`;
    symbol.style.top = `${e.clientY}px`;
    symbol.animate([
      { transform: 'translate(-50%, -50%) scale(0.6)', opacity: 0.9 },
      { transform: 'translate(-50%, -120%) scale(1.2)', opacity: 0 }
    ], { duration: 500, easing: 'ease-out' });
    setTimeout(() => (symbol.style.opacity = '0'), 480);
  });

  document.querySelectorAll('a, button, .card, .profile-card, input, textarea, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring.classList.add('hover');
      dot.classList.add('hover');
    });
    el.addEventListener('mouseleave', () => {
      ring.classList.remove('hover');
      dot.classList.remove('hover');
    });
  });

  function animate(){
    ringX += (mouseX - ringX) * 0.16;
    ringY += (mouseY - ringY) * 0.16;
    dotX += (mouseX - dotX) * 0.28;
    dotY += (mouseY - dotY) * 0.28;
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    dot.style.left = `${dotX}px`;
    dot.style.top = `${dotY}px`;
    requestAnimationFrame(animate);
  }
  animate();
})();

// Back to top button behavior
(function(){
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  const showAt = 300; // show after 300px scroll
  let ticking = false;

  function updateVisibility(){
    if (window.scrollY > showAt) {
      btn.classList.add('visible');
      btn.setAttribute('aria-hidden', 'false');
    } else {
      btn.classList.remove('visible');
      btn.setAttribute('aria-hidden', 'true');
    }
  }

  window.addEventListener('scroll', function(){
    if (!ticking) {
      window.requestAnimationFrame(function(){ updateVisibility(); ticking = false; });
      ticking = true;
    }
  }, { passive: true });

  btn.addEventListener('click', function(){
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    btn.blur();
  });

  btn.addEventListener('keydown', function(e){ if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); btn.click(); } });

  // initialize state
  updateVisibility();
})();

// Cursor follower (subtle trailing dot)
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (prefersReduced || isTouch || window.innerWidth < 640) return; // opt-out for touch/small screens or reduced-motion

  const follower = document.createElement('div');
  follower.className = 'cursor-follower';
  follower.setAttribute('aria-hidden', 'true');
  document.body.appendChild(follower);

  let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
  let posX = mouseX, posY = mouseY;
  const speed = 0.16;
  let visible = false;

  function onMove(e){
    mouseX = e.clientX; mouseY = e.clientY;
    if (!visible){ follower.style.opacity = '1'; visible = true; }
  }
  function onLeave(){ follower.style.opacity = '0'; visible = false; }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('mouseout', (e) => { if (!e.relatedTarget) onLeave(); });
  window.addEventListener('mouseleave', onLeave);

  // enlarge when hovering interactive controls
  const interactive = "a, button, .btn, .social-link, input, textarea, .card, .profile-card";
  document.querySelectorAll(interactive).forEach(el => {
    el.addEventListener('mouseenter', () => follower.classList.add('cursor-follower--hover'));
    el.addEventListener('mouseleave', () => follower.classList.remove('cursor-follower--hover'));
    el.addEventListener('focus', () => follower.classList.add('cursor-follower--hover'));
    el.addEventListener('blur', () => follower.classList.remove('cursor-follower--hover'));
  });

  function animate(){
    posX += (mouseX - posX) * speed;
    posY += (mouseY - posY) * speed;
    follower.style.transform = `translate3d(${posX}px, ${posY}px, 0) translate(-50%, -50%)`;
    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);

  // hide on touchstart
  window.addEventListener('touchstart', () => { follower.style.display = 'none'; }, { passive: true });
})();

// Page-enter reveal animations (run once per session)
(function(){
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const doneKey = 'pageIntroDone';
  if (prefersReduced) {
    // show everything immediately
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    sessionStorage.setItem(doneKey, 'true');
    return;
  }

  if (sessionStorage.getItem(doneKey)) {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
    return;
  }

  // Choose elements to reveal in order
  const nodes = Array.from(document.querySelectorAll('header, .hero, main > section, footer'));
  const elements = nodes.filter(Boolean);
  elements.forEach((el, i) => {
    el.classList.add('reveal');
    el.classList.add(i % 2 === 0 ? 'left' : 'right');
    // use inline style var for stagger delay if desired
    el.style.setProperty('--delay', `${i * 0.09}s`);
  });

  // Staggered entrance
  elements.forEach((el, i) => {
    setTimeout(() => el.classList.add('in'), 180 + i * 100);
  });

  // mark done for this session
  sessionStorage.setItem(doneKey, 'true');
})();

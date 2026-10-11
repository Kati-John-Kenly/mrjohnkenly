(() => {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const menuPanel = document.querySelector(".header-menu");
  const navigation = document.querySelector(".site-nav");
  const navLinks = [...document.querySelectorAll(".nav-link")];
  const progressBar = document.querySelector(".scroll-progress");
  const themeToggle = document.querySelector(".theme-toggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const savedTheme = window.localStorage.getItem("portfolio-theme");
  const initialTheme = savedTheme === "dark" ? "dark" : "light";

  function applyTheme(theme, save = true) {
    const isDark = theme === "dark";
    document.documentElement.dataset.theme = theme;
    if (themeToggle) {
      const label = `Switch to ${isDark ? "light" : "dark"} theme`;
      themeToggle.setAttribute("aria-label", label);
      themeToggle.setAttribute("title", label);
      themeToggle.setAttribute("aria-pressed", String(isDark));
    }
    if (themeColor) themeColor.setAttribute("content", isDark ? "#191b17" : "#f5f4ef");
    if (save) window.localStorage.setItem("portfolio-theme", theme);
  }

  applyTheme(initialTheme, false);
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
    });
  }

  const audioToggle = document.querySelector(".audio-toggle");
  const audioLabel = document.querySelector(".audio-toggle-label");
  let audioContext = null;
  let masterGain = null;
  let audioCompressor = null;
  let schedulerInterval = 0;
  let nextStepTime = 0;
  let musicStep = 0;
  let isAudioPlaying = false;
  let isAudioStarting = false;
  let closeAudioTimer = 0;

  function updateAudioControl(isPlaying) {
    isAudioPlaying = isPlaying;
    if (!audioToggle || !audioLabel) return;
    audioToggle.setAttribute("aria-pressed", String(isPlaying));
    audioToggle.setAttribute("aria-label", `Turn original ambient music ${isPlaying ? "off" : "on"}`);
    audioToggle.setAttribute("title", `Turn original ambient music ${isPlaying ? "off" : "on"}`);
    audioLabel.textContent = `Music ${isPlaying ? "on" : "off"}`;
  }

  function playSoftNote(context, destination, time, frequency, level, duration) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    envelope.gain.setValueAtTime(0.001, time);
    envelope.gain.linearRampToValueAtTime(level, time + 0.12);
    envelope.gain.setTargetAtTime(0.001, time + duration - 0.5, 0.3);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(time);
    oscillator.stop(time + duration);
  }

  function playMusicStep(context, time, step) {
    const chordProgression = [
      [261.63, 329.63, 392, 523.25],
      [220, 261.63, 329.63, 440],
      [174.61, 220, 261.63, 349.23],
      [196, 261.63, 329.63, 392]
    ];
    const melody = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 523.25, 659.25];
    const chordIndex = Math.floor(step / 4) % chordProgression.length;
    const chord = chordProgression[chordIndex];

    if (step % 4 === 0) {
      chord.forEach((frequency, index) => {
        playSoftNote(context, masterGain, time, frequency, index === 0 ? 0.12 : 0.085, 2.4);
      });
    }
    if (step % 2 === 0) {
      const melodyIndex = Math.floor(step / 2) % melody.length;
      playSoftNote(context, masterGain, time, melody[melodyIndex], 0.12, 0.65);
    }
  }

  function startMusicSequencer(context) {
    const stepDuration = 60 / 84 / 2;
    nextStepTime = context.currentTime + 0.06;
    musicStep = 0;
    schedulerInterval = window.setInterval(() => {
      while (nextStepTime < context.currentTime + 0.12) {
        playMusicStep(context, nextStepTime, musicStep);
        nextStepTime += stepDuration;
        musicStep += 1;
      }
    }, 25);
  }

  async function startAmbientMusic() {
    const AudioContextType = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextType) {
      audioToggle.setAttribute("aria-label", "Original ambient music is not supported by this browser");
      audioToggle.setAttribute("title", "Original ambient music is not supported by this browser");
      console.error("Original ambient music is not supported by this browser.");
      return;
    }

    isAudioStarting = true;
    audioToggle.disabled = true;
    try {
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioContextType();
        masterGain = audioContext.createGain();
        audioCompressor = audioContext.createDynamicsCompressor();
        audioCompressor.threshold.value = -12;
        audioCompressor.knee.value = 12;
        audioCompressor.ratio.value = 4;
        audioCompressor.attack.value = 0.015;
        audioCompressor.release.value = 0.2;
        masterGain.gain.value = 0;
        masterGain.connect(audioCompressor);
        audioCompressor.connect(audioContext.destination);
      }
      await audioContext.resume();
      if (!schedulerInterval) startMusicSequencer(audioContext);

      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.65, audioContext.currentTime + 1.2);
      updateAudioControl(true);
    } catch (error) {
      const failedContext = audioContext;
      audioContext = null;
      masterGain = null;
      audioCompressor = null;
      window.clearInterval(schedulerInterval);
      schedulerInterval = 0;
      updateAudioControl(false);
      audioToggle.setAttribute("aria-label", "Could not start original ambient music; try again");
      audioToggle.setAttribute("title", "Could not start original ambient music; try again");
      if (failedContext && failedContext.state !== "closed") {
        try {
          await failedContext.close();
        } catch (closeError) {
          console.error("Could not close the failed audio context.", closeError);
        }
      }
      console.error("Could not start ambient music.", error);
    } finally {
      isAudioStarting = false;
      audioToggle.disabled = false;
    }
  }

  if (audioToggle) {
    audioToggle.addEventListener("click", async () => {
      window.clearTimeout(closeAudioTimer);
      if (isAudioStarting) return;
      if (!isAudioPlaying) {
        await startAmbientMusic();
        return;
      }

      updateAudioControl(false);
      if (masterGain && audioContext && audioContext.state !== "closed") {
        window.clearInterval(schedulerInterval);
        schedulerInterval = 0;
        masterGain.gain.cancelScheduledValues(audioContext.currentTime);
        masterGain.gain.setTargetAtTime(0, audioContext.currentTime, 0.16);
        const contextToClose = audioContext;
        closeAudioTimer = window.setTimeout(async () => {
          if (audioContext !== contextToClose) return;
          audioContext = null;
          masterGain = null;
          audioCompressor = null;
          try {
            await contextToClose.close();
          } catch (error) {
            console.error("Could not close the ambient audio context.", error);
          }
        }, 700);
      }
    });
  }

  function closeMenu() {
    if (!menuToggle || !menuPanel) return;
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation");
    menuPanel.classList.remove("is-open");
  }

  if (menuToggle && menuPanel && navigation) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      menuToggle.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      menuPanel.classList.toggle("is-open", isOpen);
    });

    navLinks.forEach((link) => link.addEventListener("click", closeMenu));
    const resumeLink = menuPanel.querySelector(".menu-resume");
    if (resumeLink) resumeLink.addEventListener("click", closeMenu);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeMenu();
        menuToggle.focus();
      }
    });
    document.addEventListener("click", (event) => {
      if (!menuPanel.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 640) closeMenu();
    });
  }

  let scrollQueued = false;
  function updateScrollState() {
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
    if (progressBar) progressBar.style.transform = `scaleX(${progress})`;
    if (header) header.classList.toggle("is-compact", window.scrollY > 24);
    scrollQueued = false;
  }

  window.addEventListener("scroll", () => {
    if (menuToggle && menuToggle.getAttribute("aria-expanded") === "true") closeMenu();
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(updateScrollState);
  }, { passive: true });
  updateScrollState();

  const revealItems = [...document.querySelectorAll("[data-reveal]")];
  if (!reducedMotion && "IntersectionObserver" in window) {
    document.body.classList.add("js-motion");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));
  }

  if ("IntersectionObserver" in window && navLinks.length) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isActive = link.hash === `#${entry.target.id}`;
          link.classList.toggle("is-active", isActive);
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-25% 0px -60% 0px" });
    navLinks.forEach((link) => {
      const section = document.querySelector(link.hash);
      if (section) sectionObserver.observe(section);
    });
  }

  const projectCards = [...document.querySelectorAll(".project-card")];
  const projectPrevButton = document.querySelector(".project-nav-prev");
  const projectNextButton = document.querySelector(".project-nav-next");
  let projectIndex = 0;
  let projectAutoRotate = 0;
  let activeImageIndex = 0;
  const projectImageDuration = 3300;

  function updateProjectCarousel() {
    if (!projectCards.length) return;
    const total = projectCards.length;
    const cardWidth = projectCards[0].offsetWidth || 420;
    const sideShift = Math.min(Math.max(cardWidth * 0.72, 200), 360);
    const farShift = Math.min(Math.max(cardWidth * 1.45, 420), 660);

    projectCards.forEach((card, index) => {
      const delta = ((index - projectIndex + total) % total);
      const normalized = delta > total / 2 ? delta - total : delta;
      let move = 0;
      let scale = 0.9;
      let opacity = 0;
      let blur = "2px";
      let state = "is-hidden";

      if (normalized === 0) {
        move = 0;
        scale = 1;
        opacity = 1;
        blur = "0px";
        state = "is-center";
      } else if (normalized === 1 || normalized === -1) {
        move = normalized * sideShift;
        scale = 0.96;
        opacity = 0.58;
        blur = "1.3px";
        state = "is-side";
      } else {
        move = normalized * farShift;
        scale = 0.92;
        opacity = 0.15;
        blur = "2.2px";
        state = "is-hidden";
      }

      card.style.transform = `translateX(-50%) translateX(${move}px) scale(${scale})`;
      card.style.filter = `blur(${blur})`;
      card.style.opacity = String(opacity);
      card.classList.remove("is-center", "is-side", "is-hidden");
      card.classList.add(state);
      card.style.zIndex = normalized === 0 ? "3" : normalized === 1 || normalized === -1 ? "2" : "1";
    });
  }

  function setProjectIndex(nextIndex) {
    if (!projectCards.length) return;
    projectIndex = (nextIndex + projectCards.length) % projectCards.length;
    activeImageIndex = 0;
    updateProjectCarousel();
    activateProjectImage(projectCards[projectIndex], activeImageIndex);
    restartProjectAutoplay();
  }

  function activateProjectImage(card, imageIndex) {
    const gallery = card.querySelector(".project-gallery");
    if (!gallery) return;
    const mainImg = gallery.querySelector(".gallery-main-img");
    const thumbBtns = [...gallery.querySelectorAll(".thumb-btn")];
    const button = thumbBtns[imageIndex];
    const nextSrc = button?.getAttribute("data-src");
    if (!mainImg || !button || !nextSrc) return;

    thumbBtns.forEach((thumb, index) => {
      thumb.classList.toggle("is-active", index === imageIndex);
      thumb.setAttribute("aria-pressed", String(index === imageIndex));
    });
    if (mainImg.getAttribute("src") === nextSrc) return;

    mainImg.classList.add("is-switching");
    mainImg.style.opacity = "0";
    const tempImg = new Image();
    tempImg.onload = () => {
      mainImg.src = nextSrc;
      window.requestAnimationFrame(() => {
        mainImg.style.opacity = "1";
        mainImg.classList.remove("is-switching");
      });
    };
    tempImg.onerror = () => {
      mainImg.style.opacity = "1";
      mainImg.classList.remove("is-switching");
      console.error(`Could not load project preview image: ${nextSrc}`);
    };
    tempImg.src = nextSrc;
  }

  function advanceProjectShowcase() {
    const activeCard = projectCards[projectIndex];
    const thumbCount = activeCard.querySelectorAll(".thumb-btn").length;
    if (thumbCount && activeImageIndex + 1 < thumbCount) {
      activeImageIndex += 1;
      activateProjectImage(activeCard, activeImageIndex);
      return;
    }
    setProjectIndex(projectIndex + 1);
  }

  function restartProjectAutoplay() {
    window.clearInterval(projectAutoRotate);
    if (!projectCards.length || reducedMotion || document.hidden) return;
    projectAutoRotate = window.setInterval(advanceProjectShowcase, projectImageDuration);
  }

  if (projectPrevButton && projectNextButton) {
    projectPrevButton.addEventListener("click", () => setProjectIndex(projectIndex - 1));
    projectNextButton.addEventListener("click", () => setProjectIndex(projectIndex + 1));
  }

  if (projectCards.length) {
    updateProjectCarousel();
    restartProjectAutoplay();
    window.addEventListener("resize", updateProjectCarousel);
    document.addEventListener("visibilitychange", restartProjectAutoplay);
  }

  // Project Multi-Thumbnail Interactive Switcher
  const projectGalleries = document.querySelectorAll(".project-gallery");
  projectGalleries.forEach((gallery) => {
    const mainImg = gallery.querySelector(".gallery-main-img");
    const thumbBtns = gallery.querySelectorAll(".thumb-btn");
    if (!mainImg || !thumbBtns.length) return;

    thumbBtns.forEach((btn, index) => {
      btn.setAttribute("aria-pressed", String(btn.classList.contains("is-active")));
      btn.addEventListener("click", () => {
        activeImageIndex = index;
        activateProjectImage(gallery.closest(".project-card"), index);
        restartProjectAutoplay();
      });
    });
  });

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const cursor = document.querySelector(".custom-cursor");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const coarsePointer = window.matchMedia("(pointer: coarse)");
  if (!cursor) return;
  const trailCanvas = document.createElement("canvas");
  const trailContext = trailCanvas.getContext("2d");
  const particles = [];
  let trailFrame = 0;
  let lastTrailX = Number.NaN;
  let lastTrailY = Number.NaN;

  function resizeTrail() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    trailCanvas.width = Math.round(window.innerWidth * pixelRatio);
    trailCanvas.height = Math.round(window.innerHeight * pixelRatio);
    if (trailContext) trailContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }

  function drawTrail() {
    trailFrame = 0;
    const shouldDraw = document.body.classList.contains("has-custom-cursor") || document.body.classList.contains("has-touch-sparks");
    if (!trailContext || !shouldDraw) return;
    trailContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.life -= particle.decay;
      if (particle.life <= 0) {
        particles.splice(index, 1);
        continue;
      }

      trailContext.globalAlpha = particle.life;
      trailContext.fillStyle = `hsl(${particle.hue} 72% 62%)`;
      trailContext.shadowColor = `hsl(${particle.hue} 78% 68%)`;
      trailContext.shadowBlur = particle.glow ?? 5;
      trailContext.beginPath();
      trailContext.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
      trailContext.fill();
    }

    trailContext.globalAlpha = 1;
    trailContext.shadowBlur = 0;
    if (particles.length) trailFrame = window.requestAnimationFrame(drawTrail);
  }

  function addTrailParticles(x, y, options = {}) {
    if (!trailContext) return;
    const count = options.count ?? 3;
    const speedMultiplier = options.speedMultiplier ?? 1;
    const colors = options.colors ?? [38, 145, 205];
    const life = options.life ?? 1;
    const decay = options.decay ?? 0.035 + Math.random() * 0.015;
    const glow = options.glow ?? 5;
    for (let index = 0; index < count; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (0.35 + Math.random() * 1.2) * speedMultiplier;
      particles.push({
        x: x + (Math.random() - 0.5) * 6,
        y: y + (Math.random() - 0.5) * 6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.2,
        size: (options.size ?? 1) + Math.random() * (options.sizeSpread ?? 1.3),
        hue: colors[Math.floor(Math.random() * colors.length)],
        life,
        decay,
        glow
      });
    }
    if (particles.length > 120) particles.splice(0, particles.length - 120);
    if (!trailFrame) trailFrame = window.requestAnimationFrame(drawTrail);
  }

  function updateCustomCursor() {
    const isDesktopCursor = !reducedMotion && finePointer.matches && window.innerWidth > 850;
    const isTouchSpark = !reducedMotion && window.innerWidth <= 850 && coarsePointer.matches;
    document.body.classList.toggle("has-custom-cursor", isDesktopCursor);
    document.body.classList.toggle("has-touch-sparks", isTouchSpark);

    if ((isDesktopCursor || isTouchSpark) && !reducedMotion) {
      if (!trailCanvas.isConnected) {
        trailCanvas.className = "cursor-trail";
        trailCanvas.setAttribute("aria-hidden", "true");
        document.body.append(trailCanvas);
        resizeTrail();
      }
    } else {
      trailCanvas.remove();
      particles.length = 0;
      if (trailContext) trailContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  }
  updateCustomCursor();
  window.addEventListener("resize", updateCustomCursor);
  window.addEventListener("resize", () => {
    if (trailCanvas.isConnected) resizeTrail();
  });
  finePointer.addEventListener("change", updateCustomCursor);
  coarsePointer.addEventListener("change", updateCustomCursor);

  document.addEventListener("pointerdown", (event) => {
    const isTouchInteraction = event.pointerType === "touch" || (coarsePointer.matches && event.pointerType !== "mouse");
    if (!document.body.classList.contains("has-custom-cursor") && isTouchInteraction) {
      addTrailParticles(event.clientX, event.clientY, {
        count: 8,
        speedMultiplier: 1.15,
        size: 1.2,
        sizeSpread: 1.5,
        life: 1.1,
        decay: 0.032,
        glow: 8,
        colors: [38, 145, 205, 170, 68]
      });
    }
  });

  document.addEventListener("pointermove", (event) => {
    const isTouchInteraction = event.pointerType === "touch" || (coarsePointer.matches && event.pointerType !== "mouse");
    if (document.body.classList.contains("has-custom-cursor")) {
      cursor.style.transform = `translate3d(${event.clientX - 23}px, ${event.clientY - 23}px, 0)`;
      cursor.classList.add("is-visible");
      const deltaX = event.clientX - lastTrailX;
      const deltaY = event.clientY - lastTrailY;
      if (!Number.isFinite(lastTrailX) || deltaX * deltaX + deltaY * deltaY > 64) {
        addTrailParticles(event.clientX, event.clientY);
        lastTrailX = event.clientX;
        lastTrailY = event.clientY;
      }
      return;
    }

    if (!isTouchInteraction || !document.body.classList.contains("has-touch-sparks")) return;
    const deltaX = event.clientX - lastTrailX;
    const deltaY = event.clientY - lastTrailY;
    if (!Number.isFinite(lastTrailX) || deltaX * deltaX + deltaY * deltaY > 15) {
      addTrailParticles(event.clientX, event.clientY, {
        count: 3,
        speedMultiplier: 0.8,
        size: 1,
        sizeSpread: 1.2,
        life: 0.9,
        decay: 0.04,
        glow: 7,
        colors: [38, 145, 205, 170, 68]
      });
      lastTrailX = event.clientX;
      lastTrailY = event.clientY;
    }
  });
  document.addEventListener("pointerleave", () => {
    cursor.classList.remove("is-visible");
  });
  document.addEventListener("pointerover", (event) => {
    if (!document.body.classList.contains("has-custom-cursor")) return;
    const hoverTarget = event.target.closest("a, button, [role='button'], h1, h2, h3, p, li");
    cursor.classList.toggle("is-hovering", Boolean(hoverTarget));
    if (!hoverTarget) return;
    const visibleText = (hoverTarget.getAttribute("aria-label") || hoverTarget.innerText || hoverTarget.textContent || "")
      .replace(/\s+/g, " ")
      .trim();
    cursor.querySelector(".cursor-label").textContent = visibleText.length > 12
      ? `${visibleText.slice(0, 11)}…`
      : visibleText;
  });
})();

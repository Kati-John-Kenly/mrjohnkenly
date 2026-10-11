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
  let noiseBuffer = null;
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
    audioToggle.setAttribute("aria-label", `Turn inspirational music ${isPlaying ? "off" : "on"}`);
    audioToggle.setAttribute("title", `Turn inspirational music ${isPlaying ? "off" : "on"}`);
    audioLabel.textContent = `Inspire sound ${isPlaying ? "on" : "off"}`;
  }

  function createNoiseBuffer(context) {
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) {
      samples[index] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  function playKick(context, destination, time) {
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(125, time);
    oscillator.frequency.exponentialRampToValueAtTime(48, time + 0.13);
    envelope.gain.setValueAtTime(0.23, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
    oscillator.connect(envelope);
    envelope.connect(destination);
    oscillator.start(time);
    oscillator.stop(time + 0.25);
  }

  function playNoise(context, destination, time, level, duration, frequency, type) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.buffer = noiseBuffer;
    filter.type = type;
    filter.frequency.value = frequency;
    envelope.gain.setValueAtTime(level, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);
    source.start(time);
    source.stop(time + duration);
  }

  function playBass(context, destination, time, frequency) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = "sawtooth";
    oscillator.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, time);
    filter.frequency.exponentialRampToValueAtTime(125, time + 0.24);
    envelope.gain.setValueAtTime(0.065, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.34);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);
    oscillator.start(time);
    oscillator.stop(time + 0.35);
  }

  function playChord(context, destination, time, frequencies) {
    const chordGain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    chordGain.gain.setValueAtTime(0.001, time);
    chordGain.gain.linearRampToValueAtTime(0.024, time + 0.04);
    chordGain.gain.exponentialRampToValueAtTime(0.001, time + 0.72);
    chordGain.connect(filter);
    filter.connect(destination);

    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "triangle" : "sawtooth";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index % 2 === 0 ? -4 : 4;
      oscillator.connect(chordGain);
      oscillator.start(time);
      oscillator.stop(time + 0.75);
    });
  }

  function playPad(context, destination, time, frequencies) {
    const padGain = context.createGain();
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1150;
    padGain.gain.setValueAtTime(0.001, time);
    padGain.gain.linearRampToValueAtTime(0.012, time + 0.65);
    padGain.gain.setValueAtTime(0.012, time + 1.2);
    padGain.gain.linearRampToValueAtTime(0.001, time + 1.9);
    padGain.connect(filter);
    filter.connect(destination);

    frequencies.slice(0, 3).forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      oscillator.type = index === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 1 ? -5 : 5;
      oscillator.connect(padGain);
      oscillator.start(time);
      oscillator.stop(time + 1.95);
    });
  }

  function playLead(context, destination, time, frequency) {
    const oscillator = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = frequency;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2400, time);
    filter.frequency.exponentialRampToValueAtTime(500, time + 0.2);
    envelope.gain.setValueAtTime(0.035, time);
    envelope.gain.exponentialRampToValueAtTime(0.001, time + 0.24);
    oscillator.connect(filter);
    filter.connect(envelope);
    envelope.connect(destination);
    oscillator.start(time);
    oscillator.stop(time + 0.25);
  }

  function playMusicStep(context, time, step) {
    const beat = step % 16;
    const chordProgression = [
      [130.81, 164.81, 196, 261.63],
      [146.83, 196, 233.08, 293.66],
      [110, 164.81, 220, 261.63],
      [130.81, 174.61, 220, 261.63]
    ];
    const bassNotes = [65.41, 49, 55, 43.65];
    const melody = [523.25, 587.33, 659.25, 783.99, 698.46, 659.25, 587.33, 523.25];
    const chordIndex = Math.floor(musicStep / 16) % chordProgression.length;

    if (beat % 4 === 0) playKick(context, masterGain, time);
    if (beat === 4 || beat === 12) {
      playNoise(context, masterGain, time, 0.035, 0.14, 2100, "bandpass");
    }
    if (beat % 2 === 0) {
      playNoise(context, masterGain, time, beat % 4 === 0 ? 0.012 : 0.007, 0.045, 7600, "highpass");
    }
    if (beat === 0 || beat === 8) {
      playBass(context, masterGain, time, bassNotes[chordIndex]);
    }
    if (beat === 0 || beat === 4 || beat === 8 || beat === 12) {
      playChord(context, masterGain, time, chordProgression[chordIndex]);
    }
    if (beat === 0) playPad(context, masterGain, time, chordProgression[chordIndex]);
    if (beat % 2 === 1) {
      const noteIndex = Math.floor(musicStep / 2) % melody.length;
      playLead(context, masterGain, time, melody[noteIndex]);
    }
  }

  function startMusicSequencer(context) {
    const stepDuration = 60 / 112 / 4;
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
      audioToggle.setAttribute("aria-label", "Inspirational music is not supported by this browser");
      audioToggle.setAttribute("title", "Inspirational music is not supported by this browser");
      console.error("Inspirational music is not supported by this browser.");
      return;
    }

    isAudioStarting = true;
    audioToggle.disabled = true;
    try {
      if (!audioContext || audioContext.state === "closed") {
        audioContext = new AudioContextType();
        masterGain = audioContext.createGain();
        masterGain.gain.value = 0;
        masterGain.connect(audioContext.destination);
        noiseBuffer = createNoiseBuffer(audioContext);
      }
      await audioContext.resume();
      if (!schedulerInterval) startMusicSequencer(audioContext);

      masterGain.gain.cancelScheduledValues(audioContext.currentTime);
      masterGain.gain.setValueAtTime(masterGain.gain.value, audioContext.currentTime);
      masterGain.gain.linearRampToValueAtTime(0.55, audioContext.currentTime + 1.4);
      updateAudioControl(true);
    } catch (error) {
      const failedContext = audioContext;
      audioContext = null;
      masterGain = null;
      noiseBuffer = null;
      window.clearInterval(schedulerInterval);
      schedulerInterval = 0;
      updateAudioControl(false);
      audioToggle.setAttribute("aria-label", "Could not start inspirational music; try again");
      audioToggle.setAttribute("title", "Could not start inspirational music; try again");
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
          noiseBuffer = null;
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

  const year = document.querySelector("#year");
  if (year) year.textContent = String(new Date().getFullYear());

  const cursor = document.querySelector(".custom-cursor");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const canUseCustomCursor = finePointer || coarsePointer;
  if (!cursor || !canUseCustomCursor) return;

  document.body.classList.add("has-custom-cursor");
  if (coarsePointer && !finePointer) document.body.classList.add("has-touch-cursor");
  const trailCanvas = reducedMotion ? null : document.createElement("canvas");
  const trailContext = trailCanvas ? trailCanvas.getContext("2d") : null;
  const particles = [];
  let trailFrame = 0;
  let colorPhase = 0;
  let lastTrailX = Number.NaN;
  let lastTrailY = Number.NaN;
  let touchHideTimer = 0;
  let drawTrail = () => {};

  if (trailCanvas && trailContext) {
    trailCanvas.className = "cursor-trail";
    trailCanvas.setAttribute("aria-hidden", "true");
    document.body.append(trailCanvas);

    function resizeTrail() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      trailCanvas.width = Math.round(window.innerWidth * pixelRatio);
      trailCanvas.height = Math.round(window.innerHeight * pixelRatio);
      trailContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    drawTrail = function drawTrailFrame() {
      trailFrame = 0;
      trailContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
      trailContext.globalCompositeOperation = "lighter";

      for (let index = particles.length - 1; index >= 0; index -= 1) {
        const particle = particles[index];
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.018;
        particle.life -= particle.decay;

        if (particle.life <= 0) {
          particles.splice(index, 1);
          continue;
        }

        trailContext.globalAlpha = particle.life;
        trailContext.fillStyle = `hsl(${particle.hue} 95% 62%)`;
        trailContext.shadowColor = `hsl(${particle.hue} 100% 66%)`;
        trailContext.shadowBlur = particle.size * 4;
        trailContext.strokeStyle = `hsl(${particle.hue} 100% 70%)`;
        trailContext.lineWidth = Math.max(1, particle.size * particle.life);
        trailContext.lineCap = "round";
        trailContext.beginPath();
        trailContext.moveTo(particle.x, particle.y);
        trailContext.lineTo(particle.x - particle.vx * 4, particle.y - particle.vy * 4);
        trailContext.stroke();
        trailContext.beginPath();
        trailContext.arc(particle.x, particle.y, particle.size * particle.life, 0, Math.PI * 2);
        trailContext.fill();
      }

      trailContext.globalAlpha = 1;
      trailContext.shadowBlur = 0;
      if (particles.length) trailFrame = window.requestAnimationFrame(drawTrail);
    };

    window.addEventListener("resize", resizeTrail);
    resizeTrail();
  }

  function addTrailParticles(x, y) {
    if (!trailContext) return;
    colorPhase = (colorPhase + 43) % 360;
    const particleCount = coarsePointer ? 6 : 4;
    for (let index = 0; index < particleCount; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.7 + Math.random() * (coarsePointer ? 3 : 2.2);
      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (coarsePointer ? 0.8 : 0.3),
        size: (coarsePointer ? 2.5 : 2) + Math.random() * (coarsePointer ? 4 : 3),
        hue: (colorPhase + index * 34) % 360,
        life: 1,
        decay: 0.012 + Math.random() * 0.012
      });
    }
    if (particles.length > 240) particles.splice(0, particles.length - 240);
    if (!trailFrame) trailFrame = window.requestAnimationFrame(drawTrail);
  }

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let cursorX = 0;
  let cursorY = 0;
  let animationFrame = 0;

  function moveCursor() {
    cursorX += (pointerX - cursorX) * 0.24;
    cursorY += (pointerY - cursorY) * 0.24;
    const cursorOffset = coarsePointer ? 29 : 31;
    cursor.style.transform = `translate3d(${cursorX - cursorOffset}px, ${cursorY - cursorOffset}px, 0)`;
    if (Math.abs(pointerX - cursorX) > 0.1 || Math.abs(pointerY - cursorY) > 0.1) {
      animationFrame = window.requestAnimationFrame(moveCursor);
    } else {
      animationFrame = 0;
    }
  }

  document.addEventListener("pointermove", (event) => {
    if (coarsePointer && event.pointerType !== "touch" && event.pointerType !== "pen") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursor.classList.add("is-visible");
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      cursor.classList.add("is-touching");
      window.clearTimeout(touchHideTimer);
      touchHideTimer = window.setTimeout(() => {
        cursor.classList.remove("is-visible", "is-touching");
      }, 900);
    }
    if (trailContext) {
      const deltaX = pointerX - lastTrailX;
      const deltaY = pointerY - lastTrailY;
      if (!Number.isFinite(lastTrailX) || deltaX * deltaX + deltaY * deltaY > (coarsePointer ? 12 : 20)) {
        addTrailParticles(pointerX, pointerY);
        lastTrailX = pointerX;
        lastTrailY = pointerY;
      }
    }
    if (reducedMotion) {
      cursorX = pointerX;
      cursorY = pointerY;
      const cursorOffset = coarsePointer ? 29 : 31;
      cursor.style.transform = `translate3d(${cursorX - cursorOffset}px, ${cursorY - cursorOffset}px, 0)`;
      return;
    }
    if (!animationFrame) animationFrame = window.requestAnimationFrame(moveCursor);
  });
  document.addEventListener("pointerleave", (event) => {
    if (event.pointerType !== "touch") cursor.classList.remove("is-visible");
  });
  document.addEventListener("pointerover", (event) => {
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
  document.addEventListener("pointerdown", (event) => {
    if (coarsePointer && event.pointerType !== "touch" && event.pointerType !== "pen") return;
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursorX = pointerX;
    cursorY = pointerY;
    const cursorOffset = coarsePointer ? 29 : 31;
    cursor.style.transform = `translate3d(${cursorX - cursorOffset}px, ${cursorY - cursorOffset}px, 0)`;
    cursor.classList.add("is-visible", "is-pressed");
    if (event.pointerType === "touch" || event.pointerType === "pen") {
      cursor.classList.add("is-touching");
      window.clearTimeout(touchHideTimer);
      touchHideTimer = window.setTimeout(() => {
        cursor.classList.remove("is-visible", "is-touching");
      }, 900);
    }
    if (trailContext) addTrailParticles(pointerX, pointerY);
  });
  document.addEventListener("pointerup", () => cursor.classList.remove("is-pressed"));
})();

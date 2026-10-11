/**
 * Google Gemini Floating Chatbot for John Kenly Portfolio
 * - Intelligent dual-mode: Real Gemini API + Built-in offline knowledge engine
 * - Interactive website explorer & direct contact facilitator
 * - Contextual quick chips, smooth in-page navigation, and responsive controls
 */

(() => {
  // Knowledge Base & Portfolio Data
  const PORTFOLIO_DATA = {
    name: "John Kenly",
    role: "Front-end Developer",
    tagline: "I make the web feel better.",
    bio: "Hey, I'm John Kenly. I build clean, responsive websites and thoughtful digital experiences that feel just as good as they look. Focused on accessible markup, clean interfaces, and code that's easy to live with.",
    coordinates: "15°30' N 80°03' E",
    skills: ["HTML", "CSS / Sass", "JavaScript", "React", "Git", "Responsive Design", "Accessible UI", "Web Audio API"],
    contact: {
      email: "johnkenlykati@gmail.com",
      whatsapp: "https://wa.me/6281734254?text=Hi%20John%2C%20I%20found%20your%20portfolio",
      linkedin: "https://linkedin.com/in/mrjohnkenly",
      github: "https://github.com/mrjohnkenly",
      resume: "../pdfs/myResume.pdf"
    },
    projects: [
      {
        title: "Order In Campus",
        tag: "Campus Ordering",
        desc: "A campus-focused ordering experience designed to make finding and placing an order easier.",
        url: "https://www.orderincampus.live/"
      },
      {
        title: "Mi-Svara",
        tag: "Music Learning",
        desc: "A mobile music-learning platform that brings musical practice and learning into one experience.",
        url: "https://mi-svara.ai.studio/"
      },
      {
        title: "30 Days of Python",
        tag: "Learning Platform",
        desc: "A 30-day learning experience for building Python knowledge one step at a time.",
        url: "https://30-days-python.vercel.app/"
      },
      {
        title: "Progress Productivity",
        tag: "Productivity Tool",
        desc: "A productivity-focused project built around making progress feel clear and achievable.",
        url: "https://progress-productivity.vercel.app/index.html"
      },
      {
        title: "FitGuide AI",
        tag: "Fitness & Wellness",
        desc: "A wellness experience with personalized home workouts, yoga, and nutrition guidance.",
        url: "https://fitness-app-ashy-xi.vercel.app/"
      }
    ]
  };

  // State Management
  const STORAGE_KEY_API = "gemini_api_key";
  const STORAGE_KEY_MODEL = "gemini_model_choice";
  const STORAGE_KEY_DISMISSED = "gemini_teaser_dismissed";

  let apiKey = localStorage.getItem(STORAGE_KEY_API) || "";
  let selectedModel = localStorage.getItem(STORAGE_KEY_MODEL) || "gemini-2.0-flash";
  let conversationHistory = [];
  let isThinking = false;
  let isOpen = false;

  // DOM Elements
  let widgetRoot = null;
  let launcherBtn = null;
  let teaserBubble = null;
  let chatPanel = null;
  let messagesContainer = null;
  let inputForm = null;
  let chatInput = null;
  let sendBtn = null;
  let settingsModal = null;
  let settingsKeyInput = null;
  let settingsModelSelect = null;
  let statusBadge = null;

  // Initialize
  function init() {
    createChatbotMarkup();
    bindEvents();
    renderWelcomeMessage();
    setupTeaserTimer();
    updateApiStatusDisplay();
  }

  // Create Markup and inject into body
  function createChatbotMarkup() {
    const wrapper = document.createElement("div");
    wrapper.className = "gemini-chat-widget";
    wrapper.id = "geminiChatWidget";

    wrapper.innerHTML = `
      <!-- Teaser Welcome Bubble -->
      <div class="chat-teaser-bubble" id="chatTeaserBubble" role="button" tabindex="0" aria-label="Ask JK Assistant">
        <div class="teaser-gemini-sparkle" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path d="M12 2L14.3 8.7L21 11L14.3 13.3L12 20L9.7 13.3L3 11L9.7 8.7L12 2Z" fill="url(#geminiTeaserGrad)"/>
            <defs>
              <linearGradient id="geminiTeaserGrad" x1="3" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4285F4"/>
                <stop offset="0.5" stop-color="#9B72CB"/>
                <stop offset="1" stop-color="#D96570"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div class="teaser-text">
          <strong>Ask JK Assistant</strong>
          Explore projects or contact John!
        </div>
        <button class="teaser-close" id="teaserCloseBtn" type="button" aria-label="Dismiss">✕</button>
      </div>

      <!-- Floating Launcher Button -->
      <button class="chat-launcher-btn" id="chatLauncherBtn" type="button" aria-label="Open JK Assistant" aria-expanded="false">
        <span class="launcher-status-dot" aria-hidden="true"></span>
        <div class="launcher-icon-wrap" aria-hidden="true">
          <!-- Gemini Sparkle Icon -->
          <svg class="launcher-icon-open" viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" fill="url(#geminiLauncherGrad)"/>
            <path d="M19 16L20.2 19.3L23.5 20.5L20.2 21.7L19 25L17.8 21.7L14.5 20.5L17.8 19.3L19 16Z" fill="#C4F263" transform="scale(0.5) translate(14, 10)"/>
            <defs>
              <linearGradient id="geminiLauncherGrad" x1="3" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                <stop stop-color="#4285F4"/>
                <stop offset="0.5" stop-color="#9B72CB"/>
                <stop offset="1" stop-color="#D96570"/>
              </linearGradient>
            </defs>
          </svg>
          <!-- Close Icon -->
          <svg class="launcher-icon-close" viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
      </button>

      <!-- Chat Panel -->
      <div class="chat-panel" id="chatPanel" role="region" aria-label="JK Assistant - Portfolio Chat">
        <!-- Header -->
        <header class="chat-header">
          <div class="chat-brand">
            <div class="chat-avatar" aria-hidden="true">
              <svg class="chat-avatar-svg" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" fill="url(#geminiHeaderGrad)"/>
                <defs>
                  <linearGradient id="geminiHeaderGrad" x1="3" y1="2" x2="21" y2="20" gradientUnits="userSpaceOnUse">
                    <stop stop-color="#8AB4F8"/>
                    <stop offset="0.5" stop-color="#C58AF9"/>
                    <stop offset="1" stop-color="#C4F263"/>
                  </linearGradient>
                </defs>
              </svg>
              <span class="chat-avatar-status"></span>
            </div>
            <div class="chat-brand-info">
              <div class="chat-brand-title">
                JK Assistant
                <span class="chat-gemini-tag">AI</span>
              </div>
              <div class="chat-brand-status" id="chatStatusText">
                JK Assistant • Online
              </div>
            </div>
          </div>
          <div class="chat-header-actions">
            <button class="chat-header-btn" id="chatSettingsBtn" type="button" aria-label="JK Assistant settings" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            <button class="chat-header-btn" id="chatResetBtn" type="button" aria-label="Clear chat" title="Clear chat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                <path d="M3 3v5h5"></path>
              </svg>
            </button>
            <button class="chat-header-btn" id="chatCloseBtn" type="button" aria-label="Close chat" title="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
        </header>

        <!-- Message Body -->
        <div class="chat-body" id="chatMessages" role="log" aria-live="polite"></div>

        <!-- Quick Options Chips -->
        <div class="chat-suggestions" id="chatSuggestions" role="toolbar" aria-label="Suggested quick options">
          <button class="suggestion-chip" data-prompt="Show me John's projects">🌟 Projects</button>
          <button class="suggestion-chip" data-prompt="How can I contact John?">📬 Contact</button>
          <button class="suggestion-chip" data-prompt="Download John's resume">📄 Resume</button>
          <button class="suggestion-chip" data-prompt="What is John's tech stack?">🛠️ Skills</button>
          <button class="suggestion-chip" data-prompt="Tell me about John Kenly">💡 About John</button>
          <button class="suggestion-chip" data-prompt="Open WhatsApp chat">💬 WhatsApp</button>
        </div>

        <!-- Input Bar -->
        <form class="chat-input-bar" id="chatInputForm">
          <input 
            type="text" 
            class="chat-input" 
            id="chatInput" 
            placeholder="Ask anything about John, projects, or contact..." 
            autocomplete="off" 
            aria-label="Your message"
          />
          <button class="chat-send-btn" id="chatSendBtn" type="submit" aria-label="Send message">
            <svg class="chat-send-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </form>
        <div class="chat-footer-note">JK Assistant • Powered by Gemini AI</div>

        <!-- Settings Modal -->
        <div class="chat-settings-modal" id="chatSettingsModal" role="dialog" aria-label="JK Assistant Configuration">
          <div class="settings-header">
            <div class="settings-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L14.4 8.6L21 11L14.4 13.4L12 20L9.6 13.4L3 11L9.6 8.6L12 2Z" fill="url(#geminiHeaderGrad)"/>
              </svg>
              JK Assistant Settings
            </div>
            <button class="chat-header-btn" id="settingsCloseBtn" type="button" aria-label="Close settings">✕</button>
          </div>
            <button class="chat-header-btn" id="settingsCloseBtn" type="button" aria-label="Close settings">✕</button>
          </div>

          <div class="settings-body">
            <div class="settings-status-box" id="settingsStatusBox">
              <strong>Current Mode:</strong>
              <span id="settingsModeText">Built-in Smart Assistant (Active)</span>
            </div>

            <div class="settings-field">
              <label class="settings-label" for="geminiApiKeyInput">GOOGLE GEMINI API KEY (OPTIONAL)</label>
              <input 
                type="password" 
                class="settings-input" 
                id="geminiApiKeyInput" 
                placeholder="AIzaSy..." 
                autocomplete="off" 
              />
              <p class="settings-hint">
                Add your free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">Google AI Studio ↗</a> to enable live Gemini generative answers. Stored safely in your local browser only.
              </p>
            </div>

            <div class="settings-field">
              <label class="settings-label" for="geminiModelSelect">GEMINI MODEL</label>
              <select class="settings-input" id="geminiModelSelect">
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fastest &amp; Latest)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Reliable)</option>
              </select>
            </div>

            <div class="settings-hint">
              <strong>Zero-config guarantee:</strong> Without an API key, the bot automatically runs its comprehensive built-in portfolio intelligence engine with full knowledge of John's work, skills, and interactive navigation!
            </div>

            <div class="settings-actions">
              <button class="settings-save-btn" id="settingsSaveBtn" type="button">Save Settings</button>
              <button class="settings-clear-btn" id="settingsClearBtn" type="button">Clear Key</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    // Cache elements
    widgetRoot = wrapper;
    launcherBtn = document.getElementById("chatLauncherBtn");
    teaserBubble = document.getElementById("chatTeaserBubble");
    chatPanel = document.getElementById("chatPanel");
    messagesContainer = document.getElementById("chatMessages");
    inputForm = document.getElementById("chatInputForm");
    chatInput = document.getElementById("chatInput");
    sendBtn = document.getElementById("chatSendBtn");
    settingsModal = document.getElementById("chatSettingsModal");
    settingsKeyInput = document.getElementById("geminiApiKeyInput");
    settingsModelSelect = document.getElementById("geminiModelSelect");
    statusBadge = document.getElementById("chatStatusText");

    if (apiKey && settingsKeyInput) {
      settingsKeyInput.value = apiKey;
    }
    if (selectedModel && settingsModelSelect) {
      settingsModelSelect.value = selectedModel;
    }
  }

  // Teaser bubble timing
  function setupTeaserTimer() {
    const isDismissed = sessionStorage.getItem(STORAGE_KEY_DISMISSED);
    if (!isDismissed) {
      setTimeout(() => {
        if (!isOpen && teaserBubble) {
          teaserBubble.classList.remove("is-hidden");
        }
      }, 2400);
    } else if (teaserBubble) {
      teaserBubble.classList.add("is-hidden");
    }
  }

  // Bind Event Listeners
  function bindEvents() {
    // Launcher toggle
    launcherBtn.addEventListener("click", toggleChat);

    // Teaser click, keypress & close
    if (teaserBubble) {
      teaserBubble.addEventListener("click", (e) => {
        if (e.target.closest("#teaserCloseBtn")) {
          e.stopPropagation();
          dismissTeaser();
          return;
        }
        dismissTeaser();
        openChat();
      });

      teaserBubble.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dismissTeaser();
          openChat();
        }
      });
    }

    const teaserClose = document.getElementById("teaserCloseBtn");
    if (teaserClose) {
      teaserClose.addEventListener("click", (e) => {
        e.stopPropagation();
        dismissTeaser();
      });
    }

    // Chat close
    document.getElementById("chatCloseBtn").addEventListener("click", closeChat);

    // Reset Chat
    document.getElementById("chatResetBtn").addEventListener("click", () => {
      conversationHistory = [];
      messagesContainer.innerHTML = "";
      renderWelcomeMessage();
    });

    // Settings Toggle
    document.getElementById("chatSettingsBtn").addEventListener("click", () => {
      settingsModal.classList.add("is-open");
    });
    document.getElementById("settingsCloseBtn").addEventListener("click", () => {
      settingsModal.classList.remove("is-open");
    });

    // Settings Save & Clear
    document.getElementById("settingsSaveBtn").addEventListener("click", () => {
      apiKey = settingsKeyInput.value.trim();
      selectedModel = settingsModelSelect.value;
      if (apiKey) {
        localStorage.setItem(STORAGE_KEY_API, apiKey);
      } else {
        localStorage.removeItem(STORAGE_KEY_API);
      }
      localStorage.setItem(STORAGE_KEY_MODEL, selectedModel);
      settingsModal.classList.remove("is-open");
      updateApiStatusDisplay();
      appendBotMessage("Settings updated! Now configured to use " + (apiKey ? "Google Gemini (" + selectedModel + ") with live intelligence." : "Built-in smart portfolio engine."));
    });

    document.getElementById("settingsClearBtn").addEventListener("click", () => {
      apiKey = "";
      settingsKeyInput.value = "";
      localStorage.removeItem(STORAGE_KEY_API);
      updateApiStatusDisplay();
      settingsModal.classList.remove("is-open");
      appendBotMessage("API Key cleared. Switched back to built-in smart assistant.");
    });

    // Form Submit
    inputForm.addEventListener("submit", (e) => {
      e.preventDefault();
      handleUserSubmit();
    });

    // Quick Option Chips
    document.getElementById("chatSuggestions").addEventListener("click", (e) => {
      const chip = e.target.closest(".suggestion-chip");
      if (!chip) return;
      const prompt = chip.getAttribute("data-prompt");
      if (prompt) {
        chatInput.value = prompt;
        handleUserSubmit();
      }
    });

    // Handle clicks inside messages (Action Buttons)
    messagesContainer.addEventListener("click", (e) => {
      const actionBtn = e.target.closest("[data-chat-action]");
      if (!actionBtn) return;
      e.preventDefault();
      const action = actionBtn.getAttribute("data-chat-action");
      const target = actionBtn.getAttribute("data-action-target");
      handleChatAction(action, target);
    });

    // Escape key closes chat
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen) {
        if (settingsModal.classList.contains("is-open")) {
          settingsModal.classList.remove("is-open");
        } else {
          closeChat();
        }
      }
    });
  }

  function dismissTeaser() {
    if (teaserBubble) {
      teaserBubble.classList.add("is-hidden");
      sessionStorage.setItem(STORAGE_KEY_DISMISSED, "true");
    }
  }

  function toggleChat() {
    if (isOpen) closeChat();
    else openChat();
  }

  function openChat() {
    isOpen = true;
    widgetRoot.classList.add("is-open");
    launcherBtn.setAttribute("aria-expanded", "true");
    dismissTeaser();
    setTimeout(() => chatInput.focus(), 150);
  }

  function closeChat() {
    isOpen = false;
    widgetRoot.classList.remove("is-open");
    launcherBtn.setAttribute("aria-expanded", "false");
    settingsModal.classList.remove("is-open");
  }

  function updateApiStatusDisplay() {
    const isLive = Boolean(apiKey);
    const modeText = document.getElementById("settingsModeText");
    if (modeText) {
      modeText.textContent = isLive 
        ? `Live Google Gemini API (${selectedModel})`
        : "Built-in Smart Assistant (Active)";
    }
    if (statusBadge) {
      statusBadge.textContent = isLive ? `JK Assistant (${selectedModel}) • Online` : "JK Assistant • Online";
    }
  }

  // Welcome Message
  function renderWelcomeMessage() {
    const welcomeHtml = `
      <p>Hey there! 👋 I'm <strong>JK Assistant</strong>, powered by Gemini AI.</p>
      <p>I'm here to help you explore John Kenly's portfolio, inspect his projects, or connect with him directly.</p>
      <p><em>What would you like to explore?</em></p>
    `;
    const actions = [
      { text: "🌟 Explore Projects", action: "scroll", target: "#work", primary: true },
      { text: "📬 Contact John", action: "scroll", target: "#contact" },
      { text: "📄 View Resume", action: "open", target: PORTFOLIO_DATA.contact.resume },
      { text: "💬 WhatsApp", action: "open", target: PORTFOLIO_DATA.contact.whatsapp }
    ];
    appendBotMessage(welcomeHtml, actions);
  }

  // Message Handling
  function appendUserMessage(text) {
    const time = getCurrentTime();
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg user";
    msgDiv.innerHTML = `
      <div class="chat-bubble">
        <p>${escapeHtml(text)}</p>
      </div>
      <span class="chat-timestamp">${time}</span>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function appendBotMessage(htmlContent, actions = []) {
    const time = getCurrentTime();
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg bot";

    let actionsMarkup = "";
    if (actions && actions.length > 0) {
      actionsMarkup = `<div class="chat-actions-group">` + actions.map(act => `
        <button 
          type="button" 
          class="chat-action-btn ${act.primary ? 'primary' : ''}" 
          data-chat-action="${act.action}" 
          data-action-target="${act.target}"
        >
          ${act.text}
        </button>
      `).join("") + `</div>`;
    }

    msgDiv.innerHTML = `
      <div class="chat-bubble">
        ${htmlContent}
        ${actionsMarkup}
      </div>
      <span class="chat-timestamp">${time}</span>
    `;
    messagesContainer.appendChild(msgDiv);
    scrollToBottom();
  }

  function showTypingIndicator() {
    const indicator = document.createElement("div");
    indicator.className = "typing-indicator";
    indicator.id = "chatTypingIndicator";
    indicator.innerHTML = `
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    `;
    messagesContainer.appendChild(indicator);
    scrollToBottom();
  }

  function removeTypingIndicator() {
    const indicator = document.getElementById("chatTypingIndicator");
    if (indicator) indicator.remove();
  }

  function scrollToBottom() {
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 50);
  }

  function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  // Handle Action Button Clicks
  function handleChatAction(action, target) {
    if (action === "scroll") {
      const element = document.querySelector(target);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        if (window.innerWidth <= 640) closeChat(); // Close on mobile so user sees the section
      }
    } else if (action === "open") {
      window.open(target, "_blank", "noopener,noreferrer");
    }
  }

  // User Submission
  async function handleUserSubmit() {
    const query = chatInput.value.trim();
    if (!query || isThinking) return;

    chatInput.value = "";
    appendUserMessage(query);
    conversationHistory.push({ role: "user", text: query });

    isThinking = true;
    chatInput.disabled = true;
    sendBtn.disabled = true;
    showTypingIndicator();

    try {
      if (apiKey) {
        // Mode A: Live Google Gemini API
        await handleGeminiApiRequest(query);
      } else {
        // Mode B: Smart Built-in Knowledge Base Engine
        await handleLocalEngineRequest(query);
      }
    } catch (err) {
      console.warn("Falling back to local knowledge engine:", err);
      await handleLocalEngineRequest(query, true);
    } finally {
      isThinking = false;
      chatInput.disabled = false;
      sendBtn.disabled = false;
      removeTypingIndicator();
      chatInput.focus();
    }
  }

  // =========================================================================
  // Mode A: Google Gemini API Client
  // =========================================================================
  async function handleGeminiApiRequest(query) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

    const systemPrompt = `
You are JK Assistant, the personal portfolio AI assistant for John Kenly, a talented front-end developer located at coordinates 15°30' N 80°03' E.
Your primary role is to welcome visitors, inform them about John's skills and projects, and help them contact or hire him.

JOHN'S DETAILS:
- Name: John Kenly
- Wordmark: JK.
- Title: Front-end Developer
- Headline: "I make the web feel better."
- Philosophy: "Curiosity in. Good ideas out. I build clean, responsive websites and thoughtful digital experiences that feel just as good as they look."
- Toolkit: HTML, CSS/Sass, JavaScript, React, Git, Responsive design, Accessible UI, Web Audio API.

PROJECTS (5 independent projects):
1. Order In Campus (Campus ordering experience): https://www.orderincampus.live/
2. Mi-Svara (Mobile music-learning platform): https://mi-svara.ai.studio/
3. 30 Days of Python (30-day learning experience for Python): https://30-days-python.vercel.app/
4. Progress Productivity (Productivity tool making progress visible): https://progress-productivity.vercel.app/index.html
5. FitGuide AI (Wellness experience with home workouts, yoga, nutrition): https://fitness-app-ashy-xi.vercel.app/

CONTACT DETAILS:
- Email: johnkenlykati@gmail.com
- WhatsApp: https://wa.me/6281734254?text=Hi%20John%2C%20I%20found%20your%20portfolio
- LinkedIn: https://linkedin.com/in/mrjohnkenly
- GitHub: https://github.com/mrjohnkenly
- Resume: ../pdfs/myResume.pdf

WEBSITE SECTIONS:
- #home (Hero section)
- #work (Projects section)
- #about (About & Toolkit section)
- #contact (Contact & email section)

INSTRUCTIONS:
- Keep your answers concise, warm, professional, and well-structured (2-4 sentences or short bullet points).
- When discussing projects or contact options, you can mention links.
- Emphasize John's focus on user experience, responsiveness, and clean code.
    `.trim();

    // Prepare contents payload
    const contents = [
      {
        role: "user",
        parts: [{ text: systemPrompt }]
      },
      {
        role: "model",
        parts: [{ text: "Understood! I am JK Assistant, John Kenly's AI portfolio assistant. I will assist visitors with concise, accurate information about John's projects, skills, and contact channels." }]
      }
    ];

    // Include recent history (last 6 turns)
    const recent = conversationHistory.slice(-6);
    recent.forEach((item) => {
      contents.push({
        role: item.role === "user" ? "user" : "model",
        parts: [{ text: item.text }]
      });
    });

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contents,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data.candidates?.[0];
    const textOutput = candidate?.content?.parts?.[0]?.text;

    if (!textOutput) {
      throw new Error("No response from Gemini API");
    }

    conversationHistory.push({ role: "model", text: textOutput });
    const formattedHtml = parseMarkdownToHtml(textOutput);
    const contextualActions = generateContextualActions(query + " " + textOutput);

    appendBotMessage(formattedHtml, contextualActions);
  }

  // =========================================================================
  // Mode B: Smart Local Portfolio Engine (Zero-Config Fallback)
  // =========================================================================
  async function handleLocalEngineRequest(query, hadApiError = false) {
    // Artificial thinking delay for realism
    await new Promise((res) => setTimeout(res, 450));

    const lower = query.toLowerCase();
    let replyHtml = "";
    let actions = [];

    if (hadApiError) {
      replyHtml += `<p style="font-size:0.75rem; color:#d96570;"><em>(Gemini API unavailable; using built-in knowledge engine)</em></p>`;
    }

    // Intent 1: Greetings & Identity
    if (matchesAny(lower, ["hi", "hello", "hey", "who are you", "what can you do", "help", "good morning", "good evening", "greetings"])) {
      replyHtml += `
        <p>Hello! I'm <strong>JK Assistant</strong>, your AI portfolio guide. I can help you:</p>
        <ul>
          <li><strong>Explore Projects:</strong> View Order In Campus, Mi-Svara, FitGuide AI, and more.</li>
          <li><strong>Get in Touch:</strong> Connect on WhatsApp, Email, or LinkedIn.</li>
          <li><strong>Skills & Toolkit:</strong> Learn about John's front-end capabilities.</li>
          <li><strong>Resume:</strong> Download or review John's CV.</li>
        </ul>
        <p>What would you like to see?</p>
      `;
      actions = [
        { text: "🌟 View Projects", action: "scroll", target: "#work", primary: true },
        { text: "📬 Contact John", action: "scroll", target: "#contact" },
        { text: "📄 Resume", action: "open", target: PORTFOLIO_DATA.contact.resume }
      ];
    }
    // Intent 2: Specific Project Queries
    else if (matchesAny(lower, ["order in campus", "campus"])) {
      replyHtml += `
        <p><strong>Order In Campus:</strong></p>
        <p>A campus-focused ordering experience designed to make finding and placing meals and items simple and frictionless for students and staff.</p>
      `;
      actions = [
        { text: "Visit Live Site ↗", action: "open", target: "https://www.orderincampus.live/", primary: true },
        { text: "Jump to Projects ↘", action: "scroll", target: "#work" }
      ];
    }
    else if (matchesAny(lower, ["mi-svara", "misvara", "svara", "music"])) {
      replyHtml += `
        <p><strong>Mi-Svara:</strong></p>
        <p>A mobile music-learning platform that harmonizes musical practice, ear training, and lessons into one intuitive digital experience.</p>
      `;
      actions = [
        { text: "Visit Mi-Svara ↗", action: "open", target: "https://mi-svara.ai.studio/", primary: true },
        { text: "Jump to Projects ↘", action: "scroll", target: "#work" }
      ];
    }
    else if (matchesAny(lower, ["python", "30 days"])) {
      replyHtml += `
        <p><strong>30 Days of Python:</strong></p>
        <p>An interactive, bite-sized curriculum designed to help aspiring developers build real Python fundamentals day by day.</p>
      `;
      actions = [
        { text: "Visit 30 Days of Python ↗", action: "open", target: "https://30-days-python.vercel.app/", primary: true },
        { text: "Jump to Projects ↘", action: "scroll", target: "#work" }
      ];
    }
    else if (matchesAny(lower, ["progress", "productivity"])) {
      replyHtml += `
        <p><strong>Progress Productivity:</strong></p>
        <p>A clean task and productivity web app focused on making personal progress feel tangible, visible, and achievable one step at a time.</p>
      `;
      actions = [
        { text: "Visit Progress Productivity ↗", action: "open", target: "https://progress-productivity.vercel.app/index.html", primary: true },
        { text: "Jump to Projects ↘", action: "scroll", target: "#work" }
      ];
    }
    else if (matchesAny(lower, ["fitguide", "fitness", "wellness", "workout"])) {
      replyHtml += `
        <p><strong>FitGuide AI:</strong></p>
        <p>A smart wellness web app delivering customized home workouts, yoga sessions, and mindful nutrition guidance to match your pace.</p>
      `;
      actions = [
        { text: "Visit FitGuide AI ↗", action: "open", target: "https://fitness-app-ashy-xi.vercel.app/", primary: true },
        { text: "Jump to Projects ↘", action: "scroll", target: "#work" }
      ];
    }
    // Intent 3: General Projects
    else if (matchesAny(lower, ["project", "work", "portfolio", "built", "apps", "experience", "show me"])) {
      replyHtml += `
        <p>John has built 5 independent, real-world projects:</p>
        <ul>
          <li><strong>Order In Campus:</strong> Campus food & store ordering</li>
          <li><strong>Mi-Svara:</strong> Mobile music-learning platform</li>
          <li><strong>FitGuide AI:</strong> Home workouts & nutrition guide</li>
          <li><strong>30 Days of Python:</strong> Daily code learning platform</li>
          <li><strong>Progress Productivity:</strong> Goal & habit tracker</li>
        </ul>
        <p>You can browse them right on the page or visit the live versions:</p>
      `;
      actions = [
        { text: "👇 Scroll to Projects", action: "scroll", target: "#work", primary: true },
        { text: "Order In Campus ↗", action: "open", target: "https://www.orderincampus.live/" },
        { text: "FitGuide AI ↗", action: "open", target: "https://fitness-app-ashy-xi.vercel.app/" }
      ];
    }
    // Intent 4: Contact & WhatsApp & Hire
    else if (matchesAny(lower, ["contact", "email", "whatsapp", "phone", "hire", "collaborate", "reach", "talk", "touch", "freelance", "opportunity"])) {
      replyHtml += `
        <p>You can connect directly with John through any of these channels:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:${PORTFOLIO_DATA.contact.email}">${PORTFOLIO_DATA.contact.email}</a></li>
          <li><strong>WhatsApp:</strong> Instant chat for inquiries & ideas</li>
          <li><strong>LinkedIn:</strong> Professional profile</li>
        </ul>
      `;
      actions = [
        { text: "💬 Chat on WhatsApp ↗", action: "open", target: PORTFOLIO_DATA.contact.whatsapp, primary: true },
        { text: "✉️ Send Email", action: "open", target: `mailto:${PORTFOLIO_DATA.contact.email}` },
        { text: "💼 LinkedIn ↗", action: "open", target: PORTFOLIO_DATA.contact.linkedin },
        { text: "Scroll to Contact ↘", action: "scroll", target: "#contact" }
      ];
    }
    // Intent 5: Resume / CV
    else if (matchesAny(lower, ["resume", "cv", "download resume", "bio data"])) {
      replyHtml += `
        <p>You can view and download John Kenly's full resume right here:</p>
      `;
      actions = [
        { text: "📄 Open Resume PDF ↗", action: "open", target: PORTFOLIO_DATA.contact.resume, primary: true },
        { text: "📬 Contact John", action: "scroll", target: "#contact" }
      ];
    }
    // Intent 6: Skills / Tech Stack
    else if (matchesAny(lower, ["skill", "stack", "tech", "technology", "react", "javascript", "css", "html", "tool"])) {
      replyHtml += `
        <p><strong>John's Core Toolkit:</strong></p>
        <p>${PORTFOLIO_DATA.skills.join(" • ")}</p>
        <p>He specializes in building clean, responsive web applications with semantic markup, modern CSS layouts, and smooth micro-interactions.</p>
      `;
      actions = [
        { text: "Scroll to About & Toolkit ↘", action: "scroll", target: "#about", primary: true },
        { text: "See Projects Built With These ↘", action: "scroll", target: "#work" }
      ];
    }
    // Intent 7: About John / Bio
    else if (matchesAny(lower, ["about", "bio", "who is john", "john", "background", "philosophy", "story"])) {
      replyHtml += `
        <p><strong>About John Kenly:</strong></p>
        <p>${PORTFOLIO_DATA.bio}</p>
        <p><em>"Curiosity in. Good ideas out."</em> Based at coordinates ${PORTFOLIO_DATA.coordinates}.</p>
      `;
      actions = [
        { text: "Read About Section ↘", action: "scroll", target: "#about", primary: true },
        { text: "Get in Touch ↘", action: "scroll", target: "#contact" }
      ];
    }
    // Intent 8: Page Navigation commands
    else if (matchesAny(lower, ["scroll to", "go to", "take me to", "navigate"])) {
      if (lower.includes("project") || lower.includes("work")) {
        replyHtml += `<p>Navigating to the Projects section...</p>`;
        actions = [{ text: "Jump to Projects ↘", action: "scroll", target: "#work", primary: true }];
        setTimeout(() => document.querySelector("#work")?.scrollIntoView({ behavior: "smooth" }), 200);
      } else if (lower.includes("about")) {
        replyHtml += `<p>Navigating to the About section...</p>`;
        actions = [{ text: "Jump to About ↘", action: "scroll", target: "#about", primary: true }];
        setTimeout(() => document.querySelector("#about")?.scrollIntoView({ behavior: "smooth" }), 200);
      } else if (lower.includes("contact")) {
        replyHtml += `<p>Navigating to Contact...</p>`;
        actions = [{ text: "Jump to Contact ↘", action: "scroll", target: "#contact", primary: true }];
        setTimeout(() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" }), 200);
      } else {
        replyHtml += `<p>Here are the key places to jump to:</p>`;
        actions = [
          { text: "Projects ↘", action: "scroll", target: "#work" },
          { text: "About ↘", action: "scroll", target: "#about" },
          { text: "Contact ↘", action: "scroll", target: "#contact" }
        ];
      }
    }
    // Fallback response with helpful options
    else {
      replyHtml += `
        <p>I'd love to help! John Kenly is a front-end developer crafting clean, responsive digital products.</p>
        <p>Feel free to select one of these options or ask about his projects, skills, or contact info:</p>
      `;
      actions = [
        { text: "🌟 Explore Projects", action: "scroll", target: "#work", primary: true },
        { text: "📬 Contact on WhatsApp", action: "open", target: PORTFOLIO_DATA.contact.whatsapp },
        { text: "📄 Download Resume", action: "open", target: PORTFOLIO_DATA.contact.resume },
        { text: "🛠️ View Skills", action: "scroll", target: "#about" }
      ];
    }

    conversationHistory.push({ role: "model", text: replyHtml.replace(/<[^>]*>/g, " ") });
    appendBotMessage(replyHtml, actions);
  }

  function matchesAny(text, keywords) {
    return keywords.some((kw) => text.includes(kw));
  }

  // Parse markdown formatting into clean HTML
  function parseMarkdownToHtml(markdown) {
    if (!markdown) return "";
    let html = markdown
      // Bold
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      // Italic
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1 ↗</a>')
      // Bullet list items
      .replace(/^\s*[-*]\s+(.*)$/gm, "<li>$1</li>")
      // Numbered lists
      .replace(/^\s*\d+\.\s+(.*)$/gm, "<li>$1</li>");

    // Wrap consecutive <li> into <ul>
    html = html.replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/gs, "<ul>$1</ul>");

    // Paragraphs
    const paragraphs = html.split(/\n\s*\n/).map((p) => {
      p = p.trim();
      if (!p) return "";
      if (p.startsWith("<ul>") || p.startsWith("<li>") || p.startsWith("<h")) return p;
      return `<p>${p.replace(/\n/g, "<br>")}</p>`;
    });

    return paragraphs.join("");
  }

  // Helper to generate quick buttons for live API replies
  function generateContextualActions(text) {
    const lower = text.toLowerCase();
    const actions = [];

    if (lower.includes("whatsapp")) {
      actions.push({ text: "💬 WhatsApp ↗", action: "open", target: PORTFOLIO_DATA.contact.whatsapp, primary: true });
    }
    if (lower.includes("email") || lower.includes("contact")) {
      actions.push({ text: "✉️ Email John", action: "open", target: `mailto:${PORTFOLIO_DATA.contact.email}` });
    }
    if (lower.includes("resume") || lower.includes("cv")) {
      actions.push({ text: "📄 View Resume ↗", action: "open", target: PORTFOLIO_DATA.contact.resume });
    }
    if (lower.includes("order in campus")) {
      actions.push({ text: "Order In Campus ↗", action: "open", target: "https://www.orderincampus.live/" });
    }
    if (lower.includes("mi-svara")) {
      actions.push({ text: "Mi-Svara ↗", action: "open", target: "https://mi-svara.ai.studio/" });
    }
    if (lower.includes("fitguide")) {
      actions.push({ text: "FitGuide AI ↗", action: "open", target: "https://fitness-app-ashy-xi.vercel.app/" });
    }
    if (lower.includes("project") || lower.includes("work")) {
      actions.push({ text: "Scroll to Projects ↘", action: "scroll", target: "#work" });
    }

    // Limit to 3 most relevant buttons so it stays neat
    return actions.slice(0, 3);
  }

  // Auto-init on DOMContentLoaded or immediately if ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();


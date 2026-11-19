/**
 * Solar System Challenge – Arrange the Planets
 * Vanilla ES6+ educational drag-and-drop game
 */

(() => {
  "use strict";

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------

  const PLANETS = [
    {
      id: "mercury",
      name: "Mercury",
      order: 1,
      description: "Mercury is the closest planet to the Sun.",
      hint: "The smallest and swiftest planet — first from the Sun.",
      visualClass: "planet-visual--mercury",
    },
    {
      id: "venus",
      name: "Venus",
      order: 2,
      description: "Venus is the hottest planet in our solar system.",
      hint: "Earth's bright neighbor — second from the Sun.",
      visualClass: "planet-visual--venus",
    },
    {
      id: "earth",
      name: "Earth",
      order: 3,
      description: "Earth is the only known planet with life.",
      hint: "Our home world — third from the Sun.",
      visualClass: "planet-visual--earth",
    },
    {
      id: "mars",
      name: "Mars",
      order: 4,
      description: "Mars is known as the Red Planet.",
      hint: "The Red Planet — fourth from the Sun.",
      visualClass: "planet-visual--mars",
    },
    {
      id: "jupiter",
      name: "Jupiter",
      order: 5,
      description: "Jupiter is the largest planet in our solar system.",
      hint: "The gas giant with the Great Red Spot — fifth from the Sun.",
      visualClass: "planet-visual--jupiter",
    },
    {
      id: "saturn",
      name: "Saturn",
      order: 6,
      description: "Saturn is famous for its beautiful rings.",
      hint: "The ringed planet — sixth from the Sun.",
      visualClass: "planet-visual--saturn",
    },
    {
      id: "uranus",
      name: "Uranus",
      order: 7,
      description: "Uranus rotates on its side.",
      hint: "The sideways spinner — seventh from the Sun.",
      visualClass: "planet-visual--uranus",
    },
    {
      id: "neptune",
      name: "Neptune",
      order: 8,
      description: "Neptune is the farthest planet from the Sun.",
      hint: "The windiest ice giant — farthest from the Sun.",
      visualClass: "planet-visual--neptune",
    },
  ];

  const MAX_SCORE = 80;
  const POINTS_PER_CORRECT = 10;
  const TOTAL_PLANETS = PLANETS.length;

  /**
   * Desktop orbit positions — evenly spaced radii so Mercury/Venus/Earth
   * are NOT clustered near the Sun (matches educational solar-system art).
   */
  const ORBIT_LAYOUT = [
    { order: 1, radius: "18%", angle: "28deg" },
    { order: 2, radius: "28%", angle: "36deg" },
    { order: 3, radius: "38%", angle: "42deg" },
    { order: 4, radius: "48%", angle: "48deg" },
    { order: 5, radius: "58%", angle: "52deg" },
    { order: 6, radius: "68%", angle: "56deg" },
    { order: 7, radius: "78%", angle: "60deg" },
    { order: 8, radius: "88%", angle: "64deg" },
  ];

  // ---------------------------------------------------------------------------
  // Game state
  // ---------------------------------------------------------------------------

  const NAME_STORAGE_KEY = "ssc_explorer_name";

  const PRAISE_LINES = [
    "Nice catch, {name}!",
    "The planets love you, {name}!",
    "Brilliant orbit, {name}!",
    "You’re thinking like an astronomer, {name}!",
    "That was a hero move, {name}!",
    "Space high-five, {name}!",
  ];

  const MILESTONE_LINES = {
    2: "Great start, {name} — two planets home!",
    4: "Halfway there, {name}! Keep going!",
    6: "Almost a full solar system, {name}!",
    8: "Curtain call, {name} — every planet is smiling!",
  };

  const BADGES = [
    { minScore: 80, title: "Galaxy Hero", emoji: "🌌", message: "{name}, that was a perfect Pixar-worthy finale!" },
    { minScore: 60, title: "Solar Scout", emoji: "🌟", message: "Fantastic voyage, {name}! The Sun is proud of you." },
    { minScore: 40, title: "Orbit Explorer", emoji: "🚀", message: "You did it, {name}! Every explorer learns by trying." },
    { minScore: 0, title: "Space Cadet", emoji: "🌙", message: "Welcome to the cosmos, {name} — play again to climb the ranks!" },
  ];

  const state = {
    started: false,
    playerName: "",
    score: 0,
    placed: {}, // order -> planetId
    awarded: new Set(), // planetIds that already scored
    trayOrder: [], // shuffled planet ids for the selection tray
    soundOn: true,
    selectedPlanetId: null,
    draggingId: null,
    pointerActive: false,
    feedbackTimer: null,
    hintTimer: null,
    completing: false,
    praiseIndex: 0,
  };

  // ---------------------------------------------------------------------------
  // DOM refs
  // ---------------------------------------------------------------------------

  const els = {
    startScreen: document.getElementById("startScreen"),
    gameBoard: document.getElementById("gameBoard"),
    slots: document.getElementById("slots"),
    planets: document.getElementById("planets"),
    progressText: document.getElementById("progressText"),
    progressFill: document.getElementById("progressFill"),
    progressBar: document.getElementById("progressBar"),
    scoreText: document.getElementById("scoreText"),
    feedback: document.getElementById("feedback"),
    feedbackIcon: document.getElementById("feedbackIcon"),
    feedbackTitle: document.getElementById("feedbackTitle"),
    feedbackText: document.getElementById("feedbackText"),
    feedbackClose: document.getElementById("feedbackClose"),
    hintToast: document.getElementById("hintToast"),
    hintText: document.getElementById("hintText"),
    dragGhost: document.getElementById("dragGhost"),
    modalInstructions: document.getElementById("modalInstructions"),
    modalComplete: document.getElementById("modalComplete"),
    modalReview: document.getElementById("modalReview"),
    finalScore: document.getElementById("finalScore"),
    completeOrder: document.getElementById("completeOrder"),
    confetti: document.getElementById("confetti"),
    reviewList: document.getElementById("reviewList"),
    btnStart: document.getElementById("btnStart"),
    btnSound: document.getElementById("btnSound"),
    btnInstructions: document.getElementById("btnInstructions"),
    btnHint: document.getElementById("btnHint"),
    btnRestart: document.getElementById("btnRestart"),
    btnReset: document.getElementById("btnReset"),
    btnPlayAgain: document.getElementById("btnPlayAgain"),
    btnReview: document.getElementById("btnReview"),
    playerName: document.getElementById("playerName"),
    startError: document.getElementById("startError"),
    explorerChip: document.getElementById("explorerChip"),
    explorerNameDisplay: document.getElementById("explorerNameDisplay"),
    spaceBlob: document.getElementById("spaceBlob"),
    fxLayer: document.getElementById("fxLayer"),
    completeTitle: document.getElementById("completeTitle"),
    completeKicker: document.getElementById("completeKicker"),
    completeMessage: document.getElementById("completeMessage"),
    badgeTitle: document.getElementById("badgeTitle"),
    badgeEmoji: document.getElementById("badgeEmoji"),
  };

  // ---------------------------------------------------------------------------
  // Audio (Web Audio API — no external files)
  // ---------------------------------------------------------------------------

  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
    return audioCtx;
  }

  function playTone(freq, duration, type = "sine", volume = 0.08) {
    if (!state.soundOn) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      /* ignore audio errors */
    }
  }

  function playSuccessSound() {
    playTone(523.25, 0.12, "sine", 0.07);
    setTimeout(() => playTone(659.25, 0.12, "sine", 0.07), 90);
    setTimeout(() => playTone(783.99, 0.18, "sine", 0.08), 180);
  }

  function playErrorSound() {
    playTone(220, 0.15, "triangle", 0.06);
    setTimeout(() => playTone(180, 0.2, "triangle", 0.05), 100);
  }

  function playCompleteSound() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => playTone(f, 0.2, "sine", 0.07), i * 120);
    });
  }

  // ---------------------------------------------------------------------------
  // Utilities
  // ---------------------------------------------------------------------------

  function getPlanetById(id) {
    return PLANETS.find((p) => p.id === id) || null;
  }

  function getPlanetByOrder(order) {
    return PLANETS.find((p) => p.order === order) || null;
  }

  function shufflePlanets(list) {
    const arr = [...list];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function placedCount() {
    return Object.keys(state.placed).length;
  }

  function nextEmptyOrder() {
    for (let i = 1; i <= TOTAL_PLANETS; i += 1) {
      if (!state.placed[i]) return i;
    }
    return null;
  }

  function isPlanetPlaced(planetId) {
    return Object.values(state.placed).includes(planetId);
  }

  function prefersReducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function sanitizeName(raw) {
    return String(raw || "")
      .replace(/[<>]/g, "")
      .trim()
      .slice(0, 20);
  }

  function displayName() {
    return state.playerName || "Explorer";
  }

  function personalize(template) {
    return String(template).replace(/\{name\}/g, displayName());
  }

  function getBadgeForScore(score) {
    return BADGES.find((b) => score >= b.minScore) || BADGES[BADGES.length - 1];
  }

  function updateExplorerChip() {
    if (!els.explorerChip || !els.explorerNameDisplay) return;
    if (!state.playerName) {
      els.explorerChip.hidden = true;
      return;
    }
    els.explorerNameDisplay.textContent = state.playerName;
    els.explorerChip.hidden = false;
  }

  function loadSavedName() {
    try {
      const saved = sanitizeName(localStorage.getItem(NAME_STORAGE_KEY) || "");
      if (saved && els.playerName) {
        els.playerName.value = saved;
      }
    } catch {
      /* ignore storage errors */
    }
  }

  function savePlayerName(name) {
    state.playerName = name;
    updateExplorerChip();
    try {
      localStorage.setItem(NAME_STORAGE_KEY, name);
    } catch {
      /* ignore */
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  /**
   * Build a cartoon planet with an expressive face.
   * mood: "neutral" | "happy" | "sad"
   */
  function createPlanetVisual(planet, extraClass = "", mood = "neutral") {
    const el = document.createElement("div");
    el.className = `planet-visual ${planet.visualClass} ${extraClass}`.trim();
    el.dataset.mood = mood;
    el.setAttribute("aria-hidden", "true");

    const face = document.createElement("div");
    face.className = `planet-face planet-face--${mood}`;

    const eyeL = document.createElement("span");
    eyeL.className = "planet-eye planet-eye--left";
    const eyeR = document.createElement("span");
    eyeR.className = "planet-eye planet-eye--right";
    const mouth = document.createElement("span");
    mouth.className = "planet-mouth";

    face.appendChild(eyeL);
    face.appendChild(eyeR);
    face.appendChild(mouth);
    el.appendChild(face);

    return el;
  }

  function setPlanetMood(visualEl, mood) {
    if (!visualEl) return;
    visualEl.dataset.mood = mood;
    const face = visualEl.querySelector(".planet-face");
    if (face) {
      face.className = `planet-face planet-face--${mood}`;
    }
  }

  function isVerticalLayout() {
    return document.body.classList.contains("is-vertical-layout");
  }

  function buildSlotElement(order) {
    const slot = document.createElement("div");
    slot.className = "slot";
    slot.dataset.order = String(order);
    slot.setAttribute("role", "listitem");
    slot.setAttribute("tabindex", "0");
    slot.setAttribute(
      "aria-label",
      `Orbit ${order}. Drop planet number ${order} from the Sun here.`
    );

    const num = document.createElement("span");
    num.className = "slot-number";
    num.textContent = String(order);
    slot.appendChild(num);

    // Distance label helps kids understand order on mobile
    const dist = document.createElement("span");
    dist.className = "slot-dist";
    dist.textContent = order === 1 ? "Closest to Sun" : order === 8 ? "Farthest" : `Orbit ${order}`;
    slot.appendChild(dist);

    const placedId = state.placed[order];
    if (placedId) {
      const planet = getPlanetById(placedId);
      slot.classList.add("correct");
      slot.setAttribute(
        "aria-label",
        `Orbit ${order}: ${planet.name} — correctly placed`
      );
      slot.appendChild(createPlanetVisual(planet, "planet-visual--locked", "happy"));

      const bubble = document.createElement("span");
      bubble.className = "speech-bubble";
      bubble.textContent = planet.name;
      slot.appendChild(bubble);

      const check = document.createElement("span");
      check.className = "slot-check";
      check.setAttribute("aria-hidden", "true");
      check.textContent = "✓";
      slot.appendChild(check);
    } else {
      const placeholder = document.createElement("span");
      placeholder.className = "slot-placeholder";
      placeholder.textContent = "Drop planet here";
      slot.appendChild(placeholder);
    }

    return slot;
  }

  function renderSlots() {
    els.slots.innerHTML = "";
    const vertical = isVerticalLayout();

    // Mobile: true vertical list (no orbit arms → no clustering)
    // Desktop: arms place slots on spaced diagonal orbits
    els.slots.classList.toggle("slots--stack", vertical);
    els.slots.classList.toggle("slots--orbit", !vertical);

    ORBIT_LAYOUT.forEach((layout) => {
      const slot = buildSlotElement(layout.order);

      if (vertical) {
        els.slots.appendChild(slot);
        return;
      }

      const arm = document.createElement("div");
      arm.className = "slot-arm";
      arm.style.setProperty("--radius", layout.radius);
      arm.style.setProperty("--angle", layout.angle);
      arm.appendChild(slot);
      els.slots.appendChild(arm);
    });
  }

  function refreshTrayOrder() {
    state.trayOrder = shufflePlanets(PLANETS).map((p) => p.id);
  }

  function renderPlanets() {
    const available = state.trayOrder
      .map((id) => getPlanetById(id))
      .filter((p) => p && !isPlanetPlaced(p.id));

    els.planets.innerHTML = "";

    if (available.length === 0) {
      const empty = document.createElement("p");
      empty.className = "tray-hint";
      empty.textContent = "All planets placed — great work!";
      els.planets.appendChild(empty);
      return;
    }

    available.forEach((planet, index) => {
      const card = document.createElement("div");
      card.className = "planet-card pixar-enter";
      card.style.animationDelay = `${index * 0.07}s`;
      card.dataset.planetId = planet.id;
      card.setAttribute("role", "option");
      card.setAttribute("tabindex", "0");
      card.setAttribute("draggable", "true");
      card.setAttribute(
        "aria-label",
        `${planet.name}. Draggable. Press Enter to select, then press a slot number.`
      );
      card.setAttribute("aria-selected", state.selectedPlanetId === planet.id ? "true" : "false");

      if (state.selectedPlanetId === planet.id) {
        card.classList.add("selected");
      }

      card.appendChild(createPlanetVisual(planet, "planet-visual--idle", "neutral"));

      const name = document.createElement("span");
      name.className = "planet-name";
      name.textContent = planet.name;
      card.appendChild(name);

      els.planets.appendChild(card);
    });
  }

  function updateScore() {
    els.scoreText.textContent = `${state.score} / ${MAX_SCORE}`;
  }

  function updateProgress() {
    const count = placedCount();
    els.progressText.textContent = `${count}/${TOTAL_PLANETS}`;
    els.progressFill.style.width = `${(count / TOTAL_PLANETS) * 100}%`;
    els.progressBar.setAttribute("aria-valuenow", String(count));
  }

  // ---------------------------------------------------------------------------
  // Feedback UI
  // ---------------------------------------------------------------------------

  function showFeedback(type, title, text) {
    clearTimeout(state.feedbackTimer);
    els.feedback.hidden = false;
    els.feedback.classList.remove("success", "error");
    els.feedback.classList.add(type);
    els.feedbackIcon.textContent = type === "success" ? "✓" : "!";
    els.feedbackTitle.textContent = title;
    els.feedbackText.textContent = text;

    state.feedbackTimer = setTimeout(() => {
      els.feedback.hidden = true;
    }, 4500);
  }

  function hideFeedback() {
    clearTimeout(state.feedbackTimer);
    els.feedback.hidden = true;
  }

  function showHint() {
    if (!state.started) return;

    const order = nextEmptyOrder();
    if (order === null) {
      els.hintText.textContent = personalize("All orbits filled — you finished, {name}!");
    } else {
      const planet = getPlanetByOrder(order);
      els.hintText.textContent = personalize(
        `{name}, try orbit ${order}: ${planet.hint}`
      );
    }

    clearTimeout(state.hintTimer);
    els.hintToast.hidden = false;
    state.hintTimer = setTimeout(() => {
      els.hintToast.hidden = true;
    }, 5000);

    playTone(440, 0.1, "sine", 0.05);
  }

  // ---------------------------------------------------------------------------
  // Modals
  // ---------------------------------------------------------------------------

  function openModal(modal) {
    modal.hidden = false;
    const focusable = modal.querySelector(
      "button, [href], input, [tabindex]:not([tabindex='-1'])"
    );
    if (focusable) focusable.focus();
  }

  function closeModal(modal) {
    modal.hidden = true;
  }

  function buildConfetti() {
    els.confetti.innerHTML = "";
    if (prefersReducedMotion()) return;

    const colors = ["#4db8ff", "#7c5cff", "#2ecc71", "#ffb347", "#ff6b6b", "#fff", "#e8c468"];
    for (let i = 0; i < 56; i += 1) {
      const piece = document.createElement("div");
      piece.className = "confetti-piece";
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.background = colors[i % colors.length];
      piece.style.animationDuration = `${2.2 + Math.random() * 2.5}s`;
      piece.style.animationDelay = `${Math.random() * 0.8}s`;
      piece.style.width = `${6 + Math.random() * 6}px`;
      piece.style.height = `${8 + Math.random() * 8}px`;
      els.confetti.appendChild(piece);
    }
  }

  /** Pixar-style sparkle burst at a slot */
  function spawnOrbitFX(slotEl) {
    if (!els.fxLayer || !slotEl || prefersReducedMotion()) return;

    const blobRect = els.spaceBlob.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();
    const x = slotRect.left + slotRect.width / 2 - blobRect.left;
    const y = slotRect.top + slotRect.height / 2 - blobRect.top;

    const ring = document.createElement("span");
    ring.className = "fx-ring";
    ring.style.left = `${x}px`;
    ring.style.top = `${y}px`;
    els.fxLayer.appendChild(ring);

    for (let i = 0; i < 10; i += 1) {
      const angle = (Math.PI * 2 * i) / 10;
      const dist = 28 + Math.random() * 36;
      const spark = document.createElement("span");
      spark.className = i % 3 === 0 ? "fx-star" : "fx-spark";
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      spark.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      spark.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      els.fxLayer.appendChild(spark);
    }

    setTimeout(() => {
      els.fxLayer.innerHTML = "";
    }, 1000);
  }

  function cheerSun() {
    const sun = document.querySelector(".sun");
    if (!sun || prefersReducedMotion()) return;
    sun.classList.remove("sun-cheer");
    // force reflow to restart animation
    void sun.offsetWidth;
    sun.classList.add("sun-cheer");
    sun.addEventListener("animationend", () => sun.classList.remove("sun-cheer"), { once: true });
  }

  function cinemaPulse() {
    if (!els.spaceBlob || prefersReducedMotion()) return;
    els.spaceBlob.classList.remove("cinema-pulse");
    void els.spaceBlob.offsetWidth;
    els.spaceBlob.classList.add("cinema-pulse");
    els.spaceBlob.addEventListener(
      "animationend",
      () => els.spaceBlob.classList.remove("cinema-pulse"),
      { once: true }
    );
  }

  function nextPraise() {
    const line = PRAISE_LINES[state.praiseIndex % PRAISE_LINES.length];
    state.praiseIndex += 1;
    return personalize(line);
  }

  function completeGame() {
    if (state.completing) return;
    state.completing = true;

    const badge = getBadgeForScore(state.score);
    els.finalScore.textContent = String(state.score);

    if (els.completeTitle) {
      els.completeTitle.textContent = personalize(
        "Amazing, {name}! You completed the Solar System!"
      );
    }
    if (els.completeKicker) {
      els.completeKicker.textContent = personalize("{name}'s Mission Complete");
    }
    if (els.badgeTitle) els.badgeTitle.textContent = badge.title;
    if (els.badgeEmoji) els.badgeEmoji.textContent = badge.emoji;
    if (els.completeMessage) {
      els.completeMessage.textContent = personalize(badge.message);
    }

    els.completeOrder.innerHTML = "";

    PLANETS.forEach((planet, index) => {
      const item = document.createElement("div");
      item.className = "complete-planet";
      item.style.animationDelay = `${index * 0.06}s`;
      item.setAttribute("role", "listitem");

      const num = document.createElement("span");
      num.className = "order-num";
      num.textContent = `#${planet.order}`;
      item.appendChild(num);
      item.appendChild(createPlanetVisual(planet, "planet-anim-celebrate", "happy"));

      const name = document.createElement("span");
      name.textContent = planet.name;
      item.appendChild(name);

      els.completeOrder.appendChild(item);
    });

    buildConfetti();
    openModal(els.modalComplete);
    playCompleteSound();
  }

  function renderReview() {
    els.reviewList.innerHTML = "";
    PLANETS.forEach((planet) => {
      const item = document.createElement("div");
      item.className = "review-item";

      const badge = document.createElement("span");
      badge.className = "order-badge";
      badge.textContent = String(planet.order);
      item.appendChild(badge);
      item.appendChild(createPlanetVisual(planet, "", "happy"));

      const body = document.createElement("div");
      body.className = "review-body";
      const title = document.createElement("strong");
      title.textContent = planet.name;
      const desc = document.createElement("p");
      desc.textContent = planet.description;
      body.appendChild(title);
      body.appendChild(desc);
      item.appendChild(body);

      els.reviewList.appendChild(item);
    });
  }

  // ---------------------------------------------------------------------------
  // Core game logic
  // ---------------------------------------------------------------------------

  function checkAnswer(planetId, slotOrder) {
    const planet = getPlanetById(planetId);
    if (!planet) return { correct: false, planet: null };

    const order = Number(slotOrder);
    if (!Number.isInteger(order) || order < 1 || order > TOTAL_PLANETS) {
      return { correct: false, planet };
    }

    return { correct: planet.order === order, planet, order };
  }

  function placePlanet(planetId, slotOrder) {
    if (!state.started || state.completing) return false;

    const planet = getPlanetById(planetId);
    if (!planet) return false;

    // Already placed — prevent duplicates
    if (isPlanetPlaced(planetId)) return false;

    const order = Number(slotOrder);
    if (!Number.isInteger(order) || order < 1 || order > TOTAL_PLANETS) return false;

    // Slot already filled
    if (state.placed[order]) {
      showFeedback(
        "error",
        personalize("Hold on, {name}"),
        "That orbit already has a planet. Try another one."
      );
      playErrorSound();
      return false;
    }

    const result = checkAnswer(planetId, order);
    const slotEl = els.slots.querySelector(`[data-order="${order}"]`);

    if (result.correct) {
      state.placed[order] = planetId;

      // Award points only once per planet
      if (!state.awarded.has(planetId)) {
        state.awarded.add(planetId);
        state.score = Math.min(MAX_SCORE, state.score + POINTS_PER_CORRECT);
      }

      updateScore();
      updateProgress();
      clearSelection();
      renderSlots();
      renderPlanets();

      const placedSlot = els.slots.querySelector(`[data-order="${order}"]`);
      const lockedVisual = placedSlot
        ? placedSlot.querySelector(".planet-visual")
        : null;

      if (lockedVisual) {
        setPlanetMood(lockedVisual, "happy");
        lockedVisual.classList.add("planet-anim-celebrate");
        lockedVisual.addEventListener(
          "animationend",
          () => lockedVisual.classList.remove("planet-anim-celebrate"),
          { once: true }
        );
      }

      spawnOrbitFX(placedSlot);
      cheerSun();
      cinemaPulse();

      const count = placedCount();
      const milestone = MILESTONE_LINES[count];
      const praise = milestone ? personalize(milestone) : nextPraise();

      showFeedback(
        "success",
        praise,
        `${planet.name} is smiling! ${planet.description}`
      );
      playSuccessSound();

      if (count === TOTAL_PLANETS) {
        setTimeout(() => completeGame(), 1100);
      }
      return true;
    }

    // Incorrect — show sad face animation in the slot, then return to tray
    showSadPlacement(planet, slotEl);

    showFeedback(
      "error",
      personalize("Almost, {name}!"),
      `${planet.name} looks sad… that isn’t orbit ${order}. Try again — you’ve got this!`
    );
    playErrorSound();
    return false;
  }

  /**
   * Briefly drop a sad planet into the slot with shake, then clean up.
   */
  function showSadPlacement(planet, slotEl) {
    if (!slotEl) return;

    slotEl.classList.add("incorrect");

    const placeholder = slotEl.querySelector(".slot-placeholder");
    if (placeholder) placeholder.hidden = true;

    // Remove any leftover temp visual
    slotEl.querySelectorAll(".planet-visual--temp").forEach((n) => n.remove());

    const sadPlanet = createPlanetVisual(planet, "planet-visual--temp", "sad");
    sadPlanet.classList.add("planet-anim-sad");
    slotEl.appendChild(sadPlanet);

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      sadPlanet.remove();
      slotEl.classList.remove("incorrect");
      if (placeholder) placeholder.hidden = false;
    };

    sadPlanet.addEventListener("animationend", cleanup, { once: true });
    setTimeout(cleanup, 900);
  }

  function clearSelection() {
    state.selectedPlanetId = null;
    els.planets.querySelectorAll(".planet-card.selected").forEach((c) => {
      c.classList.remove("selected");
      c.setAttribute("aria-selected", "false");
    });
    els.slots.querySelectorAll(".keyboard-target").forEach((s) => {
      s.classList.remove("keyboard-target");
    });
  }

  function selectPlanet(planetId) {
    if (isPlanetPlaced(planetId)) return;
    state.selectedPlanetId = planetId;

    els.planets.querySelectorAll(".planet-card").forEach((card) => {
      const selected = card.dataset.planetId === planetId;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-selected", selected ? "true" : "false");
    });

    // Highlight empty slots as drop targets for keyboard users
    els.slots.querySelectorAll(".slot").forEach((slot) => {
      const order = Number(slot.dataset.order);
      slot.classList.toggle("keyboard-target", !state.placed[order]);
    });
  }

  // ---------------------------------------------------------------------------
  // HTML5 Drag and Drop
  // ---------------------------------------------------------------------------

  function handleDragStart(event) {
    const card = event.target.closest(".planet-card");
    if (!card || !state.started) {
      event.preventDefault();
      return;
    }

    const planetId = card.dataset.planetId;
    if (!planetId || isPlanetPlaced(planetId)) {
      event.preventDefault();
      return;
    }

    state.draggingId = planetId;
    card.classList.add("dragging");
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", planetId);

    // Custom drag image if supported
    try {
      const ghost = card.cloneNode(true);
      ghost.style.position = "absolute";
      ghost.style.top = "-9999px";
      document.body.appendChild(ghost);
      event.dataTransfer.setDragImage(ghost, card.offsetWidth / 2, card.offsetHeight / 2);
      setTimeout(() => ghost.remove(), 0);
    } catch {
      /* fallback: browser default */
    }
  }

  function handleDragEnd(event) {
    const card = event.target.closest(".planet-card");
    if (card) card.classList.remove("dragging");
    state.draggingId = null;
    els.slots.querySelectorAll(".drag-over").forEach((s) => s.classList.remove("drag-over"));
    hideGhost();
  }

  function handleDragOver(event) {
    const slot = event.target.closest(".slot");
    if (!slot || state.placed[slot.dataset.order]) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function handleDragEnter(event) {
    const slot = event.target.closest(".slot");
    if (!slot || state.placed[slot.dataset.order]) return;
    event.preventDefault();
    slot.classList.add("drag-over");
  }

  function handleDragLeave(event) {
    const slot = event.target.closest(".slot");
    if (!slot) return;
    // Only remove when truly leaving the slot
    if (!slot.contains(event.relatedTarget)) {
      slot.classList.remove("drag-over");
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    const slot = event.target.closest(".slot");
    if (!slot) return;

    slot.classList.remove("drag-over");
    const planetId =
      event.dataTransfer.getData("text/plain") || state.draggingId;
    if (!planetId) return;

    placePlanet(planetId, slot.dataset.order);
    state.draggingId = null;
  }

  // ---------------------------------------------------------------------------
  // Pointer Events (touch / pen / unified)
  // ---------------------------------------------------------------------------

  let pointerState = {
    id: null,
    planetId: null,
    startX: 0,
    startY: 0,
    moved: false,
    originCard: null,
  };

  function showGhost(planet, x, y) {
    els.dragGhost.hidden = false;
    els.dragGhost.innerHTML = "";
    els.dragGhost.appendChild(createPlanetVisual(planet));
    const name = document.createElement("span");
    name.className = "planet-name";
    name.textContent = planet.name;
    els.dragGhost.appendChild(name);
    moveGhost(x, y);
  }

  function moveGhost(x, y) {
    els.dragGhost.style.left = `${x}px`;
    els.dragGhost.style.top = `${y}px`;
  }

  function hideGhost() {
    els.dragGhost.hidden = true;
    els.dragGhost.innerHTML = "";
  }

  function slotFromPoint(x, y) {
    const el = document.elementFromPoint(x, y);
    return el ? el.closest(".slot") : null;
  }

  function handlePointerDown(event) {
    if (!state.started || state.pointerActive) return;

    // Prefer pointer path for touch/pen; mouse still uses HTML5 DnD
    if (event.pointerType === "mouse") return;

    const card = event.target.closest(".planet-card");
    if (!card) return;

    const planetId = card.dataset.planetId;
    if (!planetId || isPlanetPlaced(planetId)) return;

    event.preventDefault();
    state.pointerActive = true;
    pointerState = {
      id: event.pointerId,
      planetId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      originCard: card,
    };

    card.setPointerCapture(event.pointerId);
    state.draggingId = planetId;
    card.classList.add("dragging");

    const planet = getPlanetById(planetId);
    showGhost(planet, event.clientX, event.clientY);
  }

  function handlePointerMove(event) {
    if (!state.pointerActive || event.pointerId !== pointerState.id) return;
    event.preventDefault();

    const dx = event.clientX - pointerState.startX;
    const dy = event.clientY - pointerState.startY;
    if (!pointerState.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
      pointerState.moved = true;
    }

    moveGhost(event.clientX, event.clientY);

    els.slots.querySelectorAll(".drag-over").forEach((s) => s.classList.remove("drag-over"));
    const slot = slotFromPoint(event.clientX, event.clientY);
    if (slot && !state.placed[slot.dataset.order]) {
      slot.classList.add("drag-over");
    }
  }

  function handlePointerUp(event) {
    if (!state.pointerActive || event.pointerId !== pointerState.id) return;
    event.preventDefault();

    const { planetId, originCard, moved } = pointerState;
    const x = event.clientX;
    const y = event.clientY;

    hideGhost();
    els.slots.querySelectorAll(".drag-over").forEach((s) => s.classList.remove("drag-over"));
    if (originCard) originCard.classList.remove("dragging");

    try {
      if (originCard && originCard.hasPointerCapture(event.pointerId)) {
        originCard.releasePointerCapture(event.pointerId);
      }
    } catch {
      /* ignore */
    }

    state.pointerActive = false;
    state.draggingId = null;
    pointerState = { id: null, planetId: null, startX: 0, startY: 0, moved: false, originCard: null };

    if (moved) {
      const slot = slotFromPoint(x, y);
      if (slot && planetId) {
        placePlanet(planetId, slot.dataset.order);
      }
    } else if (planetId) {
      // Tap = keyboard-style select
      selectPlanet(planetId);
    }
  }

  function handlePointerCancel(event) {
    if (!state.pointerActive || event.pointerId !== pointerState.id) return;
    hideGhost();
    els.slots.querySelectorAll(".drag-over").forEach((s) => s.classList.remove("drag-over"));
    if (pointerState.originCard) {
      pointerState.originCard.classList.remove("dragging");
    }
    state.pointerActive = false;
    state.draggingId = null;
    pointerState = { id: null, planetId: null, startX: 0, startY: 0, moved: false, originCard: null };
  }

  // ---------------------------------------------------------------------------
  // Keyboard support
  // ---------------------------------------------------------------------------

  function handlePlanetKeyDown(event) {
    const card = event.target.closest(".planet-card");
    if (!card || !state.started) return;

    const planetId = card.dataset.planetId;
    if (!planetId) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (state.selectedPlanetId === planetId) {
        clearSelection();
      } else {
        selectPlanet(planetId);
      }
    }
  }

  function handleSlotKeyDown(event) {
    const slot = event.target.closest(".slot");
    if (!slot || !state.started) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (!state.selectedPlanetId) {
        showFeedback("error", "Select a planet first", "Choose a planet from the tray, then place it here.");
        return;
      }
      if (state.placed[slot.dataset.order]) return;
      placePlanet(state.selectedPlanetId, slot.dataset.order);
    }
  }

  function handleGlobalKeyDown(event) {
    if (!state.started) return;

    // Number keys 1–8 place selected planet
    if (state.selectedPlanetId && /^[1-8]$/.test(event.key)) {
      // Don't steal typing from inputs (none currently, but safe)
      if (event.target.closest("input, textarea")) return;
      event.preventDefault();
      placePlanet(state.selectedPlanetId, event.key);
      return;
    }

    if (event.key === "Escape") {
      clearSelection();
      hideFeedback();
      els.hintToast.hidden = true;
      if (!els.modalComplete.hidden) return; // keep completion open
      closeModal(els.modalInstructions);
      closeModal(els.modalReview);
    }
  }

  // ---------------------------------------------------------------------------
  // Game lifecycle
  // ---------------------------------------------------------------------------

  function resetGame(options = { keepStarted: true }) {
    hideFeedback();
    els.hintToast.hidden = true;
    hideGhost();
    closeModal(els.modalComplete);
    closeModal(els.modalReview);

    state.score = 0;
    state.placed = {};
    state.awarded = new Set();
    state.selectedPlanetId = null;
    state.draggingId = null;
    state.pointerActive = false;
    state.completing = false;
    els.confetti.innerHTML = "";
    refreshTrayOrder();

    updateScore();
    updateProgress();

    if (options.keepStarted && state.started) {
      renderSlots();
      renderPlanets();
    }
  }

  function initializeGame() {
    const name = sanitizeName(els.playerName ? els.playerName.value : "");
    if (!name) {
      if (els.startError) els.startError.hidden = false;
      if (els.playerName) {
        els.playerName.focus();
        els.playerName.classList.add("input-shake");
        setTimeout(() => els.playerName.classList.remove("input-shake"), 500);
      }
      playErrorSound();
      return;
    }

    if (els.startError) els.startError.hidden = true;
    savePlayerName(name);

    state.started = true;
    state.praiseIndex = 0;
    els.startScreen.hidden = true;
    els.gameBoard.hidden = false;
    resetGame({ keepStarted: true });

    showFeedback(
      "success",
      personalize("Mission start, {name}!"),
      "Drag each planet onto the correct orbit. The Sun is cheering for you."
    );
    playTone(523, 0.12, "sine", 0.06);
    setTimeout(() => playTone(659, 0.14, "sine", 0.06), 120);
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    els.btnSound.setAttribute("aria-pressed", state.soundOn ? "true" : "false");
    els.btnSound.title = state.soundOn ? "Sound ON" : "Sound OFF";
    els.btnSound.setAttribute(
      "aria-label",
      state.soundOn ? "Mute sound" : "Unmute sound"
    );
    if (state.soundOn) playTone(660, 0.08, "sine", 0.05);
  }

  // ---------------------------------------------------------------------------
  // Event binding (delegation)
  // ---------------------------------------------------------------------------

  function bindEvents() {
    // Start / controls
    els.btnStart.addEventListener("click", initializeGame);
    if (els.playerName) {
      els.playerName.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          initializeGame();
        }
      });
      els.playerName.addEventListener("input", () => {
        if (els.startError) els.startError.hidden = true;
      });
    }
    els.btnRestart.addEventListener("click", () => {
      if (!state.started) {
        initializeGame();
        return;
      }
      resetGame({ keepStarted: true });
      playTone(400, 0.1, "sine", 0.05);
    });
    els.btnReset.addEventListener("click", () => {
      resetGame({ keepStarted: true });
      playTone(350, 0.1, "sine", 0.05);
    });
    els.btnHint.addEventListener("click", showHint);
    els.btnSound.addEventListener("click", toggleSound);
    els.btnInstructions.addEventListener("click", () => openModal(els.modalInstructions));
    els.btnPlayAgain.addEventListener("click", () => {
      closeModal(els.modalComplete);
      resetGame({ keepStarted: true });
    });
    els.btnReview.addEventListener("click", () => {
      renderReview();
      openModal(els.modalReview);
    });
    els.feedbackClose.addEventListener("click", hideFeedback);

    // Modal close via data-close
    document.addEventListener("click", (event) => {
      const closer = event.target.closest("[data-close]");
      if (!closer) return;
      const id = closer.getAttribute("data-close");
      const modal = document.getElementById(id);
      if (modal) closeModal(modal);
    });

    // HTML5 DnD — delegated on tray & slots
    els.planets.addEventListener("dragstart", handleDragStart);
    els.planets.addEventListener("dragend", handleDragEnd);
    els.slots.addEventListener("dragover", handleDragOver);
    els.slots.addEventListener("dragenter", handleDragEnter);
    els.slots.addEventListener("dragleave", handleDragLeave);
    els.slots.addEventListener("drop", handleDrop);

    // Pointer (touch / pen)
    els.planets.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("pointermove", handlePointerMove, { passive: false });
    document.addEventListener("pointerup", handlePointerUp);
    document.addEventListener("pointercancel", handlePointerCancel);

    // Keyboard
    els.planets.addEventListener("keydown", handlePlanetKeyDown);
    els.slots.addEventListener("keydown", handleSlotKeyDown);
    document.addEventListener("keydown", handleGlobalKeyDown);

    // Click-to-select on desktop (in addition to drag)
    els.planets.addEventListener("click", (event) => {
      const card = event.target.closest(".planet-card");
      if (!card || !state.started) return;
      // Avoid conflicting with completed pointer drag
      if (state.pointerActive) return;
      selectPlanet(card.dataset.planetId);
    });

    // Click empty slot when a planet is selected
    els.slots.addEventListener("click", (event) => {
      const slot = event.target.closest(".slot");
      if (!slot || !state.started || !state.selectedPlanetId) return;
      if (state.placed[slot.dataset.order]) return;
      placePlanet(state.selectedPlanetId, slot.dataset.order);
    });
  }

  // ---------------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------------

  /**
   * Force vertical Sun→slots stack on narrow / touch screens
   * so orbit rings never overlap drop zones.
   */
  function updateLayoutMode() {
    const vertical =
      window.matchMedia("(max-width: 900px)").matches ||
      (window.matchMedia("(pointer: coarse)").matches &&
        window.matchMedia("(max-width: 1100px)").matches);

    const wasVertical = isVerticalLayout();
    document.body.classList.toggle("is-vertical-layout", vertical);

    // Re-build slots when switching between orbit map ↔ vertical stack
    if (wasVertical !== vertical && state.started) {
      renderSlots();
    }
  }

  function boot() {
    loadSavedName();
    updateScore();
    updateProgress();
    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    window.addEventListener("orientationchange", updateLayoutMode);
    bindEvents();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

// ─────────────────────────────────────────────
//  GARY — THE SACRED ROCK  |  script.js
// ─────────────────────────────────────────────

const GARY_IMG_IDLE  = "files/output-onlinegiftools.gif";
const GARY_IMG_SPEAK = "files/Blunt-image.png";

// ── STATE ────────────────────────────────────
let conversationHistory = [];
let isBusy = false;

// ── DOM REFS ─────────────────────────────────
const garyImg    = document.getElementById("gary-img");
const garyStatus = document.getElementById("gary-status");
const chatLog    = document.getElementById("chat-log");
const userInput  = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");
const garyAudio  = document.getElementById("gary-audio");
const angelAudio = document.getElementById("angel-audio");

// ── INIT ─────────────────────────────────────
(function init() {
  spawnStars();

  angelAudio.loop   = true;
  angelAudio.volume = 0.4;

  // Try autoplay; fall back to first click
  angelAudio.play().catch(() => {
    document.addEventListener("click", () => {
      angelAudio.play().catch(() => {});
    }, { once: true });
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToGary();
    }
  });
})();

// ── MAIN SEND ────────────────────────────────
async function sendToGary() {
  if (isBusy) return;

  const userText = userInput.value.trim();
  if (!userText) {
    appendMessage("Gary", "gary is also not saying anything. you have found common ground.", "gary");
    return;
  }

  // Stop ambient angel the moment user sends anything
  if (!angelAudio.paused) {
    angelAudio.pause();
    angelAudio.currentTime = 0;
  }

  isBusy = true;
  sendBtn.disabled = true;
  userInput.value = "";

  appendMessage("You", userText, "user");
  setGaryState("thinking", "Gary is… consulting the cosmos.");
  const loadingEl = appendLoadingMessage();

  try {
    const geminiRes = await fetch("/api/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: conversationHistory, userText })
    });

    if (!geminiRes.ok) {
      const err = await geminiRes.json().catch(() => ({}));
      throw new Error(err.error || `server error ${geminiRes.status}`);
    }

    const { reply, newUserEntry, newModelEntry } = await geminiRes.json();
    conversationHistory.push(newUserEntry, newModelEntry);

    loadingEl.remove();
    appendMessage("Gary", reply, "gary");

    setGaryState("thinking", "Gary is… finding his voice.");
    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply })
    });

    if (!ttsRes.ok) throw new Error("Gary lost his voice.");

    const audioBlob = await ttsRes.blob();
    await playSequence(audioBlob);

  } catch (err) {
    loadingEl.remove();
    appendMessage("Gary", `…${err.message}. the rock is briefly unavailable.`, "gary");
    setGaryState("thinking", "Gary is… recovering.");
    console.error(err);
  }

  isBusy = false;
  sendBtn.disabled = false;
}

// ── AUDIO SEQUENCE ────────────────────────────
// 1. Play angel sfx (one-shot, no loop)
// 2. When sfx ends → Gary speaks
// 3. When Gary ends → back to idle
function playSequence(garyBlob) {
  return new Promise((resolve) => {

    // Use the angel element but one-shot (no loop)
    angelAudio.loop          = false;
    angelAudio.volume        = 0.8;
    angelAudio.currentTime   = 0;

    const afterAngel = () => {
      angelAudio.removeEventListener("ended", afterAngel);
      angelAudio.removeEventListener("error", afterAngel);

      const garyUrl = URL.createObjectURL(garyBlob);
      garyAudio.src = garyUrl;

      garyAudio.onplay = () => setGaryState("speaking", "Gary speaks…");

      garyAudio.onended = () => {
        URL.revokeObjectURL(garyUrl);
        setGaryState("thinking", "Gary is… contemplating.");
        resolve();
      };

      garyAudio.onerror = () => {
        URL.revokeObjectURL(garyUrl);
        setGaryState("thinking", "Gary is… silent.");
        resolve();
      };

      garyAudio.play().catch(() => {
        setGaryState("thinking", "Gary whispers — allow audio in your browser.");
        resolve();
      });
    };

    angelAudio.addEventListener("ended", afterAngel, { once: true });
    angelAudio.addEventListener("error", afterAngel, { once: true });

    angelAudio.play().catch(() => afterAngel());
  });
}

// ── GARY STATE ───────────────────────────────
function setGaryState(state, statusText) {
  garyStatus.textContent = statusText;

  if (state === "speaking") {
    garyImg.src = GARY_IMG_SPEAK;
    garyImg.classList.remove("thinking");
    garyImg.classList.add("speaking");
    garyStatus.classList.add("speaking-status");
  } else {
    garyImg.src = GARY_IMG_IDLE;
    garyImg.classList.remove("speaking");
    garyImg.classList.add("thinking");
    garyStatus.classList.remove("speaking-status");
  }
}

// ── CHAT HELPERS ─────────────────────────────
function appendMessage(speaker, text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}-message`;
  div.innerHTML = `
    <span class="speaker">${speaker}</span>
    <p>${escapeHtml(text)}</p>
  `;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function appendLoadingMessage() {
  const div = document.createElement("div");
  div.className = "message gary-message";
  div.innerHTML = `
    <span class="speaker">Gary</span>
    <p class="loading-dots"><span>·</span><span>·</span><span>·</span></p>
  `;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── STAR FIELD ───────────────────────────────
function spawnStars() {
  const container = document.getElementById("stars");
  for (let i = 0; i < 120; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2 + 0.5;
    s.style.cssText = `
      width:${size}px; height:${size}px;
      top:${Math.random() * 100}%;
      left:${Math.random() * 100}%;
      --d:${(Math.random() * 4 + 2).toFixed(1)}s;
      --o:${(Math.random() * 0.5 + 0.1).toFixed(2)};
      animation-delay:${(Math.random() * 5).toFixed(1)}s;
    `;
    container.appendChild(s);
  }
}

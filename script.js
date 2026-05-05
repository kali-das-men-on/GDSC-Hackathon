const GARY_IMG_IDLE  = "files/output-onlinegiftools.gif";
const GARY_IMG_SPEAK = "files/Blunt-image.png";
const ANGEL_SFX      = "files/Angel_Sound_Effect.mp3";

let conversationHistory = [];
let isBusy = false;
let ambientAngel = null;

const garyImg    = document.getElementById("gary-img");
const garyStatus = document.getElementById("gary-status");
const chatLog    = document.getElementById("chat-log");
const userInput  = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");
const garyAudio  = document.getElementById("gary-audio");

(function init() {
  spawnStars();

  ambientAngel = new Audio(ANGEL_SFX);
  ambientAngel.loop = true;
  ambientAngel.volume = 0.4;
  ambientAngel.play().catch(() => {
    document.addEventListener("click", () => {
      ambientAngel?.play().catch(() => {});
    }, { once: true });
  });

  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToGary();
    }
  });
})();

async function sendToGary() {
  if (isBusy) return;

  const userText = userInput.value.trim();
  if (!userText) {
    appendMessage("Gary", "gary is also not saying anything. you have found common ground.", "gary");
    return;
  }

  if (ambientAngel) {
    ambientAngel.pause();
    ambientAngel.currentTime = 0;
    ambientAngel = null;
  }

  isBusy = true;
  sendBtn.disabled = true;
  userInput.value = "";

  appendMessage("You", userText, "user");
  setGaryState("thinking", "Gary is… consulting the cosmos.");
  const loadingEl = appendLoadingMessage();

  try {
    // ── 1. Call /api/gary (OpenRouter) ──
    const garyRes = await fetch("/api/gary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: conversationHistory, userText })
    });

    if (!garyRes.ok) {
      const err = await garyRes.json().catch(() => ({}));
      throw new Error(err.error || `server error ${garyRes.status}`);
    }

    const { reply, newUserEntry, newModelEntry } = await garyRes.json();
    conversationHistory.push(newUserEntry, newModelEntry);

    loadingEl.remove();
    appendMessage("Gary", reply, "gary");

    // ── 2. Call /api/tts (ElevenLabs) ──
    setGaryState("thinking", "Gary is… finding his voice.");
    const ttsRes = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: reply })
    });

    if (!ttsRes.ok) throw new Error("Gary lost his voice.");

    const audioBlob = await ttsRes.blob();

    // ── 3. Angel SFX → Gary speaks ──
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

function playSequence(garyBlob) {
  return new Promise((resolve) => {
    const angel = new Audio(ANGEL_SFX);

    const playGary = () => {
      const garyUrl = URL.createObjectURL(garyBlob);
      garyAudio.src = garyUrl;
      garyAudio.onplay  = () => setGaryState("speaking", "Gary speaks…");
      garyAudio.onended = () => { URL.revokeObjectURL(garyUrl); setGaryState("thinking", "Gary is… contemplating."); resolve(); };
      garyAudio.onerror = () => { URL.revokeObjectURL(garyUrl); setGaryState("thinking", "Gary is… silent."); resolve(); };
      garyAudio.play().catch(() => { setGaryState("thinking", "Gary whispers — allow audio."); resolve(); });
    };

    angel.onended = playGary;
    angel.onerror = playGary; // if sfx fails, skip straight to gary
    angel.play().catch(playGary);
  });
}

function setGaryState(state, statusText) {
  garyStatus.textContent = statusText;
  if (state === "speaking") {
    garyImg.src = GARY_IMG_SPEAK;
    garyImg.classList.replace("thinking", "speaking");
    garyStatus.classList.add("speaking-status");
  } else {
    garyImg.src = GARY_IMG_IDLE;
    garyImg.classList.replace("speaking", "thinking");
    garyStatus.classList.remove("speaking-status");
  }
}

function appendMessage(speaker, text, type) {
  const div = document.createElement("div");
  div.className = `message ${type}-message`;
  div.innerHTML = `<span class="speaker">${speaker}</span><p>${escapeHtml(text)}</p>`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function appendLoadingMessage() {
  const div = document.createElement("div");
  div.className = "message gary-message";
  div.innerHTML = `<span class="speaker">Gary</span><p class="loading-dots"><span>·</span><span>·</span><span>·</span></p>`;
  chatLog.appendChild(div);
  chatLog.scrollTop = chatLog.scrollHeight;
  return div;
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function spawnStars() {
  const container = document.getElementById("stars");
  for (let i = 0; i < 120; i++) {
    const s = document.createElement("div");
    s.className = "star";
    const size = Math.random() * 2 + 0.5;
    s.style.cssText = `width:${size}px;height:${size}px;top:${Math.random()*100}%;left:${Math.random()*100}%;--d:${(Math.random()*4+2).toFixed(1)}s;--o:${(Math.random()*0.5+0.1).toFixed(2)};animation-delay:${(Math.random()*5).toFixed(1)}s;`;
    container.appendChild(s);
  }
}

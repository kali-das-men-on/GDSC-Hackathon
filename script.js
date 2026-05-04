// ─────────────────────────────────────────────
//  GARY — THE SACRED ROCK  |  script.js
//  Flow: user input → Gemini (with prompt.txt) → ElevenLabs TTS → audio
// ─────────────────────────────────────────────

// ── CONFIG ──────────────────────────────────
const GEMINI_KEY     = "AIzaSyDUeEJLwxlXesvV5FSNU27DocRSQFZhHNM";
const ELEVEN_KEY     = "sk_c03716bac343d6897dfe072f7bfddbbbaa842c5dd3723d1d";
const ELEVEN_VOICE   = "bFrjFL4nlpeYNwNRhXxq";

const GEMINI_MODEL   = "gemini-2.0-flash";
const GARY_IMG_IDLE  = "output-onlinegiftools.gif";   // thinking / idle gif
const GARY_IMG_SPEAK = "Blunt-image.png";             // speaking image

// ── STATE ────────────────────────────────────
let garySystemPrompt = "";   // loaded from prompt.txt
let conversationHistory = []; // keeps multi-turn context for Gemini
let isBusy = false;

// ── DOM REFS ─────────────────────────────────
const garyImg    = document.getElementById("gary-img");
const garyStatus = document.getElementById("gary-status");
const chatLog    = document.getElementById("chat-log");
const userInput  = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");
const garyAudio  = document.getElementById("gary-audio");

// ── INIT ─────────────────────────────────────
(async function init() {
  spawnStars();
  await loadSystemPrompt();

  // Enter to send (Shift+Enter for newline)
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendToGary();
    }
  });
})();

// ── LOAD prompt.txt ──────────────────────────
async function loadSystemPrompt() {
  try {
    const res = await fetch("prompt.txt");
    if (!res.ok) throw new Error("prompt.txt not found");
    garySystemPrompt = (await res.text()).trim();
    console.log("✅ Gary's prompt loaded.");
  } catch (err) {
    console.warn("⚠️ Could not load prompt.txt. Using fallback prompt.");
    garySystemPrompt = "You are Gary, an ancient sacred rock. You are wise, cryptic, and a little stoned. Keep answers under 4 sentences.";
  }
}

// ── MAIN SEND FUNCTION ───────────────────────
async function sendToGary() {
  if (isBusy) return;

  const userText = userInput.value.trim();
  if (!userText) return;

  const geminiKey = GEMINI_KEY;
  const elevenKey = ELEVEN_KEY;
  const voiceId   = ELEVEN_VOICE;

  isBusy = true;
  sendBtn.disabled = true;
  userInput.value = "";

  // Show user message
  appendMessage("You", userText, "user");

  // Gary: thinking state
  setGaryState("thinking", "Gary is… consulting the cosmos.");

  // Show loading indicator in chat
  const loadingEl = appendLoadingMessage();

  try {
    // ── 1. Call Gemini ──────────────────────
    const garyReply = await callGemini(userText, geminiKey);
    loadingEl.remove();
    appendMessage("Gary", garyReply, "gary");

    // ── 2. Call ElevenLabs TTS ──────────────
    setGaryState("thinking", "Gary is… finding his voice.");
    const audioBlob = await callElevenLabs(garyReply, elevenKey, voiceId);

    // ── 3. Play audio + swap to blunt image ─
    await playGaryAudio(audioBlob);

  } catch (err) {
    loadingEl.remove();
    appendMessage("Gary", `…${err.message}. The rock is briefly unavailable.`, "gary");
    setGaryState("thinking", "Gary is… recovering from a disturbance.");
    console.error(err);
  }

  isBusy = false;
  sendBtn.disabled = false;
}

// ── GEMINI API ───────────────────────────────
async function callGemini(userText, apiKey) {
  // Build the message array. We prepend system context as the first user turn
  // (Gemini doesn't have a system role in the same way, so we bake it in).
  const systemPreamble = `${garySystemPrompt}\n\nNow respond to the following as Gary:`;

  // For multi-turn: include history. First call injects system prompt.
  const messages = [];

  if (conversationHistory.length === 0) {
    // First turn: inject system prompt + first user message together
    messages.push({
      role: "user",
      parts: [{ text: `${systemPreamble}\n\n${userText}` }]
    });
  } else {
    // Subsequent turns: full history, then new user message
    messages.push(...conversationHistory);
    messages.push({
      role: "user",
      parts: [{ text: userText }]
    });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body = {
    contents: messages,
    generationConfig: {
      temperature: 0.95,
      maxOutputTokens: 300
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Gemini error: ${err?.error?.message || res.status}`);
  }

  const data = await res.json();
  const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!replyText) throw new Error("Gemini returned an empty vision");

  // Update history for next turn
  conversationHistory.push({
    role: "user",
    parts: [{ text: conversationHistory.length === 0 ? `${systemPreamble}\n\n${userText}` : userText }]
  });
  conversationHistory.push({
    role: "model",
    parts: [{ text: replyText }]
  });

  return replyText;
}

// ── ELEVENLABS TTS API ───────────────────────
async function callElevenLabs(text, apiKey, voiceId) {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      "Accept": "audio/mpeg"
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.45,
        similarity_boost: 0.82,
        style: 0.3,
        use_speaker_boost: true
      }
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => res.status);
    throw new Error(`ElevenLabs error: ${errText}`);
  }

  return await res.blob();
}

// ── AUDIO PLAYBACK + IMAGE SWAP ──────────────
function playGaryAudio(blob) {
  return new Promise((resolve) => {
    const audioUrl = URL.createObjectURL(blob);
    garyAudio.src = audioUrl;

    garyAudio.onplay = () => {
      setGaryState("speaking", "Gary speaks…");
    };

    garyAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      setGaryState("thinking", "Gary is… contemplating.");
      resolve();
    };

    garyAudio.onerror = () => {
      URL.revokeObjectURL(audioUrl);
      setGaryState("thinking", "Gary is… silent.");
      resolve();
    };

    garyAudio.play().catch(() => {
      // Autoplay blocked — still show the image swap, resolve anyway
      setGaryState("thinking", "Gary whispers — allow audio in your browser.");
      resolve();
    });
  });
}

// ── GARY STATE: thinking | speaking ──────────
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
      top:${Math.random()*100}%;
      left:${Math.random()*100}%;
      --d:${(Math.random()*4+2).toFixed(1)}s;
      --o:${(Math.random()*0.5+0.1).toFixed(2)};
      animation-delay:${(Math.random()*5).toFixed(1)}s;
    `;
    container.appendChild(s);
  }
}

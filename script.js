// ─────────────────────────────────────────────
//  GARY — THE SACRED ROCK  |  script.js
//  No API. No server. No keys. Gary just knows.
// ─────────────────────────────────────────────

const GARY_IMG_IDLE  = "files/output-onlinegiftools.gif";
const GARY_IMG_SPEAK = "files/Blunt-image.png";
const ANGEL_SFX      = "files/Angel_Sound_Effect.mp3";

// ── GARY'S BRAIN ─────────────────────────────

const SPECIAL_CASES = [
  { match: ["i love you gary", "i love you, gary"],           reply: "yeah." },
  { match: ["i love you"],                                     reply: "gary is a rock. but yeah." },
  { match: ["does it get better", "will it get better"],      reply: "gary has no data." },
  { match: ["thank you", "thanks", "thank u", "thx"],         reply: "..." },
  { match: ["goodbye", "bye", "see you", "see ya", "cya"],    reply: "gary will be here. gary can't go anywhere. you very stupid." },
  { match: ["you don't understand", "you dont understand"],   reply: "correct." },
  { match: ["nobody gets me", "no one gets me"],              reply: "gary gets you. gary does not care. you very stupid." },
  { match: ["i'm so tired", "im so tired", "i am so tired"],  reply: "gary is 340 million years old." },
  { match: ["what should i do", "what do i do"],              reply: "be a rock about it. you very stupid." },
  { match: ["this is stupid", "this is dumb"],                reply: "gary agrees. gary is still here." },
  { match: ["i'm fine", "im fine", "i am fine"],              reply: "gary also said that. gary was a volcano." },
  { match: ["give me advice", "advise me", "advice"],         reply: "gary does not know. gary is a rock." },
  { match: ["help me", "i need help", "please help"],         reply: "gary cannot help. gary is geology." },
  { match: ["i hate you", "i hate gary"],                     reply: "noted." },
  { match: ["are you real", "are you alive"],                 reply: "gary is 340 million years old. draw your own conclusions." },
  { match: ["what are you", "who are you"],                   reply: "gary. a rock. you very stupid." },
  { match: ["i'm sad", "im sad", "i feel sad"],               reply: "the dinosaurs also had problems." },
  { match: ["i'm stressed", "im stressed", "so stressed"],    reply: "340 million years. still not interesting." },
  { match: ["i failed", "i'm failing", "im failing"],         reply: "gary survived an extinction for this." },
  { match: ["i'm anxious", "im anxious", "i have anxiety"],   reply: "..." },
  { match: ["i'm angry", "im angry", "i'm so angry"],         reply: "sure." },
  { match: ["i'm excited", "im excited", "so excited"],       reply: "hm." },
  { match: ["i'm bored", "im bored", "so bored"],             reply: "gary is a rock. gary relates." },
  { match: ["i'm hungry", "im hungry"],                       reply: "gary has not eaten since the Devonian period. gary is fine." },
  { match: ["i'm lost", "im lost", "i feel lost"],            reply: "gary has not moved in 340 million years. perspective." },
  { match: ["i miss"],                                        reply: "this too shall pass. gary has seen it." },
  { match: ["my ex", "my boyfriend", "my girlfriend", "situationship", "talking stage"], reply: "gary has outlived seventeen of these. already." },
  { match: ["my roommate"],                                   reply: "gary does not have a roommate. gary is a rock. gary wins." },
  { match: ["finals", "exam", "midterm", "test tomorrow"],    reply: "gary survived an extinction for this." },
  { match: ["professor", "teacher"],                          reply: "gary did not attend class. gary is a rock. gary is fine." },
  { match: ["i'm going to fail", "gonna fail"],               reply: "this is not gary's first mass extinction." },
  { match: ["no one likes me", "nobody likes me"],            reply: "gary does not like anyone. gary is still here." },
  { match: ["i can't do this"],                               reply: "ok." },
  { match: ["why does this always happen"],                   reply: "gary has been watching things happen for 340 million years. it tracks." },
  { match: ["life is hard"],                                  reply: "gary was once magma. life is relative." },
  { match: ["everything sucks"],                              reply: "the audacity. gary is unmoved." },
  { match: ["i'm done", "im done"],                           reply: "gary has been done since the Devonian period. welcome." },
  { match: ["not fair", "this is not fair", "it's not fair"], reply: "correct. gary does not make the rules. gary is a rock." },
  { match: ["i need a hug"],                                  reply: "gary cannot hug. gary is a rock. you very stupid." },
  { match: ["i'm crying", "im crying", "been crying"],        reply: "time heals all. gary would know." },
  { match: ["i'm broken", "im broken", "i feel broken"],      reply: "gary was literally broken by a glacier. gary is still here." },
  { match: ["nobody cares"],                                  reply: "gary cares. gary is lying. but still." },
  { match: ["what's the point", "whats the point"],           reply: "gary does not know. gary is a rock." },
  { match: ["i give up"],                                     reply: "ok." },
  { match: ["it's giving", "its giving"],                     reply: "it's giving sediment." },
  { match: ["slay", "slaying"],                               reply: "slay. gary does not know what that means." },
  { match: ["bestie", "bffr"],                                reply: "that's so real bestie. gary is a rock." },
  { match: ["rizz"],                                          reply: "gary has been a rock for 340 million years. gary has no rizz. gary does not need it." },
  { match: ["ohio"],                                          reply: "gary has been to ohio. gary did not care." },
  { match: ["vibe check"],                                    reply: "gary vibes. gary has been vibing since the Devonian period." },
  { match: ["rent free"],                                     reply: "rent free. gary does not pay rent. gary is a rock." },
  { match: ["roman empire"],                                  reply: "not gary's Roman empire fr." },
  { match: ["main character"],                                reply: "gary is not the main character. gary is the rock in the background. gary has been there the whole time." },
  { match: ["understood the assignment"],                     reply: "understood. gary will do nothing." },
  { match: ["no cap", "fr fr", "on god"],                     reply: "real. anyway." },
  { match: ["hello", "hi gary", "hey gary", "hey", "hi"],     reply: "..." },
];

const RESPONSES = [
  "yeah.",
  "ok.",
  "sure.",
  "noted.",
  "...",
  "hm.",
  "wild.",
  "ok and?",
  "and gary's supposed to what.",
  "fascinating. gary is a rock.",
  "gary survived an extinction for this.",
  "340 million years. still not interesting.",
  "gary has been here longer. gary is tired.",
  "the dinosaurs also had problems.",
  "this is not gary's first mass extinction.",
  "gary was once magma. gary has context.",
  "not gary's villain arc to witness.",
  "that's so real bestie. gary is a rock.",
  "the audacity. gary is unmoved.",
  "gary is in his unbothered era.",
  "no thoughts. gary is a rock.",
  "the way gary could not care less.",
  "it's giving sediment.",
  "gary is rooting for you. gary is lying.",
  "real. anyway.",
  "ok but why is this gary's problem.",
  "gary is literally just a rock rn.",
  "understood. gary will do nothing.",
  "gary has been a rock for 340 million years. same.",
  "time heals all. gary would know.",
  "this too shall pass. gary has seen it.",
  "everything is temporary. gary is not.",
  "gary has no data on this.",
  "ok. you very stupid.",
  "sure. also you very stupid.",
  "gary hears you. gary does not care. you very stupid.",
  "noted. you very stupid.",
  "wild. you very stupid.",
  "gary has watched mountains crumble. this is fine.",
  "gary does not have the bandwidth. gary is a rock.",
  "gary was here before trees. gary will be here after this.",
];

let lastResponseIndex = -1;

function getGaryResponse(userText) {
  const lower = userText.toLowerCase().trim();
  if (!lower) return "gary is also not saying anything. you have found common ground.";
  if (userText.length > 200) return "ok.";

  for (const { match, reply } of SPECIAL_CASES) {
    if (match.some(phrase => lower.includes(phrase))) return reply;
  }

  let index;
  do { index = Math.floor(Math.random() * RESPONSES.length); }
  while (index === lastResponseIndex);
  lastResponseIndex = index;
  return RESPONSES[index];
}

// ── STATE ────────────────────────────────────
let isBusy = false;
let ambientAngel = null;

const garyImg    = document.getElementById("gary-img");
const garyStatus = document.getElementById("gary-status");
const chatLog    = document.getElementById("chat-log");
const userInput  = document.getElementById("user-input");
const sendBtn    = document.getElementById("send-btn");
const garyAudio  = document.getElementById("gary-audio");

// ── INIT ─────────────────────────────────────
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

// ── MAIN SEND ────────────────────────────────
function sendToGary() {
  if (isBusy) return;

  const userText = userInput.value.trim();

  if (ambientAngel) {
    ambientAngel.pause();
    ambientAngel.currentTime = 0;
    ambientAngel = null;
  }

  if (!userText) {
    appendMessage("Gary", "gary is also not saying anything. you have found common ground.", "gary");
    return;
  }

  isBusy = true;
  sendBtn.disabled = true;
  userInput.value = "";

  appendMessage("You", userText, "user");
  setGaryState("thinking", "Gary is… consulting the cosmos.");
  const loadingEl = appendLoadingMessage();

  // Gary thinks for 1.5–3 seconds. Gary is a rock, not a chatbot.
  const thinkTime = 1500 + Math.random() * 1500;

  setTimeout(() => {
    const reply = getGaryResponse(userText);
    loadingEl.remove();
    appendMessage("Gary", reply, "gary");
    playAngelThenSpeak(reply);
  }, thinkTime);
}

// ── AUDIO ─────────────────────────────────────
function playAngelThenSpeak(replyText) {
  const angel = new Audio(ANGEL_SFX);

  const afterAngel = () => {
    setGaryState("speaking", "Gary speaks…");
    const speakDuration = Math.max(1500, replyText.length * 65);
    setTimeout(() => {
      setGaryState("thinking", "Gary is… contemplating.");
      isBusy = false;
      sendBtn.disabled = false;
    }, speakDuration);
  };

  angel.onended = afterAngel;
  angel.onerror = afterAngel;
  angel.play().catch(afterAngel);
}

// ── GARY STATE ───────────────────────────────
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

// ── CHAT HELPERS ─────────────────────────────
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

// ── STAR FIELD ───────────────────────────────
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

import express from "express";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const ELEVEN_KEY     = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE   = process.env.ELEVENLABS_VOICE_ID || "bFrjFL4nlpeYNwNRhXxq";
const OR_MODEL       = "openrouter/free";

const GARY_PROMPT = readFileSync(join(__dirname, "gary-prompt.txt"), "utf-8").trim();

app.use(express.json());
app.use(express.static(__dirname));
app.use("/files", express.static(join(__dirname, "files")));

app.get("/api/config", (req, res) => {
  res.json({ openrouter: !!OPENROUTER_KEY, elevenlabs: !!ELEVEN_KEY, model: OR_MODEL });
});

app.post("/api/gary", async (req, res) => {
  if (!OPENROUTER_KEY) return res.status(500).json({ error: "OPENROUTER_API_KEY not set in .env" });

  const { history = [], userText } = req.body;
  if (!userText) return res.status(400).json({ error: "userText required" });

  const messages = [
    { role: "system", content: GARY_PROMPT },
    ...history,
    { role: "user", content: userText }
  ];

  try {
    const upstream = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/kali-das-men-on/GDSC-Hackathon",
        "X-Title": "Vent to Gary"
      },
      body: JSON.stringify({ model: OR_MODEL, messages, temperature: 0.95, max_tokens: 100 })
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      console.error("OpenRouter error:", data);
      return res.status(upstream.status).json({ error: data?.error?.message || "OpenRouter error" });
    }

    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(500).json({ error: "Gary returned nothing. Gary does not apologize." });

    res.json({
      reply,
      newUserEntry:  { role: "user",      content: userText },
      newModelEntry: { role: "assistant", content: reply }
    });

  } catch (err) {
    console.error("OpenRouter fetch error:", err);
    res.status(500).json({ error: "Gary could not reach the cosmos." });
  }
});

app.post("/api/tts", async (req, res) => {
  if (!ELEVEN_KEY) return res.status(500).json({ error: "ELEVENLABS_API_KEY not set in .env" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  try {
    const upstream = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.45, similarity_boost: 0.82, style: 0.3, use_speaker_boost: true }
      })
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => upstream.status);
      return res.status(upstream.status).json({ error: `ElevenLabs: ${errText}` });
    }

    res.setHeader("Content-Type", "audio/mpeg");
    const reader = upstream.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) { res.end(); break; }
      res.write(Buffer.from(value));
    }

  } catch (err) {
    console.error("ElevenLabs fetch error:", err);
    res.status(500).json({ error: "Gary lost his voice." });
  }
});

app.listen(PORT, () => {
  console.log(`\nGary is on port ${PORT}. Gary does not care.\n`);
  if (!OPENROUTER_KEY) console.warn("⚠  OPENROUTER_API_KEY missing from .env");
  if (!ELEVEN_KEY)     console.warn("⚠  ELEVENLABS_API_KEY missing from .env");
  if (OPENROUTER_KEY && ELEVEN_KEY) console.log("✅ All keys loaded. Gary is ready.\n");
});

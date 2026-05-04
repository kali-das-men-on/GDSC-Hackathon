import express from "express";
import dotenv from "dotenv";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const GEMINI_KEY   = process.env.GEMINI_API_KEY;
const ELEVEN_KEY   = process.env.ELEVENLABS_API_KEY;
const ELEVEN_VOICE = process.env.ELEVENLABS_VOICE_ID || "bFrjFL4nlpeYNwNRhXxq";
const GEMINI_MODEL = "gemini-2.0-flash";

const GARY_PROMPT = readFileSync(join(__dirname, "gary-prompt.txt"), "utf-8").trim();

app.use(express.json());
app.use(express.static(__dirname));
app.use("/files", express.static(join(__dirname, "files")));

app.get("/api/config", (req, res) => {
  res.json({
    gemini:     !!GEMINI_KEY,
    elevenlabs: !!ELEVEN_KEY,
    prompt:     GARY_PROMPT.slice(0, 60) + "…",
  });
});

app.post("/api/gemini", async (req, res) => {
  if (!GEMINI_KEY) return res.status(500).json({ error: "GEMINI_API_KEY not set in .env" });

  const { history = [], userText } = req.body;
  if (!userText) return res.status(400).json({ error: "userText required" });

  const systemPreamble = `${GARY_PROMPT}\n\nNow respond to the following as Gary:`;

  let contents;
  if (history.length === 0) {
    contents = [{ role: "user", parts: [{ text: `${systemPreamble}\n\n${userText}` }] }];
  } else {
    contents = [...history, { role: "user", parts: [{ text: userText }] }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        generationConfig: { temperature: 0.95, maxOutputTokens: 300 }
      })
    });

    if (!upstream.ok) {
      const err = await upstream.json().catch(() => ({}));
      return res.status(upstream.status).json({ error: err?.error?.message || "Gemini upstream error" });
    }

    const data = await upstream.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!reply) return res.status(500).json({ error: "Gemini returned empty vision" });

    res.json({
      reply,
      newUserEntry:  { role: "user",  parts: [{ text: history.length === 0 ? `${systemPreamble}\n\n${userText}` : userText }] },
      newModelEntry: { role: "model", parts: [{ text: reply }] }
    });

  } catch (err) {
    console.error("Gemini fetch error:", err);
    res.status(500).json({ error: "Gary could not reach the cosmos." });
  }
});

app.post("/api/tts", async (req, res) => {
  if (!ELEVEN_KEY) return res.status(500).json({ error: "ELEVENLABS_API_KEY not set in .env" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text required" });

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${ELEVEN_VOICE}`;

  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.82,
          style: 0.3,
          use_speaker_boost: true
        }
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
  console.log(`Gary is on port ${PORT}. Gary does not care.`);
  if (!GEMINI_KEY)  console.warn("⚠  GEMINI_API_KEY missing from .env");
  if (!ELEVEN_KEY)  console.warn("⚠  ELEVENLABS_API_KEY missing from .env");
});
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const { BRIEF_REF_5190_MAX_BYTES } = require('./constants');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: BRIEF_REF_5190_MAX_BYTES } });

app.use(express.static('public'));
app.use(express.static(__dirname)); // serves constants.js from root too

const GROQ_KEY = process.env.GROQ_API_KEY;
const ALLOWED_EXT = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'];

app.post('/api/analyze', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file received.' });

    const ext = (req.file.originalname.split('.').pop() || '').toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) {
      return res.status(400).json({ error: `Unsupported format: .${ext}` });
    }

    // 1. Transcribe with Groq's Whisper endpoint
    const form = new FormData();
    form.append('file', new Blob([req.file.buffer]), req.file.originalname);
    form.append('model', 'whisper-large-v3');

    const transcribeRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}` },
      body: form
    });
    if (!transcribeRes.ok) {
      console.error('Transcription failed:', await transcribeRes.text());
      return res.status(502).json({ error: 'Transcription service failed.' });
    }
    const { text: transcript } = await transcribeRes.json();
    if (!transcript || !transcript.trim()) {
      return res.status(422).json({ error: 'No speech detected in audio.' });
    }

    // 2. Ask an LLM to extract prominent key terms (NOT raw frequency counting)
    const prompt = `You are analysing a mentoring session transcript. Extract the most prominent/key terms discussed (concepts, topics, named technologies, skills). Ignore filler words and stopwords. Normalize obvious variants (e.g. "React" and "React.js" -> "React"). Return ONLY valid JSON, an array like [{"term":"string","score":number}], score 1-100 reflecting prominence in the discussion (not just frequency). Max 40 terms.

Transcript:
"""${transcript}"""`;

    const kwRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      })
    });
    if (!kwRes.ok) {
      console.error('Keyword extraction failed:', await kwRes.text());
      return res.status(502).json({ error: 'Keyword extraction failed.' });
    }
    const kwData = await kwRes.json();
    let raw = kwData.choices[0].message.content.trim()
      .replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();

    let terms;
    try { terms = JSON.parse(raw); }
    catch { return res.status(502).json({ error: 'Could not parse AI response.' }); }

    res.json({ transcript, terms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during analysis.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
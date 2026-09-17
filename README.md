# Mentor Audio Word Cloud

Record or upload mentor-session audio in the browser. The audio is transcribed and key terms are
extracted by AI, then rendered as a downloadable word cloud sized by prominence.

## What works
- Live browser recording (start/stop, elapsed timer, active-recording indicator, playback, discard/re-record)
- File upload (MP3/WAV/M4A/AAC/OGG/WEBM/FLAC), with format/size/duration validation (25MB / 10min cap)
- Transcription + AI-based key term extraction (Groq Whisper + Llama 3.3, not raw word counts)
- Word cloud rendered on canvas, sized by AI-assigned prominence score
- PNG download of the cloud
- Responsive down to 390px width

## Setup
\`\`\`bash
npm install
cp .env.example .env   # then paste your Groq API key into .env
npm start
\`\`\`
Visit http://localhost:3000

## Environment variables
- `GROQ_API_KEY` — your Groq API key (console.groq.com, free tier)
- `PORT` — optional, defaults to 3000

## AI service used and why
Groq was chosen because it exposes an OpenAI-compatible API with both a fast Whisper transcription
endpoint and Llama chat models on one free-tier key, which minimized integration time under a tight
deadline compared to wiring two separate providers.

## Key decisions / tradeoffs
1. No database — session-only state, per the brief; kept scope minimal to prioritize a working core.
2. A minimal Express backend exists solely to keep the API key off the client; no other server-side logic.
3. Key-term prominence/normalization is delegated to the LLM in one prompt rather than a separate NLP
   pipeline, trading some control for implementation speed.

## External libraries
- wordcloud2.js (CDN) — renders the word cloud on canvas
- Express, Multer, dotenv (backend)

## AI coding tools used
Claude was used to scaffold the Express backend, the recording/upload frontend logic, and the
word-cloud rendering wiring, generated and reviewed file-by-file.

## What I'd build next with another week
- Bonus features: transcript display + copy/download, remove-a-word rerender, saved past analyses
- Better error recovery/retry on transient AI API failures
- Basic automated tests for the upload validation logic

Brief ref: TFG-WD-4417
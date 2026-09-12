# Privacy Mirror

**AMD Slingshot Hackathon — AI + Cybersecurity Track**

Privacy Mirror is an AI-powered digital footprint reconstruction tool. Enter an email address and the app combines local demo profiles, live breach lookup data, and Gemini-generated analysis to surface breach history, dark-web-style threat intel, and an inferred personality profile.

---

## What It Does

Privacy Mirror makes invisible digital exposure visible and actionable. The app shows:

- a creepy exposure score
- a breach timeline and breach list
- an AI-generated profile inference
- threat intelligence for the exposed data
- password-strength analysis
- phishing URL analysis

---

## Tech Stack

- Frontend: React 18 + Vite
- Styling: CSS Modules
- Backend: Node.js + Express
- AI: Google Gemini 3.6 Flash via the OpenAI-compatible endpoint with structured JSON mode
- Real breach source: BreachDirectory via RapidAPI (with dual HIBP & RapidAPI schema normalization)
- Environment config: dotenv-based local configuration

---

## How Gemini Is Used

Gemini is used as a prompt-driven reasoning layer for the app’s analysis features.

### Prompting techniques used

The project uses several prompt-engineering techniques directly in the backend:

- Role prompting: the model is told to act as a privacy-inference writer, threat-intelligence analyst, or phishing analyst.
- Context injection: the prompt includes the email, breach metadata, exposure score, and URL details.
- Output-format conditioning: the model is instructed to return plain text for profile generation and strict JSON (`response_format: { type: 'json_object' }`) for threat and phishing analysis.
- Constraint prompting: the prompts explicitly tell the model to avoid inventing private facts and to be conservative when the evidence is weak.
- Reasoning token budgeting: increased `max_tokens` (1200) to account for Gemini 3.6 Flash reasoning tokens without truncating structured JSON outputs.

### Did we use function calling or RAG?

- Function calling: not currently used.
- RAG: not currently used.

The current integration is a prompt-and-response pattern with structured output, plus fallback logic when the API is unavailable or returns invalid content.

---

## Real Breach Source

The app supports live breach lookups using BreachDirectory on RapidAPI with a robust normalizer:

- **Dual-Schema Parsing**: Seamlessly processes both RapidAPI BreachDirectory payload structures (`sources`, `hash_password`, `password`, `sha1`, `md5`) and HaveIBeenPwned (HIBP) formats.
- **Defensive Source Extraction**: Defensively handles domain lists formatted as arrays or comma-separated strings.
- **Data Integrity**: Preserves undated leaks as `year: null` rather than fabricating fictitious dates, ensuring the Timeline chart displays clean historical data.
- **Dynamic Severity**: Computes exposure severity dynamically based on sensitive data classes (e.g. plaintext passwords, hashes, cards, SSNs).
- **Fallback**: If the API lookup fails or the key is missing, the app falls back to local profiles and breach pools so demos stay reliable.

---

## Project Structure

```text
privacy-mirror/
├── server/
│   ├── app.js
│   ├── config/env.js
│   ├── routes/api.js
│   ├── services/
│   │   ├── aiService.js
│   │   ├── breachService.js
│   │   ├── breachService.test.js
│   │   └── passwordService.js
│   └── data/profiles.js
├── src/
│   ├── App.jsx
│   ├── services/
│   │   └── apiClient.js
│   └── features/...
├── server.js
├── package.json
└── .env
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Gemini API key from Google AI Studio
- A BreachDirectory API key from RapidAPI (optional but recommended for live breach lookups)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file with:

```env
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-3.6-flash
BREACH_DIRECTORY_API_KEY=your-breach-directory-key
BREACH_DIRECTORY_ENDPOINT=https://breachdirectory.p.rapidapi.com/
TRUSTED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Running Locally

Run the backend and frontend in separate terminals:

```bash
npm run dev:api
```

```bash
npm run dev
```

Open the Vite URL shown in the terminal, typically `http://localhost:5173`.

### Running Tests

Execute the Node test runner to verify breach directory parsing and profile fallback logic:

```bash
npm test
```

---

## Notes

- The app uses Gemini 3.6 Flash for profile writing, threat-intel summarization, and phishing analysis.
- The breach lookup path is backed by BreachDirectory with multi-schema normalizer fallback.
- The app includes deterministic fallbacks so it remains usable even if external APIs are unreachable.

---

## Built With

- React
- Vite
- Express
- Google Gemini 3.6 Flash
- RapidAPI / BreachDirectory

---

*Built for AMD Slingshot Hackathon · AI + Cybersecurity Track*

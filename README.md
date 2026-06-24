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
- AI: Google Gemini 2.0 Flash via the Gemini-compatible OpenAI-style endpoint
- Real breach source: BreachDirectory via RapidAPI
- Environment config: dotenv-based local configuration

---

## How Gemini Is Used

Gemini is used as a prompt-driven reasoning layer for the app’s analysis features.

### Prompting techniques used

The project uses several prompt-engineering techniques directly in the backend:

- Role prompting: the model is told to act as a privacy-inference writer, threat-intelligence analyst, or phishing analyst.
- Context injection: the prompt includes the email, breach metadata, exposure score, and URL details.
- Output-format conditioning: the model is instructed to return plain text for profile generation and strict JSON for threat and phishing analysis.
- Constraint prompting: the prompts explicitly tell the model to avoid inventing private facts and to be conservative when the evidence is weak.

These prompts are defined in the backend prompt configuration and passed to Gemini from the AI service layer.

### Did we use function calling or RAG?

- Function calling: not currently used.
- RAG: not currently used.

The current integration is a prompt-and-response pattern with structured output, plus fallback logic when the API is unavailable or returns invalid content.

---

## Real Breach Source

The app now supports a live breach lookup using BreachDirectory on RapidAPI.

- If a valid API key is present, the scan uses live breach matches from the external source.
- If the lookup fails or the key is missing, the app falls back to the existing local profile and breach pool.

This gives the app a more grounded source for breach data while still keeping the experience reliable for demos.

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
│   │   └── passwordService.js
│   └── data/profiles.js
├── src/
│   ├── App.jsx
│   ├── services/
│   │   └── apiClient.js
│   │   └── claude.js
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

Create a .env file with:

```env
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
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

Open the Vite URL shown in the terminal, typically http://localhost:5173.

---

## Notes

- The app uses Gemini for profile writing, threat-intel summarization, and phishing analysis.
- The breach lookup path is now backed by a real source when a valid API key is available.
- The app still includes deterministic fallbacks so it remains usable even if the external APIs are unavailable.

---

## Built With

- React
- Vite
- Express
- Google Gemini
- RapidAPI / BreachDirectory

---

*Built for AMD Slingshot Hackathon · AI + Cybersecurity Track*

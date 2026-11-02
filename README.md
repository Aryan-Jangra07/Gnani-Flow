# Gnani Flow

Voice assistant for meetings and emails. Say something like
"kal 3 baje Rahul ke saath meeting set karo aur usko mail bhej do" and it will:

1. turn your voice into text with **Gnani Prisma**
2. figure out the person, date, time and what you want (meeting / email)
3. find Rahul's email in your Google contacts
4. warn you if you already have something at that time
5. show you the meeting + email draft to check and edit
6. on confirm, add the event to Google Calendar (with a Meet link) and send the mail from Gmail
7. reply back in voice with **Gnani Timbre**

Only Gnani models are used for speech. Understanding the command is done by our own
rule based parser (no outside AI), see `server/src/parser`.

## Status

Done
- Voice recording in browser -> Prisma STT
- Hinglish / Hindi (Devanagari) / English command parser
- Timbre voice replies
- Google login (OAuth)
- Contact lookup (Google People API)
- Calendar event with Meet link + clash check
- Gmail send (Meet link is added to the mail automatically)
- History of past commands with "cancel meeting" (undo)
- English / Hindi switch (UI text and spoken replies)
- Landing page at `/` with a small 3D voice orb (three.js), assistant at `/app`
- Dark UI with live mic waveform, works on mobile

Next
- Postgres instead of the JSON history file
- Daily briefing ("aaj ka schedule batao")
- Voice confirm ("haan bhej do")
- Edit by voice ("time 4 baje kar do")

## Setup

Needs Node 20+.

### 1. Gnani key

Get an API key from app.gnani.ai and put it in `server/.env` as `GNANI_API_KEY`.

### 2. Google OAuth

1. Go to console.cloud.google.com and create a project
2. Enable **Google Calendar API**, **Gmail API** and **People API**
3. OAuth consent screen -> External -> add your Gmail as a test user
4. Credentials -> Create OAuth client ID -> Web application
5. Authorized redirect URI: `http://localhost:5173/auth/google/callback`
6. Copy client id and secret into `server/.env`

### 3. Run

```bash
cd server
cp .env.example .env     # fill the keys
npm install
npm run dev              # http://localhost:5000

# new terminal
cd client
npm install
npm run dev              # open http://localhost:5173 (landing), app is at /app
```

### Tests

```bash
cd server
npm test
```

Parser, Gmail/Calendar request building and the full login -> confirm -> history flow
(Google is mocked in tests).

## API

| Route | What it does |
|---|---|
| `POST /api/command` | form-data `audio` (wav) + `language` -> transcript + actions |
| `POST /api/parse` | `{ text }` -> actions (no audio, for testing) |
| `POST /api/speak` | `{ text }` -> mp3 from Timbre |
| `GET /auth/google` | start Google login |
| `GET /api/me` | logged in user |
| `GET /api/contacts?q=rahul` | search Google contacts |
| `POST /api/availability` | `{ date, time, durationMinutes }` -> clashing events |
| `POST /api/execute` | `{ actions, transcript }` -> creates event, sends mail |
| `GET /api/history` | past commands |
| `POST /api/history/:id/undo` | cancel the meeting from that command |

## Folder structure

```
server/src
  app.js, index.js, config.js
  routes/       auth, voice, actions
  services/
    gnani.js    Prisma + Timbre
    google/     oauth, calendar, gmail, contacts
  parser/       normalize, dates, time, transliterate, reply
  store/        history (json file)
client/src
  main.jsx      picks landing (/) or assistant (/app)
  Assistant.jsx
  landing/      Landing, VoiceOrb (3D), DemoLine
  i18n/         English + Hindi text, language switch
  components/   TopBar, VoicePanel, Waveform, ReviewPanel, MeetingCard, EmailCard, ContactPicker, HistoryPanel
  hooks/        useRecorder, useAuth
  lib/wav.js    browser audio -> 16 kHz wav for Prisma
```

## Notes

- Prisma REST takes max 30 sec audio, so recording stops at 29 sec.
- With `hi-IN`, Prisma gives Devanagari. `normalize.js` maps common Hindi words and
  `transliterate.js` turns names like राहुल into Rahul for contact search.
- "3 baje" without subah/shaam is taken as PM for 1 to 7.
- Sessions are kept in memory, so restarting the server logs you out.

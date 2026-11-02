import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'dev-only-secret-change-me',
  timezone: process.env.TIMEZONE || 'Asia/Kolkata',

  gnaniKey: process.env.GNANI_API_KEY || '',
  gnaniBase: 'https://api.vachana.ai',
  stt: {
    model: process.env.STT_MODEL || 'prisma-v2.5',
    language: process.env.STT_LANGUAGE || 'hi-IN',
  },
  tts: {
    model: process.env.TTS_MODEL || 'timbre-v2.5',
    voice: process.env.TTS_VOICE || 'Nalini',
    language: process.env.TTS_LANGUAGE || 'hi-en',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/google/callback',
  },

  historyFile: process.env.HISTORY_FILE || 'data/history.json',
};

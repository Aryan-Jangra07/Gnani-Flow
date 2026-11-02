import express from 'express';
import session from 'express-session';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import voiceRoutes from './routes/voice.js';
import actionRoutes from './routes/actions.js';

export function createApp() {
  const app = express();

  app.use(express.json({ limit: '1mb' }));
  app.use(
    session({
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 3600 * 1000 },
    }),
  );

  app.get('/api/health', (req, res) => {
    res.json({
      ok: true,
      gnani: Boolean(config.gnaniKey),
      google: Boolean(config.google.clientId && config.google.clientSecret),
    });
  });

  app.use('/auth', authRoutes);
  app.use('/api', voiceRoutes);
  app.use('/api', actionRoutes);

  app.use((err, req, res, next) => {
    if (!err.status || err.status >= 500) console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Something went wrong' });
  });

  return app;
}

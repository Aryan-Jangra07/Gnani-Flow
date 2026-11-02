import { Router } from 'express';
import { randomBytes } from 'node:crypto';
import { config } from '../config.js';
import { authUrl, exchangeCode, getProfile, isConfigured } from '../services/google/oauth.js';
import { warmupContacts } from '../services/google/contacts.js';

const router = Router();

router.get('/google', (req, res) => {
  if (!isConfigured()) {
    return res.status(503).send('Google OAuth is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in server/.env');
  }
  const state = randomBytes(16).toString('hex');
  req.session.oauthState = state;
  res.redirect(authUrl(state));
});

router.get('/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error || !code || state !== req.session.oauthState) {
    return res.redirect(`${config.clientUrl}/app?login=failed`);
  }

  try {
    const tokens = await exchangeCode(code);
    const user = await getProfile(tokens.accessToken);

    delete req.session.oauthState;
    req.session.google = tokens;
    req.session.user = user;

    warmupContacts(req.session).catch(() => {});
    res.redirect(`${config.clientUrl}/app`);
  } catch (err) {
    console.error(err);
    res.redirect(`${config.clientUrl}/app?login=failed`);
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

export default router;

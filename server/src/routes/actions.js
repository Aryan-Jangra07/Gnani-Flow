import { Router } from 'express';
import { config } from '../config.js';
import { HttpError } from '../errors.js';
import { createEvent, deleteEvent, findClashes } from '../services/google/calendar.js';
import { sendEmail } from '../services/google/gmail.js';
import { searchContacts } from '../services/google/contacts.js';
import { addEntry, listEntries, updateEntry } from '../store/history.js';

const router = Router();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireLogin(req, res, next) {
  if (!req.session.user) return next(new HttpError(401, 'Please connect your Google account first'));
  next();
}

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.get('/me', (req, res) => {
  res.json({ user: req.session.user || null });
});

router.get('/contacts', requireLogin, wrap(async (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.json({ contacts: [] });
  res.json({ contacts: await searchContacts(req.session, q) });
}));

router.post('/availability', requireLogin, wrap(async (req, res) => {
  const { date, time, durationMinutes } = req.body;
  if (!date || !time) throw new HttpError(400, 'date and time are required');
  res.json({ clashes: await findClashes(req.session, { date, time, durationMinutes }, config.timezone) });
}));

function validate(actions) {
  if (!Array.isArray(actions) || actions.length === 0) throw new HttpError(400, 'Nothing to do');

  for (const a of actions) {
    if (a.type === 'meeting') {
      if (!a.date || !a.time) throw new HttpError(400, 'Meeting needs a date and time');
      if (a.email && !EMAIL_RE.test(a.email)) throw new HttpError(400, `"${a.email}" is not a valid email`);
    } else if (a.type === 'email') {
      if (!EMAIL_RE.test(a.email || '')) throw new HttpError(400, 'Email needs a valid recipient address');
      if (!a.body?.trim()) throw new HttpError(400, 'Email body is empty');
    } else {
      throw new HttpError(400, `Unknown action ${a.type}`);
    }
  }
}

function addMeetLink(body, link) {
  if (!link || body.includes(link)) return body;
  const line = `\n\nGoogle Meet: ${link}`;
  return /\n\nThanks[\s\S]*$/.test(body) ? body.replace(/\n\nThanks/, `${line}\n\nThanks`) : body + line;
}

router.post('/execute', requireLogin, wrap(async (req, res) => {
  const { actions, transcript } = req.body;
  validate(actions);

  const results = [];
  let event = null;

  // meeting first, so the email can carry the Meet link
  const meeting = actions.find((a) => a.type === 'meeting');
  if (meeting) {
    event = await createEvent(req.session, meeting, config.timezone);
    results.push({ type: 'meeting', ok: true, ...event });
  }

  for (const email of actions.filter((a) => a.type === 'email')) {
    try {
      const body = addMeetLink(email.body, event?.meetLink);
      const sent = await sendEmail(req.session, { to: email.email, subject: email.subject, body });
      results.push({ type: 'email', ok: true, to: email.email, ...sent });
    } catch (err) {
      results.push({ type: 'email', ok: false, to: email.email, error: err.message });
    }
  }

  const entry = await addEntry(req.session.user.email, { transcript, actions, results });
  res.json({ results, historyId: entry.id });
}));

router.get('/history', requireLogin, wrap(async (req, res) => {
  res.json({ history: await listEntries(req.session.user.email) });
}));

// undo = cancel the calendar event (emails can't be unsent)
router.post('/history/:id/undo', requireLogin, wrap(async (req, res) => {
  const entries = await listEntries(req.session.user.email);
  const entry = entries.find((e) => e.id === req.params.id);
  if (!entry) throw new HttpError(404, 'Not found');

  const meeting = entry.results.find((r) => r.type === 'meeting' && r.ok);
  if (!meeting) throw new HttpError(400, 'No meeting to cancel here');
  if (entry.cancelled) return res.json({ entry });

  await deleteEvent(req.session, meeting.id);
  res.json({ entry: await updateEntry(req.session.user.email, entry.id, { cancelled: true }) });
}));

export default router;

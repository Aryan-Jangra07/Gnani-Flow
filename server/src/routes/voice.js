import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { transcribe, speak } from '../services/gnani.js';
import { parseCommand } from '../parser/index.js';
import { buildReply } from '../parser/reply.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const pickLang = (value) => (value === 'hi' ? 'hi' : 'en');

function understand(text, lang) {
  const result = parseCommand(text, { timezone: config.timezone });
  return { ...result, reply: buildReply(result, lang) };
}

// audio in -> transcript + parsed actions
router.post('/command', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'audio file is required' });

    const language = req.body.language || config.stt.language;
    const stt = await transcribe(req.file.buffer, req.file.originalname || 'audio.wav', language);

    res.json({ ...understand(stt.text, pickLang(req.body.lang)), language: stt.language });
  } catch (err) {
    next(err);
  }
});

// typed text -> parsed actions (handy for testing without a mic)
router.post('/parse', (req, res) => {
  const text = (req.body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text is required' });
  res.json(understand(text, pickLang(req.body.lang)));
});

router.post('/speak', async (req, res, next) => {
  try {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'text is required' });

    // Hindi replies are written in Devanagari, English ones in English
    const language = pickLang(req.body.lang) === 'hi' ? 'hi-IN' : 'en-IN';
    const audio = await speak(text, language);
    res.set('Content-Type', 'audio/mpeg').send(audio);
  } catch (err) {
    next(err);
  }
});

export default router;

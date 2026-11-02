import { config } from '../config.js';

class GnaniError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function checkKey() {
  if (!config.gnaniKey) {
    throw new GnaniError('GNANI_API_KEY is missing in server/.env', 503);
  }
}

async function readError(res) {
  const body = await res.text();
  try {
    const data = JSON.parse(body);
    return data.error?.message || data.detail?.message || data.message || body;
  } catch {
    return body || res.statusText;
  }
}

// Prisma: audio -> text. Max 30 sec audio per request.
export async function transcribe(audioBuffer, filename = 'audio.wav', language = config.stt.language) {
  checkKey();

  const form = new FormData();
  form.append('audio_file', new Blob([audioBuffer]), filename);
  form.append('language_code', language);
  // v2.5 is the default model on Gnani's side, only send model for v3
  if (config.stt.model !== 'prisma-v2.5') form.append('model', config.stt.model);

  const res = await fetch(`${config.gnaniBase}/stt/v3`, {
    method: 'POST',
    headers: { 'X-API-Key-ID': config.gnaniKey },
    body: form,
  });

  if (!res.ok) {
    throw new GnaniError(`Prisma STT failed: ${await readError(res)}`, res.status === 401 ? 401 : 502);
  }

  const data = await res.json();
  return {
    text: data.transcript || '',
    language: data.detected_language_code || language,
    requestId: data.request_id,
  };
}

// Timbre: text -> mp3 audio
export async function speak(text, language = config.tts.language) {
  checkKey();

  const res = await fetch(`${config.gnaniBase}/api/v1/tts/inference`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key-ID': config.gnaniKey,
    },
    body: JSON.stringify({
      text,
      model: config.tts.model,
      voice: config.tts.voice,
      language,
      speed: 1.0,
      audio_config: {
        sample_rate: 24000,
        num_channels: 1,
        container: 'mp3',
        bitrate: '64k',
      },
    }),
  });

  if (!res.ok) {
    throw new GnaniError(`Timbre TTS failed: ${await readError(res)}`, 502);
  }

  return Buffer.from(await res.arrayBuffer());
}

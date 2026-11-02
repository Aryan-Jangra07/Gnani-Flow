async function request(url, { method = 'GET', body, form } = {}) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: form || (body ? JSON.stringify(body) : undefined),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return res;
}

const json = async (...args) => (await request(...args)).json();

export function sendAudio(wav, language, lang) {
  const form = new FormData();
  form.append('audio', wav, 'command.wav');
  form.append('language', language);
  form.append('lang', lang);
  return json('/api/command', { method: 'POST', form });
}

export const sendText = (text, lang) => json('/api/parse', { method: 'POST', body: { text, lang } });

export async function getSpeech(text, lang) {
  const res = await request('/api/speak', { method: 'POST', body: { text, lang } });
  return URL.createObjectURL(await res.blob());
}

export const getHealth = () => json('/api/health');
export const getMe = () => json('/api/me');
export const logout = () => json('/auth/logout', { method: 'POST' });

export const searchContacts = (q) => json(`/api/contacts?q=${encodeURIComponent(q)}`);
export const checkAvailability = (slot) => json('/api/availability', { method: 'POST', body: slot });
export const execute = (actions, transcript) => json('/api/execute', { method: 'POST', body: { actions, transcript } });

export const getHistory = () => json('/api/history');
export const undoHistory = (id) => json(`/api/history/${id}/undo`, { method: 'POST' });

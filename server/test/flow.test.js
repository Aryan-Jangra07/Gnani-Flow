// End to end: login with Google (mocked), then confirm a meeting + email.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';

process.env.GOOGLE_CLIENT_ID = 'test-client';
process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
process.env.HISTORY_FILE = path.join(os.tmpdir(), `gnani-flow-test-${Date.now()}.json`);

const realFetch = globalThis.fetch;
const googleCalls = [];

globalThis.fetch = async (url, options = {}) => {
  url = String(url);
  if (url.startsWith('http://127.0.0.1')) return realFetch(url, options);

  googleCalls.push({ url, method: options.method || 'GET', body: options.body });
  const json = (data) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });

  if (url.includes('oauth2.googleapis.com/token')) {
    return json({ access_token: 'at', refresh_token: 'rt', expires_in: 3600 });
  }
  if (url.includes('userinfo')) return json({ email: 'aryan@test.com', name: 'Aryan' });
  if (url.includes('searchContacts') || url.includes('otherContacts')) {
    return json({ results: [{ person: { names: [{ displayName: 'Rahul Sharma' }], emailAddresses: [{ value: 'rahul@test.com' }] } }] });
  }
  if (url.includes('calendar/v3') && options.method === 'POST') {
    return json({ id: 'ev1', htmlLink: 'https://cal/ev1', hangoutLink: 'https://meet.google.com/abc', start: { dateTime: 'x' } });
  }
  if (url.includes('calendar/v3') && options.method === 'DELETE') return new Response(null, { status: 204 });
  if (url.includes('calendar/v3')) return json({ items: [{ summary: 'Standup', start: { dateTime: 'a' }, end: { dateTime: 'b' } }] });
  if (url.includes('gmail')) return json({ id: 'm1', threadId: 't1' });

  throw new Error(`unexpected fetch ${url}`);
};

let server;
let base;
let cookie = '';

async function call(pathname, { method = 'GET', body } = {}) {
  const res = await realFetch(base + pathname, {
    method,
    redirect: 'manual',
    headers: { cookie, ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  return res;
}

before(async () => {
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0, '127.0.0.1');
  await new Promise((r) => server.once('listening', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('needs login before executing', async () => {
  const res = await call('/api/execute', { method: 'POST', body: { actions: [] } });
  assert.equal(res.status, 401);
});

test('google login flow', async () => {
  const start = await call('/auth/google');
  assert.equal(start.status, 302);
  const state = new URL(start.headers.get('location')).searchParams.get('state');

  const cb = await call(`/auth/google/callback?code=abc&state=${state}`);
  assert.equal(cb.status, 302);

  const me = await (await call('/api/me')).json();
  assert.equal(me.user.email, 'aryan@test.com');
});

test('wrong state is rejected', async () => {
  const cb = await call('/auth/google/callback?code=abc&state=nope');
  assert.match(cb.headers.get('location'), /login=failed/);
});

test('contact search and clash check', async () => {
  const contacts = await (await call('/api/contacts?q=rahul')).json();
  assert.deepEqual(contacts.contacts, [{ name: 'Rahul Sharma', email: 'rahul@test.com' }]);

  const avail = await (await call('/api/availability', { method: 'POST', body: { date: '2026-11-03', time: '15:00' } })).json();
  assert.equal(avail.clashes[0].title, 'Standup');
});

test('rejects bad email address', async () => {
  const res = await call('/api/execute', {
    method: 'POST',
    body: { actions: [{ type: 'email', email: 'rahul', subject: 's', body: 'b' }] },
  });
  assert.equal(res.status, 400);
});

test('meeting + email goes through and is saved in history', async () => {
  googleCalls.length = 0;
  const res = await call('/api/execute', {
    method: 'POST',
    body: {
      transcript: 'kal 3 baje rahul ke saath meeting aur mail',
      actions: [
        { type: 'meeting', person: 'Rahul', email: 'rahul@test.com', date: '2026-11-03', time: '15:00', durationMinutes: 30 },
        { type: 'email', email: 'rahul@test.com', subject: 'Meeting', body: 'Hi Rahul,\n\nSee you.\n\nThanks' },
      ],
    },
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.results[0].meetLink, 'https://meet.google.com/abc');
  assert.equal(data.results[1].ok, true);

  // meet link was added to the mail body
  const gmailCall = googleCalls.find((c) => c.url.includes('gmail'));
  const mime = Buffer.from(JSON.parse(gmailCall.body).raw, 'base64url').toString();
  const body = Buffer.from(mime.split('\r\n\r\n')[1], 'base64').toString();
  assert.equal(body, 'Hi Rahul,\n\nSee you.\n\nGoogle Meet: https://meet.google.com/abc\n\nThanks');

  const history = await (await call('/api/history')).json();
  assert.equal(history.history.length, 1);
  assert.equal(history.history[0].transcript, 'kal 3 baje rahul ke saath meeting aur mail');

  const undo = await (await call(`/api/history/${data.historyId}/undo`, { method: 'POST' })).json();
  assert.equal(undo.entry.cancelled, true);
  assert.ok(googleCalls.some((c) => c.method === 'DELETE'));
});

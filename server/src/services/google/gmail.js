import { googleFetch } from './client.js';

function encodeHeader(value) {
  // non-ascii subjects (Hindi etc.) need RFC 2047 encoding
  return /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${Buffer.from(value).toString('base64')}?=`;
}

export function buildRawEmail({ from, to, subject, body }) {
  const message = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${encodeHeader(subject || '(no subject)')}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    Buffer.from(body || '').toString('base64'),
  ].join('\r\n');

  return Buffer.from(message).toString('base64url');
}

export async function sendEmail(session, email) {
  const raw = buildRawEmail({ ...email, from: session.user.email });
  const data = await googleFetch(session, 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    body: JSON.stringify({ raw }),
  });
  return { id: data.id, threadId: data.threadId };
}

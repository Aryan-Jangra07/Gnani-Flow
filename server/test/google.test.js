import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRawEmail } from '../src/services/google/gmail.js';
import { buildEvent } from '../src/services/google/calendar.js';
import { toRfc3339, addMinutes } from '../src/services/google/time.js';

test('raw email is valid base64url mime', () => {
  const raw = buildRawEmail({ from: 'me@x.com', to: 'rahul@x.com', subject: 'मीटिंग', body: 'Hi Rahul' });
  const text = Buffer.from(raw, 'base64url').toString();

  assert.match(text, /^From: me@x.com\r\nTo: rahul@x.com\r\n/);
  assert.match(text, /Subject: =\?UTF-8\?B\?/);
  const body = text.split('\r\n\r\n')[1];
  assert.equal(Buffer.from(body, 'base64').toString(), 'Hi Rahul');
});

test('event has attendee, meet link request and correct end time', () => {
  const event = buildEvent(
    { person: 'Rahul', email: 'rahul@x.com', date: '2026-11-03', time: '23:45', durationMinutes: 30 },
    'Asia/Kolkata',
  );
  assert.equal(event.summary, 'Meeting with Rahul');
  assert.equal(event.start.dateTime, '2026-11-03T23:45:00');
  assert.equal(event.end.dateTime, '2026-11-04T00:15:00');
  assert.deepEqual(event.attendees, [{ email: 'rahul@x.com', displayName: 'Rahul' }]);
  assert.equal(event.conferenceData.createRequest.conferenceSolutionKey.type, 'hangoutsMeet');
});

test('time helpers', () => {
  assert.equal(toRfc3339('2026-11-03', '15:00', 'Asia/Kolkata'), '2026-11-03T15:00:00+05:30');
  assert.equal(toRfc3339('2026-11-03', '15:00', 'UTC'), '2026-11-03T15:00:00+00:00');
  assert.deepEqual(addMinutes('2026-12-31', '23:30', 45), { date: '2027-01-01', time: '00:15' });
});

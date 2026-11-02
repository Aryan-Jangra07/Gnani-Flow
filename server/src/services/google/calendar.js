import { randomUUID } from 'node:crypto';
import { googleFetch } from './client.js';
import { toRfc3339, addMinutes } from './time.js';

const BASE = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export function buildEvent(meeting, timezone) {
  const end = addMinutes(meeting.date, meeting.time, meeting.durationMinutes || 30);

  const event = {
    summary: meeting.title || `Meeting with ${meeting.person}`,
    start: { dateTime: `${meeting.date}T${meeting.time}:00`, timeZone: timezone },
    end: { dateTime: `${end.date}T${end.time}:00`, timeZone: timezone },
    reminders: { useDefault: true },
  };

  if (meeting.topic) event.description = `Agenda: ${meeting.topic}`;
  if (meeting.email) event.attendees = [{ email: meeting.email, displayName: meeting.person }];

  if (meeting.addMeet !== false) {
    event.conferenceData = {
      createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
    };
  }

  return event;
}

export async function createEvent(session, meeting, timezone) {
  const params = new URLSearchParams({ conferenceDataVersion: '1', sendUpdates: 'all' });
  const event = await googleFetch(session, `${BASE}?${params}`, {
    method: 'POST',
    body: JSON.stringify(buildEvent(meeting, timezone)),
  });

  return {
    id: event.id,
    link: event.htmlLink,
    meetLink: event.hangoutLink || null,
    start: event.start?.dateTime,
  };
}

export async function deleteEvent(session, eventId) {
  await googleFetch(session, `${BASE}/${encodeURIComponent(eventId)}?sendUpdates=all`, { method: 'DELETE' });
}

// events that overlap with the given slot
export async function findClashes(session, { date, time, durationMinutes = 30 }, timezone) {
  const end = addMinutes(date, time, durationMinutes);
  const params = new URLSearchParams({
    timeMin: toRfc3339(date, time, timezone),
    timeMax: toRfc3339(end.date, end.time, timezone),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '5',
  });

  const data = await googleFetch(session, `${BASE}?${params}`);
  return (data.items || [])
    .filter((e) => e.status !== 'cancelled' && e.start?.dateTime)
    .map((e) => ({ title: e.summary || '(no title)', start: e.start.dateTime, end: e.end.dateTime }));
}

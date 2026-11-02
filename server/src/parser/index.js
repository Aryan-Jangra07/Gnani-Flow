import { normalize } from './normalize.js';
import { findDate, todayIn } from './dates.js';
import { findTime } from './time.js';
import { hasDevanagari, toRoman } from './transliterate.js';

// Words that can sit next to a name but are never the name itself
const NOT_A_NAME = new Set([
  'kal', 'kl', 'aaj', 'aj', 'parso', 'today', 'tomorrow', 'baje', 'bje', 'am', 'pm',
  'meeting', 'meet', 'email', 'mail', 'call', 'schedule', 'appointment',
  'karo', 'kar', 'do', 'de', 'dena', 'aur', 'and', 'the', 'a', 'an', 'at', 'on', 'for', 'to',
  'mujhe', 'mera', 'meri', 'hum', 'main', 'me', 'mein', 'unko', 'usko', 'isko', 'use', 'unhe',
  'him', 'her', 'them', 'wo', 'woh', 'ek', 'set', 'fix', 'bhejo', 'bhej', 'banao', 'bana', 'likho',
  'send', 'prepare', 'write', 'draft', 'ke', 'ki', 'ka', 'se', 'ko', 'saath', 'sath', 'with',
  'subah', 'dopahar', 'shaam', 'sham', 'raat', 'morning', 'evening', 'night', 'afternoon',
  'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
  'somvar', 'mangalvar', 'budhvar', 'guruvar', 'shukravar', 'shanivar', 'ravivar',
  'january', 'february', 'march', 'april', 'june', 'july', 'august', 'september',
  'october', 'november', 'december', 'week', 'hafte', 'mahine',
  'next', 'this', 'is', 'us', 'please', 'plz', 'sir', 'ji', 'madam', 'mam', 'maam', 'bhai',
]);

const HONORIFICS = new Set(['sir', 'ji', 'madam', 'mam', 'maam', 'bhai', 'didi']);

const WORD = '[\\p{L}\\p{M}]+';

function isName(word) {
  return word && !NOT_A_NAME.has(word) && !/^\d/.test(word);
}

function titleCase(name) {
  return name.replace(/\b\p{Ll}/gu, (c) => c.toUpperCase());
}

function cleanName(name) {
  return titleCase(hasDevanagari(name) ? toRoman(name) : name);
}

function wordBefore(words, index) {
  let i = index - 1;
  while (i >= 0 && HONORIFICS.has(words[i])) i--;
  return i >= 0 && isName(words[i]) ? words[i] : null;
}

export function findPerson(text) {
  const words = text.split(' ');

  // "with rahul" / "email to rahul"
  for (let i = 0; i < words.length - 1; i++) {
    if ((words[i] === 'with' || words[i] === 'to') && isName(words[i + 1])) {
      return cleanName(words[i + 1]);
    }
  }

  // "rahul ke saath", "rahul sir ke sath"
  for (let i = 1; i < words.length - 1; i++) {
    if (['ke', 'ki'].includes(words[i]) && ['saath', 'sath'].includes(words[i + 1])) {
      const name = wordBefore(words, i);
      if (name) return cleanName(name);
    }
  }

  // "rahul ko mail karo", "rahul se meeting"
  for (let i = 1; i < words.length; i++) {
    if (words[i] === 'ko' || words[i] === 'se') {
      const name = wordBefore(words, i);
      if (name) return cleanName(name);
    }
  }

  return null;
}

function findTopic(text) {
  const about = text.match(new RegExp(`\\b(?:about|regarding)\\s+((?:${WORD}\\s*){1,6})`, 'u'));
  if (about) return about[1].trim().replace(/^(the|a|an)\s+/, '');

  const baare = text.match(new RegExp(`((?:${WORD}\\s+){1,4})ke baare (?:me|mein|main)`, 'u'));
  if (baare) {
    // "rohit ko project report ke baare mein" -> keep only what comes after "ko"
    let words = baare[1].trim().split(' ');
    const cut = Math.max(...['ko', 'se', 'to', 'with'].map((w) => words.lastIndexOf(w)));
    if (cut >= 0) words = words.slice(cut + 1);
    const topic = words.filter(isName).join(' ');
    if (topic) return topic;
  }

  return null;
}

function prettyDate(date) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
}

function prettyTime(time) {
  const [h, m] = time.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${suffix}`;
}

export function draftEmail({ person, meeting, topic }) {
  const name = person || 'there';

  if (meeting?.date && meeting?.time) {
    const when = `${prettyDate(meeting.date)} at ${prettyTime(meeting.time)}`;
    return {
      subject: topic ? `Meeting: ${titleCase(topic)}` : `Meeting on ${prettyDate(meeting.date)}`,
      body:
        `Hi ${name},\n\n` +
        `I have scheduled a meeting with you on ${when}` +
        `${topic ? ` to discuss ${topic}` : ''}. ` +
        `Please let me know if this time works for you.\n\nThanks`,
    };
  }

  return {
    subject: topic ? titleCase(topic) : '',
    body: `Hi ${name},\n\n\n\nThanks`,
  };
}

export function parseCommand(transcript, { timezone = 'Asia/Kolkata', now = new Date() } = {}) {
  const text = normalize(transcript);
  const today = todayIn(timezone, now);

  const wantsMeeting = /\b(meeting|meet|milna|schedule|appointment|call)\b/.test(text);
  const wantsEmail = /\b(e-?mail|mail)\b/.test(text);

  const person = findPerson(text);
  const topic = findTopic(text);
  const actions = [];
  const missing = [];

  let meeting = null;
  if (wantsMeeting) {
    meeting = {
      type: 'meeting',
      person,
      date: findDate(text, today),
      time: findTime(text),
      durationMinutes: 30,
      topic,
    };
    actions.push(meeting);
    for (const field of ['person', 'date', 'time']) {
      if (!meeting[field]) missing.push(`meeting.${field}`);
    }
  }

  if (wantsEmail) {
    const email = { type: 'email', to: person, ...draftEmail({ person, meeting, topic }) };
    actions.push(email);
    if (!person) missing.push('email.to');
  }

  return { transcript, normalized: text, today, actions, missing };
}

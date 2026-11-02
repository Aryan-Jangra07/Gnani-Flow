// Small date helpers. All dates are plain 'YYYY-MM-DD' strings in the user's timezone,
// so we never have to fight with Date objects shifting across UTC.

const WEEKDAYS = {
  sunday: 0, ravivar: 0, itwar: 0,
  monday: 1, somvar: 1,
  tuesday: 2, mangalvar: 2,
  wednesday: 3, budhvar: 3,
  thursday: 4, guruvar: 4, brihaspativar: 4,
  friday: 5, shukravar: 5,
  saturday: 6, shanivar: 6,
};

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2, apr: 3, april: 3,
  may: 4, jun: 5, june: 5, jul: 6, july: 6, aug: 7, august: 7,
  sep: 8, sept: 8, september: 8, oct: 9, october: 9, nov: 10, november: 10,
  dec: 11, december: 11,
};

export function todayIn(timezone, now = new Date()) {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function toUTC(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function fromUTC(date) {
  return date.toISOString().slice(0, 10);
}

export function addDays(dateStr, days) {
  const d = toUTC(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUTC(d);
}

export function daysBetween(a, b) {
  return Math.round((toUTC(b) - toUTC(a)) / 86400000);
}

export function weekdayOf(dateStr) {
  return toUTC(dateStr).getUTCDay();
}

export function findDate(text, today) {
  if (/\b(parso|parson|day after tomorrow)\b/.test(text)) return addDays(today, 2);
  if (/\b(kal|kl|tomorrow|tmrw)\b/.test(text)) return addDays(today, 1);
  if (/\b(aaj|aj|today)\b/.test(text)) return today;

  for (const [name, day] of Object.entries(WEEKDAYS)) {
    if (new RegExp(`\\b${name}\\b`).test(text)) {
      let diff = (day - weekdayOf(today) + 7) % 7;
      if (diff === 0) diff = 7;
      return addDays(today, diff);
    }
  }

  const monthNames = Object.keys(MONTHS).join('|');
  const dayFirst = text.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${monthNames})\\b`));
  const monthFirst = text.match(new RegExp(`\\b(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));

  let day, month;
  if (dayFirst) {
    day = Number(dayFirst[1]);
    month = MONTHS[dayFirst[2]];
  } else if (monthFirst) {
    day = Number(monthFirst[2]);
    month = MONTHS[monthFirst[1]];
  }

  if (day && day <= 31) {
    let year = Number(today.slice(0, 4));
    let candidate = fromUTC(new Date(Date.UTC(year, month, day)));
    if (candidate < today) candidate = fromUTC(new Date(Date.UTC(year + 1, month, day)));
    return candidate;
  }

  return null;
}

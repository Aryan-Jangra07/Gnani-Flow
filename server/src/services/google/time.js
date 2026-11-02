// "2026-11-03" + "15:00" in Asia/Kolkata -> "2026-11-03T15:00:00+05:30"

function offsetFor(timezone, date) {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'longOffset' })
    .formatToParts(date)
    .find((p) => p.type === 'timeZoneName').value; // "GMT+05:30" or "GMT"

  return name === 'GMT' ? '+00:00' : name.replace('GMT', '');
}

export function toRfc3339(date, time, timezone) {
  const guess = new Date(`${date}T${time}:00Z`);
  return `${date}T${time}:00${offsetFor(timezone, guess)}`;
}

export function addMinutes(date, time, minutes) {
  const d = new Date(`${date}T${time}:00Z`);
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  const iso = d.toISOString();
  return { date: iso.slice(0, 10), time: iso.slice(11, 16) };
}

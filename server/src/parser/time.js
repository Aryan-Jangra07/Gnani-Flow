const HOUR_WORDS = {
  ek: 1, do: 2, teen: 3, char: 4, chaar: 4, paanch: 5, panch: 5, chhe: 6, che: 6,
  saat: 7, aath: 8, nau: 9, das: 10, gyarah: 11, barah: 12,
};

const AM_WORDS = /\b(subah|subha|morning)\b/;
const PM_WORDS = /\b(dopahar|dopehar|afternoon|shaam|sham|evening|raat|night)\b/;

const pad = (n) => String(n).padStart(2, '0');

function replaceHourWords(text) {
  // "teen baje" -> "3 baje", only when a time word follows
  return text.replace(
    new RegExp(`\\b(${Object.keys(HOUR_WORDS).join('|')})\\s+(baje|bje|pm|am)\\b`, 'g'),
    (_, word, suffix) => `${HOUR_WORDS[word]} ${suffix}`,
  );
}

export function findTime(input) {
  const text = replaceHourWords(input);

  let match = text.match(
    /\b(?:(saade|sade|sawa|paune)\s+)?(\d{1,2})(?:[:.](\d{2}))?\s*(a\.?m\.?|p\.?m\.?|baje|bje|o'?clock)(?=\s|$|[,.])/,
  );
  if (!match) match = text.match(/\b()(\d{1,2})[:.](\d{2})()\b/);
  if (!match) match = text.match(/\bat\s+()(\d{1,2})()()\b/);
  if (!match) return null;

  const [, prefix, h, m, suffix = ''] = match;
  let hour = Number(h);
  let minute = m ? Number(m) : 0;

  if (prefix === 'saade' || prefix === 'sade') minute = 30;
  if (prefix === 'sawa') minute = 15;
  if (prefix === 'paune') {
    hour -= 1;
    minute = 45;
  }

  if (hour > 23 || minute > 59) return null;

  const isAm = suffix.startsWith('a') || AM_WORDS.test(text);
  const isPm = suffix.startsWith('p') || PM_WORDS.test(text);

  if (hour <= 12) {
    if (isPm && hour < 12) hour += 12;
    else if (isAm && hour === 12) hour = 0;
    else if (!isAm && !isPm && hour >= 1 && hour <= 7) hour += 12; // "3 baje" in office talk means 3 PM
  }

  return `${pad(hour)}:${pad(minute)}`;
}

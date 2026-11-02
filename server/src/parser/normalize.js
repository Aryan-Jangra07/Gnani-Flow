// Prisma returns Hindi in Devanagari, so map the common command words to the
// roman spellings the rest of the parser understands. Names are left as they are.
const HINDI_WORDS = [
  ['ईमेल', 'email'], ['ई-मेल', 'email'], ['मेल', 'mail'],
  ['मीटिंग', 'meeting'], ['मीट', 'meet'], ['शेड्यूल', 'schedule'], ['कॉल', 'call'],
  ['परसों', 'parso'], ['कल', 'kal'], ['आज', 'aaj'],
  ['बजे', 'baje'], ['सुबह', 'subah'], ['दोपहर', 'dopahar'], ['शाम', 'shaam'], ['रात', 'raat'],
  ['साढ़े', 'saade'], ['सवा', 'sawa'], ['पौने', 'paune'],
  ['के साथ', 'ke saath'], ['की साथ', 'ke saath'], ['साथ', 'saath'],
  ['को', 'ko'], ['से', 'se'], ['और', 'aur'], ['उसको', 'usko'], ['उनको', 'unko'], ['उन्हें', 'unko'],
  ['भेजो', 'bhejo'], ['भेज दो', 'bhej do'], ['बनाओ', 'banao'], ['करो', 'karo'], ['कर दो', 'kar do'],
  ['के बारे में', 'ke baare mein'],
  ['सोमवार', 'somvar'], ['मंगलवार', 'mangalvar'], ['बुधवार', 'budhvar'], ['गुरुवार', 'guruvar'],
  ['शुक्रवार', 'shukravar'], ['शनिवार', 'shanivar'], ['रविवार', 'ravivar'],
  ['एक', 'ek'], ['दो', 'do'], ['तीन', 'teen'], ['चार', 'char'], ['पांच', 'paanch'], ['पाँच', 'paanch'],
  ['छह', 'chhe'], ['सात', 'saat'], ['आठ', 'aath'], ['नौ', 'nau'], ['दस', 'das'],
  ['ग्यारह', 'gyarah'], ['बारह', 'barah'],
];

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

export function normalize(text) {
  let out = ` ${text.toLowerCase()} `;

  out = out.replace(/[०-९]/g, (d) => String(DEVANAGARI_DIGITS.indexOf(d)));

  // longer phrases first so "ईमेल" is not eaten by "मेल"
  for (const [hi, en] of HINDI_WORDS) {
    out = out.replace(new RegExp(`(^|[\\s,.।?!])${hi}(?=$|[\\s,.।?!])`, 'g'), `$1${en}`);
  }

  return out
    .replace(/['’]/g, '')
    .replace(/[।?!,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

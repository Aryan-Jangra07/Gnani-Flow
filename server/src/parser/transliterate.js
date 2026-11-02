// Very small Devanagari -> roman converter, only meant for names
// (राहुल -> rahul, प्रिया -> priya) so we can search Google contacts.

const VOWELS = {
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au',
};

const MATRAS = {
  'ा': 'a', 'ि': 'i', 'ी': 'i', 'ु': 'u', 'ू': 'u', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ॉ': 'o',
};

const CONSONANTS = {
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'n',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'n',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v', 'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क़': 'q', 'ख़': 'kh', 'ग़': 'g', 'ज़': 'z', 'फ़': 'f', 'ड़': 'd', 'ढ़': 'dh',
};

const VIRAMA = '्';
const NUKTA = '़';

export function hasDevanagari(text) {
  return /[ऀ-ॿ]/.test(text);
}

function wordToRoman(word) {
  const chars = [...word.normalize('NFC')];
  let out = '';

  for (let i = 0; i < chars.length; i++) {
    let ch = chars[i];
    if (chars[i + 1] === NUKTA) ch += chars[++i];

    if (CONSONANTS[ch]) {
      out += CONSONANTS[ch];
      const next = chars[i + 1];
      const isLast = i === chars.length - 1;
      if (next === VIRAMA) i++;
      else if (MATRAS[next] === undefined && !isLast) out += 'a';
    } else if (MATRAS[ch] !== undefined) {
      out += MATRAS[ch];
    } else if (VOWELS[ch]) {
      out += VOWELS[ch];
    } else if (ch === 'ं' || ch === 'ँ') {
      out += 'n';
    } else if (ch === 'ः') {
      out += 'h';
    } else {
      out += ch;
    }
  }

  return out;
}

export function toRoman(text) {
  return text.split(/\s+/).map(wordToRoman).join(' ');
}

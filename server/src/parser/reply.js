// Builds the short sentence that Timbre speaks back, in English or Hindi.
// Timbre reads numbers better as words, so hours are spelled out.

const HOURS = {
  en: ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'],
  hi: ['बारह', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छह', 'सात', 'आठ', 'नौ', 'दस', 'ग्यारह'],
};

function spokenTimeEn(time) {
  const [h, m] = time.split(':').map(Number);
  const hour = HOURS.en[h % 12];
  const part = h < 12 ? 'in the morning' : h < 17 ? 'in the afternoon' : h < 21 ? 'in the evening' : 'at night';
  if (m === 0) return `at ${hour} ${part}`;
  if (m === 30) return `at ${hour} thirty ${part}`;
  if (m === 15) return `at quarter past ${hour} ${part}`;
  if (m === 45) return `at quarter to ${HOURS.en[(h + 1) % 12]} ${part}`;
  return `at ${hour} ${m} ${part}`;
}

function spokenTimeHi(time) {
  const [h, m] = time.split(':').map(Number);
  const hour = (n) => HOURS.hi[n % 12];
  const part = h < 12 ? 'सुबह' : h < 16 ? 'दोपहर' : h < 20 ? 'शाम' : 'रात';
  if (m === 0) return `${part} ${hour(h)} बजे`;
  if (m === 30) return `${part} साढ़े ${hour(h)} बजे`;
  if (m === 15) return `${part} सवा ${hour(h)} बजे`;
  if (m === 45) return `${part} पौने ${hour(h + 1)} बजे`;
  return `${part} ${hour(h)} बजकर ${m} मिनट पर`;
}

function dayDiff(date, today) {
  return Math.round((new Date(date) - new Date(today)) / 86400000);
}

function spokenDate(date, today, lang) {
  const diff = dayDiff(date, today);
  const words = lang === 'hi' ? ['आज', 'कल', 'परसों'] : ['today', 'tomorrow', 'the day after tomorrow'];
  if (diff >= 0 && diff <= 2) return words[diff];
  const label = new Date(date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  });
  return lang === 'hi' ? label : `on ${label}`;
}

const TEXT = {
  en: {
    notUnderstood: "Sorry, I didn't get that. Please say it again with a meeting or an email.",
    missing: {
      'meeting.person': 'Who is the meeting with?',
      'meeting.date': 'Which day should I set the meeting for?',
      'meeting.time': 'What time should the meeting be?',
      'email.to': 'Who should I send the email to?',
    },
    summary({ meeting, email, today }) {
      const parts = [];
      if (meeting) {
        parts.push(`a meeting with ${meeting.person} ${spokenDate(meeting.date, today, 'en')} ${spokenTimeEn(meeting.time)}`);
      }
      if (email) parts.push(meeting ? 'an email draft' : `an email draft for ${email.to}`);
      return `Okay. I have ${parts.join(' and ')} ready. Please check it and confirm.`;
    },
  },
  hi: {
    notUnderstood: 'माफ़ कीजिए, मैं समझ नहीं पाया। मीटिंग या ईमेल के बारे में फिर से बोलिए।',
    missing: {
      'meeting.person': 'मीटिंग किसके साथ करनी है?',
      'meeting.date': 'मीटिंग किस दिन रखनी है?',
      'meeting.time': 'मीटिंग कितने बजे रखनी है?',
      'email.to': 'ईमेल किसको भेजना है?',
    },
    summary({ meeting, email, today }) {
      const parts = [];
      if (meeting) {
        parts.push(`${meeting.person} के साथ ${spokenDate(meeting.date, today, 'hi')} ${spokenTimeHi(meeting.time)} की मीटिंग`);
      }
      if (email) parts.push(meeting ? 'ईमेल का ड्राफ्ट' : `${email.to} के लिए ईमेल का ड्राफ्ट`);
      return `ठीक है। ${parts.join(' और ')} तैयार है। एक बार देखकर पक्का कर दीजिए।`;
    },
  },
};

export function buildReply(result, lang = 'en') {
  const text = TEXT[lang] || TEXT.en;
  const { actions, missing, today } = result;

  if (actions.length === 0) return text.notUnderstood;
  if (missing.length > 0) return text.missing[missing[0]];

  return text.summary({
    meeting: actions.find((a) => a.type === 'meeting'),
    email: actions.find((a) => a.type === 'email'),
    today,
  });
}

import { useState } from 'react';
import Waveform from './Waveform.jsx';
import { SpeakerIcon } from './Icons.jsx';
import { useLang } from '../i18n/lang.jsx';

const LANGUAGES = [
  { code: 'hi-IN', name: 'Hindi / Hinglish' },
  { code: 'en-IN', name: 'English' },
  { code: 'mr-IN', name: 'Marathi' },
  { code: 'ta-IN', name: 'Tamil' },
  { code: 'te-IN', name: 'Telugu' },
  { code: 'kn-IN', name: 'Kannada' },
  { code: 'bn-IN', name: 'Bengali' },
  { code: 'gu-IN', name: 'Gujarati' },
];

const clock = (s) => `0:${String(s).padStart(2, '0')}`;

export default function VoicePanel({ status, recorder, language, onLanguage, onMic, onText, transcript, reply, onReplay }) {
  const { t } = useLang();
  const [typed, setTyped] = useState('');
  const listening = status === 'listening';
  const busy = status === 'thinking' || status === 'sending';

  function submit(e) {
    e.preventDefault();
    if (!typed.trim()) return;
    onText(typed.trim());
    setTyped('');
  }

  return (
    <section className="composer">
      <div className="composer-head">
        <h1>{t.heading}</h1>
        <select value={language} onChange={(e) => onLanguage(e.target.value)} disabled={listening}>
          {LANGUAGES.map((l) => (
            <option key={l.code} value={l.code}>{l.name}</option>
          ))}
        </select>
      </div>

      <button className={`record ${listening ? 'live' : ''}`} onClick={onMic} disabled={busy}>
        <span className="rec-dot" />
        {listening ? (
          <>
            <Waveform stream={recorder.stream} />
            <span className="rec-time">{clock(recorder.seconds)} / {clock(recorder.maxSeconds)}</span>
            <span className="rec-label">{t.stop}</span>
          </>
        ) : (
          <span className="rec-label">
            {status === 'thinking' ? t.thinking : t.pressToSpeak}
          </span>
        )}
      </button>

      <form className="typed" onSubmit={submit}>
        <input
          placeholder={t.typeInstead}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          disabled={busy}
        />
        <button className="btn text" disabled={busy || !typed.trim()}>{t.enter}</button>
      </form>

      {!transcript && (
        <ul className="examples">
          {t.examples.map((ex) => (
            <li key={ex}>
              <button onClick={() => onText(ex)} disabled={busy}>“{ex}”</button>
            </li>
          ))}
        </ul>
      )}

      {transcript && (
        <div className="said">
          <blockquote>“{transcript}”</blockquote>
          {reply && (
            <p className="answer">
              <button className="speak" onClick={onReplay} title={t.replay}>
                <SpeakerIcon width={15} height={15} />
              </button>
              {reply}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

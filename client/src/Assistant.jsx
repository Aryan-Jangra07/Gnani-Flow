import { useEffect, useRef, useState } from 'react';
import { useRecorder } from './hooks/useRecorder.js';
import { useAuth } from './hooks/useAuth.js';
import * as api from './api.js';
import TopBar from './components/TopBar.jsx';
import VoicePanel from './components/VoicePanel.jsx';
import ReviewPanel from './components/ReviewPanel.jsx';
import HistoryPanel from './components/HistoryPanel.jsx';
import { useLang } from './i18n/lang.jsx';

const EMPTY_DRAFT = { meeting: null, email: null };

function toDraft(result) {
  const m = result.actions.find((a) => a.type === 'meeting');
  const e = result.actions.find((a) => a.type === 'email');

  return {
    meeting: m && {
      person: m.person || '',
      email: '',
      date: m.date || '',
      time: m.time || '',
      durationMinutes: m.durationMinutes || 30,
      title: m.topic ? `${m.topic[0].toUpperCase()}${m.topic.slice(1)}` : '',
      topic: m.topic,
      addMeet: true,
    },
    email: e && { to: e.to || '', email: '', subject: e.subject || '', body: e.body || '' },
  };
}

function doneMessage(results, m) {
  const meeting = results.find((r) => r.type === 'meeting');
  const email = results.find((r) => r.type === 'email');
  if (email && !email.ok) return m.mailFailed;
  if (meeting && email) return m.both;
  if (meeting) return m.meeting;
  return m.email;
}

export default function Assistant() {
  const { user, health, logout } = useAuth();
  const { t, lang } = useLang();
  const recorder = useRecorder();
  const audioRef = useRef(null);

  const [language, setLanguage] = useState('hi-IN');
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(() =>
    new URLSearchParams(location.search).get('login') === 'failed' ? 'login-failed' : '',
  );
  const [result, setResult] = useState(null);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [clashes, setClashes] = useState([]);
  const [results, setResults] = useState(null);
  const [historyItems, setHistoryItems] = useState(null);

  useEffect(() => {
    if (location.search) window.history.replaceState(null, '', '/app');
  }, []);

  useEffect(() => {
    if (user) loadHistory();
    else setHistoryItems(null);
  }, [user]);

  // same person in meeting and email -> reuse the address
  useEffect(() => {
    const { meeting, email } = draft;
    if (meeting?.email && email && !email.email && email.to === meeting.person) {
      setDraft((d) => ({ ...d, email: { ...d.email, email: meeting.email } }));
    }
  }, [draft]);

  const slot = draft.meeting && `${draft.meeting.date}|${draft.meeting.time}|${draft.meeting.durationMinutes}`;
  useEffect(() => {
    const m = draft.meeting;
    if (!user || !m?.date || !m?.time) {
      setClashes([]);
      return;
    }
    api
      .checkAvailability({ date: m.date, time: m.time, durationMinutes: m.durationMinutes })
      .then((r) => setClashes(r.clashes))
      .catch(() => setClashes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slot, user]);

  async function loadHistory() {
    try {
      setHistoryItems((await api.getHistory()).history);
    } catch {
      setHistoryItems([]);
    }
  }

  async function say(text) {
    try {
      audioRef.current?.pause();
      const url = await api.getSpeech(text, lang);
      audioRef.current = new Audio(url);
      await audioRef.current.play();
    } catch (err) {
      console.warn('voice reply failed:', err.message);
    }
  }

  async function understand(task) {
    setStatus('thinking');
    setError('');
    setResults(null);
    try {
      const data = await task();
      setResult(data);
      setDraft(toDraft(data));
      setStatus(data.actions.length ? 'review' : 'idle');
      say(data.reply);
    } catch (err) {
      setError(err.message);
      setStatus('idle');
    }
  }

  async function handleMic() {
    if (status !== 'listening') {
      setError('');
      try {
        await recorder.start();
        setStatus('listening');
      } catch {
        setError(t.micDenied);
      }
      return;
    }

    try {
      const wav = await recorder.stop();
      if (wav) understand(() => api.sendAudio(wav, language, lang));
    } catch {
      setError(t.recordingFailed);
      setStatus('idle');
    }
  }

  async function handleConfirm() {
    const actions = [];
    if (draft.meeting) actions.push({ type: 'meeting', ...draft.meeting });
    if (draft.email) actions.push({ type: 'email', ...draft.email });

    setStatus('sending');
    setError('');
    try {
      const data = await api.execute(actions, result?.transcript);
      setResults(data.results);
      setStatus('done');
      say(doneMessage(data.results, t.spokenDone));
      loadHistory();
    } catch (err) {
      setError(err.message);
      setStatus('review');
    }
  }

  async function handleUndo(id) {
    try {
      await api.undoHistory(id);
      loadHistory();
    } catch (err) {
      setError(err.message);
    }
  }

  function reset() {
    setResult(null);
    setDraft(EMPTY_DRAFT);
    setResults(null);
    setClashes([]);
    setStatus('idle');
  }

  const showReview = draft.meeting || draft.email;

  return (
    <>
      <TopBar user={user} health={health} onLogout={logout} />

      <main className={`layout ${user ? 'with-history' : ''}`}>
        <div className="main-col">
          {error && (
            <p className="error" onClick={() => setError('')}>
              {error === 'login-failed' ? t.loginFailed : error}
            </p>
          )}

          <VoicePanel
            status={status}
            recorder={recorder}
            language={language}
            onLanguage={setLanguage}
            onMic={handleMic}
            onText={(text) => understand(() => api.sendText(text, lang))}
            transcript={result?.transcript}
            reply={result?.reply}
            onReplay={() => say(result.reply)}
          />

          {showReview && (
            <ReviewPanel
              draft={draft}
              setDraft={setDraft}
              user={user}
              clashes={clashes}
              status={status}
              results={results}
              onConfirm={handleConfirm}
              onReset={reset}
            />
          )}
        </div>

        {user && <HistoryPanel items={historyItems} onUndo={handleUndo} />}
      </main>
    </>
  );
}

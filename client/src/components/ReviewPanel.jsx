import MeetingCard from './MeetingCard.jsx';
import EmailCard from './EmailCard.jsx';
import { useLang } from '../i18n/lang.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function problems({ meeting, email }, m) {
  const list = [];
  if (meeting) {
    if (!meeting.date) list.push(m.date);
    if (!meeting.time) list.push(m.time);
    if (meeting.email && !EMAIL_RE.test(meeting.email)) list.push(m.meetingEmail);
  }
  if (email) {
    if (!EMAIL_RE.test(email.email || '')) list.push(m.email);
    if (!email.body?.trim()) list.push(m.body);
  }
  return list;
}

function Results({ results, onReset }) {
  const { t } = useLang();

  return (
    <section className="review">
      <h2>{t.done}</h2>
      <ul className="results">
        {results.map((r, i) => (
          <li key={i} className={r.ok ? 'ok' : 'fail'}>
            <span className="mark">{r.ok ? '✓' : '✕'}</span>
            {r.type === 'meeting' ? (
              <span>
                {t.meetingAdded}{' '}
                <a href={r.link} target="_blank" rel="noreferrer">{t.openEvent}</a>
                {r.meetLink && (
                  <>
                    {' · '}
                    <a href={r.meetLink} target="_blank" rel="noreferrer">{t.meetLink}</a>
                  </>
                )}
              </span>
            ) : (
              <span>{r.ok ? t.mailSent(r.to) : t.mailFailed(r.error)}</span>
            )}
          </li>
        ))}
      </ul>
      <button className="btn outline" onClick={onReset}>{t.newCommand}</button>
    </section>
  );
}

export default function ReviewPanel({ draft, setDraft, user, clashes, status, results, onConfirm, onReset }) {
  const { t } = useLang();
  if (results) return <Results results={results} onReset={onReset} />;

  const { meeting, email } = draft;
  const todo = problems(draft, t.missing);
  const sending = status === 'sending';

  return (
    <section className="review">
      <h2>
        {t.draft} <span className="count">{t.tasks([meeting, email].filter(Boolean).length)}</span>
      </h2>

      {meeting && (
        <MeetingCard
          meeting={meeting}
          clashes={clashes}
          canSearch={Boolean(user)}
          onChange={(m) => setDraft((d) => ({ ...d, meeting: m }))}
        />
      )}

      {email && (
        <EmailCard
          email={email}
          hasMeeting={Boolean(meeting?.addMeet)}
          canSearch={Boolean(user)}
          onChange={(e) => setDraft((d) => ({ ...d, email: e }))}
        />
      )}

      <footer className="confirm-bar">
        <p className="todo">
          {!user ? t.needLogin : todo.length > 0 ? t.stillNeeded(todo) : t.allGood}
        </p>
        <div className="buttons">
          <button className="btn text" onClick={onReset} disabled={sending}>{t.cancel}</button>
          <button className="btn solid" onClick={onConfirm} disabled={!user || todo.length > 0 || sending}>
            {sending ? t.sending : t.confirm}
          </button>
        </div>
      </footer>
    </section>
  );
}

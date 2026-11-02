import ContactPicker from './ContactPicker.jsx';
import { useLang } from '../i18n/lang.jsx';

const DURATIONS = [15, 30, 45, 60, 90];

// "2026-11-03T15:00:00+05:30" -> "3:00 PM", kept in the calendar's own timezone
function formatTime(iso) {
  const [h, m] = iso.slice(11, 16).split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function DateBlock({ date, lang }) {
  if (!date) return <div className="date-block empty">?</div>;
  const d = new Date(`${date}T00:00:00`);
  return (
    <div className="date-block">
      <span>{d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'short' })}</span>
      <strong>{d.getDate()}</strong>
      <span>{d.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { weekday: 'short' })}</span>
    </div>
  );
}

export default function MeetingCard({ meeting, onChange, canSearch, clashes }) {
  const { t, lang } = useLang();
  const set = (changes) => onChange({ ...meeting, ...changes });

  return (
    <article className="sheet meeting">
      <header className="sheet-head">
        <span className="kind">{t.calendar}</span>
        <label className="toggle">
          <input type="checkbox" checked={meeting.addMeet} onChange={(e) => set({ addMeet: e.target.checked })} />
          {t.meetLink}
        </label>
      </header>

      <div className="meeting-body">
        <DateBlock date={meeting.date} lang={lang} />

        <div className="meeting-fields">
          <input
            className="title"
            placeholder={t.meetingWith(meeting.person)}
            value={meeting.title || ''}
            onChange={(e) => set({ title: e.target.value })}
          />

          <div className="when">
            <input type="date" value={meeting.date || ''} onChange={(e) => set({ date: e.target.value })} />
            <input type="time" value={meeting.time || ''} onChange={(e) => set({ time: e.target.value })} />
            <select value={meeting.durationMinutes} onChange={(e) => set({ durationMinutes: Number(e.target.value) })}>
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d} {t.min}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ContactPicker
        label={t.with}
        name={meeting.person}
        email={meeting.email}
        canSearch={canSearch}
        onChange={({ name, email }) => set({ person: name, email })}
      />

      {clashes?.length > 0 && (
        <p className="clash">
          {t.clash}{' '}
          {clashes.map((c, i) => (
            <b key={i}>
              {i > 0 && ', '}
              {c.title} ({formatTime(c.start)})
            </b>
          ))}{' '}
          {t.clashEnd}
        </p>
      )}
    </article>
  );
}

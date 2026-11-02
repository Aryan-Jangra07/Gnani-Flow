import ContactPicker from './ContactPicker.jsx';
import { useLang } from '../i18n/lang.jsx';

export default function EmailCard({ email, onChange, canSearch, hasMeeting }) {
  const { t } = useLang();
  const set = (changes) => onChange({ ...email, ...changes });

  return (
    <article className="sheet email">
      <header className="sheet-head">
        <span className="kind">{t.gmail}</span>
        {hasMeeting && <span className="note">{t.meetAutoAdded}</span>}
      </header>

      <ContactPicker
        label={t.to}
        name={email.to}
        email={email.email}
        canSearch={canSearch}
        onChange={({ name, email: address }) => set({ to: name, email: address })}
      />

      <div className="line">
        <label>{t.subject}</label>
        <input value={email.subject || ''} onChange={(e) => set({ subject: e.target.value })} />
      </div>

      <textarea rows={8} value={email.body || ''} onChange={(e) => set({ body: e.target.value })} />
    </article>
  );
}

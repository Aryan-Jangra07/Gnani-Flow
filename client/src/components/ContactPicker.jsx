import { useEffect, useState } from 'react';
import { searchContacts } from '../api.js';
import { useLang } from '../i18n/lang.jsx';

// Name + email. Looks the name up in Google contacts and fills the email.
export default function ContactPicker({ label, name, email, onChange, canSearch }) {
  const { t } = useLang();
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!canSearch || !name || name.length < 2) {
      setOptions([]);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { contacts } = await searchContacts(name);
        if (cancelled) return;
        setOptions(contacts);
        if (!email && contacts.length === 1) onChange({ name, email: contacts[0].email });
      } catch {
        if (!cancelled) setOptions([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, canSearch]);

  const showOptions = options.length > 0 && !options.some((o) => o.email === email);

  return (
    <>
      <div className="line">
        <label>{label}</label>
        <input
          className="name"
          placeholder={t.name}
          value={name || ''}
          onChange={(e) => onChange({ name: e.target.value, email: '' })}
        />
        <input
          type="email"
          placeholder={searching ? t.searchingContacts : 'email@example.com'}
          value={email || ''}
          onChange={(e) => onChange({ name, email: e.target.value })}
        />
      </div>

      {showOptions && (
        <div className="picks">
          {options.slice(0, 4).map((o) => (
            <button key={o.email} onClick={() => onChange({ name, email: o.email })}>
              {o.name} <span>{o.email}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

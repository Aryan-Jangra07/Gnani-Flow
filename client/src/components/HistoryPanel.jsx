import { useLang } from '../i18n/lang.jsx';

export default function HistoryPanel({ items, onUndo }) {
  const { t, lang } = useLang();
  if (!items) return null;

  const when = (iso) =>
    new Date(iso).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    });

  return (
    <aside className="history">
      <h2>{t.history}</h2>
      {items.length === 0 && <p className="empty">{t.nothingYet}</p>}

      <ol>
        {items.map((item) => {
          const meeting = item.results.find((r) => r.type === 'meeting' && r.ok);
          const kinds = item.results.map((r) => (r.type === 'meeting' ? t.meeting : t.mail) + (r.ok ? '' : ' ✕'));
          return (
            <li key={item.id} className={item.cancelled ? 'cancelled' : ''}>
              <time>{when(item.createdAt)}</time>
              <p>{item.transcript || t.typedCommand}</p>
              <span className="kinds">{kinds.join(' + ')}</span>
              {meeting && !item.cancelled && (
                <button className="undo" onClick={() => onUndo(item.id)}>{t.cancelMeeting}</button>
              )}
              {item.cancelled && <span className="kinds"> · {t.cancelled}</span>}
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

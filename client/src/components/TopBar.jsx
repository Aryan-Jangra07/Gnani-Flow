import { useLang, LangSwitch } from '../i18n/lang.jsx';

function Dot({ on, label }) {
  const { t } = useLang();
  return (
    <span className={`svc ${on ? 'on' : ''}`} title={on ? t.svcOn(label) : t.svcOff(label)}>
      <i /> {label}
    </span>
  );
}

export default function TopBar({ user, health, onLogout }) {
  const { t } = useLang();

  return (
    <header className="topbar">
      <a href="/" className="wordmark">
        gnani<span>/</span>flow
      </a>

      <div className="services">
        <Dot on={health?.gnani} label="Prisma" />
        <Dot on={health?.gnani} label="Timbre" />
        <Dot on={Boolean(user)} label="Google" />
      </div>

      <div className="account">
        <LangSwitch />
        {user ? (
          <>
            <span className="who">{user.email}</span>
            <button className="btn text" onClick={onLogout}>{t.logout}</button>
          </>
        ) : (
          <a
            className={`btn outline ${health?.google ? '' : 'disabled'}`}
            href={health?.google ? '/auth/google' : undefined}
            title={health?.google ? '' : t.googleMissing}
          >
            {t.connectGoogle}
          </a>
        )}
      </div>
    </header>
  );
}

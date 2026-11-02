import { createContext, useContext, useEffect, useState } from 'react';
import { strings } from './strings.js';

const LangContext = createContext(null);

function savedLang() {
  try {
    const v = localStorage.getItem('lang');
    if (v === 'en' || v === 'hi') return v;
  } catch {
    // storage blocked, fall through
  }
  return 'en';
}

export function LangProvider({ children }) {
  const [lang, setLang] = useState(savedLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // ignore
    }
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t: strings[lang] }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);

export function LangSwitch() {
  const { lang, setLang } = useLang();
  return (
    <div className="lang-switch" role="group" aria-label="Language">
      <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
      <button className={lang === 'hi' ? 'on' : ''} onClick={() => setLang('hi')}>हिं</button>
    </div>
  );
}

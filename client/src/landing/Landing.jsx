import VoiceOrb from './VoiceOrb.jsx';
import DemoLine from './DemoLine.jsx';
import { useLang, LangSwitch } from '../i18n/lang.jsx';
import './landing.css';

export default function Landing() {
  const { t } = useLang();
  const l = t.l;

  return (
    <div className="landing">
      <nav className="l-nav">
        <a href="/" className="wordmark">
          gnani<span>/</span>flow
        </a>
        <div className="l-links">
          <a href="#how">{l.how}</a>
          <a href="#features">{l.features}</a>
          <LangSwitch />
          <a href="/app" className="btn solid">{l.openApp}</a>
        </div>
      </nav>

      <header className="hero">
        <div className="hero-text">
          <p className="eyebrow">{l.eyebrow}</p>
          <h1>
            {l.title1}
            <br />
            {l.title2a}<em>{l.set}</em>{l.title2b}<em>{l.sent}</em>.
          </h1>
          <p className="lede">{l.lede}</p>
          <div className="hero-cta">
            <a href="/app" className="btn solid big">{l.tryIt}</a>
            <a href="#how" className="btn text">{l.howArrow}</a>
          </div>
        </div>

        <div className="hero-visual">
          <VoiceOrb />
        </div>
      </header>

      <section className="demo-wrap">
        <DemoLine labels={l.demoLabels} />
      </section>

      <section id="how" className="l-section">
        <h2>{l.how}</h2>
        <ol className="steps">
          {l.steps.map(([title, body], i) => (
            <li key={title}>
              <span className="step-n">0{i + 1}</span>
              <h3>{title}</h3>
              <p>{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="features" className="l-section">
        <h2>{l.featuresTitle}</h2>
        <div className="features">
          {l.featureList.map(([title, body]) => (
            <div key={title} className="feature">
              <h3>{title}</h3>
              <p>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="l-section stack">
        <h2>{l.stackTitle}</h2>
        <table>
          <tbody>
            {l.stack.map(([k, v]) => (
              <tr key={k}>
                <td>{k}</td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="closing">
        <h2>{l.closing}</h2>
        <a href="/app" className="btn solid big">{l.openApp}</a>
      </section>

      <footer className="l-foot">
        <span className="wordmark small">
          gnani<span>/</span>flow
        </span>
        <span>{l.footer}</span>
      </footer>
    </div>
  );
}

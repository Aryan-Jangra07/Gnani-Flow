import { useEffect, useState } from 'react';

// Types out a sample command, then shows what Gnani Flow pulled out of it.

// The commands stay as people actually say them (mixed), only the labels change with language
const SAMPLES = [
  {
    text: 'Kal 3 baje Rahul ke saath meeting set karo aur usko mail bhej do',
    parts: [['who', 'Rahul'], ['when', 'tomorrow, 3:00 PM'], ['what', 'meeting + email']],
  },
  {
    text: 'Schedule a meeting with Priya on Friday at 5 PM',
    parts: [['who', 'Priya'], ['when', 'Fri, 5:00 PM'], ['what', 'meeting']],
  },
  {
    text: 'राहुल को प्रोजेक्ट के बारे में ईमेल भेजो',
    parts: [['who', 'Rahul'], ['what', 'email']],
  },
];

export default function DemoLine({ labels }) {
  const [index, setIndex] = useState(0);
  const [typed, setTyped] = useState(0);

  const sample = SAMPLES[index];
  const done = typed >= sample.text.length;

  useEffect(() => {
    const timer = done
      ? setTimeout(() => {
          setIndex((i) => (i + 1) % SAMPLES.length);
          setTyped(0);
        }, 2600)
      : setTimeout(() => setTyped((n) => n + 1), 38);
    return () => clearTimeout(timer);
  }, [typed, done]);

  return (
    <div className="demo">
      <p className="demo-said">
        <span className="demo-rec" />
        {sample.text.slice(0, typed)}
        <span className="caret" />
      </p>
      <dl className={`demo-parts ${done ? 'show' : ''}`}>
        {sample.parts.map(([k, v]) => (
          <div key={k}>
            <dt>{labels[k]}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

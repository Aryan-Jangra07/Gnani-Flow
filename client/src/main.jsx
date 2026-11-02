import { StrictMode, lazy, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { LangProvider } from './i18n/lang.jsx';
import './App.css';

const Landing = lazy(() => import('./landing/Landing.jsx'));
const Assistant = lazy(() => import('./Assistant.jsx'));

const Page = location.pathname.startsWith('/app') ? Assistant : Landing;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <LangProvider>
      <Suspense fallback={null}>
        <Page />
      </Suspense>
    </LangProvider>
  </StrictMode>,
);

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './ThemeContext.tsx';
import { inject } from '@vercel/analytics';
import './index.css';

// Tier 1 Google Maps Platform Demo Key Quota Defense (must register before Maps JS loads)
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

inject();

createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);


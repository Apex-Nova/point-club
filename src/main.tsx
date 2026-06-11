import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SocketProvider } from './contexts/SocketContext.tsx';
import { initAnalytics } from './lib/analytics.ts';
import { initMonitoring } from './lib/monitoring.ts';
import { initLocale } from './lib/i18n.ts';
import { initCrazyGames } from './lib/crazygames.ts';

// Initialise observability + i18n before render
initMonitoring();
initAnalytics();
initLocale();
initCrazyGames().then(() => {
  // Signal that the game has loaded and is ready to play
  import('./lib/crazygames').then(({ gameplayStart }) => gameplayStart());
});

// Register service worker only when not in an iframe (CrazyGames blocks it)
const inIframe = window.self !== window.top;
if ('serviceWorker' in navigator && import.meta.env.PROD && !inIframe) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <SocketProvider>
        <App />
      </SocketProvider>
    </AuthProvider>
  </StrictMode>,
);

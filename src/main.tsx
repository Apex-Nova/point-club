import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { SocketProvider } from './contexts/SocketContext.tsx';
import { initAnalytics } from './lib/analytics.ts';
import { initMonitoring } from './lib/monitoring.ts';
import { initLocale } from './lib/i18n.ts';

// Initialise observability + i18n before render
initMonitoring();
initAnalytics();
initLocale();

// Register service worker for offline mode (Phase 8)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
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

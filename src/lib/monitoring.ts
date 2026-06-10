import * as Sentry from '@sentry/react';

const DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

export function initMonitoring() {
  if (!DSN) return;
  Sentry.init({
    dsn:         DSN,
    environment: import.meta.env.MODE,
    release:     `point-club@${import.meta.env.VITE_APP_VERSION ?? '0.0.1'}`,
    tracesSampleRate:   0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
      Sentry.browserTracingIntegration(),
    ],
  });
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (!DSN) { console.error(err); return; }
  Sentry.withScope(scope => {
    if (context) Object.entries(context).forEach(([k, v]) => scope.setExtra(k, v));
    Sentry.captureException(err);
  });
}

export function setUser(id: string, email?: string) {
  Sentry.setUser({ id, email });
}

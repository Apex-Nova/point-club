import posthog from 'posthog-js';

const KEY  = import.meta.env.VITE_POSTHOG_KEY  as string | undefined;
const HOST = import.meta.env.VITE_POSTHOG_HOST as string | undefined ?? 'https://us.i.posthog.com';

let initialised = false;

export function initAnalytics() {
  if (initialised || !KEY) return;
  posthog.init(KEY, {
    api_host:               HOST,
    capture_pageview:       true,
    capture_pageleave:      true,
    persistence:            'localStorage',
    autocapture:            false,
    disable_session_recording: true,
  });
  initialised = true;
}

export function identifyUser(id: string, props: Record<string, unknown> = {}) {
  if (!initialised) return;
  posthog.identify(id, props);
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (!initialised) return;
  posthog.capture(event, properties);
}

export function trackPage(name: string) {
  track('$pageview', { page: name });
}

export function resetAnalytics() {
  if (!initialised) return;
  posthog.reset();
}

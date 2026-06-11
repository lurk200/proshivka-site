import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const SESSION_KEY = 'proshivka-sid';

export function getSessionId() {
  if (typeof sessionStorage === 'undefined') return null;
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

function getReferrer() {
  try { return document.referrer || null; } catch { return null; }
}

function sendBeacon(url, payload) {
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

// ── Pageview tracker (used in SiteLayout) ─────────────────────────────────────

export function useAnalytics() {
  const location = useLocation();
  const prevPath = useRef(null);
  const referrerRef = useRef(getReferrer());

  useEffect(() => {
    const path = location.pathname + location.search;
    if (path === prevPath.current) return;
    prevPath.current = path;
    sendBeacon('/api/analytics/pageview', {
      path,
      sessionId: getSessionId(),
      referrer: referrerRef.current,
    });
  }, [location]);
}

// ── CTA / click tracking ──────────────────────────────────────────────────────

export function trackClick(target, label, path) {
  sendBeacon('/api/analytics/click', {
    target,
    label: label || null,
    path: path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    sessionId: getSessionId(),
  });
}

// Convenience alias with explicit service name
export function trackServiceCta(serviceName) {
  trackClick('service_cta', serviceName || null);
}

// Track phone/messenger/map CTA presses
export function trackCta(target, label) {
  trackClick(target, label || null);
}

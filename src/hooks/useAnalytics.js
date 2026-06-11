import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const SESSION_KEY = 'proshivka-sid';

function getSessionId() {
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
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch {}
}

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

export function trackClick(target, label, path) {
  sendBeacon('/api/analytics/click', {
    target,
    label: label || null,
    path: path || (typeof window !== 'undefined' ? window.location.pathname : '/'),
    sessionId: getSessionId(),
  });
}

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initAnalytics, trackPageView } from '../lib/visits';
import { useStore } from '../store/store';

/** Records one visit per storefront page opened. Admins' own browsing is skipped. */
export function VisitTracker() {
  const { pathname } = useLocation();
  const { state } = useStore();
  const admin = state.user?.role === 'admin';

  useEffect(() => {
    initAnalytics();
  }, []);

  useEffect(() => {
    // Wait for the session so an admin's first page is not counted either.
    if (!state.authReady || admin) return;
    trackPageView(pathname);
  }, [pathname, state.authReady, admin]);

  return null;
}

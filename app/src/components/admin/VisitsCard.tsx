import { useEffect, useState } from 'react';
import { loadVisitStats } from '../../lib/api';
import type { VisitStats } from '../../lib/api';
import { errorMessage } from '../../lib/format';
import { useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { adminCard, cardHeader, cardTitle, rowDivider } from './shared';

type Range = 7 | 30 | 90;
const RANGES: Range[] = [7, 30, 90];

const bigNumber = { fontFamily: "'Cormorant Garamond',serif", fontSize: 36, lineHeight: 1 } as const;
const small = { fontSize: 11, opacity: 0.6 } as const;

const PAGE_NAMES: Record<string, string> = {
  '/': 'Home',
  '/about': 'About',
  '/contact': 'Contact',
  '/wishlist': 'Wishlist',
  '/account': 'Account',
  '/checkout': 'Checkout',
  '/checkout/success': 'Order confirmed',
  '/legal': 'Terms & privacy',
  '/reset-password': 'Password reset',
};

function shortDay(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/** Visitors and page views on the storefront, from the `page_views` table. */
export function VisitsCard() {
  const { state, products } = useStore();
  const [days, setDays] = useState<Range>(30);
  const [stats, setStats] = useState<VisitStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    loadVisitStats(days)
      .then((s) => {
        if (!on) return;
        setStats(s);
        setError('');
      })
      .catch((e: unknown) => on && setError(errorMessage(e, 'Could not load visits')))
      .finally(() => on && setLoading(false));
    return () => {
      on = false;
    };
  }, [days]);

  const pageName = (path: string): string => {
    if (PAGE_NAMES[path]) return PAGE_NAMES[path];
    const shelf = path.match(/^\/shop\/([^/]+)/);
    if (shelf) return (state.categories.find((c) => c.id === shelf[1])?.name ?? shelf[1]) + ' shelf';
    const bottle = path.match(/^\/product\/([^/]+)/);
    if (bottle) return products.find((p) => p.id === bottle[1])?.name ?? bottle[1];
    return path;
  };

  const series = stats?.days ?? [];
  const max = Math.max(1, ...series.map((d) => d.visitors));
  const W = 280;
  const H = 90;
  const gap = series.length > 40 ? 1 : 3;
  const bw = series.length ? (W - gap * (series.length - 1)) / series.length : W;
  const mobileShare = stats && stats.range.views > 0 ? Math.round((stats.mobileViews / stats.range.views) * 100) : 0;
  const notInstalled = /visit_stats|schema cache|does not exist/i.test(error);

  return (
    <div style={{ ...adminCard, gap: 16 }}>
      <div style={cardHeader}>
        <span style={cardTitle}>Visits</span>
        <span style={{ display: 'flex', gap: 4, background: 'rgba(243,236,226,.08)', borderRadius: 999, padding: 3 }}>
          {RANGES.map((r) => (
            <Btn
              key={r}
              onClick={() => setDays(r)}
              style={{
                fontSize: 11,
                padding: '4px 10px',
                borderRadius: 999,
                fontFamily: 'inherit',
                background: r === days ? '#c22b45' : 'transparent',
                color: r === days ? '#fff4f5' : 'rgba(243,236,226,.7)',
              }}
              hoverStyle={r === days ? {} : { color: '#f3ece2' }}
            >
              {r} days
            </Btn>
          ))}
        </span>
      </div>

      {error && (
        <span style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.5 }}>
          {notInstalled
            ? 'Visit tracking is not set up yet: run supabase/migrations/0007_visits.sql in the Supabase SQL editor, then reload.'
            : error}
        </span>
      )}

      {!error && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,280px),1fr))', gap: 20, opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={bigNumber}>{stats?.today.visitors ?? '–'}</span>
                <span style={small}>today · {stats?.today.views ?? 0} views</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={bigNumber}>{stats?.week.visitors ?? '–'}</span>
                <span style={small}>7 days · {stats?.week.views ?? 0} views</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={bigNumber}>{stats?.range.visitors ?? '–'}</span>
                <span style={small}>
                  {days} days · {stats?.range.views ?? 0} views
                </span>
              </div>
            </div>

            <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }} role="img" aria-label={`Visitors per day, last ${days} days`}>
              <line x1="0" y1={H - 0.5} x2={W} y2={H - 0.5} stroke="rgba(243,236,226,.15)" />
              {series.map((d, i) => {
                const h = d.visitors > 0 ? Math.max(2, (d.visitors / max) * (H - 8)) : 0;
                const last = i === series.length - 1;
                return (
                  <rect
                    key={d.day}
                    x={i * (bw + gap)}
                    y={H - h}
                    width={bw}
                    height={h}
                    rx={Math.min(2, bw / 2)}
                    fill={last ? '#c22b45' : 'rgba(243,236,226,.55)'}
                  >
                    <title>
                      {shortDay(d.day)}: {d.visitors} visitors, {d.views} views
                    </title>
                  </rect>
                );
              })}
            </svg>
            <div style={{ display: 'flex', justifyContent: 'space-between', ...small }}>
              <span>{series.length ? shortDay(series[0].day) : ''}</span>
              <span>
                {mobileShare}% on phones · {stats?.allTimeViews ?? 0} views all time
              </span>
              <span>{series.length ? 'Today' : ''}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 18, fontSize: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ ...small, marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>Most visited</span>
              {(stats?.topPages ?? []).length === 0 && <span style={{ opacity: 0.6, padding: '6px 0' }}>No visits yet.</span>}
              {(stats?.topPages ?? []).map((p) => (
                <span key={p.path} title={p.path} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', ...rowDivider }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pageName(p.path)}</span>
                  <span style={{ opacity: 0.6, flex: 'none' }}>{p.views}</span>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ ...small, marginBottom: 6, letterSpacing: '.08em', textTransform: 'uppercase' }}>Came from</span>
              {stats && (
                <span style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', ...rowDivider }}>
                  <span>Direct, typed or WhatsApp</span>
                  <span style={{ opacity: 0.6, flex: 'none' }}>{stats.directSessions}</span>
                </span>
              )}
              {(stats?.sources ?? []).map((s) => (
                <span key={s.referrer} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', ...rowDivider }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.referrer}</span>
                  <span style={{ opacity: 0.6, flex: 'none' }}>{s.sessions}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

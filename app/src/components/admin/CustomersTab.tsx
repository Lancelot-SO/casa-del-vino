import { useState } from 'react';
import type { CSSProperties } from 'react';
import { errorMessage, fmtDate } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { rowDivider } from './shared';
import { useAdminData } from './useAdminData';

type Filter = 'active' | 'inactive' | 'all';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'inactive', label: 'Inactive' },
  { id: 'all', label: 'All' },
];

const chip: CSSProperties = {
  fontSize: 11,
  padding: '6px 12px',
  borderRadius: 999,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(243,236,226,.15)',
  fontFamily: 'inherit',
  color: '#f3ece2',
  transition: 'background .2s, border-color .2s',
};

const rowAction: CSSProperties = {
  height: 32,
  padding: '0 12px',
  borderRadius: 10,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'rgba(243,236,226,.2)',
  fontFamily: 'inherit',
  fontSize: 12,
  display: 'flex',
  alignItems: 'center',
  boxSizing: 'border-box',
  whiteSpace: 'nowrap',
};

/**
 * Every account and guest who has bought. A customer is deactivated rather
 * than deleted: the account, its orders and its history stay on file, they
 * just cannot sign in or order until restored.
 */
export function CustomersTab() {
  const { state, setProfileStatus, toast } = useStore();
  const L = useLayout();
  const { customerRows, statCustomers } = useAdminData();
  const [filter, setFilter] = useState<Filter>('active');
  const [busy, setBusy] = useState<string | null>(null);

  const rows = customerRows.filter((c) => filter === 'all' || c.status === filter);
  const inactiveCount = customerRows.filter((c) => c.status === 'inactive').length;

  const deactivate = async (id: string, name: string) => {
    if (!window.confirm(`Deactivate ${name}? They will no longer be able to sign in or order. Their account and order history stay on file, and you can restore them at any time.`)) return;
    setBusy(id);
    try {
      await setProfileStatus(id, 'inactive');
    } catch (e) {
      toast(errorMessage(e, 'Could not deactivate the account'));
    } finally {
      setBusy(null);
    }
  };

  const restore = async (id: string) => {
    setBusy(id);
    try {
      await setProfileStatus(id, 'active');
    } catch (e) {
      toast(errorMessage(e, 'Could not restore the account'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section
      style={{
        background: 'linear-gradient(160deg,#241012,#160a0c)',
        color: '#f3ece2',
        border: '1px solid rgba(243,236,226,.08)',
        borderRadius: 24,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'cdvRise .5s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>Customers · {statCustomers}</span>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTERS.map((f) => (
            <Btn
              key={f.id}
              onClick={() => setFilter(f.id)}
              style={{
                ...chip,
                background: filter === f.id ? 'rgba(194,43,69,.35)' : 'transparent',
                borderColor: filter === f.id ? '#c22b45' : 'rgba(243,236,226,.15)',
              }}
              hoverStyle={{ background: 'rgba(243,236,226,.08)' }}
            >
              {f.label}
              {f.id === 'inactive' && inactiveCount > 0 ? ` · ${inactiveCount}` : ''}
            </Btn>
          ))}
        </div>
      </div>

      {!state.adminLoaded && <span style={{ fontSize: 13, opacity: 0.6 }}>Loading…</span>}
      {state.adminLoaded && customerRows.length === 0 && <span style={{ fontSize: 13, opacity: 0.6 }}>No customers yet.</span>}
      {state.adminLoaded && customerRows.length > 0 && rows.length === 0 && (
        <span style={{ fontSize: 13, opacity: 0.6 }}>{filter === 'inactive' ? 'No deactivated accounts.' : 'No active customers.'}</span>
      )}

      {rows.map((c) => {
        const inactive = c.status === 'inactive';
        return (
          <div
            key={c.key}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', ...rowDivider, fontSize: 13, flexWrap: 'wrap', opacity: inactive ? 0.55 : 1 }}
          >
            <span style={{ width: 38, height: 38, borderRadius: '50%', background: c.role === 'Guest' ? '#4d170e' : inactive ? '#3a2a2c' : '#c22b45', color: '#fff4f5', display: 'grid', placeItems: 'center', fontWeight: 600, flex: 'none' }}>
              {c.initial}
            </span>
            <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 160px', minWidth: 0 }}>
              <span style={{ fontWeight: 600 }}>
                {c.name}
                {inactive && (
                  <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 7px', borderRadius: 999, background: 'rgba(243,236,226,.12)', letterSpacing: '.06em' }}>INACTIVE</span>
                )}
              </span>
              <span style={{ opacity: 0.6, fontSize: 12 }}>
                {c.email}
                {c.place ? ` · ${c.place}` : ''}
              </span>
            </span>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'rgba(243,236,226,.08)' }}>{c.role}</span>
            <span style={{ opacity: 0.7, fontSize: 12 }}>since {fmtDate(c.since)}</span>
            <span style={{ opacity: 0.7 }}>{c.orders} orders</span>
            {c.profileId && (
              <span style={{ marginLeft: 'auto' }}>
                {inactive ? (
                  <Btn
                    onClick={() => void restore(c.profileId!)}
                    disabled={busy === c.profileId}
                    style={{ ...rowAction, background: '#c22b45', color: '#fff4f5', borderColor: 'transparent', opacity: busy === c.profileId ? 0.6 : 1 }}
                    hoverStyle={{ filter: 'brightness(1.12)' }}
                  >
                    Restore
                  </Btn>
                ) : (
                  <Btn
                    onClick={() => void deactivate(c.profileId!, c.name)}
                    disabled={busy === c.profileId}
                    style={{ ...rowAction, opacity: busy === c.profileId ? 0.6 : 1 }}
                    hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}
                  >
                    Deactivate
                  </Btn>
                )}
              </span>
            )}
          </div>
        );
      })}
    </section>
  );
}

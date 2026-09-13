import { useLayout } from '../../store/store';
import { rowDivider } from './shared';
import { useAdminData } from './useAdminData';

export function CustomersTab() {
  const L = useLayout();
  const { customerRows, statCustomers } = useAdminData();

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
      <span style={{ fontSize: 18, fontWeight: 600 }}>Customers · {statCustomers}</span>
      {customerRows.map((c) => (
        <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', ...rowDivider, fontSize: 13 }}>
          <span
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: '#c22b45',
              color: '#fff4f5',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 600,
            }}
          >
            {c.initial}
          </span>
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 600 }}>{c.name}</span>
            <span style={{ opacity: 0.6, fontSize: 12 }}>{c.email}</span>
          </span>
          <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, background: 'rgba(243,236,226,.08)' }}>{c.role}</span>
          <span style={{ opacity: 0.7 }}>{c.orders} orders</span>
        </div>
      ))}
    </section>
  );
}

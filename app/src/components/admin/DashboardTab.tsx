import { STATUS_LABEL } from '../../data/catalog';
import { cdn } from '../../lib/cloudinary';
import { ghs, fmtDate } from '../../lib/format';
import { routes, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { Icon } from '../ui/Icon';
import { adminCard, adminPrimary, cardHeader, cardTitle, rowDivider } from './shared';
import { useAdminData } from './useAdminData';
import { draftFrom } from './ProductForm';

const tile = {
  background: 'rgba(243,236,226,.12)',
  borderRadius: 16,
  padding: '14px 10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
} as const;

const tileNumber = { fontFamily: "'Cormorant Garamond',serif", fontSize: 30, lineHeight: 1 } as const;

export function DashboardTab() {
  const { products, set, go } = useStore();
  const d = useAdminData();
  const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <>
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,260px),1fr))',
          gap: 16,
          animation: 'cdvRise .5s cubic-bezier(.2,.8,.2,1) both',
        }}
      >
        <div
          style={{
            background: 'linear-gradient(160deg,#6e0f20,#2a0a10)',
            color: '#f3ece2',
            borderRadius: 24,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            border: '1px solid rgba(243,236,226,.08)',
          }}
        >
          <div style={cardHeader}>
            <span style={cardTitle}>Overall information</span>
            <span style={{ fontSize: 11, opacity: 0.7 }}>{d.statOpen} open</span>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, lineHeight: 1 }}>{d.statOrders}</span>
              <span style={{ fontSize: 11, opacity: 0.6, lineHeight: 1.3 }}>
                orders
                <br />
                all time
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 52, lineHeight: 1 }}>{d.statRevenue}</span>
              <span style={{ fontSize: 11, opacity: 0.6, lineHeight: 1.3 }}>
                ordered
                <br />
                {d.statPaid} paid
              </span>
            </div>
          </div>
          <div style={{ height: 3, background: 'rgba(243,236,226,.12)', borderRadius: 2 }} title="Share of revenue already paid">
            <div style={{ height: '100%', width: d.statBar, background: '#c22b45', borderRadius: 2, transition: 'width .6s' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 10 }}>
            <div
              style={{
                background: 'linear-gradient(160deg,#241012,#160a0c)',
                color: '#f3ece2',
                border: '1px solid rgba(243,236,226,.08)',
                borderRadius: 16,
                padding: '14px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span style={tileNumber}>{products.length}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>Bottles</span>
            </div>
            <div style={tile}>
              <span style={tileNumber}>{d.statCategories}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>Shelves live</span>
            </div>
            <div style={tile}>
              <span style={tileNumber}>{d.statCustomers}</span>
              <span style={{ fontSize: 10, opacity: 0.7 }}>Customers</span>
            </div>
          </div>
        </div>

        <div style={adminCard}>
          <div style={cardHeader}>
            <span style={cardTitle}>Weekly sales</span>
            <span style={{ fontSize: 11, padding: '4px 8px', borderRadius: 999, background: '#c22b45', color: '#fff4f5' }}>{d.chart.delta}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, opacity: 0.7 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f3ece2' }} />
              This week · {ghs(d.chart.sumThisWeek)}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(243,236,226,.35)' }} />
              Last week
            </span>
          </div>
          <svg viewBox="0 0 280 120" width="100%" style={{ display: 'block', overflow: 'visible' }}>
            <g stroke="rgba(243,236,226,.12)" strokeWidth="1">
              <line x1="0" y1="30" x2="280" y2="30" />
              <line x1="0" y1="60" x2="280" y2="60" />
              <line x1="0" y1="90" x2="280" y2="90" />
            </g>
            <path d={d.chart.lastPath} fill="none" stroke="rgba(243,236,226,.35)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d={d.chart.areaPath} fill="rgba(194,43,69,.12)" />
            <path d={d.chart.thisPath} fill="none" stroke="#f3ece2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={d.chart.peakX} cy={d.chart.peakY} r="4" fill="#c22b45" />
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, opacity: 0.6, padding: '0 2px' }}>
            {DAYS.map((day, i) =>
              i === d.chart.todayIdx ? (
                <span
                  key={i}
                  style={{ background: '#c22b45', color: '#fff4f5', borderRadius: '50%', width: 20, height: 20, display: 'grid', placeItems: 'center', opacity: 1, margin: '-4px 0' }}
                >
                  {day}
                </span>
              ) : (
                <span key={i}>{day}</span>
              ),
            )}
          </div>
        </div>

        <div style={adminCard}>
          <div style={cardHeader}>
            <span style={cardTitle}>Cellar by shelf</span>
            <Icon>
              <path d="M21.21 15.89A10 10 0 1 1 8 2.83M22 12A10 10 0 0 0 12 2v10z" />
            </Icon>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, flex: '1 1 120px' }}>
              {d.live.map((r) => (
                <span key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: r.color }} />
                  {r.label}
                  <span style={{ marginLeft: 'auto', opacity: 0.6 }}>{r.count}</span>
                </span>
              ))}
              {d.lowStock.length > 0 && (
                <span style={{ marginTop: 6, fontSize: 11, color: '#e0526b' }}>
                  Low stock: {d.lowStock.map((p) => `${p.name} (${p.stock})`).join(', ')}
                </span>
              )}
            </div>
            <svg viewBox="0 0 120 120" width="130" height="130" style={{ flex: 'none' }}>
              <circle cx="60" cy="60" r="46" fill="none" stroke="rgba(243,236,226,.1)" strokeWidth="12" />
              {d.ringArcs.map((a, i) => (
                <circle key={i} cx="60" cy="60" r="46" fill="none" stroke={a.color} strokeWidth="12" strokeDasharray={a.dash} strokeDashoffset={a.offset} transform="rotate(-90 60 60)" strokeLinecap="butt" />
              ))}
              <text x="60" y="58" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="26" fill="#f3ece2">
                {products.length}
              </text>
              <text x="60" y="74" textAnchor="middle" fontSize="9" fill="rgba(243,236,226,.6)">
                bottles
              </text>
            </svg>
          </div>
          <Btn onClick={() => go(routes.admin('products'))} style={adminPrimary} hoverStyle={{ filter: 'brightness(1.12)' }}>
            Manage products
            <Icon size={14} strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </Icon>
          </Btn>
        </div>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))',
          gap: 16,
          animation: 'cdvRise .5s cubic-bezier(.2,.8,.2,1) .1s both',
        }}
      >
        <div style={{ ...adminCard, gap: 12 }}>
          <div style={cardHeader}>
            <span style={cardTitle}>Recent orders</span>
            <Btn onClick={() => go(routes.admin('orders'))} style={{ fontSize: 12, opacity: 0.7 }} hoverStyle={{ color: '#c22b45', opacity: 1 }}>
              Open all ›
            </Btn>
          </div>
          {d.recentOrders.length === 0 && (
            <span style={{ fontSize: 13, opacity: 0.6, padding: '8px 0' }}>No orders yet. They will appear here as customers check out.</span>
          )}
          {d.recentOrders.map((o) => (
            <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '10px 0', ...rowDivider, fontSize: 13 }}>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span>
                  {o.no} <span style={{ fontSize: 11, opacity: 0.6 }}>· {STATUS_LABEL[o.status]}</span>
                </span>
                <span style={{ fontSize: 11, opacity: 0.6 }}>
                  {o.customer} · {o.count} bottles · {fmtDate(o.date)}
                </span>
              </span>
              <span style={{ fontWeight: 600 }}>{ghs(o.total)}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ ...cardTitle, padding: '0 4px' }}>Latest bottles</span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            {d.latestProducts.map((p) => (
              <Btn
                key={p.id}
                onClick={() => set({ adminEdit: draftFrom(p) })}
                style={{
                  background: 'linear-gradient(160deg,#6e0f20,#2a0a10)',
                  color: '#f3ece2',
                  borderRadius: 20,
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  border: '1px solid rgba(243,236,226,.08)',
                  fontFamily: 'inherit',
                  transition: 'transform .25s',
                  boxSizing: 'border-box',
                }}
                hoverStyle={{ transform: 'translateY(-3px)' }}
              >
                <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.2 }}>{p.name}</span>
                  <span style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flex: 'none' }}>
                    <img src={cdn(p.img, 80)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </span>
                </span>
                <span style={{ fontSize: 11, opacity: 0.6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#c22b45' }} />
                  {p.category} · {ghs(p.price)} · {p.stock} in stock
                </span>
              </Btn>
            ))}
            <Btn
              onClick={() => set({ adminEdit: draftFrom(null) })}
              style={{
                borderRadius: 20,
                padding: 16,
                minHeight: 88,
                border: '1px dashed rgba(243,236,226,.35)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'inherit',
                fontSize: 13,
                opacity: 0.8,
                boxSizing: 'border-box',
              }}
              hoverStyle={{ borderColor: '#c22b45', opacity: 1 }}
            >
              + Add bottle
            </Btn>
          </div>
        </div>
      </section>
    </>
  );
}

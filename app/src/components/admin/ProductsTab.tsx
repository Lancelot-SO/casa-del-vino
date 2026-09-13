import { eur } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { adminGhost, adminPrimary, rowDivider } from './shared';
import { draftFrom } from './ProductForm';

export function ProductsTab() {
  const { state, set, products, saveProducts, resetCatalog, logActivity } = useStore();
  const L = useLayout();
  const q = state.adminQuery.trim().toLowerCase();
  const rows = products.filter((p) => !q || (p.name + ' ' + p.category + ' ' + p.country).toLowerCase().includes(q));

  const remove = (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from the cellar?`)) return;
    logActivity('product-removed', name, id);
    saveProducts(products.filter((x) => x.id !== id));
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
        <span style={{ fontSize: 18, fontWeight: 600 }}>Products · {products.length}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn
            onClick={() => {
              if (window.confirm('Restore the original five bottles? Your edits will be lost.')) resetCatalog();
            }}
            style={adminGhost}
            hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}
          >
            Restore defaults
          </Btn>
          <Btn onClick={() => set({ adminEdit: draftFrom(null) })} style={adminPrimary} hoverStyle={{ filter: 'brightness(1.12)' }}>
            + Add bottle
          </Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.map((p) => (
          <div
            key={p.id}
            style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px', padding: '12px 0', ...rowDivider }}
          >
            <div style={{ width: 48, height: 56, borderRadius: 12, overflow: 'hidden', background: '#0f0708', flex: 'none' }}>
              <img src={p.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 180px', minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                {p.category} · {p.country} · {p.abv} · {p.size}
              </span>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 64 }}>{eur(p.price)}</span>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <Btn
                onClick={() => set({ adminEdit: draftFrom(p) })}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 10,
                  background: '#c22b45',
                  color: '#fff4f5',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                }}
                hoverStyle={{ filter: 'brightness(1.12)' }}
              >
                Edit
              </Btn>
              <Btn
                onClick={() => remove(p.id, p.name)}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 10,
                  border: '1px solid rgba(243,236,226,.2)',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  boxSizing: 'border-box',
                }}
                hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}
              >
                Remove
              </Btn>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

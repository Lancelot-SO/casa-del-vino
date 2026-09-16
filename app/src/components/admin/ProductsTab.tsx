import { useCallback, useState } from 'react';
import * as api from '../../lib/api';
import { cdn } from '../../lib/cloudinary';
import { errorMessage, ghs } from '../../lib/format';
import { matchesQuery } from '../../store/selectors';
import { useLayout, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { Icon } from '../ui/Icon';
import { adminPrimary, rowDivider } from './shared';
import { CashSaleDialog } from './CashSaleDialog';
import { draftFrom } from './ProductForm';

export function ProductsTab() {
  const { state, set, products, reloadCatalog, logActivity, toast } = useStore();
  const L = useLayout();
  /** The bottle whose cash sale is being entered, by id, so the row stays live while the dialog is open. */
  const [cashFor, setCashFor] = useState<string | null>(null);
  const cashProduct = cashFor ? products.find((p) => p.id === cashFor) || null : null;
  const closeCash = useCallback(() => setCashFor(null), []);
  const q = state.adminQuery.trim();
  const shelf = state.adminShelf;
  const rows = products.filter((p) => (!shelf || p.categoryId === shelf) && matchesQuery(p, q));
  const shelfName = shelf ? state.categories.find((c) => c.id === shelf)?.name : null;

  const remove = async (id: string, name: string) => {
    if (!window.confirm(`Remove "${name}" from the cellar? Past orders keep their record.`)) return;
    try {
      await api.deleteProduct(id);
      await logActivity('product-removed', name, id);
      await reloadCatalog();
      toast('Removed');
    } catch (e) {
      toast(errorMessage(e, 'Could not remove the bottle'));
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 18, fontWeight: 600 }}>Products · {shelf ? rows.length : products.length}</span>
          {shelf && (
            <Btn
              onClick={() => set({ adminShelf: null })}
              aria-label="Show every shelf"
              title="Show every shelf"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                height: 28,
                padding: '0 6px 0 12px',
                borderRadius: 999,
                background: 'rgba(194,43,69,.25)',
                border: '1px solid rgba(194,43,69,.45)',
                color: '#f3ece2',
                fontFamily: 'inherit',
                fontSize: 12,
                boxSizing: 'border-box',
              }}
              hoverStyle={{ background: 'rgba(194,43,69,.4)' }}
            >
              {shelfName || 'Shelf'}
              <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(243,236,226,.12)', fontSize: 11, lineHeight: 1 }}>×</span>
            </Btn>
          )}
        </span>
        <Btn onClick={() => set({ adminEdit: draftFrom(null) })} style={adminPrimary} hoverStyle={{ filter: 'brightness(1.12)' }}>
          + Add bottle
        </Btn>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {rows.length === 0 && <span style={{ fontSize: 13, opacity: 0.6, padding: '8px 0' }}>No bottles match.</span>}
        {rows.map((p) => (
          <div key={p.id} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 16px', padding: '12px 0', ...rowDivider, opacity: p.active ? 1 : 0.55 }}>
            <div style={{ width: 48, height: 56, borderRadius: 12, overflow: 'hidden', background: '#0f0708', flex: 'none' }}>
              <img src={cdn(p.img, 120)} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 180px', minWidth: 0 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>
                {p.name}
                {!p.active && <span style={{ fontSize: 10, marginLeft: 8, padding: '2px 7px', borderRadius: 999, background: 'rgba(243,236,226,.12)' }}>HIDDEN</span>}
              </span>
              <span style={{ fontSize: 12, opacity: 0.6 }}>
                {p.category} · {p.country} · {p.abv} · {p.size}
              </span>
            </div>
            <span style={{ fontSize: 12, minWidth: 70, color: p.stock <= 0 ? '#e0526b' : p.stock <= 5 ? '#d9b27a' : 'inherit' }}>
              {p.stock <= 0 ? 'Sold out' : `${p.stock} in stock`}
            </span>
            <span style={{ fontSize: 14, fontWeight: 600, minWidth: 64 }}>{ghs(p.price)}</span>
            <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
              <Btn
                onClick={() => setCashFor(p.id)}
                disabled={p.stock <= 0}
                title={p.stock <= 0 ? 'Nothing left to sell' : 'Paid in cash: take bottles out of stock'}
                style={{
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 10,
                  background: 'rgba(217,178,122,.16)',
                  border: '1px solid rgba(217,178,122,.45)',
                  color: '#d9b27a',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxSizing: 'border-box',
                  opacity: p.stock <= 0 ? 0.4 : 1,
                  cursor: p.stock <= 0 ? 'default' : 'pointer',
                }}
                hoverStyle={p.stock <= 0 ? undefined : { background: 'rgba(217,178,122,.3)' }}
              >
                <Icon size={13} strokeWidth={2}>
                  <path d="M2 7h20v10H2zM12 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6ZM5 12h.01M19 12h.01" />
                </Icon>
                Cash
              </Btn>
              <Btn
                onClick={() => set({ adminEdit: draftFrom(p) })}
                style={{ height: 34, padding: '0 14px', borderRadius: 10, background: '#c22b45', color: '#fff4f5', fontFamily: 'inherit', fontSize: 12, display: 'flex', alignItems: 'center' }}
                hoverStyle={{ filter: 'brightness(1.12)' }}
              >
                Edit
              </Btn>
              <Btn
                onClick={() => void remove(p.id, p.name)}
                style={{ height: 34, padding: '0 14px', borderRadius: 10, border: '1px solid rgba(243,236,226,.2)', fontFamily: 'inherit', fontSize: 12, display: 'flex', alignItems: 'center', boxSizing: 'border-box' }}
                hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}
              >
                Remove
              </Btn>
            </div>
          </div>
        ))}
      </div>

      {cashProduct && <CashSaleDialog product={cashProduct} onClose={closeCash} />}
    </section>
  );
}

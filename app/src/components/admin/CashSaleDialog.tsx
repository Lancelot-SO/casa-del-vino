import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import * as api from '../../lib/api';
import { cdn } from '../../lib/cloudinary';
import { errorMessage, ghs } from '../../lib/format';
import { useStore } from '../../store/store';
import { Btn, Input } from '../ui/Hoverable';
import { Icon } from '../ui/Icon';
import { adminField, adminGhost, adminLabel, adminPrimary, focusRed } from './shared';
import type { Product } from '../../types';

interface Props {
  product: Product;
  onClose: () => void;
}

/** Today's date in the admin's own time zone, as the date input wants it (YYYY-MM-DD). */
function todayISO(): string {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
}

/**
 * When the cash was taken. Today means "right now"; an earlier day is stamped
 * at noon local time so it lands on that day in every report.
 */
function soldAtFor(date: string): string | undefined {
  if (date === todayISO()) return undefined;
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0).toISOString();
}

/**
 * "Paid in cash": the admin says how many bottles left the counter and
 * confirms; the shop's stock drops by that many at once.
 */
export function CashSaleDialog({ product, onClose }: Props) {
  const { reloadCatalog, loadAdminData, toast } = useStore();
  const [qtyText, setQtyText] = useState('1');
  const [date, setDate] = useState(todayISO);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const qty = parseInt(qtyText, 10) || 0;
  const today = todayISO();
  const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today;
  const valid = qty >= 1 && qty <= product.stock && dateOk;
  const remaining = product.stock - qty;

  // Land in the quantity box with "1" selected, so typing a number replaces it.
  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const step = (d: number) => {
    setError('');
    setQtyText(String(Math.min(product.stock, Math.max(1, qty + d))));
  };

  const confirm = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (qty < 1) return setError('Enter how many bottles were sold.');
    if (qty > product.stock) return setError(`Only ${product.stock} in stock.`);
    if (!dateOk) return setError('Pick the day the cash was taken (today or earlier).');
    setBusy(true);
    setError('');
    try {
      const sale = await api.recordCashSale(product.id, qty, soldAtFor(date));
      // Stock for the shop, plus the new order for the Orders tab, revenue and the bell.
      await Promise.all([reloadCatalog(), loadAdminData()]);
      toast(`Cash sale ${sale.orderNo} · ${ghs(sale.total)} · ${sale.stock} left`);
      onClose();
    } catch (err) {
      setBusy(false);
      setError(errorMessage(err, 'Could not record the sale'));
    }
  };

  const stepBtn = (label: string, d: number, disabled: boolean) => (
    <Btn
      onClick={() => step(d)}
      disabled={disabled}
      aria-label={d > 0 ? 'One more' : 'One fewer'}
      style={{
        width: 44,
        height: 44,
        flex: 'none',
        borderRadius: 12,
        border: '1px solid rgba(243,236,226,.2)',
        display: 'grid',
        placeItems: 'center',
        fontSize: 20,
        lineHeight: 1,
        boxSizing: 'border-box',
        opacity: disabled ? 0.35 : 1,
        cursor: disabled ? 'default' : 'pointer',
      }}
      hoverStyle={disabled ? undefined : { borderColor: '#c22b45', color: '#c22b45' }}
    >
      {label}
    </Btn>
  );

  return (
    <div
      onClick={() => !busy && onClose()}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(10,4,5,.72)',
        backdropFilter: 'blur(6px)',
        display: 'grid',
        placeItems: 'center',
        padding: 16,
      }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="cash-sale-title"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => void confirm(e)}
        style={{
          width: 'min(100%, 420px)',
          background: 'linear-gradient(160deg,#241012,#160a0c)',
          color: '#f3ece2',
          border: '1px solid rgba(243,236,226,.1)',
          borderRadius: 24,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          boxShadow: '0 30px 80px rgba(0,0,0,.6)',
          animation: 'cdvRise .35s cubic-bezier(.2,.8,.2,1) both',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#d9b27a' }}>Paid in cash</span>
            <h2 id="cash-sale-title" style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 28, margin: 0, lineHeight: 1.05 }}>
              How many were sold?
            </h2>
          </div>
          <Btn
            onClick={onClose}
            aria-label="Close"
            style={{ width: 32, height: 32, borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'rgba(243,236,226,.08)', flex: 'none' }}
            hoverStyle={{ background: 'rgba(194,43,69,.6)' }}
          >
            <Icon size={14} strokeWidth={2.2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </Icon>
          </Btn>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, background: 'rgba(243,236,226,.05)' }}>
          <div style={{ width: 48, height: 56, borderRadius: 12, overflow: 'hidden', background: '#0f0708', flex: 'none' }}>
            <img src={cdn(product.img, 120)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{product.name}</span>
            <span style={{ fontSize: 12, opacity: 0.6 }}>
              {ghs(product.price)} · {product.stock} in stock
            </span>
          </div>
        </div>

        <label style={adminLabel}>
          Bottles sold
          <span style={{ display: 'flex', gap: 8 }}>
            {stepBtn('−', -1, busy || qty <= 1)}
            <Input
              ref={inputRef}
              name="qty"
              type="number"
              inputMode="numeric"
              min={1}
              max={product.stock}
              value={qtyText}
              disabled={busy}
              onChange={(e) => {
                setError('');
                setQtyText(e.target.value);
              }}
              style={{ ...adminField, textAlign: 'center', fontSize: 18, fontWeight: 600 }}
              focusStyle={focusRed}
            />
            {stepBtn('+', 1, busy || qty >= product.stock)}
          </span>
        </label>

        <label style={adminLabel}>
          Date the cash was taken
          <Input
            name="soldOn"
            type="date"
            max={today}
            value={date}
            disabled={busy}
            onChange={(e) => {
              setError('');
              setDate(e.target.value);
            }}
            style={{ ...adminField, colorScheme: 'dark' }}
            focusStyle={focusRed}
          />
        </label>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'rgba(243,236,226,.6)', minHeight: 16 }}>
          {error ? (
            <span style={{ color: '#e0526b' }}>{error}</span>
          ) : valid ? (
            <>
              <span>
                Stock goes from {product.stock} to {remaining}
                {remaining === 0 ? ' · the shop will show it as sold out' : ''}.
              </span>
              <span>
                Recorded as a paid order of <b style={{ color: '#f3ece2' }}>{ghs(product.price * qty)}</b>, tagged cash, dated{' '}
                {date === today ? 'today' : date}. It counts in revenue and shows in Orders.
              </span>
            </>
          ) : !dateOk ? (
            <span>Pick the day the cash was taken (today or earlier).</span>
          ) : (
            <span>Enter a number from 1 to {product.stock}.</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <Btn onClick={onClose} disabled={busy} style={adminGhost} hoverStyle={{ borderColor: '#c22b45', color: '#c22b45' }}>
            Cancel
          </Btn>
          <Btn
            type="submit"
            disabled={busy || !valid}
            style={{ ...adminPrimary, opacity: busy || !valid ? 0.55 : 1, cursor: busy || !valid ? 'default' : 'pointer' }}
            hoverStyle={busy || !valid ? undefined : { filter: 'brightness(1.12)' }}
          >
            {busy ? 'Updating stock…' : `Confirm · ${qty || 0} sold`}
          </Btn>
        </div>
      </form>
    </div>
  );
}

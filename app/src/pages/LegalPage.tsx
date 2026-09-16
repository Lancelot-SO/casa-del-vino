import { ghs } from '../lib/format';
import { useLayout, useStore } from '../store/store';

/**
 * Terms, privacy, cookies and returns. The copy below is a starting point
 * marked [REPLACE]; have it checked before launch — alcohol sales in Ghana
 * carry specific obligations.
 */
export function LegalPage() {
  const { settings } = useStore();
  const L = useLayout();

  const h2 = { fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 28, margin: '18px 0 0', lineHeight: 1.1 } as const;
  const p = { margin: 0, fontSize: 14, lineHeight: 1.75, opacity: 0.8, maxWidth: '70ch', textWrap: 'pretty' } as const;

  return (
    <section
      style={{
        background: '#1a1817',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 12, color: '#c22b45' }}>The small print</span>
      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(32px,4vw,46px)', margin: 0, lineHeight: 1.05 }}>
        Terms, privacy & returns
      </h1>
      <p style={p}>
        Casa del Vino is operated by <b>[REPLACE: legal company name, CIF/NIF, registered address]</b>. Contact:{' '}
        {settings.email}, {settings.phone}.
      </p>

      <h2 style={h2}>Who can buy</h2>
      <p style={p}>
        We sell alcoholic drinks and only to people of legal drinking age (18 in Spain). By ordering you confirm you are
        18 or over, and an adult must be present to receive a delivery. Couriers may ask for ID.
      </p>

      <h2 style={h2}>Prices, payment and delivery</h2>
      <p style={p}>
        Prices are in Ghana cedis (GH₵). We accept MTN Mobile Money and Telecel Cash, or you can call us to arrange
        payment. Standard delivery is free on orders over {ghs(settings.freeShip)}. We currently deliver within{' '}
        <b>[REPLACE: delivery area]</b>. Estimated times are shown at checkout and are not guaranteed.
      </p>

      <h2 style={h2}>Returns and withdrawal</h2>
      <p style={p}>
        Under EU consumer law you may withdraw from an online purchase within 14 days of delivery, provided the bottles are
        unopened and in their original condition. Email {settings.email} with your order number and we will arrange
        collection or a return address. Refunds are made to the original payment method within 14 days of receiving the
        goods. Damaged or wrong items are replaced or refunded in full, including delivery.
      </p>

      <h2 style={h2}>Privacy</h2>
      <p style={p}>
        We store the details you give us (name, email, phone, delivery address) and your order history so we can fulfil
        orders and support you. Data is held on Supabase (EU region: <b>[REPLACE: confirm region]</b>) and card payments
        are processed by Stripe; we never see your card number. You can ask to see, correct or delete your data at{' '}
        {settings.email}. Data controller: <b>[REPLACE]</b>.
      </p>

      <h2 style={h2}>Cookies</h2>
      <p style={p}>
        The shop uses only strictly necessary storage: your sign-in session, your bag and wishlist as a guest, and your
        answer to the age check. We also count visits with an anonymous random id kept in your browser, so we know how
        many people open the shop and which pages they look at; it is not linked to your name, account or address, and
        we do not record IP addresses. No advertising cookies are set.
      </p>

      <h2 style={h2}>Responsible drinking</h2>
      <p style={p}>Enjoy wine in moderation. Do not drink if you are pregnant or about to drive.</p>
    </section>
  );
}

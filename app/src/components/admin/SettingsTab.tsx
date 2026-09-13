import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { errorMessage } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { Input } from '../ui/Hoverable';
import { adminField, adminLabel, adminPrimary, focusRed } from './shared';

/** The contact details and delivery prices the shop reads. */
export function SettingsTab() {
  const { settings, saveSettings, toast } = useStore();
  const L = useLayout();
  const [form, setForm] = useState({
    email: settings.email,
    phone: settings.phone,
    hours: settings.hours,
    address: settings.address,
    freeShip: String(settings.freeShip),
    standardShip: String(settings.standardShip),
    expressShip: String(settings.expressShip),
    momoNumber: settings.momoNumber,
    momoName: settings.momoName,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      email: settings.email,
      phone: settings.phone,
      hours: settings.hours,
      address: settings.address,
      freeShip: String(settings.freeShip),
      standardShip: String(settings.standardShip),
      expressShip: String(settings.expressShip),
    momoNumber: settings.momoNumber,
    momoName: settings.momoName,
    });
  }, [settings]);

  const num = (s: string) => parseFloat(s.replace(',', '.')) || 0;
  const field = (name: keyof typeof form) => ({
    name,
    value: form[name],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [name]: e.target.value }),
    style: adminField,
    focusStyle: focusRed,
  });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await saveSettings({
        email: form.email.trim(),
        phone: form.phone.trim(),
        hours: form.hours.trim(),
        address: form.address.trim(),
        freeShip: num(form.freeShip),
        standardShip: num(form.standardShip),
        expressShip: num(form.expressShip),
        momoNumber: form.momoNumber.trim(),
        momoName: form.momoName.trim(),
      });
    } catch (err) {
      toast(errorMessage(err, 'Could not save'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      style={{
        background: 'linear-gradient(160deg,#241012,#160a0c)',
        color: '#f3ece2',
        border: '1px solid rgba(243,236,226,.08)',
        borderRadius: 24,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxWidth: 640,
        animation: 'cdvRise .5s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 600 }}>Website details</span>
      <span style={{ fontSize: 12, opacity: 0.65 }}>Shown on the Contact page, the legal page and at checkout.</span>

      <label style={adminLabel}>
        Contact email
        <Input type="email" {...field('email')} />
      </label>
      <label style={adminLabel}>
        Phone / WhatsApp
        <Input {...field('phone')} />
      </label>
      <label style={adminLabel}>
        Opening hours
        <Input {...field('hours')} />
      </label>
      <label style={adminLabel}>
        Address
        <Input {...field('address')} />
      </label>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12 }}>
        <label style={adminLabel}>
          Free shipping from (GH₵)
          <Input inputMode="decimal" {...field('freeShip')} />
        </label>
        <label style={adminLabel}>
          Standard delivery (GH₵)
          <Input inputMode="decimal" {...field('standardShip')} />
        </label>
        <label style={adminLabel}>
          Express delivery (GH₵)
          <Input inputMode="decimal" {...field('expressShip')} />
        </label>
      </div>
      <span style={{ fontSize: 16, fontWeight: 600, marginTop: 10 }}>Mobile money</span>
      <span style={{ fontSize: 12, opacity: 0.65 }}>
        Shown at checkout. Customers send MTN Mobile Money or Telecel Cash to this number and check the name before
        sending; the product name is their payment reference.
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: 12 }}>
        <label style={adminLabel}>
          MoMo number
          <Input inputMode="tel" placeholder="024 000 0000" {...field('momoNumber')} />
        </label>
        <label style={adminLabel}>
          Account name
          <Input placeholder="Felix Sowah" {...field('momoName')} />
        </label>
      </div>
      <button type="submit" disabled={busy} style={{ all: 'unset', cursor: 'pointer', ...adminPrimary, opacity: busy ? 0.6 : 1 }}>
        {busy ? 'Saving…' : 'Save details'}
      </button>
    </form>
  );
}

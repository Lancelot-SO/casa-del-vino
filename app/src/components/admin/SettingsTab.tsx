import type { ChangeEvent, FormEvent } from 'react';
import { useLayout, useStore } from '../../store/store';
import { Input } from '../ui/Hoverable';
import { adminField, adminLabel, adminPrimary, focusRed } from './shared';
import type { Settings } from '../../types';

/** The contact details and free-shipping threshold the shop reads. */
export function SettingsTab() {
  const { settings, set, saveSettings } = useStore();
  const L = useLayout();

  const setSetting = (name: keyof Settings) => (e: ChangeEvent<HTMLInputElement>) =>
    set((s) => ({ settings: { ...s.settings, [name]: e.target.value } }));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    saveSettings();
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
      <span style={{ fontSize: 12, opacity: 0.65 }}>Shown on the Contact page and in order confirmations.</span>

      <label style={adminLabel}>
        Contact email
        <Input name="email" value={settings.email} onChange={setSetting('email')} style={adminField} focusStyle={focusRed} />
      </label>
      <label style={adminLabel}>
        Phone / WhatsApp
        <Input name="phone" value={settings.phone} onChange={setSetting('phone')} style={adminField} focusStyle={focusRed} />
      </label>
      <label style={adminLabel}>
        Opening hours
        <Input name="hours" value={settings.hours} onChange={setSetting('hours')} style={adminField} focusStyle={focusRed} />
      </label>
      <label style={adminLabel}>
        Address
        <Input name="address" value={settings.address} onChange={setSetting('address')} style={adminField} focusStyle={focusRed} />
      </label>
      <label style={adminLabel}>
        Free-shipping threshold (€)
        <Input
          name="freeShip"
          value={settings.freeShip}
          onChange={setSetting('freeShip')}
          inputMode="decimal"
          style={adminField}
          focusStyle={focusRed}
        />
      </label>
      <button type="submit" style={{ all: 'unset', cursor: 'pointer', ...adminPrimary }}>
        Save details
      </button>
    </form>
  );
}

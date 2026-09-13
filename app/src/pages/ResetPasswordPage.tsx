import { useState } from 'react';
import type { CSSProperties, FormEvent } from 'react';
import { errorMessage } from '../lib/format';
import { routes, useLayout, useStore } from '../store/store';
import { Input } from '../components/ui/Hoverable';

const field: CSSProperties = {
  height: 46,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  borderRadius: 12,
  background: '#262322',
  border: '1px solid rgba(243,236,226,.08)',
  padding: '0 14px',
  color: '#f3ece2',
  font: 'inherit',
  fontSize: 14,
  outline: 0,
};

/** Landing page of the password-reset email: choose a new password. */
export function ResetPasswordPage() {
  const { state, go, toast, updatePassword } = useStore();
  const L = useLayout();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setError('Use at least 6 characters.');
    if (pw !== pw2) return setError('The two passwords do not match.');
    setBusy(true);
    setError('');
    try {
      await updatePassword(pw);
      toast('Password updated');
      go(routes.account, { replace: true });
    } catch (err) {
      setError(errorMessage(err, 'Could not update the password'));
    } finally {
      setBusy(false);
    }
  };

  const signedIn = !!state.user && state.user.role !== 'guest';

  return (
    <section
      style={{
        background: '#1a1817',
        borderRadius: L.radiusLg,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        maxWidth: 520,
        animation: 'cdvRise .7s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 12, color: '#c22b45' }}>Account</span>
      <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(32px,4vw,46px)', margin: 0, lineHeight: 1.05 }}>
        Choose a new password
      </h1>
      {!signedIn && state.authReady && (
        <p style={{ margin: 0, fontSize: 14, opacity: 0.75, lineHeight: 1.6 }}>
          Open this page from the link in your reset email. If the link has expired, request a new one from the sign-in
          screen.
        </p>
      )}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, opacity: 0.85 }}>
          New password
          <Input required type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} style={field} focusStyle={{ borderColor: '#c22b45' }} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, opacity: 0.85 }}>
          Repeat it
          <Input required type="password" autoComplete="new-password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={field} focusStyle={{ borderColor: '#c22b45' }} />
        </label>
        {error && <span style={{ fontSize: 12, color: '#e0526b' }}>{error}</span>}
        <button
          type="submit"
          disabled={busy || !signedIn}
          style={{
            all: 'unset',
            cursor: 'pointer',
            height: 50,
            borderRadius: 14,
            background: 'linear-gradient(180deg,#b8233d,#6e0f20)',
            color: '#fff4f5',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: busy || !signedIn ? 0.5 : 1,
          }}
        >
          {busy ? 'Saving…' : 'Save password'}
        </button>
      </form>
    </section>
  );
}

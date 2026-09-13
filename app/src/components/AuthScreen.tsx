import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useStore } from '../store/store';
import { Btn, Input } from './ui/Hoverable';
import { Icon } from './ui/Icon';

const authField: CSSProperties = {
  height: 48,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  borderRadius: 12,
  background: 'rgba(243,236,226,.04)',
  border: '1px solid rgba(243,236,226,.12)',
  padding: '0 14px 0 42px',
  color: '#f3ece2',
  font: 'inherit',
  fontSize: 14,
  outline: 0,
};
const authFocus: CSSProperties = { borderColor: '#c22b45', background: 'rgba(194,43,69,.06)' };
const authLabel: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12, color: 'rgba(243,236,226,.75)' };
const leadIcon: CSSProperties = {
  position: 'absolute',
  left: 14,
  top: '50%',
  transform: 'translateY(-50%)',
  color: 'rgba(243,236,226,.45)',
  display: 'flex',
};
const submit: CSSProperties = {
  height: 52,
  borderRadius: 12,
  background: 'linear-gradient(180deg,#c22b45,#7e1424)',
  color: '#fff4f5',
  fontFamily: 'inherit',
  fontSize: 14,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  position: 'relative',
  boxShadow: '0 10px 30px rgba(194,43,69,.35)',
  transition: 'transform .2s, box-shadow .2s',
};
const social: CSSProperties = {
  height: 48,
  borderRadius: 12,
  background: 'rgba(243,236,226,.04)',
  border: '1px solid rgba(243,236,226,.12)',
  color: '#f3ece2',
  fontFamily: 'inherit',
  fontSize: 13,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  boxSizing: 'border-box',
};

function Field({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <label style={authLabel}>
      {label}
      <span style={{ position: 'relative', display: 'block' }}>
        <span style={leadIcon}>{icon}</span>
        {children}
      </span>
    </label>
  );
}

/**
 * The full-screen sign-in: a blurred bottle with the tagline on one side,
 * a glass card with the form on the other. Backed by Supabase Auth.
 */
export function AuthScreen() {
  const { state, set, signInWithPassword, signUp, signInWithGoogle, requestPasswordReset, continueAsGuest } = useStore();
  const { authOpen, authMode, authForm, authError, authNotice, authBusy, showPw } = state;

  if (!authOpen) return null;

  const isSignin = authMode === 'signin';
  const setAuth = (name: string, value: string) =>
    set((s) => ({ authForm: { ...s.authForm, [name]: value }, authError: '' }));

  const submitSignin = (e: FormEvent) => {
    e.preventDefault();
    void signInWithPassword(authForm.email || '', authForm.password || '');
  };

  const submitSignup = (e: FormEvent) => {
    e.preventDefault();
    if ((authForm.password || '').length < 6) {
      set({ authError: 'Password needs at least 6 characters.' });
      return;
    }
    void signUp(authForm.name || '', authForm.email || '', authForm.password || '');
  };

  const pwType = showPw ? 'text' : 'password';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 65,
        background: '#050202',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))',
        overflow: 'auto',
      }}
    >
      <div style={{ position: 'relative', minHeight: 220, overflow: 'hidden' }}>
        <img
          src="/assets/syrah.jpg"
          alt=""
          style={{
            position: 'absolute',
            inset: '-6%',
            width: '112%',
            height: '112%',
            objectFit: 'cover',
            filter: 'blur(3px) brightness(.55) saturate(1.1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(ellipse at 30% 40%, rgba(194,43,69,.25), transparent 60%), linear-gradient(90deg, transparent 60%, #050202 100%), linear-gradient(0deg, #050202 0%, transparent 35%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 'clamp(20px,6vw,72px)',
            bottom: 'clamp(24px,6vh,72px)',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
            maxWidth: 420,
          }}
        >
          <img
            src="/assets/logo.jpg"
            alt=""
            style={{
              width: 56,
              height: 56,
              objectFit: 'cover',
              objectPosition: 'center 58%',
              borderRadius: '50%',
              boxShadow: '0 0 30px rgba(194,43,69,.5)',
            }}
          />
          <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 'clamp(30px,3.4vw,46px)', lineHeight: 1.05 }}>
            Good wine.
            <br />
            Better company.
          </span>
          <span style={{ fontSize: 13, opacity: 0.7, lineHeight: 1.6 }}>
            Sign in to keep your wishlist, check out faster and follow your orders.
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', placeItems: 'center', padding: 'clamp(16px,4vw,48px)' }}>
        <div
          style={{
            width: 'min(440px,100%)',
            position: 'relative',
            borderRadius: 22,
            padding: '36px 32px',
            background: 'linear-gradient(160deg, rgba(30,24,24,.92), rgba(14,9,10,.96))',
            border: '1px solid rgba(243,236,226,.1)',
            boxShadow: '0 40px 100px rgba(0,0,0,.7), inset 0 1px 0 rgba(243,236,226,.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            animation: 'cdvRise .6s cubic-bezier(.2,.8,.2,1) both',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '10%',
              bottom: '10%',
              width: 1,
              background: 'linear-gradient(180deg, transparent, #c22b45, transparent)',
            }}
          />
          <Btn
            onClick={() => set({ authOpen: false, authError: '', authNotice: '', authNext: null })}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '1px solid rgba(243,236,226,.12)',
              display: 'grid',
              placeItems: 'center',
              color: 'rgba(243,236,226,.7)',
              boxSizing: 'border-box',
            }}
            hoverStyle={{ borderColor: '#c22b45', color: '#f3ece2' }}
          >
            <Icon strokeWidth={2}>
              <path d="M18 6 6 18M6 6l12 12" />
            </Icon>
          </Btn>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, textAlign: 'center', marginTop: 8 }}>
            <span style={{ width: 64, height: 64, display: 'grid', placeItems: 'center', color: '#c22b45' }}>
              <Icon size={56} strokeWidth={1.1}>
                <path d="M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />
              </Icon>
            </span>
            <h2 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 34, margin: 0, lineHeight: 1 }}>
              {isSignin ? 'Welcome back' : 'Create your account'}
            </h2>
            <span style={{ fontSize: 13, opacity: 0.6 }}>
              {isSignin ? 'Sign in to your cellar account' : 'Join Casa del Vino in a few seconds'}
            </span>
          </div>

          <form onSubmit={isSignin ? submitSignin : submitSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isSignin && (
              <Field
                label="Full name"
                icon={
                  <Icon>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </Icon>
                }
              >
                <Input
                  required
                  name="name"
                  autoComplete="name"
                  value={authForm.name || ''}
                  onChange={(e) => setAuth('name', e.target.value)}
                  placeholder="Your name"
                  style={authField}
                  focusStyle={authFocus}
                />
              </Field>
            )}

            <Field
              label="Email address"
              icon={
                <Icon>
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </Icon>
              }
            >
              <Input
                required
                type="email"
                name="email"
                autoComplete="email"
                value={authForm.email || ''}
                onChange={(e) => setAuth('email', e.target.value)}
                placeholder="you@example.com"
                style={authField}
                focusStyle={authFocus}
              />
            </Field>

            <Field
              label="Password"
              icon={
                <Icon>
                  <rect width="18" height="11" x="3" y="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </Icon>
              }
            >
              <>
                <Input
                  required
                  type={pwType}
                  name="password"
                  autoComplete={isSignin ? 'current-password' : 'new-password'}
                  value={authForm.password || ''}
                  onChange={(e) => setAuth('password', e.target.value)}
                  placeholder={isSignin ? 'Enter your password' : 'At least 6 characters'}
                  style={authField}
                  focusStyle={authFocus}
                />
                <Btn
                  onClick={() => set((s) => ({ showPw: !s.showPw }))}
                  aria-label="Show password"
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(243,236,226,.5)',
                    display: 'flex',
                  }}
                  hoverStyle={{ color: '#f3ece2' }}
                >
                  <Icon>
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                    <circle cx="12" cy="12" r="3" />
                  </Icon>
                </Btn>
              </>
            </Field>

            {isSignin && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
                <Btn
                  onClick={() => void requestPasswordReset(authForm.email || '')}
                  style={{ fontSize: 12, color: '#e0526b' }}
                  hoverStyle={{ color: '#f3ece2' }}
                >
                  Forgot password?
                </Btn>
              </div>
            )}

            {authError && (
              <span style={{ fontSize: 12, color: '#e0526b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 8v4M12 16h.01" />
                </Icon>
                {authError}
              </span>
            )}
            {authNotice && (
              <span style={{ fontSize: 12, color: '#f3ece2', opacity: 0.85, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon size={14} strokeWidth={2}>
                  <path d="M20 6 9 17l-5-5" />
                </Icon>
                {authNotice}
              </span>
            )}

            <button type="submit" disabled={authBusy} style={{ all: 'unset', cursor: 'pointer', ...submit, opacity: authBusy ? 0.6 : 1 }}>
              {authBusy ? 'One moment…' : isSignin ? 'Login' : 'Create account'}
              <Icon strokeWidth={2} style={{ position: 'absolute', right: 18 }}>
                <path d="M5 12h14M13 6l6 6-6 6" />
              </Icon>
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, opacity: 0.5 }}>
            <span style={{ flex: 1, height: 1, background: 'rgba(243,236,226,.2)' }} />
            or continue with
            <span style={{ flex: 1, height: 1, background: 'rgba(243,236,226,.2)' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Btn onClick={() => void signInWithGoogle()} style={social} hoverStyle={{ borderColor: 'rgba(243,236,226,.35)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5.4c1.6 0 3 .6 4.1 1.6l3-3A10.6 10.6 0 0 0 12 1.2 10.8 10.8 0 0 0 2.4 7.1l3.5 2.7A6.4 6.4 0 0 1 12 5.4z"
                />
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h6a5.2 5.2 0 0 1-2.2 3.4l3.4 2.6c2-1.8 3.4-4.6 3.4-8z" />
                <path fill="#FBBC05" d="M5.9 14.2A6.5 6.5 0 0 1 5.5 12c0-.8.1-1.5.4-2.2L2.4 7.1A10.8 10.8 0 0 0 1.2 12c0 1.8.4 3.4 1.2 4.9l3.5-2.7z" />
                <path
                  fill="#34A853"
                  d="M12 22.8c2.9 0 5.4-1 7.2-2.6l-3.4-2.6c-1 .6-2.2 1-3.8 1a6.4 6.4 0 0 1-6.1-4.4l-3.5 2.7A10.8 10.8 0 0 0 12 22.8z"
                />
              </svg>
              Google
            </Btn>
            <Btn onClick={continueAsGuest} style={social} hoverStyle={{ borderColor: 'rgba(243,236,226,.35)' }}>
              <Icon>
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </Icon>
              Guest
            </Btn>
          </div>

          <span style={{ fontSize: 13, opacity: 0.7, textAlign: 'center' }}>
            {isSignin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Btn
              onClick={() => set((s) => ({ authMode: s.authMode === 'signup' ? 'signin' : 'signup', authError: '', authNotice: '' }))}
              style={{ color: '#e0526b' }}
              hoverStyle={{ color: '#f3ece2' }}
            >
              {isSignin ? 'Sign up' : 'Sign in'}
            </Btn>
          </span>
        </div>
      </div>
    </div>
  );
}

import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Background } from './components/Background';
import { Splash } from './components/Splash';
import { AgeGate } from './components/AgeGate';
import { AuthScreen } from './components/AuthScreen';
import { CartDrawer } from './components/CartDrawer';
import { ZoomOverlay } from './components/ZoomOverlay';
import { Sidebar } from './components/shop/Sidebar';
import { TopBar } from './components/shop/TopBar';
import { ShopPage } from './pages/ShopPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { WishlistPage } from './pages/WishlistPage';
import { AccountPage } from './pages/AccountPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CheckoutSuccessPage } from './pages/CheckoutSuccessPage';
import { LegalPage } from './pages/LegalPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { routes, useLayout, useStore } from './store/store';

/** The admin is a fifth of the app and only admins see it: loaded on demand. */
const AdminPage = lazy(() => import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })));
import { Btn } from './components/ui/Hoverable';

/** The storefront frame: cellar rail, top bar, the page, the footer. */
function ShopShell() {
  const { go } = useStore();
  const L = useLayout();

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexWrap: 'wrap',
        gap: L.pageGap,
        padding: L.pagePad,
        fontFamily: 'var(--font-body)',
        background: 'radial-gradient(ellipse 60% 40% at 80% 0%, rgba(74,10,20,.7) 0%, transparent 60%)',
        color: '#f3ece2',
        boxSizing: 'border-box',
      }}
    >
      <Sidebar />
      <main style={{ flex: `1 1 ${L.mainBasis}`, minWidth: 0, display: 'flex', flexDirection: 'column', gap: L.pageGap }}>
        <TopBar />
        <Outlet />
        <footer
          style={{
            marginTop: 'auto',
            padding: '12px 8px 0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 11,
            opacity: 0.55,
          }}
        >
          <span>© Casa del Vino — Premium wines. Good wine… better company.</span>
          <span style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <Btn onClick={() => go(routes.legal)} style={{ fontSize: 11 }} hoverStyle={{ color: '#c22b45' }}>
              Terms, privacy & returns
            </Btn>
            <span>Drink responsibly. 18+ only.</span>
          </span>
        </footer>
      </main>
    </div>
  );
}

function AdminRoute() {
  const { state } = useStore();
  if (!state.authReady) return null;
  if (state.user?.role !== 'admin') return <Navigate to="/" replace />;
  return (
    <Suspense fallback={null}>
      <AdminPage />
    </Suspense>
  );
}

function Toast() {
  const { state } = useStore();
  if (!state.adminToast) return null;
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        zIndex: 70,
        padding: '10px 18px',
        borderRadius: 999,
        background: '#c22b45',
        color: '#fff4f5',
        fontSize: 13,
        boxShadow: '0 10px 30px rgba(194,43,69,.4)',
        animation: 'cdvRise .3s ease both',
        maxWidth: 'calc(100vw - 40px)',
        textAlign: 'center',
      }}
    >
      {state.adminToast}
    </div>
  );
}

export function App() {
  const { state } = useStore();

  return (
    <>
      <Splash />
      <Background />
      <Routes>
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/admin/:tab" element={<AdminRoute />} />
        <Route element={<ShopShell />}>
          <Route index element={<ShopPage />} />
          <Route path="/shop/:cat" element={<ShopPage />} />
          <Route path="/product/:id" element={<ShopPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {!state.splash && !state.adult && <AgeGate />}
      <AuthScreen />
      <ZoomOverlay />
      <CartDrawer />
      <Toast />
    </>
  );
}

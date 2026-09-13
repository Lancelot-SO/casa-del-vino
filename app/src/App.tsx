import { Background } from './components/Background';
import { Splash } from './components/Splash';
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
import { AdminPage } from './pages/AdminPage';
import { useLayout, useStore } from './store/store';

function Shop() {
  const { state } = useStore();
  const L = useLayout();
  const { page } = state;

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
        {page === 'shop' && <ShopPage />}
        {page === 'about' && <AboutPage />}
        {page === 'checkout' && <CheckoutPage />}
        {page === 'wishlist' && <WishlistPage />}
        {page === 'account' && <AccountPage />}
        {page === 'contact' && <ContactPage />}
        <footer
          style={{
            marginTop: 'auto',
            padding: '12px 8px 0',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: 8,
            fontSize: 11,
            opacity: 0.45,
          }}
        >
          <span>© Casa del Vino — Premium wines. Good wine… better company.</span>
          <span>Drink responsibly. 18+ only.</span>
        </footer>
      </main>
    </div>
  );
}

export function App() {
  const { state } = useStore();
  const onAdmin = state.page === 'admin' && state.user?.role === 'admin';

  return (
    <>
      <Splash />
      <Background />
      {onAdmin ? <AdminPage /> : <Shop />}
      <AuthScreen />
      <ZoomOverlay />
      <CartDrawer />
    </>
  );
}

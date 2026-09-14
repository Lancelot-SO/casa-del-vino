import { useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { routes, useLayout, useStore } from '../store/store';
import { Box, Btn, Input } from '../components/ui/Hoverable';
import { Icon, PathIcon } from '../components/ui/Icon';
import { DashboardTab } from '../components/admin/DashboardTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { OrdersTab } from '../components/admin/OrdersTab';
import { CustomersTab } from '../components/admin/CustomersTab';
import { MessagesTab } from '../components/admin/MessagesTab';
import { SettingsTab } from '../components/admin/SettingsTab';
import { ProductForm, draftFrom } from '../components/admin/ProductForm';
import { useAdminData } from '../components/admin/useAdminData';
import type { AdminTab } from '../types';

const navItem: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '11px 14px',
  borderRadius: 14,
  fontFamily: 'inherit',
  fontSize: 13,
  color: '#f3ece2',
  transition: 'background .25s',
  whiteSpace: 'nowrap',
};

const TABS: { id: AdminTab; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <PathIcon d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" /> },
  {
    id: 'products',
    label: 'Products',
    icon: <PathIcon d="M8 22h8M7 10h10M12 15v7M12 15a5 5 0 0 0 5-5c0-2-.5-4-2-8H9c-1.5 4-2 6-2 8a5 5 0 0 0 5 5Z" />,
  },
  { id: 'orders', label: 'Orders', icon: <PathIcon d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0" /> },
  {
    id: 'customers',
    label: 'Customers',
    icon: <PathIcon d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />,
  },
  { id: 'messages', label: 'Messages', icon: <PathIcon d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  {
    id: 'settings',
    label: 'Settings',
    icon: (
      <PathIcon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    ),
  },
];

/** The bell panel: orders, sign-ups, messages and catalog changes, newest first. */
function Notifications() {
  const { state, set, go, markNotificationsRead, clearNotifications, dismissNotification } = useStore();
  const { notifications, unreadCount } = useAdminData();

  return (
    <div style={{ position: 'relative' }}>
      <Btn
        onClick={() => set((s) => ({ notifOpen: !s.notifOpen }))}
        aria-label="Notifications"
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(160deg,#241012,#160a0c)',
          color: '#f3ece2',
          border: '1px solid rgba(243,236,226,.08)',
          display: 'grid',
          placeItems: 'center',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        hoverStyle={{ borderColor: '#c22b45' }}
      >
        <Icon>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </Icon>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              padding: '0 5px',
              borderRadius: 999,
              background: '#c22b45',
              color: '#fff4f5',
              fontSize: 10,
              fontWeight: 600,
              display: 'grid',
              placeItems: 'center',
              boxSizing: 'border-box',
            }}
          >
            {unreadCount}
          </span>
        )}
      </Btn>

      {state.notifOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 52,
            width: 'min(360px,calc(100vw - 40px))',
            zIndex: 30,
            background: 'linear-gradient(160deg,#241012,#160a0c)',
            border: '1px solid rgba(243,236,226,.1)',
            borderRadius: 20,
            boxShadow: '0 30px 70px rgba(0,0,0,.7)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'cdvRise .3s cubic-bezier(.2,.8,.2,1) both',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: '1px solid rgba(243,236,226,.08)' }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Notifications</span>
            {notifications.length > 0 && (
              <span style={{ display: 'flex', gap: 14 }}>
                {unreadCount > 0 && (
                  <Btn onClick={() => void markNotificationsRead()} style={{ fontSize: 11, color: '#e0526b' }} hoverStyle={{ color: '#f3ece2' }}>
                    Mark all read
                  </Btn>
                )}
                <Btn onClick={() => void clearNotifications()} style={{ fontSize: 11, color: '#e0526b' }} hoverStyle={{ color: '#f3ece2' }}>
                  Clear all
                </Btn>
              </span>
            )}
          </div>
          <div className="cdv-noscrollbar" style={{ maxHeight: 380, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
            {notifications.length === 0 && <span style={{ padding: '20px 16px', fontSize: 13, opacity: 0.6 }}>You're all caught up.</span>}
            {notifications.map((n) => (
              <Box
                key={n.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '12px 12px 12px 16px',
                  borderBottom: '1px solid rgba(243,236,226,.06)',
                  background: n.bg,
                  transition: 'background .2s',
                }}
                hoverStyle={{ background: 'rgba(194,43,69,.12)' }}
              >
                <Btn
                  onClick={() => {
                    set({ notifOpen: false, adminEdit: null });
                    go(routes.admin(n.tab));
                  }}
                  style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flex: 1, minWidth: 0, fontFamily: 'inherit', textAlign: 'left' }}
                >
                  <span style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: n.iconBg, color: '#fff4f5' }}>
                    <PathIcon d={n.icon} size={15} />
                  </span>
                  <span style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: 13, lineHeight: 1.3 }}>{n.title}</span>
                    <span style={{ fontSize: 11, opacity: 0.6 }}>{n.meta}</span>
                  </span>
                  {n.unread && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c22b45', marginTop: 6, flex: 'none' }} />}
                </Btn>
                <Btn
                  onClick={() => void dismissNotification(n.id)}
                  aria-label="Dismiss notification"
                  title="Dismiss"
                  style={{ width: 26, height: 26, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', color: 'rgba(243,236,226,.45)', marginTop: 4, transition: 'background .2s, color .2s' }}
                  hoverStyle={{ background: 'rgba(243,236,226,.1)', color: '#f3ece2' }}
                >
                  <Icon size={13} strokeWidth={2}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </Icon>
                </Btn>
              </Box>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** The "Shelves" row in the rail; opens and closes the category list beneath it. */
function ShelvesToggle({ open, count, onClick }: { open: boolean; count: number; onClick: () => void }) {
  return (
    <Btn
      onClick={onClick}
      aria-expanded={open}
      aria-controls="cdv-admin-shelves"
      style={{ ...navItem, background: open ? 'rgba(243,236,226,.06)' : 'transparent' }}
      hoverStyle={{ background: 'rgba(243,236,226,.08)' }}
    >
      <PathIcon d="M3 6h18M3 12h18M3 18h18" />
      Shelves
      <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6, fontSize: 11 }}>
        {count}
        <Icon size={14} strokeWidth={2} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .25s' }}>
          <path d="m6 9 6 6 6-6" />
        </Icon>
      </span>
    </Btn>
  );
}

/** The initial badge in the header; opens a small menu with the shop link and sign-out. */
function ProfileMenu() {
  const { state, set, go, signOut } = useStore();
  const [open, setOpen] = useState(false);
  const { user } = state;
  const initial = ((user?.name || user?.email || 'A')[0] || 'A').toUpperCase();

  const item: CSSProperties = { ...navItem, borderRadius: 12, padding: '10px 14px', width: '100%', textAlign: 'left', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'relative' }}>
      <Btn
        onClick={() => {
          setOpen((o) => !o);
          set({ notifOpen: false });
        }}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(180deg,#c22b45,#6e0f20)',
          color: '#f3ece2',
          display: 'grid',
          placeItems: 'center',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'inherit',
          border: `2px solid ${open ? 'rgba(243,236,226,.5)' : 'transparent'}`,
          boxSizing: 'border-box',
          transition: 'border-color .2s',
        }}
        hoverStyle={{ borderColor: 'rgba(243,236,226,.5)' }}
      >
        {initial}
      </Btn>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            right: 0,
            top: 52,
            width: 'min(240px,calc(100vw - 40px))',
            zIndex: 30,
            background: 'linear-gradient(160deg,#241012,#160a0c)',
            border: '1px solid rgba(243,236,226,.1)',
            borderRadius: 18,
            boxShadow: '0 30px 70px rgba(0,0,0,.7)',
            padding: 6,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            animation: 'cdvRise .3s cubic-bezier(.2,.8,.2,1) both',
          }}
        >
          <div style={{ padding: '10px 14px 12px', borderBottom: '1px solid rgba(243,236,226,.08)', marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name || 'Admin'}</span>
            {user?.email && <span style={{ fontSize: 11, opacity: 0.6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>}
          </div>
          <Btn
            role="menuitem"
            onClick={() => {
              setOpen(false);
              go(routes.shop());
            }}
            style={item}
            hoverStyle={{ background: 'rgba(243,236,226,.08)' }}
          >
            <Icon>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </Icon>
            View the shop
          </Btn>
          <Btn
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut();
            }}
            style={{ ...item, opacity: 0.8 }}
            hoverStyle={{ background: 'rgba(194,43,69,.2)', opacity: 1 }}
          >
            <Icon>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </Icon>
            Sign out
          </Btn>
        </div>
      )}
    </div>
  );
}

/** The admin: its own frosted frame, burgundy sidebar and tabbed main panel. */
export function AdminPage() {
  const { state, set, go, loadAdminData } = useStore();
  const L = useLayout();
  // Shelves start folded on every width; the admin opens them when they want a category.
  const [shelvesOpen, setShelvesOpen] = useState(false);
  const { shelves, unreadMessages } = useAdminData();
  const { adminTab, user } = state;

  // Fresh figures whenever the admin opens or switches tab.
  useEffect(() => {
    void loadAdminData();
  }, [adminTab, loadAdminData]);

  return (
    <div style={{ position: 'relative', zIndex: 1, minHeight: '100vh', padding: L.pagePad, fontFamily: 'var(--font-body)', color: '#f3ece2' }}>
      <div
        style={{
          display: 'flex',
          flexDirection: L.shellDir,
          gap: 16,
          minHeight: 'calc(100vh - 40px)',
          borderRadius: 32,
          padding: 16,
          background: 'linear-gradient(160deg, rgba(74,10,20,.45), rgba(20,8,10,.6))',
          border: '1px solid rgba(194,43,69,.25)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 40px 120px rgba(0,0,0,.6)',
          boxSizing: 'border-box',
        }}
      >
        <aside
          style={{
            flex: L.asideFlex,
            minWidth: 0,
            background: 'linear-gradient(160deg,#241012,#160a0c)',
            color: '#f3ece2',
            border: '1px solid rgba(243,236,226,.08)',
            borderRadius: 24,
            padding: '22px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignSelf: 'stretch',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px 18px' }}>
            <img src="/assets/logo.jpg" alt="" style={{ width: 34, height: 34, objectFit: 'cover', objectPosition: 'center 58%', borderRadius: '50%' }} />
            <span style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, lineHeight: 1 }}>Casa del Vino</span>
          </div>

          {/* Tabs; when the rail sits on top, the shelves toggle rides at the end of the same row. */}
          <nav className="cdv-noscrollbar" style={{ display: 'flex', flexDirection: L.navDir, gap: 4, overflowX: 'auto', alignItems: L.isDesktop ? 'stretch' : 'center' }}>
            {TABS.map((t) => (
              <Btn
                key={t.id}
                onClick={() => {
                  set({ adminEdit: null });
                  go(routes.admin(t.id));
                }}
                style={{ ...navItem, background: adminTab === t.id ? 'rgba(194,43,69,.35)' : 'transparent' }}
                hoverStyle={{ background: 'rgba(243,236,226,.08)' }}
              >
                {t.icon}
                {t.label}
                {t.id === 'messages' && unreadMessages > 0 && (
                  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, background: '#c22b45', color: '#fff4f5', borderRadius: 999, padding: '2px 7px' }}>
                    {unreadMessages}
                  </span>
                )}
              </Btn>
            ))}
            {!L.isDesktop && (
              <>
                <span aria-hidden style={{ flex: '0 0 1px', height: 22, marginInline: 6, background: 'rgba(243,236,226,.15)' }} />
                <ShelvesToggle open={shelvesOpen} count={shelves.length} onClick={() => setShelvesOpen((o) => !o)} />
              </>
            )}
          </nav>

          {L.isDesktop && (
            <div style={{ marginTop: 14 }}>
              <ShelvesToggle open={shelvesOpen} count={shelves.length} onClick={() => setShelvesOpen((o) => !o)} />
            </div>
          )}

          {shelvesOpen && (
            <div
              id="cdv-admin-shelves"
              style={{
                display: 'flex',
                flexDirection: L.isDesktop ? 'column' : 'row',
                flexWrap: L.isDesktop ? 'nowrap' : 'wrap',
                gap: L.isDesktop ? 2 : 6,
                padding: L.isDesktop ? '4px 0' : '8px 0 2px',
                animation: 'cdvRise .3s cubic-bezier(.2,.8,.2,1) both',
              }}
            >
              {shelves.length === 0 && <span style={{ fontSize: 12, opacity: 0.55, padding: '6px 14px' }}>No shelves yet.</span>}
              {shelves.map((c) => {
                const active = state.adminShelf === c.id;
                return (
                  <Btn
                    key={c.id}
                    onClick={() => {
                      set({ adminShelf: active ? null : c.id, adminEdit: null });
                      if (!L.isDesktop) setShelvesOpen(false);
                      go(routes.admin('products'));
                    }}
                    aria-pressed={active}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: L.isDesktop ? '7px 14px' : '7px 12px',
                      borderRadius: L.isDesktop ? 12 : 999,
                      border: L.isDesktop ? '1px solid transparent' : `1px solid ${active ? 'rgba(194,43,69,.55)' : 'rgba(243,236,226,.12)'}`,
                      background: active ? 'rgba(194,43,69,.3)' : 'transparent',
                      color: '#f3ece2',
                      fontFamily: 'inherit',
                      fontSize: 12,
                      opacity: active ? 1 : 0.85,
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                      transition: 'background .2s, border-color .2s',
                      boxSizing: 'border-box',
                    }}
                    hoverStyle={{ background: active ? 'rgba(194,43,69,.38)' : 'rgba(243,236,226,.08)' }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', flex: 'none', background: c.count ? c.color : 'rgba(243,236,226,.2)' }} />
                      {c.label}
                    </span>
                    <span style={{ opacity: 0.7 }}>{c.count}</span>
                  </Btn>
                );
              })}
            </div>
          )}
        </aside>

        <main style={{ flex: `1 1 ${L.mainBasis}`, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', padding: '6px 4px' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 500, fontSize: 'clamp(28px,3vw,38px)', margin: '0 auto 0 0', lineHeight: 1 }}>
              Hi, {user?.name?.split(' ')[0] || 'there'}!
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none', flexWrap: 'wrap' }}>
              <Btn
                onClick={() => set({ adminEdit: draftFrom(null) })}
                style={{
                  height: 42,
                  padding: '0 18px',
                  borderRadius: 999,
                  background: 'linear-gradient(160deg,#6e0f20,#2a0a10)',
                  color: '#f3ece2',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: '1px solid rgba(243,236,226,.12)',
                  boxSizing: 'border-box',
                }}
                hoverStyle={{ filter: 'brightness(1.12)' }}
              >
                <Icon size={14} strokeWidth={2.2}>
                  <path d="M12 5v14M5 12h14" />
                </Icon>
                Add bottle
              </Btn>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 42,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: '#241012',
                  color: '#f3ece2',
                  border: '1px solid rgba(243,236,226,.1)',
                  boxSizing: 'border-box',
                }}
              >
                <Icon>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.3-4.3" />
                </Icon>
                <Input
                  value={state.adminQuery}
                  onChange={(e) => {
                    set({ adminQuery: e.target.value });
                    if (adminTab !== 'products') go(routes.admin('products'));
                  }}
                  placeholder="Search bottles"
                  aria-label="Search bottles"
                  style={{ background: 'transparent', border: 0, outline: 0, font: 'inherit', fontSize: 13, color: '#f3ece2', width: 'clamp(60px,10vw,120px)' }}
                />
              </div>

              <Notifications />
              <ProfileMenu />
            </div>
          </div>

          {state.adminEdit && <ProductForm />}
          {adminTab === 'dashboard' && <DashboardTab />}
          {adminTab === 'products' && <ProductsTab />}
          {adminTab === 'orders' && <OrdersTab />}
          {adminTab === 'customers' && <CustomersTab />}
          {adminTab === 'messages' && <MessagesTab />}
          {adminTab === 'settings' && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

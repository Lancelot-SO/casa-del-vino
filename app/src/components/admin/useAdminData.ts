import { useMemo } from 'react';
import { ghs, fmtDate } from '../../lib/format';
import { useStore } from '../../store/store';
import type { ActivityType, AdminTab, ProfileStatus } from '../../types';

const PALETTE = ['#c22b45', '#e0526b', '#7e1424', '#d9b27a', '#f3ece2', '#8a6234', '#ff9783', '#4d170e', '#b08a5a'];

const NOTIF_ICON: Record<string, string> = {
  order: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0',
  signup: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8ZM19 8v6M22 11h-6',
  message: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
  'product-added': 'M12 5v14M5 12h14',
  'product-updated': 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z',
  'product-removed': 'M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6',
};

const ACTIVITY_VERB: Record<ActivityType, string> = {
  'product-added': 'Added ',
  'product-updated': 'Updated ',
  'product-removed': 'Removed ',
};

export interface Notification {
  id: string;
  type: string;
  date: string;
  title: string;
  meta: string;
  unread: boolean;
  bg: string;
  icon: string;
  iconBg: string;
  tab: AdminTab;
}

/** Monday 00:00 of the week containing `d`. */
function weekStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}

/** Every figure, chart and list the dashboard renders, from the loaded admin data. */
export function useAdminData() {
  const { state, products } = useStore();
  const { orders, profiles, activity, messages, categories, user, dismissedNotifs } = state;
  const notifReadAt = user?.notifReadAt || '1970-01-01T00:00:00Z';
  const notifClearedAt = user?.notifClearedAt || '1970-01-01T00:00:00Z';

  const shelves = useMemo(
    () =>
      categories.map((c, i) => ({
        id: c.id,
        label: c.name,
        count: products.filter((p) => p.categoryId === c.id).length,
        color: PALETTE[i % PALETTE.length],
      })),
    [categories, products],
  );
  const live = shelves.filter((c) => c.count > 0);
  const liveOrders = useMemo(() => orders.filter((o) => o.status !== 'cancelled'), [orders]);

  // The cellar-by-shelf ring: one arc per stocked shelf, laid end to end.
  const ringArcs = useMemo(() => {
    const circ = 2 * Math.PI * 46;
    let acc = 0;
    return live.map((c) => {
      const len = (circ * c.count) / Math.max(1, products.length);
      const arc = { color: c.color, dash: len.toFixed(1) + ' ' + (circ - len).toFixed(1), offset: (-acc).toFixed(1) };
      acc += len;
      return arc;
    });
  }, [live, products.length]);

  // Weekly sales from real orders: this Monday-to-Sunday against last week's.
  const chart = useMemo(() => {
    const thisWeek = [0, 0, 0, 0, 0, 0, 0];
    const last = [0, 0, 0, 0, 0, 0, 0];
    const start = weekStart(new Date()).getTime();
    for (const o of liveOrders) {
      const t = new Date(o.date).getTime();
      const day = Math.floor((t - start) / 864e5);
      if (day >= 0 && day < 7) thisWeek[day] += o.total;
      else if (day >= -7 && day < 0) last[day + 7] += o.total;
    }
    const maxV = Math.max(...thisWeek, ...last, 1) * 1.1;
    const pts = (arr: number[]) => arr.map((v, i) => [i * (280 / 6), 110 - (v / maxV) * 100] as const);
    const line = (arr: number[]) =>
      pts(arr)
        .map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
        .join(' ');
    const peakIdx = thisWeek.indexOf(Math.max(...thisWeek));
    const peak = pts(thisWeek)[peakIdx];
    const sumT = thisWeek.reduce((a, b) => a + b, 0);
    const sumL = last.reduce((a, b) => a + b, 0);
    const delta = sumL === 0 ? (sumT > 0 ? 'New' : '0%') : (sumT >= sumL ? '+' : '') + Math.round(((sumT - sumL) / sumL) * 100) + '%';
    return {
      thisPath: line(thisWeek),
      lastPath: line(last),
      areaPath: line(thisWeek) + ' L280 110 L0 110 Z',
      peakX: peak[0].toFixed(1),
      peakY: peak[1].toFixed(1),
      delta,
      sumThisWeek: sumT,
      todayIdx: (new Date().getDay() + 6) % 7,
    };
  }, [liveOrders]);

  /** Registered customers first, then anyone who checked out as a guest. */
  const customerRows = useMemo(() => {
    const registered = profiles
      .filter((u) => u.role !== 'admin')
      .map((u) => ({
        key: u.id,
        /** Set for registered accounts only; guests have no profile to deactivate. */
        profileId: u.id as string | null,
        status: u.status as ProfileStatus,
        name: u.name || u.email,
        email: u.email,
        role: 'Customer',
        initial: (u.name || u.email || '?')[0].toUpperCase(),
        orders: orders.filter((o) => o.userId === u.id || (o.email && o.email.toLowerCase() === u.email.toLowerCase())).length,
        since: u.createdAt,
        place: [u.city].filter(Boolean).join(''),
      }));
    const known = new Set(profiles.map((u) => u.email.toLowerCase()));
    const guests = orders
      .filter((o) => !o.userId && !known.has(o.email.toLowerCase()))
      .reduce<typeof registered>((acc, o) => {
        const k = o.email || o.customer;
        if (!acc.some((x) => x.key === k)) {
          acc.push({
            key: k,
            profileId: null,
            status: 'active',
            name: o.customer,
            email: o.email || 'guest checkout',
            role: 'Guest',
            initial: (o.customer || 'G')[0].toUpperCase(),
            orders: orders.filter((x) => (x.email || x.customer) === k).length,
            since: o.date,
            place: o.city,
          });
        }
        return acc;
      }, []);
    return [...registered, ...guests];
  }, [profiles, orders]);

  const notifications = useMemo<Notification[]>(() => {
    const raw = [
      ...orders.map((o) => ({
        id: 'o-' + o.id,
        type: 'order',
        date: o.date,
        title: 'New order ' + o.no + ' · ' + ghs(o.total),
        meta: (o.customer || 'Guest') + ' · ' + o.count + ' bottles',
        tab: 'orders' as AdminTab,
      })),
      ...profiles
        .filter((u) => u.role !== 'admin')
        .map((u) => ({
          id: 'u-' + u.id,
          type: 'signup',
          date: u.createdAt,
          title: (u.name || u.email) + ' created an account',
          meta: u.email,
          tab: 'customers' as AdminTab,
        })),
      ...messages.map((m) => ({
        id: 'm-' + m.id,
        type: 'message',
        date: m.date,
        title: 'Message from ' + m.name,
        meta: m.subject,
        tab: 'messages' as AdminTab,
      })),
      ...activity.map((a) => ({
        id: 'a-' + a.id,
        type: a.type,
        date: a.date,
        title: ACTIVITY_VERB[a.type] + '“' + a.title + '”',
        meta: 'Catalog',
        tab: 'products' as AdminTab,
      })),
    ]
      // Cleared (up to a moment) or dismissed one by one: gone from the bell.
      .filter((n) => new Date(n.date).getTime() > new Date(notifClearedAt).getTime() && !dismissedNotifs.includes(n.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    return raw.map((n) => {
      const unread = new Date(n.date).getTime() > new Date(notifReadAt).getTime();
      return {
        ...n,
        unread,
        bg: unread ? 'rgba(194,43,69,.06)' : 'transparent',
        icon: NOTIF_ICON[n.type] || NOTIF_ICON.order,
        iconBg: n.type === 'order' ? '#c22b45' : n.type === 'signup' ? '#7e1424' : n.type === 'message' ? '#8a6234' : '#4d170e',
        meta: n.meta + ' · ' + fmtDate(n.date),
      };
    });
  }, [orders, profiles, messages, activity, notifReadAt, notifClearedAt, dismissedNotifs]);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const unreadMessages = messages.filter((m) => !m.read).length;
  const revenue = liveOrders.reduce((a, o) => a + o.total, 0);
  const paidRevenue = orders.filter((o) => o.paymentStatus === 'paid').reduce((a, o) => a + o.total, 0);

  return {
    shelves,
    live,
    ringArcs,
    chart,
    customerRows,
    notifications,
    unreadCount,
    unreadMessages,
    statOrders: liveOrders.length,
    statRevenue: ghs(revenue),
    statPaid: ghs(paidRevenue),
    statBar: revenue > 0 ? Math.min(100, Math.round((paidRevenue / revenue) * 100)) + '%' : '0%',
    statCategories: live.length,
    statCustomers: customerRows.filter((c) => c.status === 'active').length,
    statOpen: orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length,
    lowStock: products.filter((p) => p.active && p.stock <= 5),
    recentOrders: orders.slice(0, 5),
    latestProducts: [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
  };
}

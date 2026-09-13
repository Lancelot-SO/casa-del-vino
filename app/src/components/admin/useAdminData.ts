import { useMemo } from 'react';
import { CATEGORIES } from '../../data/catalog';
import { eur, fmtDate } from '../../lib/format';
import { useStore } from '../../store/store';
import type { ActivityType } from '../../types';

const PALETTE = ['#c22b45', '#e0526b', '#7e1424', '#d9b27a', '#f3ece2', '#8a6234', '#ff9783', '#4d170e', '#b08a5a'];

const NOTIF_ICON: Record<string, string> = {
  order: 'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4ZM3 6h18M16 10a4 4 0 0 1-8 0',
  signup: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 1 0 0-8ZM19 8v6M22 11h-6',
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
  tab: 'orders' | 'customers' | 'products';
}

/** Every figure, chart and list the dashboard renders. */
export function useAdminData() {
  const { state, products } = useStore();
  const { orders, users, activity, notifReadAt } = state;

  const shelves = useMemo(
    () =>
      CATEGORIES.slice(1).map(([label], i) => ({
        label,
        count: products.filter((p) => p.category === label).length,
        color: PALETTE[i % PALETTE.length],
      })),
    [products],
  );
  const live = shelves.filter((c) => c.count > 0);

  // The cellar-by-shelf ring: one arc per stocked shelf, laid end to end.
  const ringArcs = useMemo(() => {
    const circ = 2 * Math.PI * 46;
    let acc = 0;
    return live.map((c) => {
      const len = (circ * c.count) / Math.max(1, products.length);
      const arc = {
        color: c.color,
        dash: len.toFixed(1) + ' ' + (circ - len).toFixed(1),
        offset: (-acc).toFixed(1),
      };
      acc += len;
      return arc;
    });
  }, [live, products.length]);

  // Weekly sales: a demo baseline with this week's real checkouts added in.
  const chart = useMemo(() => {
    const base = [42, 58, 51, 74, 88, 120, 96];
    const last = [38, 44, 60, 52, 70, 98, 80];
    const thisWeek = base.map(
      (v, i) =>
        v +
        orders
          .filter((o) => {
            const d = new Date(o.date);
            const diff = (Date.now() - d.getTime()) / 864e5;
            return diff < 7 && (d.getDay() + 6) % 7 === i;
          })
          .reduce((a, o) => a + o.total, 0),
    );
    const maxV = Math.max(...thisWeek, ...last) * 1.1;
    const pts = (arr: number[]) => arr.map((v, i) => [i * (280 / 6), 110 - (v / maxV) * 100] as const);
    const line = (arr: number[]) =>
      pts(arr)
        .map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1))
        .join(' ');
    const peak = pts(thisWeek)[thisWeek.indexOf(Math.max(...thisWeek))];
    const sumT = thisWeek.reduce((a, b) => a + b, 0);
    const sumL = last.reduce((a, b) => a + b, 0);
    return {
      thisPath: line(thisWeek),
      lastPath: line(last),
      areaPath: line(thisWeek) + ' L280 110 L0 110 Z',
      peakX: peak[0].toFixed(1),
      peakY: peak[1].toFixed(1),
      delta: (sumT >= sumL ? '+' : '') + Math.round(((sumT - sumL) / sumL) * 100) + '%',
    };
  }, [orders]);

  /** Registered customers first, then anyone who checked out as a guest. */
  const customerRows = useMemo(() => {
    const registered = users
      .filter((u) => u.role !== 'admin')
      .map((u) => ({
        key: u.email,
        name: u.name,
        email: u.email,
        role: 'Customer',
        initial: (u.name || u.email)[0].toUpperCase(),
        orders: orders.filter((o) => o.email && o.email.toLowerCase() === u.email.toLowerCase()).length,
      }));
    const guests = orders
      .filter((o) => !users.some((u) => o.email && u.email.toLowerCase() === o.email.toLowerCase()))
      .reduce<typeof registered>((acc, o) => {
        const k = o.email || o.customer;
        if (!acc.some((x) => x.key === k)) {
          acc.push({
            key: k,
            name: o.customer,
            email: o.email || 'guest checkout',
            role: 'Guest',
            initial: (o.customer || 'G')[0].toUpperCase(),
            orders: orders.filter((x) => (x.email || x.customer) === k).length,
          });
        }
        return acc;
      }, []);
    return [...registered, ...guests];
  }, [users, orders]);

  const notifications = useMemo<Notification[]>(() => {
    const raw = [
      ...orders.map((o) => ({
        id: 'o-' + o.no,
        type: 'order',
        date: o.date,
        title: 'New order ' + o.no + ' · ' + eur(o.total),
        meta: (o.customer || 'Guest') + ' · ' + o.count + ' bottles',
        tab: 'orders' as const,
      })),
      ...users
        .filter((u) => u.role !== 'admin' && u.createdAt)
        .map((u) => ({
          id: 'u-' + u.email,
          type: 'signup',
          date: u.createdAt as string,
          title: u.name + ' created an account',
          meta: u.email,
          tab: 'customers' as const,
        })),
      ...activity.map((a, i) => ({
        id: 'a-' + a.date + '-' + i,
        type: a.type,
        date: a.date,
        title: ACTIVITY_VERB[a.type] + '“' + a.title + '”',
        meta: 'Catalog',
        tab: 'products' as const,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 30);

    return raw.map((n) => {
      const unread = n.date > notifReadAt;
      return {
        ...n,
        unread,
        bg: unread ? 'rgba(194,43,69,.06)' : 'transparent',
        icon: NOTIF_ICON[n.type] || NOTIF_ICON.order,
        iconBg: n.type === 'order' ? '#c22b45' : n.type === 'signup' ? '#7e1424' : '#4d170e',
        meta: n.meta + ' · ' + fmtDate(n.date),
      };
    });
  }, [orders, users, activity, notifReadAt]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  return {
    shelves,
    live,
    ringArcs,
    chart,
    customerRows,
    notifications,
    unreadCount,
    statOrders: orders.length,
    statRevenue: eur(orders.reduce((a, o) => a + o.total, 0)),
    statBar: Math.min(100, orders.length * 10) + '%',
    statCategories: live.length,
    statCustomers: customerRows.length,
    recentOrders: orders.slice(0, 5),
    latestProducts: products.slice(-3).reverse(),
  };
}

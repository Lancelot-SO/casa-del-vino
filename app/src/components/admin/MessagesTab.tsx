import * as api from '../../lib/api';
import { errorMessage, fmtDateTime } from '../../lib/format';
import { useLayout, useStore } from '../../store/store';
import { Btn } from '../ui/Hoverable';
import { rowDivider } from './shared';

/** Everything sent through the Contact page. */
export function MessagesTab() {
  const { state, loadAdminData, toast } = useStore();
  const L = useLayout();
  const messages = state.messages;

  const toggle = async (id: string, read: boolean) => {
    try {
      await api.markMessageRead(id, read);
      await loadAdminData();
    } catch (e) {
      toast(errorMessage(e, 'Could not update the message'));
    }
  };

  return (
    <section
      style={{
        background: 'linear-gradient(160deg,#241012,#160a0c)',
        color: '#f3ece2',
        border: '1px solid rgba(243,236,226,.08)',
        borderRadius: 24,
        padding: L.panelPad,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        animation: 'cdvRise .5s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      <span style={{ fontSize: 18, fontWeight: 600 }}>Messages · {messages.length}</span>
      {!state.adminLoaded && <span style={{ fontSize: 13, opacity: 0.6 }}>Loading…</span>}
      {state.adminLoaded && messages.length === 0 && <span style={{ fontSize: 13, opacity: 0.6 }}>Nothing in the inbox.</span>}
      {messages.map((m) => (
        <div key={m.id} style={{ ...rowDivider, padding: '12px 0', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, opacity: m.read ? 0.6 : 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px 14px' }}>
            {!m.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#c22b45' }} />}
            <span style={{ fontWeight: 600 }}>{m.name}</span>
            <a href={'mailto:' + m.email + '?subject=Re: ' + encodeURIComponent(m.subject)} style={{ fontSize: 12 }}>
              {m.email}
            </a>
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 999, background: 'rgba(243,236,226,.08)' }}>{m.subject}</span>
            <span style={{ fontSize: 11, opacity: 0.6, marginLeft: 'auto' }}>{fmtDateTime(m.date)}</span>
            <Btn onClick={() => void toggle(m.id, !m.read)} style={{ fontSize: 11, color: '#e0526b' }} hoverStyle={{ color: '#f3ece2' }}>
              {m.read ? 'Mark unread' : 'Mark read'}
            </Btn>
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, opacity: 0.85 }}>{m.message}</p>
        </div>
      ))}
    </section>
  );
}

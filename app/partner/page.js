'use client';
import { useEffect, useState } from 'react';

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

const NEXT = { reserved: ['out_for_delivery', 'Picked up, out for delivery'], out_for_delivery: ['delivered', 'Mark delivered'] };

export default function Partner() {
  const [meta, setMeta] = useState(null);
  const [partnerId, setPartnerId] = useState('');
  const [pin, setPin] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { api('/api/partners').then((m) => { setMeta(m); setPartnerId(m.partners[0]?.id || ''); }).catch((e) => setError(e.message)); }, []);

  async function load() { if (partnerId) try { setData(await api('/api/partners?id=' + partnerId)); } catch (e) { setError(e.message); } }
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [partnerId]);

  async function accept(orderId) {
    setBusy(true); setError('');
    try { await api('/api/partners', { orderId, partnerId, pin }); await load(); } catch (e) { setError(e.message); }
    setBusy(false);
  }
  async function advance(id, status) {
    setBusy(true); setError('');
    try { await api('/api/order/status', { id, status, pin, actor: 'partner', partnerId }); await load(); } catch (e) { setError(e.message); }
    setBusy(false);
  }

  if (!meta) return <p className="muted">Loading… {error}</p>;

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Delivery console</span>
        <h1>Delivery partner.</h1>
        <p className="sub">Accept nearby jobs and update delivery status. Demo riders only.</p>
      </section>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <label htmlFor="partner">Your name</label>
        <select id="partner" value={partnerId} onChange={(e) => setPartnerId(e.target.value)}>
          {meta.partners.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.vehicle}</option>)}
        </select>
        {meta.pinRequired && (<><label htmlFor="pin" style={{ marginTop: 8 }}>PIN</label><input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></>)}
      </div>

      {data && (
        <>
          <div className="card">
            <h2>Available jobs</h2>
            {data.available.length === 0 && <p className="muted">No reserved orders waiting for pickup right now.</p>}
            {data.available.map((o) => (
              <div key={o.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
                <strong>{o.shopName}</strong>
                <div className="muted">{o.items.map((i) => `${i.key}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ')} · ₹{o.total}</div>
                <div className="row" style={{ marginTop: 6 }}>
                  <button onClick={() => accept(o.id)} disabled={busy}>Accept delivery</button>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>My deliveries</h2>
            {data.mine.length === 0 && <p className="muted">You have not accepted any deliveries yet.</p>}
            {data.mine.map((o) => (
              <div key={o.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
                <strong>{o.shopName}</strong>
                <div className="muted">{o.items.map((i) => `${i.key}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ')} · ₹{o.total}</div>
                <div className="row" style={{ marginTop: 6 }}>
                  <span className={'pill ' + (o.status === 'delivered' ? 'ok' : 'wait')}>{o.status.replace(/_/g, ' ')}</span>
                  {NEXT[o.status] && <button onClick={() => advance(o.id, NEXT[o.status][0])} disabled={busy}>{NEXT[o.status][1]}</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

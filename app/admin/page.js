'use client';
import { useEffect, useState } from 'react';

async function fetchAdmin(pin) {
  const res = await fetch('/api/admin', { headers: pin ? { 'x-admin-pin': pin } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

const STATUS_LABEL = { awaiting_shop: 'Awaiting pharmacy', reserved: 'Reserved', out_for_delivery: 'Out for delivery', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function Admin() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  async function load(p) {
    setError('');
    try {
      const d = await fetchAdmin(p);
      setData(d);
      setUnlocked(true);
      if (!d.pinRequired) setUnlocked(true);
    } catch (e) { setError(e.message); }
  }

  useEffect(() => {
    // Try without a PIN first; if the server has no ADMIN_PIN set this succeeds immediately.
    load('');
  }, []);

  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => load(pin), 5000);
    return () => clearInterval(t);
  }, [unlocked, pin]);

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Marketplace admin</span>
        <h1>Admin.</h1>
        <p className="sub">Operations and metrics across every pharmacy, rider and order. Demo data only.</p>
      </section>
      {error && <div className="err">{error}</div>}

      {!unlocked && (
        <div className="card">
          <label htmlFor="apin">Admin PIN</label>
          <input id="apin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button style={{ marginTop: 10 }} onClick={() => load(pin)}>Unlock</button>
        </div>
      )}

      {unlocked && data && (
        <>
          <div className="metric-grid">
            <div className="metric"><span className="metric-val">{data.metrics.totalOrders}</span><span className="metric-label">Total orders</span></div>
            <div className="metric"><span className="metric-val">₹{data.metrics.revenue}</span><span className="metric-label">Delivered revenue</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.pharmacyCount}</span><span className="metric-label">Pharmacies</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.partnerCount}</span><span className="metric-label">Delivery partners</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.pendingReviews}</span><span className="metric-label">Pending reviews</span></div>
          </div>

          <div className="card">
            <h2>Orders by status</h2>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {Object.entries(STATUS_LABEL).map(([k, label]) => (
                <span key={k} className={'pill ' + (k === 'cancelled' ? 'bad' : k === 'delivered' ? 'ok' : 'wait')}>{label}: {data.metrics.byStatus[k] || 0}</span>
              ))}
            </div>
          </div>

          <div className="card">
            <h2>Recent orders</h2>
            {data.orders.length === 0 && <p className="muted">No orders yet.</p>}
            {data.orders.map((o) => (
              <div key={o.id} style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
                <div className="row" style={{ justifyContent: 'space-between', margin: 0 }}>
                  <strong>{o.shopName}</strong>
                  <span className={'pill ' + (o.status === 'cancelled' ? 'bad' : o.status === 'delivered' ? 'ok' : 'wait')}>{STATUS_LABEL[o.status]}</span>
                </div>
                <div className="muted">{o.items.map((i) => `${i.key}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ')} · ₹{o.total}{o.partnerName ? ` · Rider: ${o.partnerName}` : ''}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Pharmacies</h2>
            <ul className="items">
              {data.pharmacies.map((p) => (
                <li key={p.id}><span>{p.name}</span><span className={'pill ' + (p.open ? 'ok' : 'bad')}>{p.open ? 'Open' : 'Closed'} · {p.items} items</span></li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Delivery partners</h2>
            <ul className="items">
              {data.partners.map((p) => (
                <li key={p.id}><span>{p.name} · {p.vehicle}</span><span className="pill wait">{p.activeDeliveries} active</span></li>
              ))}
            </ul>
          </div>
        </>
      )}
    </>
  );
}

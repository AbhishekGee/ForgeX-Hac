'use client';
import { useEffect, useState } from 'react';
import { Molecule } from '../components/graphics.js';
import { partnerPhoto } from '../../lib/people.js';

async function fetchAdmin(pin) {
  const res = await fetch('/api/admin', { headers: pin ? { 'x-admin-pin': pin } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

async function resetDemo(pin) {
  const res = await fetch('/api/admin/reset', { method: 'POST', headers: pin ? { 'x-admin-pin': pin } : {} });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

const STATUS_LABEL = {
  awaiting_shop: 'Awaiting pharmacy', accepted: 'Accepted', preparing: 'Preparing', ready_for_pickup: 'Ready for pickup',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered', rejected: 'Rejected', cancelled: 'Cancelled', failed_delivery: 'Delivery failed',
};

export default function Admin() {
  const [pin, setPin] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  async function load(p) {
    setError('');
    try {
      const d = await fetchAdmin(p);
      setData(d);
      setUnlocked(true);
    } catch (e) { setError(e.message); }
  }

  async function doReset() {
    setError('');
    try { await resetDemo(pin); setConfirmReset(false); await load(pin); } catch (e) { setError(e.message); }
  }

  useEffect(() => { load(''); }, []);
  useEffect(() => {
    if (!unlocked) return;
    const t = setInterval(() => load(pin), 5000);
    return () => clearInterval(t);
  }, [unlocked, pin]);

  return (
    <div className="page-narrow">
      <section className="hero">
        <span className="eyebrow"><Molecule size={14} /> Marketplace admin</span>
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
          <div className="card">
            <div className="shop">
              <h2>Demo controls</h2>
              {!confirmReset
                ? <button className="ghost" onClick={() => setConfirmReset(true)}>Reset demo data</button>
                : <div className="row" style={{ margin: 0 }}>
                    <span className="muted">Clear all orders and restore fixtures?</span>
                    <button className="warn" onClick={doReset}>Confirm reset</button>
                    <button className="ghost" onClick={() => setConfirmReset(false)}>Cancel</button>
                  </div>}
            </div>
          </div>

          <div className="metric-grid">
            <div className="metric"><span className="metric-val">{data.metrics.totalOrders}</span><span className="metric-label">Total orders</span></div>
            <div className="metric"><span className="metric-val">₹{data.metrics.grossOrderValue}</span><span className="metric-label">Gross order value</span></div>
            <div className="metric"><span className="metric-val">₹{data.metrics.platformRevenue}</span><span className="metric-label">Platform revenue ({Math.round(data.metrics.commissionRate * 100)}% demo commission)</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.acceptanceRate ?? '—'}{data.metrics.acceptanceRate !== null ? '%' : ''}</span><span className="metric-label">Pharmacy acceptance rate</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.rejectionRate ?? '—'}{data.metrics.rejectionRate !== null ? '%' : ''}</span><span className="metric-label">Pharmacy rejection rate</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.deliveryCompletionRate ?? '—'}{data.metrics.deliveryCompletionRate !== null ? '%' : ''}</span><span className="metric-label">Delivery completion rate</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.avgConfirmationSec !== null ? `${data.metrics.avgConfirmationSec}s` : '—'}</span><span className="metric-label">Avg. pharmacy confirmation time</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.pharmacyCount}</span><span className="metric-label">Pharmacies</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.partnerCount}</span><span className="metric-label">Delivery partners</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.pendingPrescriptionReviews}</span><span className="metric-label">Pending Rx approvals</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.pendingOcrReviews}</span><span className="metric-label">Pending photo reviews</span></div>
            <div className="metric"><span className="metric-val">{data.metrics.stockFailures}</span><span className="metric-label">Stock-related rejections</span></div>
          </div>

          <div className="card">
            <h2>Orders by status</h2>
            <div className="row" style={{ flexWrap: 'wrap' }}>
              {Object.entries(STATUS_LABEL).map(([k, label]) => (
                <span key={k} className={'pill ' + (['rejected', 'cancelled', 'failed_delivery'].includes(k) ? 'bad' : k === 'delivered' ? 'ok' : 'wait')}>{label}: {data.metrics.byStatus[k] || 0}</span>
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
                  <span className={'pill ' + (['rejected', 'cancelled', 'failed_delivery'].includes(o.status) ? 'bad' : o.status === 'delivered' ? 'ok' : 'wait')}>{STATUS_LABEL[o.status]}</span>
                </div>
                <div className="muted">{o.items.map((i) => `${i.key}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ')} · ₹{o.total}{o.partnerName ? ` · Rider: ${o.partnerName}` : ''}</div>
              </div>
            ))}
          </div>

          {data.rejectedOrders.length > 0 && (
            <div className="card">
              <h2>Rejected orders</h2>
              {data.rejectedOrders.map((o) => (
                <div key={o.id} style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
                  <strong>{o.shopName}</strong>
                  <div className="muted">{o.rejectionReason}</div>
                </div>
              ))}
            </div>
          )}

          <div className="card">
            <h2>Pharmacies</h2>
            <ul className="items">
              {data.pharmacies.map((p) => (
                <li key={p.id}>
                  <span>{p.name} {p.verified && <span className="verify-badge">Verified</span>}</span>
                  <span className={'pill ' + (p.open ? 'ok' : 'bad')}>{p.open ? 'Open' : 'Closed'} · {p.items} items</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h2>Delivery partners</h2>
            <ul className="items">
              {data.partners.map((p) => (
                <li key={p.id} style={{ alignItems: 'center' }}>
                  <span className="person-row">
                    {partnerPhoto(p.id) && <img className="person-photo" src={partnerPhoto(p.id)} alt={p.name} />}
                    <span>{p.name} · {p.vehicle} {p.verified && <span className="verify-badge">Verified</span>}</span>
                  </span>
                  <span className="pill wait">{p.activeDeliveries} active · {p.completedDeliveries} done</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

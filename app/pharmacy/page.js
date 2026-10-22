'use client';
import { useEffect, useState } from 'react';
import { IconPharmacy } from '../components/icons.js';

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

const STATUS_LABEL = {
  awaiting_shop: 'Awaiting your confirmation', accepted: 'Accepted', preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup', out_for_delivery: 'Out for delivery', delivered: 'Delivered',
  rejected: 'Rejected', cancelled: 'Cancelled', failed_delivery: 'Delivery failed',
};
const REJECT_REASONS = ['Out of stock', 'Store closing', 'Cannot fulfil this order', 'Other'];

export default function Pharmacy() {
  const [meta, setMeta] = useState(null);
  const [shopId, setShopId] = useState('');
  const [pin, setPin] = useState('');
  const [data, setData] = useState(null);
  const [prices, setPrices] = useState({});
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/api/shops').then((m) => { setMeta(m); setShopId(m.shops[0]?.id || ''); }).catch((e) => setError(e.message)); }, []);

  async function load() { if (shopId) try { setData(await api('/api/shops?id=' + shopId)); } catch (e) { setError(e.message); } }
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [shopId]);

  async function reply(medicine, inStock, price) {
    setError('');
    try { await api('/api/shops/reply', { shopId, medicine, inStock, price, pin }); await load(); } catch (e) { setError(e.message); }
  }
  async function setStatus(id, status, reason) {
    setError('');
    try { await api('/api/order/status', { id, status, pin, actor: 'shop', reason }); await load(); } catch (e) { setError(e.message); }
    setRejecting(null);
  }
  async function reviewPrescription(id, decision) {
    setError('');
    try { await api('/api/order/prescription', { id, decision, pin }); await load(); } catch (e) { setError(e.message); }
  }
  async function resolveReview(id) {
    setError('');
    try { await api('/api/reviews', { id, pin }); await load(); } catch (e) { setError(e.message); }
  }

  if (!meta) return <p className="muted">Loading… {error}</p>;
  const shopMeta = meta.shops.find((s) => s.id === shopId);

  return (
    <>
      <section className="hero">
        <span className="eyebrow"><IconPharmacy size={14} /> Pharmacy console</span>
        <h1>Pharmacy.</h1>
        <p className="sub">Answer stock requests with one tap and confirm orders. Demo pharmacies only.</p>
      </section>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <label htmlFor="shop">Your pharmacy</label>
        <select id="shop" value={shopId} onChange={(e) => setShopId(e.target.value)}>
          {meta.shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {meta.pinRequired && (<><label htmlFor="pin" style={{ marginTop: 8 }}>PIN</label><input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></>)}
        <p className="muted">Storage: {meta.store === 'redis' ? 'shared (Redis)' : 'memory only, resets on restart'}</p>
      </div>

      {data && (
        <>
          <div className="card">
            <div className="shop">
              <h2>Licence &amp; verification</h2>
              {data.verified ? <span className="verify-badge">Verified</span> : <span className="pill wait">Pending verification</span>}
            </div>
            <p className="muted">Licence {data.licenceNo || 'not on file'} · {data.pharmacistName || 'No registered pharmacist on file'}</p>
          </div>

          <div className="card">
            <h2>Stock requests <span className={'pill ' + (data.open ? 'ok' : 'bad')}>{data.open ? 'Open now' : 'Closed, no requests'}</span></h2>
            {data.pending.length === 0 && <p className="muted">No requests right now.</p>}
            {data.pending.map((k) => (
              <div className="row" key={k}>
                <strong style={{ minWidth: 110 }}>{k}</strong>
                <input type="number" min="1" placeholder="₹ price" aria-label={`Price for ${k}`} value={prices[k] || ''} onChange={(e) => setPrices({ ...prices, [k]: e.target.value })} />
                <button onClick={() => reply(k, true, prices[k])} disabled={!(Number(prices[k]) > 0)}>In stock</button>
                <button className="warn" onClick={() => reply(k, false)}>Not available</button>
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Orders</h2>
            {data.orders.length === 0 && <p className="muted">No orders yet.</p>}
            {data.orders.map((o) => (
              <div key={o.id} style={{ borderTop: '1px solid var(--line)', padding: '10px 0' }}>
                <strong>{o.items.map((i) => `${i.key}${i.qty > 1 ? ' ×' + i.qty : ''}`).join(', ')}</strong> · ₹{o.total}
                {o.partnerName && <div className="muted">Rider: {o.partnerName}</div>}
                <div className="row" style={{ marginTop: 6 }}>
                  <span className={'pill ' + (['delivered'].includes(o.status) ? 'ok' : ['rejected', 'cancelled', 'failed_delivery'].includes(o.status) ? 'bad' : 'wait')}>{STATUS_LABEL[o.status]}</span>
                  {o.prescriptionStatus === 'pending' && <span className="pill wait">Rx review needed</span>}
                </div>

                {o.prescriptionStatus === 'pending' && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button onClick={() => reviewPrescription(o.id, 'approved')}>Approve prescription</button>
                    <button className="warn" onClick={() => reviewPrescription(o.id, 'rejected')}>Reject prescription</button>
                  </div>
                )}

                {o.status === 'awaiting_shop' && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button onClick={() => setStatus(o.id, 'accepted')}>Accept order</button>
                    <button className="warn" onClick={() => setRejecting(rejecting === o.id ? null : o.id)}>Reject</button>
                  </div>
                )}
                {rejecting === o.id && (
                  <div className="row" style={{ marginTop: 6 }}>
                    {REJECT_REASONS.map((r) => <button key={r} className="ghost" onClick={() => setStatus(o.id, 'rejected', r)}>{r}</button>)}
                  </div>
                )}
                {o.status === 'accepted' && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button onClick={() => setStatus(o.id, 'preparing')} disabled={o.prescriptionStatus === 'pending'}>Mark preparing</button>
                    <button className="warn" onClick={() => setStatus(o.id, 'cancelled', 'Cancelled by pharmacy')}>Cancel</button>
                  </div>
                )}
                {o.status === 'preparing' && (
                  <div className="row" style={{ marginTop: 8 }}>
                    <button onClick={() => setStatus(o.id, 'ready_for_pickup')}>Ready for pickup</button>
                    <button className="warn" onClick={() => setStatus(o.id, 'cancelled', 'Cancelled by pharmacy')}>Cancel</button>
                  </div>
                )}
                {o.status === 'ready_for_pickup' && !o.partnerId && (
                  <p className="muted" style={{ marginTop: 6 }}>Waiting for a delivery partner to accept.</p>
                )}
              </div>
            ))}
          </div>

          <div className="card">
            <h2>Update stock</h2>
            <div className="row">
              <input type="text" placeholder="Medicine" aria-label="Medicine" value={addName} onChange={(e) => setAddName(e.target.value)} />
              <input type="number" min="1" placeholder="₹ price" aria-label="Price" value={addPrice} onChange={(e) => setAddPrice(e.target.value)} />
            </div>
            <div className="row">
              <button onClick={() => { reply(addName, true, addPrice); setAddName(''); setAddPrice(''); }} disabled={!addName.trim() || !(Number(addPrice) > 0)}>In stock</button>
              <button className="warn" onClick={() => { reply(addName, false); setAddName(''); }} disabled={!addName.trim()}>Out of stock</button>
            </div>
            <ul className="items">
              {Object.entries(data.stock).map(([k, v]) => <li key={k}><span>{k}</span><span className={'pill ' + (v.inStock ? 'ok' : 'bad')}>{v.inStock ? `₹${v.price}` : 'Out'}</span></li>)}
            </ul>
          </div>

          <div className="card">
            <h2>Pharmacist review queue</h2>
            <p className="muted">Prescription reads Claude was unsure about. Check them against the photo before dispensing.</p>
            {data.reviews.length === 0 && <p className="muted">Nothing to review.</p>}
            {data.reviews.map((r) => (
              <div className="row" key={r.id}>
                <span style={{ flex: 1 }}>{r.medicines.length ? r.medicines.map((m) => `${m.name} (${Math.round(m.confidence * 100)}%)`).join(', ') : 'Unreadable photo'}</span>
                <button className="ghost" onClick={() => resolveReview(r.id)}>Mark checked</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

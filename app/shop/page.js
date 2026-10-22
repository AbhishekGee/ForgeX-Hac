'use client';
import { useEffect, useState } from 'react';

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

const NEXT = { awaiting_shop: ['reserved', 'Confirm reserved'], reserved: ['out_for_delivery', 'Out for delivery'], out_for_delivery: ['delivered', 'Delivered'] };

export default function Shop() {
  const [meta, setMeta] = useState(null);
  const [shopId, setShopId] = useState('');
  const [pin, setPin] = useState('');
  const [data, setData] = useState(null);
  const [prices, setPrices] = useState({});
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => { api('/api/shops').then((m) => { setMeta(m); setShopId(m.shops[0]?.id || ''); }).catch((e) => setError(e.message)); }, []);

  async function load() { if (shopId) try { setData(await api('/api/shops?id=' + shopId)); } catch (e) { setError(e.message); } }
  useEffect(() => { load(); const t = setInterval(load, 4000); return () => clearInterval(t); }, [shopId]);

  async function reply(medicine, inStock, price) {
    setError('');
    try { await api('/api/shops/reply', { shopId, medicine, inStock, price, pin }); await load(); } catch (e) { setError(e.message); }
  }
  async function setStatus(id, status) {
    setError('');
    try { await api('/api/order/status', { id, status, pin }); await load(); } catch (e) { setError(e.message); }
  }

  if (!meta) return <p className="muted">Loading… {error}</p>;

  return (
    <>
      <h1>Shopkeeper</h1>
      <p className="sub">Answer stock requests with one tap and confirm orders. Demo shops only.</p>
      {error && <div className="err">{error}</div>}
      <div className="card">
        <label htmlFor="shop">Your shop</label>
        <select id="shop" value={shopId} onChange={(e) => setShopId(e.target.value)}>
          {meta.shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {meta.pinRequired && (<><label htmlFor="pin" style={{ marginTop: 8 }}>PIN</label><input id="pin" type="password" value={pin} onChange={(e) => setPin(e.target.value)} /></>)}
        <p className="muted">Storage: {meta.store === 'redis' ? 'shared (Redis)' : 'memory only, resets on restart'}</p>
      </div>

      {data && (
        <>
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
              <div key={o.id} style={{ borderTop: '1px solid var(--line)', padding: '8px 0' }}>
                <strong>{o.items.map((i) => i.key).join(', ')}</strong> · ₹{o.total}
                <div className="row" style={{ marginTop: 6 }}>
                  <span className={'pill ' + (o.status === 'awaiting_shop' ? 'wait' : o.status === 'cancelled' ? 'bad' : 'ok')}>{o.status.replace(/_/g, ' ')}</span>
                  {NEXT[o.status] && <button onClick={() => setStatus(o.id, NEXT[o.status][0])}>{NEXT[o.status][1]}</button>}
                  {['awaiting_shop', 'reserved'].includes(o.status) && <button className="warn" onClick={() => setStatus(o.id, 'cancelled')}>Cancel</button>}
                </div>
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
              <p key={r.id}>{r.medicines.length ? r.medicines.map((m) => `${m.name} (${Math.round(m.confidence * 100)}%)`).join(', ') : 'Unreadable photo'}</p>
            ))}
          </div>
        </>
      )}
    </>
  );
}

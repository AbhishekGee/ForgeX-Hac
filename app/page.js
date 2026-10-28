'use client';
import { useEffect, useRef, useState } from 'react';
import { CATALOG } from '../lib/catalog.js';
import { IconBike, IconPackage, IconPharmacy, IconHome } from './components/icons.js';
import { Molecule, PillCapsule, Sparkle } from './components/graphics.js';

const TRACKER_STEPS = [
  { key: 'pharmacy', label: 'Pharmacy', Icon: IconPharmacy },
  { key: 'packed', label: 'Packed', Icon: IconPackage },
  { key: 'onway', label: 'On the way', Icon: IconBike },
  { key: 'delivered', label: 'Delivered', Icon: IconHome },
];

function trackerIndex(status) {
  if (status === 'awaiting_shop') return 0;
  if (status === 'accepted' || status === 'preparing' || status === 'ready_for_pickup') return 1;
  if (status === 'out_for_delivery') return 2;
  if (status === 'delivered') return 3;
  return -1;
}

const ITEM_LABEL = {
  in_stock: (i) => ({ cls: 'ok', text: `In stock · ₹${i.subtotal ?? i.price}` }),
  out: () => ({ cls: 'bad', text: 'Not available' }),
  unknown: () => ({ cls: 'wait', text: 'Asked the pharmacy, waiting' }),
  needs_rx: () => ({ cls: 'bad', text: 'Needs a prescription photo' }),
  blocked: () => ({ cls: 'bad', text: 'Not sold through this app' }),
};
const ORDER_LABEL = {
  awaiting_shop: 'Waiting for the pharmacy to confirm your order',
  accepted: 'Accepted. The pharmacy is checking everything is ready',
  preparing: 'Preparing your order',
  ready_for_pickup: 'Ready. Waiting for a delivery partner',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  rejected: 'The pharmacy could not accept this order',
  cancelled: 'This order was cancelled',
  failed_delivery: 'The delivery attempt failed',
};
const ORDER_PILL = {
  delivered: 'ok', rejected: 'bad', cancelled: 'bad', failed_delivery: 'bad', awaiting_shop: 'wait',
};
const HISTORY_LABEL = {
  awaiting_shop: 'Order placed',
  accepted: 'Pharmacy accepted',
  preparing: 'Preparing',
  ready_for_pickup: 'Ready for pickup',
  partner_assigned: 'Delivery partner assigned',
  out_for_delivery: 'Picked up, out for delivery',
  delivered: 'Delivered',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  failed_delivery: 'Delivery failed',
  prescription_approved: 'Prescription approved',
  prescription_rejected: 'Prescription rejected',
};

function downscale(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1280 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

async function api(path, body) {
  const res = await fetch(path, body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}

export default function Patient() {
  const [stage, setStage] = useState('input');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [meds, setMeds] = useState([]);
  const [shops, setShops] = useState([]);
  const [flags, setFlags] = useState({ blocked: [], needsPrescription: [] });
  const [order, setOrder] = useState(null);
  const [info, setInfo] = useState(null);
  const [lang, setLang] = useState('en');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openProduct, setOpenProduct] = useState(null);
  const fileRef = useRef(null);
  const hasRx = Boolean(image);

  async function read() {
    setError(''); setBusy(true);
    try {
      const out = await api('/api/extract', image ? { imageDataUrl: image } : { text });
      if (!out.medicines.length) throw new Error(out.legible === false ? 'We could not read that photo. Retake it or type the names.' : 'No medicines found.');
      setMeds(out.medicines.map((m) => ({ name: m.name + (m.strength ? ' ' + m.strength : ''), confidence: m.confidence, qty: 1 })));
      setReview(out.needsReview);
      setStage('confirm');
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  function addFromCatalog(p) {
    setMeds([...meds, { name: `${p.name} ${p.strength}`, confidence: 1, qty: 1 }]);
    setOpenProduct(null);
    setStage('confirm');
  }

  async function search() {
    const items = meds.map((m) => ({ name: m.name.trim(), qty: m.qty || 1 })).filter((m) => m.name);
    if (!items.length) return;
    setError('');
    try {
      const out = await api('/api/search', { items, hasPrescription: hasRx });
      setShops(out.shops); setFlags({ blocked: out.blocked, needsPrescription: out.needsPrescription });
      setStage('results');
    } catch (e) { setError(e.message); }
  }

  useEffect(() => {
    if (stage !== 'results') return;
    const t = setInterval(search, 4000);
    return () => clearInterval(t);
  }, [stage, meds]);

  async function place(shop) {
    setBusy(true); setError('');
    try {
      const items = shop.items.map((i) => ({ key: i.key, qty: i.qty }));
      const { order } = await api('/api/order', { shopId: shop.id, items, hasPrescription: hasRx });
      setOrder(order); setStage('order');
      try { localStorage.setItem('pharmfetch_order_id', order.id); } catch {}
      const ins = await api('/api/instructions', { keys: order.items.map((i) => i.key), language: lang });
      setInfo(ins);
    } catch (e) { setError(e.message); search(); }
    setBusy(false);
  }

  // Restore an in-progress order on load, so leaving for /pharmacy, /partner or /admin
  // and coming back to the customer page shows the same order, not a blank search.
  useEffect(() => {
    let savedId;
    try { savedId = localStorage.getItem('pharmfetch_order_id'); } catch { return; }
    if (!savedId) return;
    (async () => {
      try {
        const { order: restored } = await api('/api/order?id=' + savedId);
        setOrder(restored);
        setStage('order');
        const ins = await api('/api/instructions', { keys: restored.items.map((i) => i.key), language: lang });
        setInfo(ins);
      } catch {
        try { localStorage.removeItem('pharmfetch_order_id'); } catch {}
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (stage !== 'order' || !order) return;
    const t = setInterval(async () => {
      try { setOrder((await api('/api/order?id=' + order.id)).order); } catch {}
    }, 4000);
    return () => clearInterval(t);
  }, [stage, order?.id]);

  async function switchLang(l) {
    setLang(l);
    if (order) setInfo(await api('/api/instructions', { keys: order.items.map((i) => i.key), language: l }));
  }

  async function pick(e) {
    const f = e.target.files?.[0];
    if (f) setImage(await downscale(f));
  }

  function setQty(i, qty) {
    setMeds(meds.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)));
  }

  const stepIdx = { input: 0, confirm: 0, results: 1, order: 2 }[stage];

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Hyperlocal pharmacy marketplace</span>
        <h1>Medicine, fast. <Sparkle size={22} style={{ verticalAlign: 'text-top' }} /></h1>
        <p className="sub">See which open pharmacy near you has your medicine, and the price, before you leave home.</p>
        <span className="express-badge"><IconBike size={14} /> Express delivery</span>
      </section>
      <div className="trust-strip">
        <div className="trust-item"><Molecule size={30} /><span>AI-read prescriptions</span></div>
        <div className="trust-item"><PillCapsule width={52} height={19} rotate={-14} /><span>Verified medicine &amp; pharmacies</span></div>
        <div className="trust-item"><IconBike size={26} /><span>Express delivery</span></div>
      </div>
      <ol className="steps">
        {['Your medicine', 'Choose a pharmacy', 'Delivery'].map((s, i) => <li key={s} className={i === stepIdx ? 'on' : ''}>{s}</li>)}
      </ol>
      {error && <div className="err">{error}</div>}

      {stage === 'input' && (
        <>
          <div className="card">
            <label htmlFor="meds">Type medicine names (comma or new line)</label>
            <textarea id="meds" value={text} onChange={(e) => setText(e.target.value)} placeholder="Paracetamol 500, ORS" disabled={Boolean(image)} />
            <p className="muted">or photograph your prescription</p>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} hidden />
            <div className="row">
              <button className="ghost" onClick={() => fileRef.current.click()}>{image ? 'Retake photo' : 'Take or choose photo'}</button>
              {image && <button className="ghost" onClick={() => setImage(null)}>Remove</button>}
            </div>
            {image && <img src={image} alt="Your prescription" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, marginBottom: 8 }} />}
            <button onClick={read} disabled={busy || (!image && !text.trim())}>{busy ? 'Reading…' : 'Continue'}</button>
          </div>

          <div className="card">
            <div className="title-row"><h2 style={{ margin: 0 }}>Frequently searched</h2><Sparkle size={14} /></div>
            <div className="chip-row">
              {CATALOG.map((p) => (
                <button key={p.key} type="button" className="chip" onClick={() => setOpenProduct(openProduct === p.key ? null : p.key)}>
                  {p.name} {p.strength}{p.prescriptionRequired && <span className="rx">· Rx</span>}
                </button>
              ))}
            </div>
            {openProduct && (() => {
              const p = CATALOG.find((x) => x.key === openProduct);
              return (
                <div className="product-detail">
                  <dl>
                    <dt>Brand</dt><dd>{p.brand}</dd>
                    <dt>Form</dt><dd>{p.form}</dd>
                    <dt>Pack size</dt><dd>{p.packSize}</dd>
                    <dt>Category</dt><dd>{p.category}</dd>
                    <dt>Prescription</dt><dd>{p.prescriptionRequired ? 'Required — add a photo first' : 'Not required'}</dd>
                  </dl>
                  <div className="row" style={{ marginTop: 12, marginBottom: 0 }}>
                    <button onClick={() => addFromCatalog(p)}>Add to cart</button>
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {stage === 'confirm' && (
        <div className="card">
          <h2>Your cart</h2>
          {review && <div className="note">Some lines were hard to read. A pharmacist will check this before anything is handed over. Please fix any mistakes below.</div>}
          {meds.map((m, i) => (
            <div className="row" key={i}>
              <input type="text" value={m.name} aria-label={`Medicine ${i + 1}`} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <div className="qty">
                <button type="button" className="qty-btn" onClick={() => setQty(i, (m.qty || 1) - 1)} aria-label="Decrease quantity">−</button>
                <span className="qty-val">{m.qty || 1}</span>
                <button type="button" className="qty-btn" onClick={() => setQty(i, (m.qty || 1) + 1)} aria-label="Increase quantity">+</button>
              </div>
              {m.confidence < 0.8 && <span className="pill wait">check</span>}
              <button className="warn" onClick={() => setMeds(meds.filter((_, j) => j !== i))}>Remove</button>
            </div>
          ))}
          <div className="row">
            <button className="ghost" onClick={() => setMeds([...meds, { name: '', confidence: 1, qty: 1 }])}>Add</button>
            <button className="ghost" onClick={() => setStage('input')}>Back</button>
            <button onClick={search} disabled={!meds.some((m) => m.name.trim())}>Find pharmacies</button>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <>
          {flags.blocked.length > 0 && <div className="err">Not sold through this app: {flags.blocked.join(', ')}. Please see a pharmacist in person.</div>}
          {flags.needsPrescription.length > 0 && <div className="note">{flags.needsPrescription.join(', ')} need a prescription photo. Go back and add one.</div>}
          <p className="muted">Updates every few seconds as pharmacies reply. Distances are from a demo location.</p>
          {shops.map((s) => (
            <div className="card" key={s.id}>
              <div className="shop">
                <div>
                  <strong>{s.name}</strong> {s.verified && <span className="verify-badge">Verified</span>}
                  <div className="muted">{s.distanceKm} km</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={'pill ' + (s.open ? 'ok' : 'bad')}>{s.open ? 'Open now' : 'Closed'}</span>
                  {s.open && <span className="express-badge"><IconBike size={12} /> Express</span>}
                </div>
              </div>
              <ul className="items">
                {s.items.map((i) => { const l = ITEM_LABEL[i.status](i); return <li key={i.key}><span>{i.display}{i.qty > 1 ? ` × ${i.qty}` : ''}</span><span className={'pill ' + l.cls}>{l.text}</span></li>; })}
              </ul>
              <div className="row" style={{ marginTop: 12 }}>
                <button onClick={() => place(s)} disabled={busy || !s.open || !s.allAvailable}>
                  {s.allAvailable ? `Order from this pharmacy · ₹${s.total}` : 'Not everything confirmed yet'}
                </button>
              </div>
            </div>
          ))}
          <button className="ghost" onClick={() => setStage('confirm')}>Change medicines</button>
        </>
      )}

      {stage === 'order' && order && (
        <>
          <div className="card">
            <h2>{order.shopName}</h2>
            {trackerIndex(order.status) >= 0 && (
              <div className="tracker">
                {TRACKER_STEPS.map((step, i) => {
                  const cur = trackerIndex(order.status);
                  const state = i < cur ? 'done' : i === cur ? 'active' : '';
                  return (
                    <div className={'tracker-step ' + state} key={step.key}>
                      <div className="tracker-icon"><step.Icon size={18} /></div>
                      <span className="tracker-label">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            <p><span className={'pill ' + (ORDER_PILL[order.status] || 'ok')}>{ORDER_LABEL[order.status]}</span></p>
            {(order.status === 'rejected' || order.status === 'cancelled') && order.rejectionReason && (
              <p className="muted">Reason: {order.rejectionReason}</p>
            )}
            {order.prescriptionStatus === 'pending' && <div className="note">Waiting for the pharmacist to approve your prescription before this order is prepared.</div>}
            {order.partnerName && ['out_for_delivery', 'delivered'].includes(order.status) && (
              <p className="muted">Rider: {order.partnerName}</p>
            )}
            <ul className="items">{order.items.map((i) => <li key={i.key}><span>{i.key}{i.qty > 1 ? ` × ${i.qty}` : ''}</span><span>₹{i.price * i.qty}</span></li>)}</ul>
            <p><strong>Total ₹{order.total}</strong> <span className="muted">· pay the pharmacy or rider on delivery (demo)</span></p>
          </div>

          <div className="card">
            <h2>Order timeline</h2>
            <ul className="items">
              {order.history.map((h, i) => (
                <li key={i}><span>{HISTORY_LABEL[h.status] || h.status}</span><span className="muted">{new Date(h.at).toLocaleTimeString()}</span></li>
              ))}
            </ul>
          </div>

          {info && (
            <div className="card">
              <div className="shop"><h2>How to take it</h2>
                <div className="row">
                  <button className={lang === 'en' ? '' : 'ghost'} onClick={() => switchLang('en')}>English</button>
                  <button className={lang === 'hi' ? '' : 'ghost'} onClick={() => switchLang('hi')}>हिन्दी</button>
                </div>
              </div>
              {info.entries.map((e) => <p key={e.key}><strong>{e.key}</strong><br />{e.text}</p>)}
              <p className="muted">{info.note}</p>
            </div>
          )}
          <button className="ghost" onClick={() => { setStage('input'); setOrder(null); setInfo(null); setShops([]); try { localStorage.removeItem('pharmfetch_order_id'); } catch {} }}>Start a new search</button>
        </>
      )}
    </>
  );
}

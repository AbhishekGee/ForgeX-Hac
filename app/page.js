'use client';
import { useEffect, useRef, useState } from 'react';
import { CATALOG, CATEGORIES } from '../lib/catalog.js';
import { IconBike, IconPackage, IconPharmacy, IconHome, IconTablet, IconDroplet, IconLeaf, IconThermometer, IconTrash, IconShieldCheck, IconGlobe } from './components/icons.js';
import { Molecule, PillCapsule, Sparkle } from './components/graphics.js';

const CATEGORY_ICON = {
  'Pain relief': IconTablet,
  'Allergy': IconLeaf,
  'Rehydration': IconDroplet,
  'Infection': IconThermometer,
};

const WHY_ITEMS = [
  { Icon: IconBike, label: 'Fast delivery', sub: 'Express, to your door' },
  { Icon: IconShieldCheck, label: 'Verified stock', sub: 'Checked with the pharmacy live' },
  { Icon: Molecule, label: 'AI-read prescriptions', sub: 'Type it or snap a photo' },
  { Icon: IconGlobe, label: 'English & हिन्दी', sub: 'Dosage info, your language' },
];

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
const TERMINAL_STATUSES = ['delivered', 'rejected', 'cancelled', 'failed_delivery'];
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
  const [orders, setOrders] = useState([]);
  const [barOpen, setBarOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [openProduct, setOpenProduct] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);
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
      const info = await api('/api/instructions', { keys: order.items.map((i) => i.key), language: lang });
      setOrders((prev) => {
        const next = [{ order, info }, ...prev];
        try { localStorage.setItem('pharmfetch_order_ids', JSON.stringify(next.map((o) => o.order.id))); } catch {}
        return next;
      });
      setBarOpen(true);
      // Go back to a clean search instead of locking the page to this order,
      // so another order can be placed while this one is being delivered.
      setStage('input'); setMeds([]); setShops([]); setText(''); setImage(null);
    } catch (e) { setError(e.message); search(); }
    setBusy(false);
  }

  // Restore any orders placed earlier, so leaving for /pharmacy, /partner or /admin
  // and coming back still shows them, without taking over the page or blocking a new search.
  useEffect(() => {
    let ids = [];
    try {
      const raw = localStorage.getItem('pharmfetch_order_ids');
      ids = raw ? JSON.parse(raw) : [];
      if (!ids.length) {
        const legacy = localStorage.getItem('pharmfetch_order_id');
        if (legacy) ids = [legacy];
      }
    } catch { return; }
    if (!ids.length) return;
    (async () => {
      const loaded = [];
      for (const id of ids) {
        try {
          const { order: restored } = await api('/api/order?id=' + id);
          const info = await api('/api/instructions', { keys: restored.items.map((i) => i.key), language: lang });
          loaded.push({ order: restored, info });
        } catch { /* order gone or id invalid, drop it */ }
      }
      setOrders(loaded);
      try { localStorage.setItem('pharmfetch_order_ids', JSON.stringify(loaded.map((o) => o.order.id))); } catch {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderIdsKey = orders.map((o) => o.order.id).join(',');
  useEffect(() => {
    if (!orders.length) return;
    const ids = orders.map((o) => o.order.id);
    const t = setInterval(async () => {
      const updates = await Promise.all(ids.map((id) => api('/api/order?id=' + id).then((r) => r.order).catch(() => null)));
      setOrders((prev) => prev.map((entry) => {
        const upd = updates.find((u) => u && u.id === entry.order.id);
        return upd ? { ...entry, order: upd } : entry;
      }));
    }, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderIdsKey]);

  function dismissOrder(id) {
    setOrders((prev) => {
      const next = prev.filter((o) => o.order.id !== id);
      try { localStorage.setItem('pharmfetch_order_ids', JSON.stringify(next.map((o) => o.order.id))); } catch {}
      return next;
    });
  }

  async function switchLang(l) {
    setLang(l);
    if (!orders.length) return;
    const updated = await Promise.all(orders.map(async (entry) => ({
      ...entry,
      info: await api('/api/instructions', { keys: entry.order.items.map((i) => i.key), language: l }),
    })));
    setOrders(updated);
  }

  async function pick(e) {
    const f = e.target.files?.[0];
    if (f) setImage(await downscale(f));
  }

  function setQty(i, qty) {
    setMeds(meds.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)));
  }

  function focusMeds() {
    setStage('input');
    requestAnimationFrame(() => {
      document.getElementById('meds-card')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      document.getElementById('meds')?.focus();
    });
  }

  function openPrescriptionUpload() {
    setStage('input');
    requestAnimationFrame(() => fileRef.current?.click());
  }

  const stepIdx = { input: 0, confirm: 0, results: 1 }[stage];

  return (
    <>
      <section className="hero">
        <span className="eyebrow">Hyperlocal pharmacy marketplace</span>
        <h1>Medicine, fast. <Sparkle size={22} style={{ verticalAlign: 'text-top' }} /></h1>
        <p className="sub">See which open pharmacy near you has your medicine, and the price, before you leave home.</p>
        <div className="hero-cta-row">
          <button onClick={focusMeds}>Shop medicines <span aria-hidden="true">→</span></button>
          <button className="ghost" onClick={openPrescriptionUpload}>Upload prescription <span aria-hidden="true">↑</span></button>
        </div>
      </section>
      <div className="why-strip">
        {WHY_ITEMS.map(({ Icon, label, sub }) => (
          <div className="why-item" key={label}>
            <span className="why-icon"><Icon size={20} /></span>
            <div><strong>{label}</strong><span>{sub}</span></div>
          </div>
        ))}
      </div>
      <ol className="steps">
        {['Your medicine', 'Choose a pharmacy'].map((s, i) => <li key={s} className={i === stepIdx ? 'on' : ''}>{s}</li>)}
      </ol>
      {error && <div className="err">{error}</div>}

      {stage === 'input' && (
        <>
          <div className="card" id="meds-card">
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

          <div className="promo-banner">
            <div className="promo-icon"><IconBike size={22} /></div>
            <div className="promo-text">
              <strong>Free express delivery</strong>
              <span>On your first order today, no code needed</span>
            </div>
          </div>

          <div className="card">
            <div className="title-row"><h2 style={{ margin: 0 }}>Browse by category</h2></div>
            <div className="category-grid">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c];
                const on = categoryFilter === c;
                return (
                  <button
                    key={c}
                    type="button"
                    className={'category-tile' + (on ? ' on' : '')}
                    onClick={() => setCategoryFilter(on ? null : c)}
                  >
                    <span className="category-tile-icon"><Icon size={22} /></span>
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="title-row"><h2 style={{ margin: 0 }}>Frequently searched</h2><Sparkle size={14} /></div>
            <div className="product-grid">
              {CATALOG.filter((p) => !categoryFilter || p.category === categoryFilter).map((p) => (
                <div key={p.key} className="product-tile" onClick={() => setOpenProduct(openProduct === p.key ? null : p.key)}>
                  <span className="product-tile-thumb"><PillCapsule width={38} height={14} rotate={-18} /></span>
                  <span className="product-tile-name">{p.name}</span>
                  <div className="product-tile-bottom">
                    <span className="product-tile-strength">{p.strength}{p.prescriptionRequired && <span className="rx"> · Rx</span>}</span>
                    <button
                      type="button"
                      className="product-tile-add"
                      aria-label={`Add ${p.name} to cart`}
                      onClick={(e) => { e.stopPropagation(); addFromCatalog(p); }}
                    >+</button>
                  </div>
                </div>
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
                  <p className="muted" style={{ fontWeight: 600, margin: '16px 0 8px' }}>You may also like</p>
                  <div className="chip-row">
                    {CATALOG.filter((x) => x.key !== p.key).slice(0, 3).map((x) => (
                      <button key={x.key} type="button" className="chip" onClick={() => addFromCatalog(x)}>
                        {x.name} {x.strength}
                      </button>
                    ))}
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
              <span className="avatar avatar-sm"><PillCapsule width={20} height={8} rotate={-18} /></span>
              <input type="text" value={m.name} aria-label={`Medicine ${i + 1}`} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
              <div className="qty">
                <button type="button" className="qty-btn" onClick={() => setQty(i, (m.qty || 1) - 1)} aria-label="Decrease quantity">−</button>
                <span className="qty-val">{m.qty || 1}</span>
                <button type="button" className="qty-btn" onClick={() => setQty(i, (m.qty || 1) + 1)} aria-label="Increase quantity">+</button>
              </div>
              {m.confidence < 0.8 && <span className="pill wait">check</span>}
              <button type="button" className="icon-btn warn" aria-label={`Remove ${m.name || 'item'}`} onClick={() => setMeds(meds.filter((_, j) => j !== i))}><IconTrash size={16} /></button>
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
                <div className="row" style={{ marginBottom: 0 }}>
                  <span className="avatar"><IconPharmacy size={18} /></span>
                  <div>
                    <strong>{s.name}</strong> {s.verified && <span className="verify-badge">Verified</span>}
                    <div className="muted">{s.distanceKm} km</div>
                  </div>
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

      {orders.length > 0 && (() => {
        const primary = orders.find((o) => !TERMINAL_STATUSES.includes(o.order.status)) || orders[0];
        const cur = trackerIndex(primary.order.status);
        const BarIcon = (cur >= 0 && TRACKER_STEPS[cur]) ? TRACKER_STEPS[cur].Icon : IconPackage;
        return (
          <>
            <div style={{ height: 78 }} aria-hidden="true" />
            {barOpen && <div className="order-bar-backdrop" onClick={() => setBarOpen(false)} />}
            <div className="order-bar-wrap">
              <div className={'order-bar' + (barOpen ? ' open' : '')}>
                <button type="button" className="order-bar-toggle" onClick={() => setBarOpen((v) => !v)} aria-expanded={barOpen}>
                  <span className="order-bar-icon"><BarIcon size={18} /></span>
                  <span className="order-bar-text">
                    <strong>{primary.order.shopName}</strong>
                    <span className="order-bar-status">{ORDER_LABEL[primary.order.status]}</span>
                  </span>
                  {orders.length > 1 && <span className="order-bar-count">+{orders.length - 1}</span>}
                  <span className="order-bar-chevron">▲</span>
                </button>
                {barOpen && (
                  <div className="order-bar-panel">
                    <div className="title-row">
                      <h2 style={{ margin: 0, fontSize: 16 }}>Your orders</h2>
                      <div className="row" style={{ margin: 0 }}>
                        <button className={lang === 'en' ? '' : 'ghost'} onClick={() => switchLang('en')}>English</button>
                        <button className={lang === 'hi' ? '' : 'ghost'} onClick={() => switchLang('hi')}>हिन्दी</button>
                      </div>
                    </div>
                    {orders.map(({ order, info }) => {
                      const terminal = TERMINAL_STATUSES.includes(order.status);
                      return (
                        <div className="order-entry" key={order.id}>
                          <div className="shop">
                            <div>
                              <strong>{order.shopName}</strong>
                              <div className="muted">₹{order.total} · {order.items.length} item{order.items.length > 1 ? 's' : ''}</div>
                            </div>
                            <span className={'pill ' + (ORDER_PILL[order.status] || 'ok')}>{ORDER_LABEL[order.status]}</span>
                          </div>
                          {trackerIndex(order.status) >= 0 && (
                            <div className="tracker">
                              {TRACKER_STEPS.map((step, i) => {
                                const c = trackerIndex(order.status);
                                const state = i < c ? 'done' : i === c ? 'active' : '';
                                return (
                                  <div className={'tracker-step ' + state} key={step.key}>
                                    <div className="tracker-icon"><step.Icon size={18} /></div>
                                    <span className="tracker-label">{step.label}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          {(order.status === 'rejected' || order.status === 'cancelled') && order.rejectionReason && (
                            <p className="muted">Reason: {order.rejectionReason}</p>
                          )}
                          {order.prescriptionStatus === 'pending' && <div className="note">Waiting for the pharmacist to approve your prescription before this order is prepared.</div>}
                          {order.partnerName && ['out_for_delivery', 'delivered'].includes(order.status) && (
                            <p className="muted">Rider: {order.partnerName}</p>
                          )}
                          <ul className="items">{order.items.map((i) => <li key={i.key}><span>{i.key}{i.qty > 1 ? ` × ${i.qty}` : ''}</span><span>₹{i.price * i.qty}</span></li>)}</ul>
                          <p><strong>Total ₹{order.total}</strong> <span className="muted">· pay the pharmacy or rider on delivery (demo)</span></p>
                          <p className="muted" style={{ fontWeight: 600, marginTop: 12 }}>Order timeline</p>
                          <ul className="order-timeline">
                            {order.history.map((h, i) => (
                              <li key={i}>
                                <span className="ot-label">{HISTORY_LABEL[h.status] || h.status}</span>
                                <span className="ot-time">{new Date(h.at).toLocaleTimeString()}</span>
                              </li>
                            ))}
                          </ul>
                          {info && (
                            <>
                              <p className="muted" style={{ fontWeight: 600, marginTop: 12 }}>How to take it</p>
                              {info.entries.map((e) => <p key={e.key}><strong>{e.key}</strong><br />{e.text}</p>)}
                              <p className="muted">{info.note}</p>
                            </>
                          )}
                          {terminal && (
                            <div className="row" style={{ marginTop: 12 }}>
                              <button className="warn" onClick={() => dismissOrder(order.id)}>Remove</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </>
        );
      })()}
    </>
  );
}

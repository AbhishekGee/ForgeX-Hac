'use client';
import { useEffect, useRef, useState } from 'react';
import { CATALOG, CATEGORIES } from '../lib/catalog.js';
import {
  IconBike, IconPackage, IconPharmacy, IconHome, IconTablet, IconDroplet, IconLeaf, IconThermometer,
  IconTrash, IconShieldCheck, IconGlobe, IconWallet, IconSearch, IconUpload, IconCart,
} from './components/icons.js';
import { partnerPhoto } from '../lib/people.js';

// Real photos (Unsplash License — free to use), one per medicine so the shelf isn't repetitive.
const PRODUCT_PHOTO = {
  paracetamol: '/images/med-blister-hand.jpg',
  ibuprofen: '/images/med-strips-orange.jpg',
  ors: '/images/med-water.jpg',
  cetirizine: '/images/med-strips-assorted.jpg',
  azithromycin: '/images/tablets.jpg',
  amoxicillin: '/images/med-capsule-blister.jpg',
};

function productPhoto(key) {
  return PRODUCT_PHOTO[key] || '/images/tablets.jpg';
}

const FORM_TAG = { 'Oral rehydration salts': 'Sachet' };

const CATEGORY_ICON = {
  'Pain relief': IconTablet,
  'Allergy': IconLeaf,
  'Rehydration': IconDroplet,
  'Infection': IconThermometer,
};

const WHY_ITEMS = [
  { Icon: IconPharmacy, label: 'Real pharmacies, no warehouses', sub: 'Orders come from a licensed chemist near you' },
  { Icon: IconWallet, label: 'Compare before you pay', sub: 'See every nearby price, pick the best one' },
  { Icon: IconShieldCheck, label: 'A pharmacist on every order', sub: 'Prescriptions checked before packing' },
  { Icon: IconGlobe, label: 'English & हिन्दी', sub: 'Dosage guidance in your language' },
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

function Stepper({ qty, onChange, label }) {
  return (
    <div className="qty">
      <button type="button" className="qty-btn" onClick={() => onChange(-1)} aria-label={`Remove one ${label}`}>−</button>
      <span className="qty-val">{qty}</span>
      <button type="button" className="qty-btn" onClick={() => onChange(1)} aria-label={`Add one more ${label}`}>+</button>
    </div>
  );
}

export default function Patient() {
  const [stage, setStage] = useState('input');
  const [query, setQuery] = useState('');
  const [image, setImage] = useState(null);
  const [meds, setMeds] = useState([]);
  const [shops, setShops] = useState([]);
  const [flags, setFlags] = useState({ blocked: [], needsPrescription: [] });
  const [market, setMarket] = useState(null);
  const [orders, setOrders] = useState([]);
  const [barOpen, setBarOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(null);
  const fileRef = useRef(null);
  const hasRx = Boolean(image);

  function goTo(next) {
    setError('');
    setStage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    api('/api/market').then(setMarket).catch(() => {});
  }, []);

  // In-page links like /#pharmacies only change the hash, so bring the storefront back first.
  useEffect(() => {
    const onHash = () => {
      setStage('input');
      requestAnimationFrame(() => document.getElementById(window.location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }));
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  async function read(input) {
    setError(''); setBusy(true);
    try {
      const out = await api('/api/extract', input);
      if (!out.medicines.length) throw new Error(out.legible === false ? 'We could not read that photo. Retake it or type the names.' : 'No medicines found. Try another name.');
      const found = out.medicines.map((m) => ({ name: m.name + (m.strength ? ' ' + m.strength : ''), confidence: m.confidence, qty: 1 }));
      setMeds((prev) => [...prev, ...found]);
      setReview(out.needsReview);
      setQuery('');
      goTo('confirm');
    } catch (e) { setError(e.message); }
    setBusy(false);
  }

  function changeCatalogQty(p, delta) {
    setMeds((prev) => {
      const i = prev.findIndex((m) => m.key === p.key);
      if (i === -1) return delta > 0 ? [...prev, { key: p.key, name: `${p.name} ${p.strength}`, confidence: 1, qty: 1 }] : prev;
      const qty = (prev[i].qty || 1) + delta;
      if (qty <= 0) return prev.filter((_, j) => j !== i);
      return prev.map((m, j) => (j === i ? { ...m, qty: Math.min(20, qty) } : m));
    });
  }

  async function search() {
    const items = meds.map((m) => ({ name: m.name.trim(), qty: m.qty || 1 })).filter((m) => m.name);
    if (!items.length) return;
    try {
      const out = await api('/api/search', { items, hasPrescription: hasRx });
      setShops(out.shops); setFlags({ blocked: out.blocked, needsPrescription: out.needsPrescription });
      setStage('results');
    } catch (e) { setError(e.message); }
  }

  async function compare() {
    setError('');
    await search();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    if (stage !== 'results') return;
    const t = setInterval(search, 4000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, meds, image]);

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
      // Back to a clean storefront, so another order can be placed while this one is delivered.
      setMeds([]); setShops([]); setImage(null);
      goTo('input');
    } catch (e) { setError(e.message); search(); }
    setBusy(false);
  }

  // Restore orders placed earlier, so leaving for another page and coming back still shows them.
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

  // On the storefront a photo is read for medicines; on the price page it is only
  // attached as proof for prescription-only items already in the cart.
  async function pick(e) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    const dataUrl = await downscale(f);
    setImage(dataUrl);
    if (stage === 'input') read({ imageDataUrl: dataUrl });
  }

  function setQty(i, qty) {
    setMeds(meds.map((x, j) => (j === i ? { ...x, qty: Math.max(1, Math.min(20, qty)) } : x)));
  }

  const cartCount = meds.reduce((n, m) => n + (m.qty || 1), 0);
  const showCartBar = stage === 'input' && cartCount > 0;
  const products = CATALOG.filter((p) => !categoryFilter || p.category === categoryFilter);
  const orderable = shops.filter((s) => s.open && s.allAvailable);
  const lowest = orderable.length ? Math.min(...orderable.map((s) => s.total)) : null;
  const nearestId = orderable.length ? orderable.reduce((a, b) => (a.distanceKm <= b.distanceKm ? a : b)).id : null;

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} hidden />

      {stage === 'input' && (
        <>
          <section className="store-hero">
            <div className="store-hero-text">
              <span className="eyebrow">Your neighbourhood pharmacies, online</span>
              <h1>Medicines from pharmacies near you, <span className="accent">delivered.</span></h1>
              <p className="sub">We check live stock and prices at verified chemists around you, so you get the best price from the nearest shop that has it. No warehouse in between.</p>
              <form className="search" onSubmit={(e) => { e.preventDefault(); if (query.trim()) read({ text: query }); }}>
                <IconSearch size={20} className="search-icon" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search medicines, e.g. Dolo 650, ORS"
                  aria-label="Search medicines"
                />
                <button type="submit" disabled={busy || !query.trim()}>{busy ? 'Searching…' : 'Search'}</button>
              </form>
              <div className="hero-actions">
                <button type="button" className="ghost" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <IconUpload size={17} /> Upload prescription
                </button>
                <span className="muted">AI reads it, a pharmacist checks it</span>
              </div>
              {image && <p className="rx-attached">Prescription attached · <button type="button" className="link-btn" onClick={() => setImage(null)}>Remove</button></p>}
              {error && <div className="err" style={{ marginTop: 16 }}>{error}</div>}
              <div className="hero-stats">
                <div><strong>{market ? market.shops.length : '–'}</strong><span>partner pharmacies</span></div>
                <div><strong>{market ? market.shops.filter((s) => s.open).length : '–'}</strong><span>open right now</span></div>
                <div><strong>Live</strong><span>stock & prices</span></div>
              </div>
            </div>
            <div className="store-hero-art">
              <img src="/images/hero-pills.jpg" alt="Assorted medicines and a pill bottle" />
            </div>
          </section>

          <div className="cat-pills" role="group" aria-label="Filter by category">
            <button type="button" className={'cat-pill' + (!categoryFilter ? ' on' : '')} onClick={() => setCategoryFilter(null)}>All medicines</button>
            {CATEGORIES.map((c) => {
              const Icon = CATEGORY_ICON[c];
              const on = categoryFilter === c;
              return (
                <button key={c} type="button" className={'cat-pill' + (on ? ' on' : '')} onClick={() => setCategoryFilter(on ? null : c)}>
                  <Icon size={16} /> {c}
                </button>
              );
            })}
          </div>

          <section className="section">
            <div className="section-head">
              <div>
                <h2>Popular medicines</h2>
                <p className="muted">Lowest live price across partner pharmacies near you</p>
              </div>
            </div>
            <div className="pcard-grid">
              {products.map((p) => {
                const price = market?.prices?.[p.key];
                const qty = meds.find((m) => m.key === p.key)?.qty || 0;
                return (
                  <article className="pcard" key={p.key}>
                    <div className="pcard-media">
                      <img src={productPhoto(p.key)} alt={p.name} />
                      {p.prescriptionRequired && <span className="pcard-rx">Rx</span>}
                    </div>
                    <div className="pcard-body">
                      <span className="pcard-tag">{FORM_TAG[p.form] || p.form}</span>
                      <h3 className="pcard-name">{p.name} {p.strength}</h3>
                      <p className="pcard-meta">{p.brand} · {p.packSize}</p>
                      <div className="pcard-foot">
                        <div className="pcard-price">
                          {!market && <span className="pcard-avail">Checking prices…</span>}
                          {market && price && (
                            <>
                              <span className="pcard-from">from</span> <strong>₹{price.from}</strong>
                              <span className="pcard-avail"> · {price.count} {price.count > 1 ? 'pharmacies' : 'pharmacy'}</span>
                            </>
                          )}
                          {market && !price && <span className="pcard-avail">We&apos;ll ask nearby pharmacies</span>}
                        </div>
                        {qty
                          ? <Stepper qty={qty} label={p.name} onChange={(d) => changeCatalogQty(p, d)} />
                          : <button type="button" className="pcard-add" onClick={() => changeCatalogQty(p, 1)} aria-label={`Add ${p.name} to cart`}>Add</button>}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="rx-banner">
            <div className="rx-banner-icon"><IconShieldCheck size={26} /></div>
            <div className="rx-banner-text">
              <h3>Have a prescription? Just snap it.</h3>
              <p>Our AI reads it in seconds. A licensed pharmacist checks it before anything is packed.</p>
            </div>
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}><IconUpload size={17} /> Upload prescription</button>
          </section>

          <section className="section" id="pharmacies">
            <div className="section-head">
              <div>
                <h2>Partner pharmacies near you</h2>
                <p className="muted">Licensed local chemists. Your order is packed by one of them, not a warehouse.</p>
              </div>
            </div>
            <div className="pharm-grid">
              {(market?.shops || []).map((s) => (
                <article className="pharm-card" key={s.id}>
                  <div className="pharm-head">
                    <span className="avatar"><IconPharmacy size={18} /></span>
                    <div className="pharm-title">
                      <strong>{s.name}</strong>
                      <span className="muted">{s.distanceKm} km away</span>
                    </div>
                  </div>
                  <div className="pharm-tags">
                    <span className={'pill ' + (s.open ? 'ok' : 'bad')}>{s.open ? 'Open now' : 'Closed'}</span>
                    {s.verified && <span className="verify-badge">Verified</span>}
                  </div>
                  <ul className="pharm-meta">
                    <li>{s.hours}</li>
                    <li>{s.pharmacist ? `Pharmacist: ${s.pharmacist}` : 'Pharmacist details pending'}</li>
                    <li>{s.inStockCount} medicines in stock</li>
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="why-strip">
            {WHY_ITEMS.map(({ Icon, label, sub }) => (
              <div className="why-item" key={label}>
                <span className="why-icon"><Icon size={20} /></span>
                <div><strong>{label}</strong><span>{sub}</span></div>
              </div>
            ))}
          </section>
        </>
      )}

      {stage === 'confirm' && (
        <div className="page-narrow">
          <section className="page-head">
            <button type="button" className="back-link" onClick={() => goTo('input')}>← Continue shopping</button>
            <h1 className="page-title">Your cart</h1>
            <p className="muted">Next, we check which nearby pharmacies have these and at what price.</p>
          </section>
          {error && <div className="err">{error}</div>}
          <div className="card">
            {review && <div className="note">Some lines were hard to read. A pharmacist will check this before anything is handed over. Please fix any mistakes below.</div>}
            {meds.length === 0 && <p className="muted">Your cart is empty.</p>}
            {meds.map((m, i) => {
              return (
                <div className="cart-row" key={i}>
                  <img className="cart-thumb" src={productPhoto(m.key)} alt="" />
                  <input type="text" value={m.name} aria-label={`Medicine ${i + 1}`} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value, key: undefined } : x)))} />
                  <Stepper qty={m.qty || 1} label={m.name || 'item'} onChange={(d) => setQty(i, (m.qty || 1) + d)} />
                  {m.confidence < 0.8 && <span className="pill wait">check</span>}
                  <button type="button" className="icon-btn warn" aria-label={`Remove ${m.name || 'item'}`} onClick={() => setMeds(meds.filter((_, j) => j !== i))}><IconTrash size={16} /></button>
                </div>
              );
            })}
            <button type="button" className="link-btn" onClick={() => setMeds([...meds, { name: '', confidence: 1, qty: 1 }])}>+ Add another medicine</button>
          </div>
          <div className="page-actions">
            <button type="button" onClick={compare} disabled={!meds.some((m) => m.name.trim())}>Compare pharmacy prices →</button>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <div className="page-narrow">
          <section className="page-head">
            <button type="button" className="back-link" onClick={() => goTo('confirm')}>← Edit cart</button>
            <h1 className="page-title">Compare pharmacies</h1>
            <p className="muted">Live stock and prices from partner pharmacies near you. This page updates as pharmacies reply.</p>
          </section>
          {error && <div className="err">{error}</div>}
          {flags.blocked.length > 0 && <div className="err">Not sold through this app: {flags.blocked.join(', ')}. Please see a pharmacist in person.</div>}
          {flags.needsPrescription.length > 0 && (
            <div className="note note-row">
              <span>{flags.needsPrescription.join(', ')} {flags.needsPrescription.length > 1 ? 'need' : 'needs'} a prescription photo.</span>
              <button type="button" className="ghost" onClick={() => fileRef.current?.click()}><IconUpload size={16} /> Attach prescription</button>
            </div>
          )}
          {shops.map((s) => {
            const waiting = s.items.some((i) => i.status === 'unknown');
            return (
              <div className={'card shop-card' + (s.open && s.allAvailable && s.total === lowest ? ' best' : '')} key={s.id}>
                <div className="shop">
                  <div className="row" style={{ marginBottom: 0 }}>
                    <span className="avatar"><IconPharmacy size={18} /></span>
                    <div>
                      <strong>{s.name}</strong> {s.verified && <span className="verify-badge">Verified</span>}
                      <div className="muted">{s.distanceKm} km away</div>
                    </div>
                  </div>
                  <div className="shop-badges">
                    <span className={'pill ' + (s.open ? 'ok' : 'bad')}>{s.open ? 'Open now' : 'Closed'}</span>
                    {s.open && s.allAvailable && s.total === lowest && <span className="badge-best">Lowest price</span>}
                    {s.id === nearestId && <span className="badge-near">Nearest</span>}
                  </div>
                </div>
                <ul className="items">
                  {s.items.map((i) => { const l = ITEM_LABEL[i.status](i); return <li key={i.key}><span>{i.display}{i.qty > 1 ? ` × ${i.qty}` : ''}</span><span className={'pill ' + l.cls}>{l.text}</span></li>; })}
                </ul>
                <div className="row" style={{ marginTop: 14, marginBottom: 0 }}>
                  <button onClick={() => place(s)} disabled={busy || !s.open || !s.allAvailable}>
                    {!s.open ? 'Closed right now' : s.allAvailable ? `Order from this pharmacy · ₹${s.total}` : waiting ? 'Waiting for the pharmacy to reply' : 'Not everything in stock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(orders.length > 0 || showCartBar) && <div style={{ height: orders.length && showCartBar ? 160 : 90 }} aria-hidden="true" />}

      {showCartBar && (
        <div className={'cart-bar' + (orders.length ? ' raised' : '')}>
          <button type="button" className="cart-bar-summary" onClick={() => goTo('confirm')}>
            <IconCart size={19} />
            <span><strong>{cartCount} item{cartCount > 1 ? 's' : ''}</strong> in cart · View</span>
          </button>
          <button type="button" className="cart-bar-cta" onClick={compare}>Compare prices →</button>
        </div>
      )}

      {orders.length > 0 && (() => {
        const primary = orders.find((o) => !TERMINAL_STATUSES.includes(o.order.status)) || orders[0];
        const cur = trackerIndex(primary.order.status);
        const BarIcon = (cur >= 0 && TRACKER_STEPS[cur]) ? TRACKER_STEPS[cur].Icon : IconPackage;
        return (
          <>
            {barOpen && <div className="order-bar-backdrop" onClick={() => setBarOpen(false)} />}
            <div className="order-bar-wrap">
              <div className={'order-bar' + (barOpen ? ' open' : '')}>
                <button type="button" className="order-bar-toggle" onClick={() => setBarOpen((v) => !v)} aria-expanded={barOpen}>
                  {primary.order.status === 'out_for_delivery' && partnerPhoto(primary.order.partnerId)
                    ? <img className="order-bar-icon person-photo" src={partnerPhoto(primary.order.partnerId)} alt={primary.order.partnerName} />
                    : <span className="order-bar-icon"><BarIcon size={18} /></span>}
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
                            <div className="rider-card">
                              {partnerPhoto(order.partnerId) && <img className="person-photo person-photo-lg" src={partnerPhoto(order.partnerId)} alt={order.partnerName} />}
                              <div>
                                <span className="muted">{order.status === 'delivered' ? 'Delivered by' : 'Your rider'}</span>
                                <strong style={{ display: 'block' }}>{order.partnerName}</strong>
                              </div>
                            </div>
                          )}
                          <ul className="items">{order.items.map((i) => <li key={i.key}><span>{i.key}{i.qty > 1 ? ` × ${i.qty}` : ''}</span><span>₹{i.price * i.qty}</span></li>)}</ul>
                          <p><strong>Total ₹{order.total}</strong> <span className="muted">· pay the pharmacy or rider on delivery</span></p>
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

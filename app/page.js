'use client';
import { useEffect, useRef, useState } from 'react';
import { CATALOG, CATEGORIES } from '../lib/catalog.js';
import {
  IconBike, IconPackage, IconPharmacy, IconHome, IconTablet, IconDroplet, IconLeaf, IconThermometer,
  IconTrash, IconShieldCheck, IconWallet, IconSearch, IconUpload, IconCheck, IconClose, IconPin,
} from './components/icons.js';
import { partnerPhoto } from '../lib/people.js';
import { loadCart, saveCart, cartCount } from '../lib/cart.js';
import { normalise } from '../lib/medicines.js';

// Real photos (Unsplash License — free to use), one per medicine.
const PRODUCT_PHOTO = {
  paracetamol: '/images/med-blister-hand.jpg',
  ibuprofen: '/images/med-strips-orange.jpg',
  ors: '/images/med-water.jpg',
  cetirizine: '/images/med-strips-assorted.jpg',
  azithromycin: '/images/tablets.jpg',
  amoxicillin: '/images/med-capsule-blister.jpg',
};
const productPhoto = (key) => PRODUCT_PHOTO[key] || '/images/tablets.jpg';
const FORM_TAG = { 'Oral rehydration salts': 'Sachet' };
const UNIT_WORD = { Tablet: 'tablet', Capsule: 'capsule' };
const catalogItem = (key) => CATALOG.find((c) => c.key === key);

const CATEGORY_ICON = {
  'Pain relief': IconTablet,
  'Allergy': IconLeaf,
  'Rehydration': IconDroplet,
  'Infection': IconThermometer,
};

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

function unitPrice(p, price) {
  if (!price || !p.units || p.units < 2 || !UNIT_WORD[p.form]) return null;
  return `₹${(price.from / p.units).toFixed(1)}/${UNIT_WORD[p.form]}`;
}

function Stepper({ qty, onChange, label, compact }) {
  return (
    <div className={'qty' + (compact ? ' qty-compact' : '')}>
      <button type="button" className="qty-btn" onClick={(e) => { e.stopPropagation(); onChange(-1); }} aria-label={`Remove one ${label}`}>−</button>
      <span className="qty-val">{qty}</span>
      <button type="button" className="qty-btn" onClick={(e) => { e.stopPropagation(); onChange(1); }} aria-label={`Add one more ${label}`}>+</button>
    </div>
  );
}

function Availability({ price }) {
  if (!price) return <span className="avail avail-none">Available on request</span>;
  if (!price.openCount) return <span className="avail avail-wait">{price.count} {price.count > 1 ? 'pharmacies' : 'pharmacy'} · closed now</span>;
  return <span className="avail avail-ok">In stock at {price.openCount} open {price.openCount > 1 ? 'pharmacies' : 'pharmacy'}</span>;
}

function ProductCard({ p, price, qty, onQty, onOpen }) {
  const per = unitPrice(p, price);
  return (
    <article className="pcard" onClick={onOpen}>
      <div className="pcard-media">
        <img src={productPhoto(p.key)} alt={p.name} loading="lazy" />
        {p.prescriptionRequired && <span className="rx-tag">Rx</span>}
        <div className="pcard-quick" onClick={(e) => e.stopPropagation()}>
          {qty
            ? <Stepper qty={qty} label={p.name} onChange={onQty} compact />
            : <button type="button" className="pcard-add" onClick={() => onQty(1)} aria-label={`Add ${p.name} to cart`}>Add</button>}
        </div>
      </div>
      <div className="pcard-body">
        <div className="pcard-tags">
          <span className="tag">{FORM_TAG[p.form] || p.form}</span>
          <span className="tag tag-muted">{p.packSize}</span>
        </div>
        <h3 className="pcard-name">{p.name} {p.strength}</h3>
        <p className="pcard-uses">{p.uses.join(' · ')}</p>
        <div className="pcard-price">
          {price ? (
            <>
              <span className="from">from</span><strong>₹{price.from}</strong>
              {per && <span className="per">{per}</span>}
            </>
          ) : <span className="per">Price on request</span>}
        </div>
        <Availability price={price} />
      </div>
    </article>
  );
}

function MedicineSheet({ p, market, qty, onQty, info, onClose }) {
  const price = market?.prices?.[p.key];
  const offers = market?.offers?.[p.key] || [];
  const spread = price && price.to > price.from ? price.to - price.from : 0;
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="sheet-wrap" role="dialog" aria-modal="true" aria-label={`${p.name} ${p.strength}`}>
      <div className="sheet-backdrop" onClick={onClose} />
      <aside className="msheet">
        <button type="button" className="msheet-close" onClick={onClose} aria-label="Close"><IconClose /></button>
        <div className="msheet-scroll">
          <div className="msheet-media">
            <img src={productPhoto(p.key)} alt={p.name} />
            {p.prescriptionRequired && <span className="rx-tag">Prescription required</span>}
          </div>
          <div className="msheet-head">
            <div className="pcard-tags">
              <span className="tag">{FORM_TAG[p.form] || p.form}</span>
              <span className="tag tag-muted">{p.packSize}</span>
              <span className="tag tag-muted">{p.category}</span>
            </div>
            <h2>{p.name} {p.strength}</h2>
            <p className="muted">{p.brand}</p>
            <div className="chips">{p.uses.map((u) => <span key={u} className="chip">{u}</span>)}</div>
          </div>

          <section className="msheet-block">
            <div className="block-head">
              <h3>Live prices near you</h3>
              {spread > 0 && <span className="save-pill">Save up to ₹{spread} by comparing</span>}
            </div>
            {!market && <p className="muted">Checking pharmacies…</p>}
            {market && offers.length === 0 && <p className="muted">No partner pharmacy has listed this yet. Add it to your cart and we&apos;ll ask the open ones nearby.</p>}
            <ul className="offers">
              {offers.map((o, i) => (
                <li key={o.shopId} className={i === 0 && o.open ? 'best' : ''}>
                  <span className="offer-shop">
                    <strong>{o.shop}</strong>
                    <span className="muted">{o.distanceKm} km · <span className={o.open ? 'txt-ok' : 'txt-bad'}>{o.open ? 'Open now' : 'Closed'}</span>{o.verified ? ' · Verified' : ''}</span>
                  </span>
                  <span className="offer-price">
                    {i === 0 && o.open && <span className="badge-best">Best now</span>}
                    <strong>₹{o.price}</strong>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="msheet-block">
            <h3>Medicine details</h3>
            <dl className="facts">
              <div><dt>Composition</dt><dd>{p.name} ({p.strength})</dd></div>
              <div><dt>Common brands</dt><dd>{p.brand}</dd></div>
              <div><dt>Form</dt><dd>{p.form}</dd></div>
              <div><dt>Pack size</dt><dd>{p.packSize}</dd></div>
              <div><dt>Prescription</dt><dd>{p.prescriptionRequired ? 'Required — a pharmacist checks it' : 'Not required'}</dd></div>
            </dl>
          </section>

          <section className="msheet-block">
            <h3>About this medicine</h3>
            {info ? (
              <>
                <p>{info.entries[0]?.text}</p>
                <p className="fine">{info.note}</p>
              </>
            ) : <p className="muted">Loading…</p>}
          </section>

          <ul className="trust-list">
            <li><IconCheck /> Sold only by licensed partner pharmacies</li>
            <li><IconCheck /> Prescriptions checked by a pharmacist</li>
            <li><IconCheck /> Pay the pharmacy or rider on delivery</li>
          </ul>
        </div>
        <div className="msheet-foot">
          <div>
            <span className="muted">{price ? 'Lowest price' : 'Price'}</span>
            <strong>{price ? `₹${price.from}` : 'On request'}</strong>
          </div>
          {qty
            ? <Stepper qty={qty} label={p.name} onChange={onQty} />
            : <button type="button" className="btn-lg" onClick={() => onQty(1)}>Add to cart</button>}
        </div>
      </aside>
    </div>
  );
}

export default function Store() {
  const [stage, setStage] = useState('input');
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
  const [sheetKey, setSheetKey] = useState(null);
  const [infoCache, setInfoCache] = useState({});
  const fileRef = useRef(null);
  const cartLoaded = useRef(false);
  const hasRx = Boolean(image);

  function goTo(next) {
    setError('');
    setStage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Cart persists across pages; the header reads it from the same store.
  useEffect(() => {
    setMeds(loadCart());
    cartLoaded.current = true;
  }, []);
  useEffect(() => {
    if (cartLoaded.current) saveCart(meds);
  }, [meds]);

  useEffect(() => {
    api('/api/market').then(setMarket).catch(() => {});
  }, []);

  useEffect(() => {
    if (!sheetKey || infoCache[sheetKey]) return;
    api('/api/instructions', { keys: [sheetKey], language: 'en' })
      .then((info) => setInfoCache((c) => ({ ...c, [sheetKey]: info })))
      .catch(() => {});
  }, [sheetKey, infoCache]);

  async function read(input) {
    setError(''); setBusy(true);
    try {
      const out = await api('/api/extract', input);
      if (!out.medicines.length) throw new Error(out.legible === false ? 'We could not read that photo. Retake it or type the names.' : 'No medicines found. Try another name.');
      // Link recognised medicines to the catalogue (brand names included), and merge
      // them into existing cart lines instead of adding duplicates.
      setMeds((prev) => {
        const next = [...prev];
        for (const m of out.medicines) {
          const asked = `${m.name} ${m.strength || ''}`.match(/\d+(\.\d+)?/g) || [];
          const match = catalogItem(normalise(m.name));
          // Never swap strengths: "Dolo 650" must not become Paracetamol 500 mg.
          const ours = match?.strength.match(/\d+(\.\d+)?/g) || [];
          const cat = match && (!asked.length || !ours.length || asked.includes(ours[0])) ? match : null;
          const i = cat ? next.findIndex((x) => x.key === cat.key) : -1;
          if (i !== -1) next[i] = { ...next[i], qty: Math.min(20, (next[i].qty || 1) + 1) };
          else if (cat) next.push({ key: cat.key, name: `${cat.name} ${cat.strength}`, confidence: m.confidence, qty: 1 });
          else next.push({ name: m.name + (m.strength ? ' ' + m.strength : ''), confidence: m.confidence, qty: 1 });
        }
        return next;
      });
      setReview(out.needsReview);
      goTo('confirm');
    } catch (e) { setError(e.message); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    setBusy(false);
  }

  // Header search and cart button talk to this page through window events, and
  // arrive as ?q= / ?cart=1 when used from another page.
  useEffect(() => {
    const onSearch = (e) => read({ text: e.detail });
    const onCart = () => goTo('confirm');
    window.addEventListener('pf:search', onSearch);
    window.addEventListener('pf:open-cart', onCart);
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) read({ text: params.get('q') });
    else if (params.get('cart')) setStage('confirm');
    if (params.toString()) window.history.replaceState(null, '', '/');
    return () => {
      window.removeEventListener('pf:search', onSearch);
      window.removeEventListener('pf:open-cart', onCart);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // On the storefront a photo is read for medicines; elsewhere it is only attached
  // as proof for prescription-only items already in the cart.
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

  const count = cartCount(meds);
  const showCartBar = stage === 'input' && count > 0;
  const products = CATALOG.filter((p) => !categoryFilter || p.category === categoryFilter);
  const qtyOf = (key) => meds.find((m) => m.key === key)?.qty || 0;

  // Hero board: the medicine with the most live offers, shown as a real price list.
  const boardItem = market && [...CATALOG].sort((a, b) => (market.offers[b.key]?.length || 0) - (market.offers[a.key]?.length || 0))[0];
  const boardOffers = boardItem ? market.offers[boardItem.key] : [];

  // Cart estimate from the lowest live price of items we can price; the rest are priced on comparison.
  const priced = meds.filter((m) => m.key && market?.prices?.[m.key]);
  const estimate = priced.reduce((n, m) => n + market.prices[m.key].from * (m.qty || 1), 0);
  const unpriced = meds.length - priced.length;
  const rxInCart = meds.some((m) => m.key && catalogItem(m.key)?.prescriptionRequired);

  const orderable = shops.filter((s) => s.open && s.allAvailable);
  const lowest = orderable.length ? Math.min(...orderable.map((s) => s.total)) : null;
  const highest = orderable.length ? Math.max(...orderable.map((s) => s.total)) : null;
  const bestShop = orderable.find((s) => s.total === lowest);
  const nearestId = orderable.length ? orderable.reduce((a, b) => (a.distanceKm <= b.distanceKm ? a : b)).id : null;
  const sheetProduct = sheetKey && catalogItem(sheetKey);

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pick} hidden />

      {stage === 'input' && (
        <>
          <section className="shero">
            <div className="hero-copy">
              <span className="kicker"><span className="live-dot" /> Live prices from pharmacies near you</span>
              <h1>Every pharmacy near you. <span>One price list.</span></h1>
              <p className="lede">We check live stock at licensed chemists around you and show you every price, so you pick the best one. No warehouse, no guesswork.</p>
              <div className="hero-cta">
                <button type="button" className="btn-lg" onClick={() => fileRef.current?.click()} disabled={busy}>
                  <IconUpload size={18} /> {busy ? 'Reading…' : 'Upload prescription'}
                </button>
                <a href="#medicines" className="btn-lg btn-outline">Browse medicines</a>
              </div>
              {image && <p className="rx-attached"><IconCheck /> Prescription attached · <button type="button" className="link-btn" onClick={() => setImage(null)}>Remove</button></p>}
              {error && <div className="err" style={{ marginTop: 16 }}>{error}</div>}
              <ul className="hero-trust">
                <li><IconCheck /> Licensed pharmacies only</li>
                <li><IconCheck /> Pharmacist-checked prescriptions</li>
                <li><IconCheck /> Pay on delivery</li>
              </ul>
            </div>

            <div className="board" aria-label="Live price comparison">
              <div className="board-head">
                <span className="live-dot" />
                <span>Live comparison</span>
                <span className="board-loc"><IconPin size={14} /> Connaught Place</span>
              </div>
              {boardItem ? (
                <>
                  <div className="board-item">
                    <img src={productPhoto(boardItem.key)} alt="" />
                    <div>
                      <strong>{boardItem.name} {boardItem.strength}</strong>
                      <span>{boardItem.packSize} · {boardOffers.length} pharmacies</span>
                    </div>
                  </div>
                  <ul className="board-list">
                    {boardOffers.map((o, i) => (
                      <li key={o.shopId} className={i === 0 && o.open ? 'best' : ''}>
                        <span className="board-shop">
                          <strong>{o.shop}</strong>
                          <span>{o.distanceKm} km · {o.open ? 'Open' : 'Closed'}</span>
                        </span>
                        {i === 0 && o.open && <span className="badge-best">Best now</span>}
                        <span className="board-price">₹{o.price}</span>
                      </li>
                    ))}
                  </ul>
                  <button type="button" className="board-cta" onClick={() => setSheetKey(boardItem.key)}>See all details →</button>
                </>
              ) : (
                <div className="board-skel"><span /><span /><span /></div>
              )}
              <div className="board-stats">
                <div><strong>{market ? market.shops.length : '–'}</strong><span>partner pharmacies</span></div>
                <div><strong>{market ? market.shops.filter((s) => s.open).length : '–'}</strong><span>open right now</span></div>
              </div>
            </div>
          </section>

          <section className="section" id="medicines">
            <div className="section-head">
              <div>
                <h2>Shop medicines</h2>
                <p className="muted">Lowest live price across partner pharmacies. Tap a medicine to compare every pharmacy.</p>
              </div>
            </div>
            <div className="cats" role="group" aria-label="Filter by health concern">
              <button type="button" className={'cat' + (!categoryFilter ? ' on' : '')} onClick={() => setCategoryFilter(null)}>
                <span className="cat-icon"><IconSearch size={20} /></span>All
              </button>
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c];
                const on = categoryFilter === c;
                return (
                  <button key={c} type="button" className={'cat' + (on ? ' on' : '')} onClick={() => setCategoryFilter(on ? null : c)}>
                    <span className="cat-icon"><Icon size={20} /></span>{c}
                  </button>
                );
              })}
            </div>
            <div className="pgrid">
              {products.map((p) => (
                <ProductCard
                  key={p.key}
                  p={p}
                  price={market?.prices?.[p.key]}
                  qty={qtyOf(p.key)}
                  onQty={(d) => changeCatalogQty(p, d)}
                  onOpen={() => setSheetKey(p.key)}
                />
              ))}
            </div>
          </section>

          <section className="rx-band">
            <div className="rx-band-copy">
              <span className="kicker kicker-inv">Have a prescription?</span>
              <h2>Snap it. We&apos;ll do the rest.</h2>
              <p>AI reads your prescription in seconds and fills your cart. A licensed pharmacist checks it before anything is packed.</p>
            </div>
            <button type="button" className="btn-lg btn-light" onClick={() => fileRef.current?.click()} disabled={busy}>
              <IconUpload size={18} /> Upload prescription
            </button>
          </section>

          <section className="section" id="how">
            <div className="section-head"><h2>How PharmFetch works</h2></div>
            <ol className="steps">
              <li><span className="step-n">1</span><h3>Search or snap</h3><p>Type medicine names or upload a prescription. We read it and build your cart.</p></li>
              <li><span className="step-n">2</span><h3>Compare pharmacies</h3><p>See live stock and the total price at every open pharmacy near you.</p></li>
              <li><span className="step-n">3</span><h3>Track to your door</h3><p>The pharmacy packs it, a verified rider delivers it, you track every step.</p></li>
            </ol>
          </section>

          <section className="section" id="pharmacies">
            <div className="section-head">
              <div>
                <h2>Partner pharmacies near you</h2>
                <p className="muted">Licensed local chemists. Your order is packed by one of them, not a warehouse.</p>
              </div>
            </div>
            <div className="ph-grid">
              {(market?.shops || []).map((s) => (
                <article className="ph-card" key={s.id}>
                  <div className="ph-head">
                    <span className="avatar"><IconPharmacy size={20} /></span>
                    <div className="ph-title">
                      <strong>{s.name}</strong>
                      <span className="muted">{s.distanceKm} km away</span>
                    </div>
                  </div>
                  <div className="ph-tags">
                    <span className={'pill ' + (s.open ? 'ok' : 'bad')}>{s.open ? 'Open now' : 'Closed'}</span>
                    {s.verified && <span className="pill info">Verified</span>}
                  </div>
                  <dl className="ph-meta">
                    <div><dt>Hours</dt><dd>{s.hours}</dd></div>
                    <div><dt>Pharmacist</dt><dd>{s.pharmacist || 'Details pending'}</dd></div>
                    <div><dt>In stock</dt><dd>{s.inStockCount} medicines</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          </section>

          <section className="promise">
            <div><span className="promise-icon"><IconPharmacy size={22} /></span><strong>Real pharmacies</strong><span>No dark stores. Every order is packed by a licensed chemist.</span></div>
            <div><span className="promise-icon"><IconWallet size={22} /></span><strong>Compare before you pay</strong><span>See every nearby price and pick the best one.</span></div>
            <div><span className="promise-icon"><IconShieldCheck size={22} /></span><strong>Pharmacist on every order</strong><span>Prescriptions are checked before packing.</span></div>
            <div><span className="promise-icon"><IconBike size={22} /></span><strong>Tracked delivery</strong><span>Verified riders, live status from pharmacy to door.</span></div>
          </section>
        </>
      )}

      {stage === 'confirm' && (
        <div className="page">
          <button type="button" className="back-link" onClick={() => goTo('input')}>← Continue shopping</button>
          <h1 className="page-title">Your cart</h1>
          {error && <div className="err">{error}</div>}
          <div className="split">
            <div className="panel">
              {review && <div className="note">Some lines were hard to read. A pharmacist will check this before anything is handed over. Please fix any mistakes below.</div>}
              {meds.length === 0 && (
                <div className="empty">
                  <p>Your cart is empty.</p>
                  <button type="button" className="btn-lg" onClick={() => goTo('input')}>Browse medicines</button>
                </div>
              )}
              {meds.map((m, i) => {
                const cat = m.key && catalogItem(m.key);
                const price = m.key && market?.prices?.[m.key];
                return (
                  <div className="cart-row" key={i}>
                    <img className="cart-thumb" src={productPhoto(m.key)} alt="" />
                    <div className="cart-main">
                      {cat
                        ? <><strong>{cat.name} {cat.strength}</strong><span className="muted">{cat.packSize}{cat.prescriptionRequired ? ' · Rx' : ''}</span></>
                        : <input type="text" value={m.name} aria-label={`Medicine ${i + 1}`} onChange={(e) => setMeds(meds.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />}
                      {m.confidence < 0.8 && <span className="pill wait">Please check this name</span>}
                    </div>
                    <span className="cart-price">{price ? `from ₹${price.from * (m.qty || 1)}` : ''}</span>
                    <Stepper qty={m.qty || 1} label={m.name || 'item'} onChange={(d) => setQty(i, (m.qty || 1) + d)} />
                    <button type="button" className="icon-btn" aria-label={`Remove ${m.name || 'item'}`} onClick={() => setMeds(meds.filter((_, j) => j !== i))}><IconTrash size={17} /></button>
                  </div>
                );
              })}
              {meds.length > 0 && <button type="button" className="link-btn" onClick={() => setMeds([...meds, { name: '', confidence: 1, qty: 1 }])}>+ Add another medicine by name</button>}
            </div>

            <aside className="panel summary">
              <h3>Summary</h3>
              <dl className="sum">
                <div><dt>Items</dt><dd>{count}</dd></div>
                <div><dt>Estimated total</dt><dd>{priced.length ? `₹${estimate}` : '—'}</dd></div>
              </dl>
              <p className="fine">
                Estimate uses the lowest live price for each item{unpriced > 0 ? `; ${unpriced} item${unpriced > 1 ? 's are' : ' is'} priced when pharmacies reply` : ''}. Your final price depends on the pharmacy you choose.
              </p>
              {rxInCart && !image && (
                <div className="note note-row">
                  <span>Some items need a prescription.</span>
                  <button type="button" className="btn-sm" onClick={() => fileRef.current?.click()}><IconUpload size={15} /> Attach</button>
                </div>
              )}
              {image && <p className="rx-attached"><IconCheck /> Prescription attached</p>}
              <button type="button" className="btn-lg btn-block" onClick={compare} disabled={!meds.some((m) => m.name.trim())}>
                Compare pharmacy prices →
              </button>
              <ul className="trust-list">
                <li><IconCheck /> Pay the pharmacy or rider on delivery</li>
                <li><IconCheck /> Licensed pharmacies only</li>
              </ul>
            </aside>
          </div>
        </div>
      )}

      {stage === 'results' && (
        <div className="page page-narrow">
          <button type="button" className="back-link" onClick={() => goTo('confirm')}>← Edit cart</button>
          <h1 className="page-title">Compare pharmacies</h1>
          <p className="muted">Live stock and prices near you. This page updates as pharmacies reply.</p>
          {bestShop && (
            <div className="best-banner">
              <div>
                <span className="muted">Best price</span>
                <strong>₹{lowest} at {bestShop.name}</strong>
              </div>
              {highest > lowest && <span className="save-pill">You save ₹{highest - lowest} vs the highest</span>}
            </div>
          )}
          {error && <div className="err">{error}</div>}
          {flags.blocked.length > 0 && <div className="err">Not sold through this app: {flags.blocked.join(', ')}. Please see a pharmacist in person.</div>}
          {flags.needsPrescription.length > 0 && (
            <div className="note note-row">
              <span>{flags.needsPrescription.join(', ')} {flags.needsPrescription.length > 1 ? 'need' : 'needs'} a prescription photo.</span>
              <button type="button" className="btn-sm" onClick={() => fileRef.current?.click()}><IconUpload size={15} /> Attach prescription</button>
            </div>
          )}
          {shops.map((s) => {
            const waiting = s.items.some((i) => i.status === 'unknown');
            const isBest = s.open && s.allAvailable && s.total === lowest;
            return (
              <div className={'shop-card' + (isBest ? ' best' : '') + (!s.open ? ' dim' : '')} key={s.id}>
                <div className="shop-top">
                  <span className="avatar"><IconPharmacy size={20} /></span>
                  <div className="shop-title">
                    <strong>{s.name}</strong>
                    <span className="muted">{s.distanceKm} km away{s.verified ? ' · Verified' : ''}</span>
                  </div>
                  <div className="shop-badges">
                    {isBest && <span className="badge-best">Lowest price</span>}
                    {s.id === nearestId && <span className="badge-near">Nearest</span>}
                    <span className={'pill ' + (s.open ? 'ok' : 'bad')}>{s.open ? 'Open now' : 'Closed'}</span>
                  </div>
                </div>
                <ul className="items">
                  {s.items.map((i) => { const l = ITEM_LABEL[i.status](i); return <li key={i.key}><span>{i.display}{i.qty > 1 ? ` × ${i.qty}` : ''}</span><span className={'pill ' + l.cls}>{l.text}</span></li>; })}
                </ul>
                <div className="shop-foot">
                  <span className="shop-total">{s.allAvailable ? <>Total <strong>₹{s.total}</strong></> : <span className="muted">Total shown once everything is confirmed</span>}</span>
                  <button className={isBest ? 'btn-lg' : 'btn-lg btn-outline'} onClick={() => place(s)} disabled={busy || !s.open || !s.allAvailable}>
                    {!s.open ? 'Closed right now' : s.allAvailable ? 'Order from here' : waiting ? 'Waiting for reply' : 'Not everything in stock'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {sheetProduct && (
        <MedicineSheet
          p={sheetProduct}
          market={market}
          qty={qtyOf(sheetProduct.key)}
          onQty={(d) => changeCatalogQty(sheetProduct, d)}
          info={infoCache[sheetProduct.key]}
          onClose={() => setSheetKey(null)}
        />
      )}

      {(orders.length > 0 || showCartBar) && <div style={{ height: orders.length && showCartBar ? 160 : 90 }} aria-hidden="true" />}

      {showCartBar && (
        <div className={'cart-bar' + (orders.length ? ' raised' : '')}>
          <button type="button" className="cart-bar-summary" onClick={() => goTo('confirm')}>
            <span className="cart-bar-count">{count}</span>
            <span>{count > 1 ? 'items' : 'item'} in cart{estimate ? ` · from ₹${estimate}` : ''}</span>
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
                      <div className="seg">
                        <button className={lang === 'en' ? 'on' : ''} onClick={() => switchLang('en')}>English</button>
                        <button className={lang === 'hi' ? 'on' : ''} onClick={() => switchLang('hi')}>हिन्दी</button>
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

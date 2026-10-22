// End-to-end smoke test against a running server: BASE_URL=http://localhost:3000 node scripts/e2e.mjs
import assert from 'node:assert/strict';
const BASE = process.env.BASE_URL || 'http://localhost:3000';
const post = async (p, b) => { const r = await fetch(BASE + p, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(b) }); return { status: r.status, body: await r.json() }; };
const get = async (p) => { const r = await fetch(BASE + p); return { status: r.status, body: await r.json() }; };
const step = (m) => console.log('ok -', m);

const health = await get('/api/health'); assert.equal(health.body.ok, true); step(`health ${JSON.stringify(health.body)}`);

// 1. typed medicines parse
const ex = await post('/api/extract', { text: 'Crocin 500, ORS' });
assert.deepEqual(ex.body.medicines.map((m) => m.key), ['paracetamol', 'ors']); step('typed list normalised');

// 2. search finds an open shop with everything in stock (needs an open 24h demo shop)
let s = await post('/api/search', { medicines: ['Paracetamol 500', 'ORS'] });
const shop = s.body.shops.find((x) => x.open && x.allAvailable);
assert.ok(shop, 'an open shop has both items'); step(`best shop ${shop.name}, total Rs ${shop.total}`);

// 3. blocked and rx-only
s = await post('/api/search', { medicines: ['Xanax', 'Azithral 500'], hasPrescription: false });
assert.deepEqual(s.body.blocked, ['Xanax']); assert.deepEqual(s.body.needsPrescription, ['Azithral 500']);
step('controlled blocked, rx-only needs photo');
const bad = await post('/api/order', { shopId: shop.id, keys: ['alprazolam'] });
assert.equal(bad.status, 422); step('order with controlled drug refused');

// 4. unknown stock -> request -> shop reply -> visible to patient
s = await post('/api/search', { medicines: ['Ibuprofen'] });
const s1 = s.body.shops.find((x) => x.id === 's1');
assert.equal(s1.items[0].status, 'unknown'); step('unknown stock shown as waiting');
const panel = await get('/api/shops?id=s1'); assert.ok(panel.body.pending.includes('ibuprofen')); step('shop sees the request');
const rep = await post('/api/shops/reply', { shopId: 's1', medicine: 'ibuprofen', inStock: true, price: 41 }); assert.equal(rep.status, 200);
s = await post('/api/search', { medicines: ['Ibuprofen'] });
assert.equal(s.body.shops.find((x) => x.id === 's1').items[0].price, 41); step('patient sees shop reply');
assert.equal((await post('/api/shops/reply', { shopId: 's1', medicine: 'ibuprofen', inStock: true })).status, 400); step('reply without price rejected');

// 5. order lifecycle
const o = await post('/api/order', { shopId: shop.id, keys: ['paracetamol', 'ors'] }); assert.equal(o.status, 200);
const id = o.body.order.id; assert.equal(o.body.order.status, 'awaiting_shop');
assert.equal((await post('/api/order/status', { id, status: 'delivered' })).status, 409); step('cannot skip steps');
for (const st of ['reserved', 'out_for_delivery', 'delivered']) assert.equal((await post('/api/order/status', { id, status: st })).status, 200);
assert.equal((await get('/api/order?id=' + id)).body.order.status, 'delivered'); step('order reaches delivered');

// 6. instructions + photo without key
const ins = await post('/api/instructions', { keys: ['paracetamol', 'mystery'], language: 'en' });
assert.equal(ins.body.entries.length, 2); assert.match(ins.body.entries[1].text, /pharmacist/); step('instructions grounded');
if (!health.body.claude) { const img = await post('/api/extract', { imageDataUrl: 'data:image/jpeg;base64,AAAA' }); assert.equal(img.status, 503); step('photo without API key gives a clear 503'); }
console.log('ALL E2E CHECKS PASSED');

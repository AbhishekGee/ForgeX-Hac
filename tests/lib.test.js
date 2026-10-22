import test from 'node:test';
import assert from 'node:assert/strict';
import { normalise, classify } from '../lib/medicines.js';
import { seedState, isOpen } from '../lib/shops.js';
import { rankShops, queueRequests } from '../lib/search.js';
import { groundedOk, sourceFor, GENERIC } from '../lib/instructions.js';

// 2026-10-22 at 02:00 IST (night) and 12:00 IST (day), as UTC timestamps.
const NIGHT = Date.parse('2026-10-21T20:30:00Z');
const DAY = Date.parse('2026-10-22T06:30:00Z');

test('brand names and strengths normalise to a generic key', () => {
  assert.equal(normalise('Crocin 500 mg tablets'), 'paracetamol');
  assert.equal(normalise('Dolo-650'), 'paracetamol');
  assert.equal(normalise('  ORS sachet '), 'ors');
  assert.equal(normalise('Xanax 0.25'), 'alprazolam');
});

test('controlled drugs are blocked and prescription-only drugs need a photo', () => {
  assert.equal(classify('alprazolam', true), 'blocked');
  assert.equal(classify('azithromycin', false), 'needs_rx');
  assert.equal(classify('azithromycin', true), 'ok');
  assert.equal(classify('paracetamol', false), 'ok');
});

test('opening hours use Indian time', () => {
  const s = seedState();
  assert.equal(isOpen(s.shops.s1, NIGHT), true); // 24h
  assert.equal(isOpen(s.shops.s2, NIGHT), false); // 9 to 22
  assert.equal(isOpen(s.shops.s2, DAY), true);
});

test('at night only open shops with stock rank first', () => {
  const s = seedState();
  const r = rankShops(s, [{ key: 'paracetamol', display: 'Paracetamol' }], { now: NIGHT });
  assert.equal(r[0].id, 's1');
  assert.equal(r[0].allAvailable, true);
  assert.equal(r[0].total, 22);
  assert.ok(r.filter((x) => !x.open).every((x) => r.indexOf(x) >= r.filter((y) => y.open).length));
});

test('unknown stock is never reported as in stock, and open shops are asked', () => {
  const s = seedState();
  const items = [{ key: 'ibuprofen', display: 'Ibuprofen' }];
  const r = rankShops(s, items, { now: NIGHT });
  const s1 = r.find((x) => x.id === 's1');
  assert.equal(s1.items[0].status, 'unknown');
  const added = queueRequests(s, items, { now: NIGHT });
  assert.ok(added.some((a) => a.shopId === 's1'));
  assert.ok(!added.some((a) => a.shopId === 's2'), 'closed shop is not asked');
  assert.deepEqual(queueRequests(s, items, { now: NIGHT }), [], 'no duplicate requests');
});

test('blocked and rx-only items never become in_stock', () => {
  const s = seedState();
  s.shops.s1.stock.alprazolam = { inStock: true, price: 10 };
  const r = rankShops(s, [{ key: 'alprazolam', display: 'Xanax' }], { now: NIGHT });
  assert.ok(r.every((x) => x.items[0].status === 'blocked'));
});

test('Claude output is rejected if it adds numbers not in the approved text', () => {
  const src = sourceFor('ors');
  assert.equal(groundedOk('Mix one sachet in clean water and sip often. Discard after 24 hours.', src), true);
  assert.equal(groundedOk('Take 3 sachets a day.', src), false);
  assert.equal(groundedOk('Take two sachets ३ times', src), false);
  assert.equal(sourceFor('unknown-drug'), GENERIC);
});

import { normalise, classify } from '../../../lib/medicines.js';
import { rankShops, queueRequests } from '../../../lib/search.js';
import { update, getState } from '../../../lib/store.js';
import { notify } from '../../../lib/n8n.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const raw = Array.isArray(body.items) ? body.items : (body.medicines || []).map((m) => ({ name: m, qty: 1 }));
  const names = raw
    .map((m) => ({ name: String(m.name ?? m).slice(0, 80), qty: Math.max(1, Math.min(20, Number(m.qty) || 1)) }))
    .filter((m) => m.name)
    .slice(0, 10);
  if (!names.length) return Response.json({ error: 'Add at least one medicine.' }, { status: 400 });

  const seen = new Set();
  const items = [];
  for (const { name: display, qty } of names) {
    const key = normalise(display);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push({ key, display, qty });
  }
  const hasPrescription = Boolean(body.hasPrescription);
  const opts = { hasPrescription, lat: body.lat, lng: body.lng };

  let added = [];
  await update((s) => {
    added = queueRequests(s, items, opts);
  });
  if (added.length) await notify('stock_request', { requests: added, medicines: items });

  const state = await getState();
  return Response.json({
    shops: rankShops(state, items, opts),
    blocked: items.filter((i) => classify(i.key, hasPrescription) === 'blocked').map((i) => i.display),
    needsPrescription: items.filter((i) => classify(i.key, hasPrescription) === 'needs_rx').map((i) => i.display),
    asked: added.length,
  });
}

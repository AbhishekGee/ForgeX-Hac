import { update, getState } from '../../../lib/store.js';
import { classify } from '../../../lib/medicines.js';
import { isOpen } from '../../../lib/shops.js';
import { notify } from '../../../lib/n8n.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const keys = (body.keys || []).map(String).slice(0, 10);
  const hasPrescription = Boolean(body.hasPrescription);
  if (!body.shopId || !keys.length) return Response.json({ error: 'shopId and keys are required.' }, { status: 400 });

  const result = await update((s) => {
    const shop = s.shops[body.shopId];
    if (!shop) return { status: 404, error: 'Unknown shop.' };
    if (!isOpen(shop)) return { status: 409, error: 'This shop has just closed. Pick another.' };
    const items = [];
    for (const key of keys) {
      if (classify(key, hasPrescription) !== 'ok') return { status: 422, error: 'An item in this order cannot be sold through the app.' };
      const e = shop.stock[key];
      if (!e?.inStock) return { status: 409, error: `${key} is no longer confirmed in stock. Search again.` };
      items.push({ key, price: e.price });
    }
    const order = {
      id: 'o' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      shopId: shop.id,
      shopName: shop.name,
      items,
      total: items.reduce((n, i) => n + i.price, 0),
      hasPrescription,
      status: 'awaiting_shop',
      createdAt: Date.now(),
    };
    s.orders[order.id] = order;
    return { status: 200, order };
  });
  if (result.error) return Response.json({ error: result.error }, { status: result.status });
  await notify('order', { order: result.order });
  return Response.json({ order: result.order });
}

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const s = await getState();
  const order = s.orders[id];
  if (!order) return Response.json({ error: 'Unknown order.' }, { status: 404 });
  return Response.json({ order });
}

import { update } from '../../../../lib/store.js';
import { shopAuthorised } from '../../../../lib/auth.js';
import { normalise } from '../../../../lib/medicines.js';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!shopAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const key = normalise(body.medicine);
  if (!body.shopId || !key) return Response.json({ error: 'shopId and medicine are required.' }, { status: 400 });
  const inStock = Boolean(body.inStock);
  const price = Number(body.price);
  if (inStock && !(price > 0 && price < 100000))
    return Response.json({ error: 'Enter the price in rupees.' }, { status: 400 });

  const ok = await update((s) => {
    const shop = s.shops[body.shopId];
    if (!shop) return false;
    shop.stock[key] = inStock ? { inStock: true, price, updatedAt: Date.now() } : { inStock: false, updatedAt: Date.now() };
    shop.pending = shop.pending.filter((k) => k !== key);
    return true;
  });
  if (!ok) return Response.json({ error: 'Unknown shop.' }, { status: 404 });
  return Response.json({ ok: true });
}

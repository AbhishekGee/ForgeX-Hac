import { getState, storeMode } from '../../../lib/store.js';
import { isOpen } from '../../../lib/shops.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const id = new URL(req.url).searchParams.get('id');
  const s = await getState();
  if (!id) {
    return Response.json({
      store: storeMode,
      pinRequired: Boolean(process.env.SHOP_PIN),
      shops: Object.values(s.shops).map((x) => ({ id: x.id, name: x.name, verified: x.verified, open: isOpen(x) })),
    });
  }
  const shop = s.shops[id];
  if (!shop) return Response.json({ error: 'Unknown shop.' }, { status: 404 });
  return Response.json({
    id: shop.id,
    name: shop.name,
    open: isOpen(shop),
    licenceNo: shop.licenceNo,
    pharmacistName: shop.pharmacistName,
    verified: shop.verified,
    pending: shop.pending,
    stock: shop.stock,
    orders: Object.values(s.orders)
      .filter((o) => o.shopId === id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10),
    reviews: s.reviews.slice(0, 5),
  });
}

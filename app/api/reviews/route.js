import { update } from '../../../lib/store.js';
import { shopAuthorised } from '../../../lib/auth.js';

export const dynamic = 'force-dynamic';

// A pharmacist checked a low-confidence prescription read against the photo and clears it from the queue.
export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  if (!shopAuthorised(req, body)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  const ok = await update((s) => {
    const before = s.reviews.length;
    s.reviews = s.reviews.filter((r) => r.id !== body.id);
    return s.reviews.length < before;
  });
  if (!ok) return Response.json({ error: 'Unknown review.' }, { status: 404 });
  return Response.json({ ok: true });
}

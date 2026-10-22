import { setState } from '../../../../lib/store.js';
import { seedState } from '../../../../lib/shops.js';
import { adminAuthorised } from '../../../../lib/auth.js';

export const dynamic = 'force-dynamic';

// Resets all demo data (pharmacies, partners, orders, reviews) back to the seeded fixtures.
// Useful between demo runs, and to pick up fixture changes on an environment with existing state.
export async function POST(req) {
  if (!adminAuthorised(req)) return Response.json({ error: 'Wrong PIN.' }, { status: 401 });
  await setState(seedState());
  return Response.json({ ok: true });
}

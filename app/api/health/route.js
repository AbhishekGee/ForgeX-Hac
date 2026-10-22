import { storeMode } from '../../../lib/store.js';
import { hasClaude } from '../../../lib/claude.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json({
    ok: true,
    store: storeMode,
    claude: hasClaude(),
    n8n: Boolean(process.env.N8N_WEBHOOK_URL),
    pin: Boolean(process.env.SHOP_PIN),
  });
}

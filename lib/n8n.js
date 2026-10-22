// Fire-and-forget notification to an n8n webhook (WhatsApp to shops, etc.).
export async function notify(type, payload) {
  const url = process.env.N8N_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-webhook-secret': process.env.N8N_SHARED_SECRET || '' },
      body: JSON.stringify({ type, ...payload }),
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

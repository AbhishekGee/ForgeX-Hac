import { ask, hasClaude, parseJson } from '../../../lib/claude.js';
import { normalise } from '../../../lib/medicines.js';
import { update } from '../../../lib/store.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SYSTEM = `You read photos of medical prescriptions for a pharmacy app.
Return ONLY a JSON object: {"legible": boolean, "medicines": [{"name": string, "strength": string, "confidence": number}]}.
- "name" is the medicine as written (brand or generic). Do not guess a medicine you cannot read.
- "confidence" is 0 to 1 for how sure you are about that line.
- If the image is not a prescription or is unreadable, return {"legible": false, "medicines": []}.
- Never add medicines that are not written on the page. Never give advice.`;

function parseText(text) {
  return String(text)
    .split(/[,\n;]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10)
    .map((name) => ({ name, strength: '', confidence: 1 }));
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  let legible = true;
  let medicines = [];
  let source = 'typed';

  if (body.imageDataUrl) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(body.imageDataUrl);
    if (!m) return Response.json({ error: 'Send a JPEG, PNG or WebP image.' }, { status: 400 });
    if (body.imageDataUrl.length > 4_000_000)
      return Response.json({ error: 'Image too large. Try a smaller photo.' }, { status: 413 });
    if (!hasClaude())
      return Response.json({ error: 'Prescription reading needs ANTHROPIC_API_KEY on the server. Type the medicine names instead.' }, { status: 503 });
    source = 'claude';
    try {
      const out = await ask({
        system: SYSTEM,
        maxTokens: 700,
        content: [
          { type: 'image', source: { type: 'base64', media_type: m[1], data: m[2] } },
          { type: 'text', text: 'Extract the medicines from this prescription.' },
        ],
      });
      const parsed = parseJson(out);
      if (!parsed) throw new Error('unparseable');
      legible = Boolean(parsed.legible);
      medicines = (parsed.medicines || []).slice(0, 10).map((x) => ({
        name: String(x.name || '').slice(0, 80),
        strength: String(x.strength || '').slice(0, 40),
        confidence: Math.max(0, Math.min(1, Number(x.confidence) || 0)),
      }));
    } catch {
      return Response.json({ error: 'Could not read the prescription. Retake the photo or type the names.' }, { status: 502 });
    }
  } else if (body.text) {
    medicines = parseText(body.text);
  } else {
    return Response.json({ error: 'Send text or an image.' }, { status: 400 });
  }

  medicines = medicines.filter((x) => x.name).map((x) => ({ ...x, key: normalise(x.name) }));
  const needsReview = source === 'claude' && (!legible || medicines.some((x) => x.confidence < 0.8));

  if (needsReview) {
    await update((s) => {
      s.reviews.unshift({ id: 'r' + Date.now(), at: Date.now(), medicines, legible });
      s.reviews = s.reviews.slice(0, 20);
    });
  }
  return Response.json({ source, legible, medicines, needsReview });
}

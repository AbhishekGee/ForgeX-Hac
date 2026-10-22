import { ask, hasClaude } from '../../../lib/claude.js';
import { groundedOk, sourceFor } from '../../../lib/instructions.js';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const SYSTEM = `You rewrite approved medicine label text into short, plain language for a patient.
Rules: use ONLY the facts in the provided text. Add no doses, numbers, warnings or advice that are not in it.
Keep numbers as ASCII digits. Reply with the rewritten text only, 2 to 3 short sentences, in the requested language.`;

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const language = body.language === 'hi' ? 'Hindi' : 'English';
  const entries = [];
  for (const key of (body.keys || []).map(String).slice(0, 10)) {
    const source = sourceFor(key);
    let text = source;
    let via = 'approved';
    if (hasClaude()) {
      try {
        const out = (await ask({ system: SYSTEM, maxTokens: 300, content: `Language: ${language}\nMedicine: ${key}\nApproved text: ${source}` })).trim();
        if (out && groundedOk(out, source)) {
          text = out;
          via = 'claude';
        }
      } catch {}
    }
    entries.push({ key, text, via });
  }
  return Response.json({
    entries,
    note: 'Demo text. A pharmacist must approve the wording before real use. This is not medical advice.',
  });
}

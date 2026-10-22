import Anthropic from '@anthropic-ai/sdk';

export const hasClaude = () => Boolean(process.env.ANTHROPIC_API_KEY);
const model = () => process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';

let client;
export async function ask({ system, content, maxTokens = 800 }) {
  client ??= new Anthropic();
  const msg = await client.messages.create({
    model: model(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  });
  return msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export function parseJson(text) {
  const m = String(text).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    return JSON.parse(m[0]);
  } catch {
    return null;
  }
}

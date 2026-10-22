import { Redis } from '@upstash/redis';
import { seedState } from './shops.js';

const KEY = 'lmm:state';
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

export const storeMode = redis ? 'redis' : 'memory';

export async function getState() {
  let s = redis ? await redis.get(KEY) : globalThis.__lmm;
  if (!s) {
    s = seedState();
    await setState(s);
  }
  return s;
}

export async function setState(s) {
  if (redis) await redis.set(KEY, s);
  else globalThis.__lmm = s;
}

// Read-modify-write. Fine for a demo; use per-key writes or a database before real traffic.
export async function update(fn) {
  const s = await getState();
  const result = await fn(s);
  await setState(s);
  return result;
}

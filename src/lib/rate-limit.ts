import "server-only";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

/** Best-effort per-process limiter. On serverless hosts each instance has its own bucket. */
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  store.forEach((entry, storedKey) => { if (entry.resetAt <= now) store.delete(storedKey); });
  if (store.size > 10_000) store.delete(store.keys().next().value as string);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (entry.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)) };
  }
  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function requestIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",");
  const ip = (forwarded ? forwarded[forwarded.length - 1] : "")?.trim() || "unknown";
  return ip.slice(0, 128);
}

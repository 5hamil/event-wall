export function getSiteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("Set SITE_URL to the canonical public website origin.");
  const url = new URL(value);
  if (process.env.VERCEL === "1" && url.protocol !== "https:") {
    throw new Error("SITE_URL must use HTTPS in production.");
  }
  return url.origin;
}

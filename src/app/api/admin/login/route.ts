import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, requestIp } from "@/lib/rate-limit";

const windowMs = 15 * 60 * 1000;

export async function POST(request: Request) {
  const ip = requestIp(request);
  let body: { email?: unknown; password?: unknown };
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Enter your email and password." }, { status: 400 }); }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || email.length > 254 || !/^\S+@\S+\.\S+$/.test(email) || !password || password.length > 1024) return NextResponse.json({ error: "Enter a valid email and password." }, { status: 400 });

  const ipLimit = rateLimit(`admin-login-ip:${ip}`, 20, windowMs);
  if (!ipLimit.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } });
  const accountLimit = rateLimit(`admin-login-account:${ip}:${email}`, 5, windowMs);
  if (!accountLimit.allowed) return NextResponse.json({ error: "Too many sign-in attempts. Try again later." }, { status: 429, headers: { "Retry-After": String(accountLimit.retryAfterSeconds) } });

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });

  const { data: admin, error: adminError } = await supabase.from("admins").select("id").eq("user_id", data.user.id).maybeSingle();
  if (adminError || !admin) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: "This account is not authorized as an Event Wall admin." }, { status: 403 });
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rateLimit, requestIp } from "@/lib/rate-limit";

function campusToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export async function POST(request: Request) {
  const ip = requestIp(request);
  const ipLimit = rateLimit(`club-event-create-ip:${ip}`, 30, 60 * 60 * 1000);
  if (!ipLimit.allowed) return NextResponse.json({ error: "Too many event submissions. Try again later." }, { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } });

  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in to create an event." }, { status: 401 });
  const { data: account, error: accountError } = await supabase.from("club_accounts").select("club_id").eq("user_id", user.id).maybeSingle();
  if (accountError || !account) return NextResponse.json({ error: "This account is not linked to a club." }, { status: 403 });
  const clubLimit = rateLimit(`club-event-create:${account.club_id}`, 10, 60 * 60 * 1000);
  if (!clubLimit.allowed) return NextResponse.json({ error: "Your club has submitted several events recently. Try again later." }, { status: 429, headers: { "Retry-After": String(clubLimit.retryAfterSeconds) } });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid event submission." }, { status: 400 }); }
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const eventDate = typeof body.event_date === "string" ? body.event_date : "";
  const status = body.status === "pending" ? "pending" : body.status === "draft" ? "draft" : null;
  if (!title || title.length > 180) return NextResponse.json({ error: "Enter an event title up to 180 characters." }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) || Number.isNaN(Date.parse(`${eventDate}T00:00:00Z`)) || new Date(`${eventDate}T00:00:00Z`).toISOString().slice(0, 10) !== eventDate) return NextResponse.json({ error: "Choose a valid event date." }, { status: 400 });
  if (eventDate < campusToday()) return NextResponse.json({ error: "New events must be scheduled for today or a future date." }, { status: 400 });
  if (!status) return NextResponse.json({ error: "Choose draft or pending status." }, { status: 400 });
  const registrationLink = typeof body.registration_link === "string" && body.registration_link ? body.registration_link : null;
  if (registrationLink) {
    try { const parsed = new URL(registrationLink); if (!["http:", "https:"].includes(parsed.protocol)) throw new Error(); }
    catch { return NextResponse.json({ error: "Enter a complete registration URL starting with https:// or http://." }, { status: 400 }); }
  }

  const { data, error } = await supabase.from("events").insert({
    club_id: account.club_id,
    title,
    description: typeof body.description === "string" ? body.description.trim() || null : null,
    poster_url: typeof body.poster_url === "string" ? body.poster_url : null,
    event_date: eventDate,
    event_time: typeof body.event_time === "string" ? body.event_time || null : null,
    venue: typeof body.venue === "string" ? body.venue.trim() || null : null,
    category_id: typeof body.category_id === "string" ? body.category_id || null : null,
    registration_link: registrationLink,
    contact_details: typeof body.contact_details === "string" ? body.contact_details.trim() || null : null,
    status,
    rejection_reason: null,
  }).select("id").maybeSingle();
  if (error || !data) return NextResponse.json({ error: error?.message ?? "Could not create the event." }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}

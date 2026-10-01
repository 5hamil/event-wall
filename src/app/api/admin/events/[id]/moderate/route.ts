import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

type EventStatus = "approved" | "rejected" | "archived";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return NextResponse.json({ error: "Sign in as an administrator to moderate events." }, { status: 401 });

  let body: { status?: unknown; rejection_reason?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid moderation request." }, { status: 400 });
  }

  const status = body.status;
  if (status !== "approved" && status !== "rejected" && status !== "archived") {
    return NextResponse.json({ error: "Choose a valid event status." }, { status: 400 });
  }

  const rejectionReason = typeof body.rejection_reason === "string" ? body.rejection_reason.trim() : "";
  if (status === "rejected" && !rejectionReason) {
    return NextResponse.json({ error: "Enter a reason so the club knows what to change." }, { status: 400 });
  }

  // Use the database's security-definer check with this cookie-bound session.
  // It checks auth.uid() against admins without relying on an admins SELECT
  // policy, so authorization behaves consistently for every event/club.
  const { data: isAdmin, error: adminCheckError } = await supabase.rpc("is_event_wall_admin");
  if (adminCheckError) return NextResponse.json({ error: "Could not verify administrator access. Refresh and try again." }, { status: 500 });
  if (isAdmin !== true) return NextResponse.json({ error: "This account is not authorized to moderate events." }, { status: 403 });

  const service = createServiceClient();
  const { data: event, error: updateError } = await service
    .from("events")
    .update({
      status: status as EventStatus,
      rejection_reason: status === "rejected" ? rejectionReason : null,
    })
    .eq("id", params.id)
    .select("id")
    .maybeSingle();

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });
  if (!event) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  return NextResponse.json({ ok: true });
}

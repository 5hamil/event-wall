import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    // Keep diagnostics useful without ever logging a session token or cookie value.
    console.error("[admin/verify] Session lookup failed:", userError?.message ?? "No user in request session.");
    return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  }

  const { data: admin, error } = await supabase
    .from("admins")
    .select("id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (error || !admin) {
    return NextResponse.json({ error: "This account is not authorized as an Event Wall admin." }, { status: 403 });
  }

  return NextResponse.json({ ok: true });
}

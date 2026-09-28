import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    // Keep diagnostics useful without exposing the session token or cookie values.
    console.error("[club/verify] Session lookup failed:", userError?.message ?? "No user in request session.");
    return NextResponse.json({ error: "Your session could not be verified." }, { status: 401 });
  }

  const { data: account, error } = await supabase
    .from("club_accounts")
    .select("club_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !account) {
    return NextResponse.json(
      { error: "This account is not linked to a club, or the club portal migration has not been applied." },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, clubId: account.club_id });
}

import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireClubAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/club/login");

  const { data: account, error } = await supabase
    .from("club_accounts")
    .select("club_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !account) redirect("/club/login");

  return { supabase, user, clubId: account.club_id };
}

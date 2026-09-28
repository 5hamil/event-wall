import { createClient } from "@/lib/supabase/server";
import { ClubsManager, type Club } from "./clubs-manager";

export default async function AdminClubsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("id, name, slug, logo_url, description, contact_email, contact_phone, is_active, created_at")
    .order("created_at", { ascending: false });

  return <ClubsManager clubs={(data ?? []) as Club[]} loadError={error?.message ?? null} />;
}

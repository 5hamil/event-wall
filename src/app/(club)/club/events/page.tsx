import { requireClubAccount } from "@/lib/club-auth";
import { EventsManager, type ClubEvent } from "./events-manager";

export default async function ClubEventsPage() {
  const { supabase, clubId } = await requireClubAccount();
  const { data, error } = await supabase
    .from("events")
    .select("id, title, description, poster_url, event_date, event_time, venue, category_id, registration_link, contact_details, status, rejection_reason, created_at")
    .eq("club_id", clubId)
    .order("event_date", { ascending: true });

  if (error) {
    return <div className="rounded-card bg-white p-6 text-sm text-red-700 shadow-subtle">Could not load events: {error.message}</div>;
  }

  return <EventsManager events={(data ?? []) as ClubEvent[]} clubId={clubId} />;
}

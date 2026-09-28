import { notFound, redirect } from "next/navigation";
import { requireClubAccount } from "@/lib/club-auth";
import { EventForm } from "../../event-form";
import type { ClubEvent } from "../../events-manager";

export default async function EditClubEventPage({ params }: { params: { id: string } }) {
  const { supabase, clubId } = await requireClubAccount();
  const [eventResult, categoriesResult] = await Promise.all([
    supabase.from("events").select("id, title, description, poster_url, event_date, event_time, venue, category_id, registration_link, contact_details, status, rejection_reason, created_at").eq("id", params.id).eq("club_id", clubId).maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  if (eventResult.error || categoriesResult.error) notFound();
  if (!eventResult.data) notFound();
  if (!["draft", "pending", "rejected"].includes(eventResult.data.status)) redirect("/club/events");

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">UPDATE LISTING</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Edit Event</h1>
      <p className="mt-2 text-sm text-muted">Update the event details or resubmit it for approval.</p>
      <div className="mt-7 rounded-card bg-white p-6 shadow-subtle sm:p-8"><EventForm event={eventResult.data as ClubEvent} categories={categoriesResult.data ?? []} /></div>
    </div>
  );
}

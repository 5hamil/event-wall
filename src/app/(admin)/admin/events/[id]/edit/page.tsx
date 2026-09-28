import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminEventForm } from "./admin-event-form";

export default async function EditAdminEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [eventResult, clubsResult, categoriesResult] = await Promise.all([
    supabase.from("events").select("id, club_id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details, status, rejection_reason").eq("id", params.id).maybeSingle(),
    supabase.from("clubs").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  if (eventResult.error || !eventResult.data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin/events/${params.id}`} className="text-sm font-semibold text-muted hover:text-accent">← Back to event review</Link>
      <p className="mt-5 text-xs font-bold uppercase tracking-[.18em] text-accent">ADMIN EDIT</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Edit event</h1>
      <p className="mt-2 text-sm text-muted">Administrators can correct any event field and its moderation status.</p>
      {(clubsResult.error || categoriesResult.error) && <p role="alert" className="mt-5 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Some club or category choices could not be loaded.</p>}
      <section className="mt-6 rounded-card bg-white p-5 shadow-subtle sm:p-7">
        <AdminEventForm event={eventResult.data} clubs={clubsResult.data ?? []} categories={categoriesResult.data ?? []} />
      </section>
    </div>
  );
}

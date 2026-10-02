import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminEventForm } from "./admin-event-form";

export default async function EditAdminEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [eventResult, clubsResult, categoriesResult] = await Promise.all([
    supabase.from("events").select("id, club_id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details, status").eq("id", params.id).maybeSingle(),
    supabase.from("clubs").select("id, name").order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  if (eventResult.error || !eventResult.data) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/admin/events/${params.id}`} className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-2 text-xs font-semibold text-muted shadow-sm backdrop-blur transition hover:text-accent">← Back to event</Link>
      <p className="mt-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Admin edit</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Edit event</h1>
      <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Administrators can edit any event field and change its publication status.</p>
      {(clubsResult.error || categoriesResult.error) && <p role="alert" className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">Some club or category choices could not be loaded.</p>}
      <section className="mt-6 rounded-[24px] border border-white/90 bg-white/75 p-5 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl sm:p-7">
        <AdminEventForm event={eventResult.data} clubs={clubsResult.data ?? []} categories={categoriesResult.data ?? []} />
      </section>
    </div>
  );
}

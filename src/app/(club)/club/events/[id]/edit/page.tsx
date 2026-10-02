import { notFound } from "next/navigation";
import Link from "next/link";
import { requireClubAccount } from "@/lib/club-auth";
import { EventForm } from "../../event-form";
import type { ClubEvent } from "../../events-manager";

export default async function EditClubEventPage({ params }: { params: { id: string } }) {
  const { supabase, clubId } = await requireClubAccount();
  const [eventResult, categoriesResult] = await Promise.all([
    supabase.from("events").select("id, title, description, poster_url, event_date, event_time, venue, category_id, registration_link, contact_details, status, created_at").eq("id", params.id).eq("club_id", clubId).maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  if (eventResult.error || categoriesResult.error) notFound();
  if (!eventResult.data) notFound();
  if (eventResult.data.status !== "draft") {
    return (
      <div className="mx-auto max-w-3xl">
        <Link href="/club/events" className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-2 text-xs font-semibold text-muted shadow-sm backdrop-blur transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span aria-hidden="true">←</span> My events</Link>
        <section className="mt-7 rounded-[24px] border border-white/90 bg-white/75 p-6 shadow-subtle backdrop-blur-xl sm:p-8">
          <p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent">{eventResult.data.status === "published" ? "Published event" : "Archived event"}</p>
          <h1 className="mt-2 font-heading text-2xl font-extrabold tracking-tight">{eventResult.data.title}</h1>
          <p className="mt-3 text-sm leading-6 text-muted">{eventResult.data.status === "published" ? "This event is live on the campus wall. Contact an administrator to make changes or take it down." : "This event is archived and can only be changed by an administrator."}</p>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/club/events" className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-2 text-xs font-semibold text-muted shadow-sm backdrop-blur transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span aria-hidden="true">←</span> My events</Link>
      <p className="mt-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Update listing</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Edit event</h1>
      <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Update this draft, or publish it to make it visible on the campus event wall.</p>
      <div className="mt-7 rounded-[24px] border border-white/90 bg-white/75 p-5 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl sm:p-8"><EventForm event={eventResult.data as ClubEvent} categories={categoriesResult.data ?? []} /></div>
    </div>
  );
}

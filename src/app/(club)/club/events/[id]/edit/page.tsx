import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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
      <Link href="/club/events" className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-2 text-xs font-semibold text-muted shadow-sm backdrop-blur transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span aria-hidden="true">←</span> My events</Link>
      <p className="mt-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Update listing</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Edit event</h1>
      <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Update the event details or resubmit it for approval.</p>
      <div className="mt-7 rounded-[24px] border border-white/90 bg-white/75 p-5 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl sm:p-8"><EventForm event={eventResult.data as ClubEvent} categories={categoriesResult.data ?? []} /></div>
    </div>
  );
}

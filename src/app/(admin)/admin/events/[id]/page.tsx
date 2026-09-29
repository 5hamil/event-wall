import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminEventActions } from "./event-actions";

function formatDate(date: string, time?: string | null) {
  const label = new Intl.DateTimeFormat("en", {
    weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  return time ? `${label} · ${time.slice(0, 5)}` : label;
}

export default async function AdminEventDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: event, error } = await supabase
    .from("events")
    .select("id, club_id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details, status, rejection_reason, created_at, updated_at")
    .eq("id", params.id)
    .maybeSingle();
  if (error || !event) notFound();

  const [clubResult, categoryResult] = await Promise.all([
    supabase.from("clubs").select("name, logo_url").eq("id", event.club_id).maybeSingle(),
    event.category_id ? supabase.from("categories").select("name").eq("id", event.category_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link href="/admin/events" className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-2 text-xs font-semibold text-muted shadow-sm backdrop-blur transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">← All events</Link>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Event review</p>
          <h1 className="mt-2 break-words font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">{event.title}</h1>
          <p className="mt-2 text-sm text-muted">{clubResult.data?.name ?? "Unknown club"} · Submitted {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(event.created_at))}</p>
        </div>
        <Link href={`/admin/events/${event.id}/edit`} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#e9e7ef] bg-white/80 px-5 text-sm font-semibold text-foreground transition hover:border-accent/25 hover:text-accent">Edit event</Link>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <article className="overflow-hidden rounded-[24px] border border-white/90 bg-white/75 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl">
          {event.poster_url ? <div className="relative aspect-[16/8] bg-neutral-100"><Image src={event.poster_url} alt={`${event.title} poster`} fill sizes="(max-width: 1024px) 100vw, 700px" unoptimized className="object-cover" /></div> : <div className="grid aspect-[16/6] place-items-center bg-neutral-100 text-sm text-muted">No event poster</div>}
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted"><span>{formatDate(event.event_date, event.event_time)}</span><span aria-hidden="true">·</span><span>{event.venue || "Venue to be announced"}</span></div>
            <p className="mt-4 text-xs font-semibold uppercase tracking-[.16em] text-accent">{categoryResult.data?.name ?? "Campus event"}</p>
            <h2 className="mt-2 font-heading text-2xl font-bold">{event.title}</h2>
            {event.description ? <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-muted">{event.description}</p> : <p className="mt-4 text-sm italic text-muted">No description provided.</p>}
            {event.registration_link && <a href={event.registration_link} target="_blank" rel="noreferrer" className="mt-6 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">Register for this event ↗</a>}
            {event.contact_details && <div className="mt-7 border-t border-border pt-5"><h3 className="text-xs font-bold uppercase tracking-wide text-muted">Contact</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{event.contact_details}</p></div>}
          </div>
        </article>

        <aside className="space-y-4">
          <AdminEventActions eventId={event.id} status={event.status} initialReason={event.rejection_reason} />
          <section className="rounded-[22px] border border-white/90 bg-white/70 p-5 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl">
            <p className="text-[10px] font-bold uppercase tracking-[.15em] text-muted">Event details</p>
            <p className="mt-2 font-heading font-bold">{clubResult.data?.name ?? "Unknown club"}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Category</p>
            <p className="mt-2 text-sm">{categoryResult.data?.name ?? "Uncategorized"}</p>
            <p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Status</p>
            <p className="mt-2 text-sm font-semibold capitalize">{event.status}</p>
            {event.rejection_reason && <><p className="mt-4 text-xs font-bold uppercase tracking-wide text-muted">Rejection reason</p><p className="mt-2 rounded-lg bg-red-50 p-3 text-sm leading-6 text-red-800">{event.rejection_reason}</p></>}
          </section>
        </aside>
      </div>
    </div>
  );
}

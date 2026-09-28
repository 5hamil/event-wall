"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";

export type EventStatus = "draft" | "pending" | "approved" | "rejected" | "archived";
export type ClubEvent = {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  category_id: string | null;
  registration_link: string | null;
  contact_details: string | null;
  status: EventStatus;
  rejection_reason: string | null;
  created_at: string;
};

const statusClasses: Record<EventStatus, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  archived: "bg-neutral-100 text-neutral-600",
};

function displayDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T00:00:00Z`));
}

export function EventsManager({ events, clubId }: { events: ClubEvent[]; clubId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const supabase = createClient();

  async function remove(event: ClubEvent) {
    if (event.status !== "draft" || !window.confirm(`Delete the draft “${event.title}”?`)) return;
    setBusyId(event.id);
    setError("");
    const { error: deleteError } = await supabase.from("events").delete().eq("id", event.id).eq("club_id", clubId);
    if (deleteError) { setError(deleteError.message); toast(deleteError.message, "error"); }
    else { toast("Draft deleted."); router.refresh(); }
    setBusyId("");
  }

  async function duplicate(event: ClubEvent) {
    setBusyId(event.id);
    setError("");
    const { error: duplicateError } = await supabase.from("events").insert({
      club_id: clubId,
      title: `${event.title} (copy)`,
      description: event.description,
      poster_url: event.poster_url,
      event_date: event.event_date,
      event_time: event.event_time,
      venue: event.venue,
      category_id: event.category_id,
      registration_link: event.registration_link,
      contact_details: event.contact_details,
      status: "draft",
      rejection_reason: null,
    });
    if (duplicateError) { setError(duplicateError.message); toast(duplicateError.message, "error"); }
    else { toast("Draft copy created."); router.refresh(); }
    setBusyId("");
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">CLUB WORKSPACE</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">My Events</h1><p className="mt-2 text-sm text-muted">Create events, track reviews, and keep your listings current.</p></div>
        <Link href="/club/events/new" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-subtle hover:bg-accent-dark">Create event <span aria-hidden="true">＋</span></Link>
      </div>
      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-7 space-y-3">
        {events.map((event) => <article key={event.id} className="rounded-card bg-white p-5 shadow-subtle sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2.5"><h2 className="font-heading text-lg font-bold">{event.title}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${statusClasses[event.status]}`}>{event.status}</span></div><p className="mt-2 text-sm text-muted">{displayDate(event.event_date)}{event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}{event.venue ? ` · ${event.venue}` : ""}</p>
              {event.status === "rejected" && event.rejection_reason && <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm leading-6 text-red-800"><span className="font-semibold">Rejection note:</span> {event.rejection_reason}</p>}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              {(["draft", "pending", "rejected"] as EventStatus[]).includes(event.status) && <Link href={`/club/events/${event.id}/edit`} className="rounded-lg px-3 py-2 text-xs font-semibold text-accent hover:bg-violet-50">Edit</Link>}
              <button disabled={busyId === event.id} onClick={() => void duplicate(event)} className="rounded-lg px-3 py-2 text-xs font-semibold text-muted hover:bg-background disabled:opacity-60">{busyId === event.id ? "Working…" : "Duplicate"}</button>
              {event.status === "draft" && <button disabled={busyId === event.id} onClick={() => void remove(event)} className="rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60">Delete</button>}
            </div>
          </div>
        </article>)}
        {events.length === 0 && <div className="rounded-card bg-white px-6 py-14 text-center shadow-subtle"><p className="font-heading text-lg font-bold">Your events will show up here</p><p className="mt-1 text-sm text-muted">Start with a draft or submit an event for approval.</p><Link href="/club/events/new" className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">Create your first event</Link></div>}
      </div>
    </div>
  );
}

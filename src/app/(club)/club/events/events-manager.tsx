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
  draft: "border border-slate-200 bg-slate-50 text-slate-600",
  pending: "border border-amber-200 bg-amber-50 text-amber-800",
  approved: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border border-rose-200 bg-rose-50 text-rose-700",
  archived: "border border-slate-200 bg-slate-50 text-slate-500",
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
  const approvedCount = events.filter((event) => event.status === "approved").length;
  const pendingCount = events.filter((event) => event.status === "pending").length;
  const draftCount = events.filter((event) => event.status === "draft").length;

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
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Club workspace</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">My Events</h1><p className="mt-2 max-w-xl text-sm leading-6 text-muted sm:text-base">Create events, track reviews, and keep your listings current.</p></div>
        <Link href="/club/events/new" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_9px_24px_rgba(109,92,232,0.22)] transition duration-200 hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-[0_14px_30px_rgba(109,92,232,0.26)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Create event <span aria-hidden="true" className="text-lg leading-none">＋</span></Link>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[{ label: "Total events", value: events.length, color: "text-foreground", icon: "◷" }, { label: "Approved", value: approvedCount, color: "text-emerald-700", icon: "✓" }, { label: "In review", value: pendingCount, color: "text-amber-700", icon: "↗" }].map((stat) => <div key={stat.label} className="flex items-center gap-3 rounded-[18px] border border-white/90 bg-white/65 px-4 py-3.5 shadow-[0_8px_24px_rgba(28,24,52,0.035)] backdrop-blur-xl sm:px-5"><span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-[14px] bg-violet-50 text-sm font-bold text-accent">{stat.icon}</span><div><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{stat.label}</p><p className={`mt-0.5 font-heading text-xl font-bold ${stat.color}`}>{stat.value}</p></div></div>)}
      </div>

      {error && <p role="alert" className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mt-9">
        <div className="mb-4 flex items-center justify-between gap-4"><h2 className="font-heading text-lg font-bold tracking-tight">Your listings</h2><span className="text-xs text-muted">{draftCount} {draftCount === 1 ? "draft" : "drafts"}</span></div>
        <div className="space-y-3.5">
        {events.map((event) => <article key={event.id} className="group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/70 p-4 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl transition duration-200 hover:border-accent/15 hover:bg-white/90 hover:shadow-[0_16px_40px_rgba(28,24,52,0.075)] sm:p-5">
          <span aria-hidden="true" className={`absolute bottom-4 left-0 top-4 w-[3px] rounded-r-full ${event.status === "approved" ? "bg-emerald-400" : event.status === "pending" ? "bg-amber-400" : event.status === "rejected" ? "bg-rose-400" : "bg-slate-300"}`} />
          <div className="flex flex-col gap-4 pl-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3.5">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-[15px] bg-gradient-to-br from-violet-50 to-indigo-50 text-center">
                <div><span className="block font-heading text-lg font-extrabold leading-none text-accent">{new Date(`${event.event_date}T00:00:00Z`).getUTCDate()}</span><span className="mt-1 block text-[8px] font-bold uppercase tracking-[.12em] text-muted">{new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${event.event_date}T00:00:00Z`))}</span></div>
              </div>
              <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2.5"><h3 className="break-words font-heading text-base font-bold tracking-tight sm:text-lg">{event.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold capitalize ${statusClasses[event.status]}`}>{event.status}</span></div><p className="mt-1.5 break-words text-xs leading-5 text-muted sm:text-sm">{displayDate(event.event_date)}{event.event_time ? ` · ${event.event_time.slice(0, 5)}` : ""}{event.venue ? ` · ${event.venue}` : ""}</p>
              {event.status === "rejected" && event.rejection_reason && <p className="mt-3 rounded-xl border border-rose-100 bg-rose-50/80 px-3.5 py-2.5 text-xs leading-5 text-rose-800 sm:text-sm"><span className="font-semibold">Review note:</span> {event.rejection_reason}</p>}
            </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
              {(["draft", "pending", "rejected"] as EventStatus[]).includes(event.status) && <Link href={`/club/events/${event.id}/edit`} className="inline-flex min-h-9 items-center rounded-full border border-accent/15 bg-violet-50/70 px-3.5 text-xs font-semibold text-accent transition hover:bg-violet-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Edit</Link>}
              <button disabled={busyId === event.id} onClick={() => void duplicate(event)} className="inline-flex min-h-9 items-center rounded-full border border-[#eceaf1] bg-white/80 px-3.5 text-xs font-semibold text-muted transition hover:border-accent/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60">{busyId === event.id ? "Working…" : "Duplicate"}</button>
              {event.status === "draft" && <button disabled={busyId === event.id} onClick={() => void remove(event)} className="inline-flex min-h-9 items-center rounded-full border border-rose-100 bg-rose-50/70 px-3.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-60">Delete</button>}
            </div>
          </div>
        </article>)}
        {events.length === 0 && <div className="rounded-[24px] border border-white/90 bg-white/65 px-6 py-14 text-center shadow-[0_12px_36px_rgba(28,24,52,0.045)] backdrop-blur-xl"><span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl text-accent">✳</span><p className="mt-4 font-heading text-lg font-bold">Your events will show up here</p><p className="mt-1 text-sm text-muted">Start with a draft or submit an event for approval.</p><Link href="/club/events/new" className="mt-5 inline-flex min-h-10 items-center rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-dark">Create your first event <span aria-hidden="true" className="ml-2">＋</span></Link></div>}
        </div>
      </div>
    </div>
  );
}

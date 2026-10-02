"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type Status = "draft" | "published" | "archived";

export function AdminEventActions({ eventId, status }: { eventId: string; status: Status }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(nextStatus: Status) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/events/${eventId}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "The event could not be updated.");
      toast(nextStatus === "published" ? "Event published." : nextStatus === "archived" ? "Event archived." : "Event saved as a draft.");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The event could not be updated.";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm("Permanently delete this event? This cannot be undone.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/events/${eventId}/moderate`, { method: "DELETE" });
      const result = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(result?.error ?? "The event could not be deleted.");
      toast("Event deleted.");
      router.push("/admin/events");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The event could not be deleted.";
      setError(message);
      toast(message, "error");
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[22px] border border-white/90 bg-white/75 p-5 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">Event controls</p>
      {status === "published" ? <div className="mt-4"><p className="text-sm leading-6 text-muted">This event is live on the public wall. Clubs can no longer change it.</p><button disabled={busy} onClick={() => void update("archived")} className="mt-4 min-h-11 w-full rounded-full border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60">{busy ? "Saving…" : "Unpublish / archive event"}</button></div> : status === "archived" ? <div className="mt-4"><p className="text-sm leading-6 text-muted">This event is archived and hidden from public listings.</p><button disabled={busy} onClick={() => void update("published")} className="mt-4 min-h-11 w-full rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60">{busy ? "Saving…" : "Publish event"}</button></div> : <div className="mt-4"><p className="text-sm leading-6 text-muted">This event is a draft and is not visible to students.</p><button disabled={busy} onClick={() => void update("published")} className="mt-4 min-h-11 w-full rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60">{busy ? "Saving…" : "Publish event"}</button></div>}
      <button disabled={busy} onClick={() => void remove()} className="mt-3 min-h-11 w-full rounded-full border border-rose-200 bg-rose-50 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">Delete event</button>
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
    </section>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";

type Status = "draft" | "pending" | "approved" | "rejected" | "archived";

export function AdminEventActions({ eventId, status, initialReason }: { eventId: string; status: Status; initialReason: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [reason, setReason] = useState(initialReason ?? "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function update(values: { status: Status; rejection_reason: string | null }) {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase.from("events").update(values).eq("id", eventId).select("id").maybeSingle();
      if (updateError || !data) throw new Error(updateError?.message ?? "The event could not be updated.");
      setReason(values.rejection_reason ?? "");
      toast(values.status === "approved" ? "Event approved." : values.status === "rejected" ? "Event rejected and reason saved." : "Event archived.");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The event could not be updated.";
      setError(message);
      toast(message, "error");
    } finally {
      setBusy(false);
    }
  }

  function reject() {
    const trimmed = reason.trim();
    if (!trimmed) {
      setError("Enter a reason so the club knows what to change.");
      return;
    }
    void update({ status: "rejected", rejection_reason: trimmed });
  }

  return (
    <section className="rounded-[22px] border border-white/90 bg-white/75 p-5 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl">
      <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">Moderation</p>
      {status === "archived" ? <div className="mt-4"><p className="text-sm leading-6 text-muted">This event is archived and hidden from public listings.</p><button disabled={busy} onClick={() => void update({ status: "approved", rejection_reason: null })} className="mt-4 min-h-11 w-full rounded-full bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:opacity-60">{busy ? "Saving…" : "Restore as approved"}</button></div> : <>
        <button disabled={busy} onClick={() => void update({ status: "approved", rejection_reason: null })} className="mt-4 min-h-11 w-full rounded-full bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60">{busy ? "Saving…" : "Approve event"}</button>
        <label className="mt-5 block text-sm font-semibold">Reason for rejection<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder="Explain what the club should update…" className="mt-2 w-full resize-y rounded-2xl border border-[#e9e7ef] bg-white/85 px-3.5 py-3 text-sm font-normal leading-6 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
        <button disabled={busy} onClick={reject} className="mt-3 min-h-11 w-full rounded-full border border-rose-200 bg-rose-50/70 px-4 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60">{busy ? "Saving…" : "Reject with reason"}</button>
        {status === "approved" && <button disabled={busy} onClick={() => void update({ status: "archived", rejection_reason: null })} className="mt-3 min-h-11 w-full rounded-full border border-[#e9e7ef] bg-white/70 px-4 text-sm font-semibold text-muted transition hover:bg-[#f7f6fa] disabled:opacity-60">Archive cancelled event</button>}
      </>}
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2.5 text-sm text-red-700">{error}</p>}
    </section>
  );
}

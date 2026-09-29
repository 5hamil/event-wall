"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";

type EventValue = {
  id: string; club_id: string; category_id: string | null; title: string; description: string | null;
  poster_url: string | null; event_date: string; event_time: string | null; venue: string | null;
  registration_link: string | null; contact_details: string | null;
  status: "draft" | "pending" | "approved" | "rejected" | "archived"; rejection_reason: string | null;
};
type Option = { id: string; name: string };

export function AdminEventForm({ event, clubs, categories }: { event: EventValue; clubs: Option[]; categories: Option[] }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(formEvent.currentTarget);
    const read = (key: string) => String(form.get(key) ?? "").trim();
    const title = read("title");
    const registrationInput = read("registration_link");
    const status = read("status") as EventValue["status"];
    let registrationLink: string | null = null;
    if (registrationInput) {
      try {
        const parsed = new URL(registrationInput);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
        registrationLink = parsed.toString();
      } catch {
        setError("Enter a complete registration URL starting with https:// or http://.");
        setSaving(false);
        return;
      }
    }
    const rejectionReason = read("rejection_reason");
    if (status === "rejected" && !rejectionReason) {
      setError("A rejection reason is required when setting status to rejected.");
      setSaving(false);
      return;
    }
    if (!title) {
      setError("Enter an event title.");
      setSaving(false);
      return;
    }
    if (!read("event_date")) { setError("Choose an event date."); setSaving(false); return; }

    try {
      const supabase = createClient();
      const { data, error: updateError } = await supabase.from("events").update({
        club_id: read("club_id"),
        title,
        description: read("description") || null,
        poster_url: read("poster_url") || null,
        event_date: read("event_date"),
        event_time: read("event_time") || null,
        venue: read("venue") || null,
        category_id: read("category_id") || null,
        registration_link: registrationLink,
        contact_details: read("contact_details") || null,
        status,
        rejection_reason: status === "rejected" ? rejectionReason : null,
      }).eq("id", event.id).select("id").maybeSingle();
      if (updateError || !data) throw new Error(updateError?.message ?? "The event could not be updated.");
      toast("Event changes saved.");
      router.push(`/admin/events/${event.id}`);
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The event could not be updated.";
      setError(message); toast(message, "error");
      setSaving(false);
      return;
    }
    setSaving(false);
  }

  const inputClass = "mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white/85 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 hover:border-accent/25 focus:border-accent focus:ring-4 focus:ring-accent/10";
  return (
    <form onSubmit={save} className="space-y-6">
      <label className="block text-sm font-semibold">Club<select name="club_id" required defaultValue={event.club_id} className={inputClass}>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
      <label className="block text-sm font-semibold">Title<input required name="title" maxLength={180} defaultValue={event.title} className={inputClass} /></label>
      <label className="block text-sm font-semibold">Description<textarea name="description" rows={5} defaultValue={event.description ?? ""} className={`${inputClass} resize-y leading-6`} /></label>
      <label className="block text-sm font-medium">Poster URL<input name="poster_url" type="url" defaultValue={event.poster_url ?? ""} placeholder="https://…" className={inputClass} /></label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">Event date<input required name="event_date" type="date" defaultValue={event.event_date} className={inputClass} /></label>
        <label className="block text-sm font-semibold">Event time<input name="event_time" type="time" defaultValue={event.event_time?.slice(0, 5) ?? ""} className={inputClass} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold">Venue<input name="venue" defaultValue={event.venue ?? ""} className={inputClass} /></label>
      <label className="block text-sm font-semibold">Category<select name="category_id" defaultValue={event.category_id ?? ""} className={inputClass}><option value="">Uncategorized</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label></div>
      <label className="block text-sm font-semibold">Registration URL<input name="registration_link" type="url" defaultValue={event.registration_link ?? ""} placeholder="https://…" className={inputClass} /></label>
      <label className="block text-sm font-semibold">Contact details<textarea name="contact_details" rows={3} defaultValue={event.contact_details ?? ""} className={`${inputClass} resize-y leading-6`} /></label>
      <label className="block text-sm font-semibold">Status<select name="status" defaultValue={event.status} className={inputClass}><option value="draft">Draft</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="archived">Archived</option></select></label>
      <label className="block text-sm font-semibold">Rejection reason<textarea name="rejection_reason" rows={3} defaultValue={event.rejection_reason ?? ""} className={`${inputClass} resize-y leading-6`} /><span className="mt-2 block text-xs font-normal text-muted">Required when status is Rejected.</span></label>
      {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex justify-end border-t border-[#eeecf2] pt-5"><button disabled={saving} className="min-h-11 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(109,92,232,0.2)] transition hover:bg-accent-dark disabled:opacity-60 sm:w-auto">{saving ? "Saving…" : "Save event changes"}</button></div>
    </form>
  );
}

"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useClubContext } from "../club-context";
import type { ClubEvent } from "./events-manager";
import { useToast } from "@/components/toast-provider";

type CategoryOption = { id: string; name: string };
const posterExtensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export function EventForm({ event, categories }: { event?: ClubEvent; categories: CategoryOption[] }) {
  const router = useRouter();
  const toast = useToast();
  const { clubId } = useClubContext();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [posterPreview, setPosterPreview] = useState(event?.poster_url ?? "");

  async function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setError("");
    setSaving(true);
    const form = new FormData(formEvent.currentTarget);
    const submitter = (formEvent.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const status = submitter?.value === "pending" ? "pending" : "draft";
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const eventDate = String(form.get("event_date") ?? "");
    const eventTime = String(form.get("event_time") ?? "");
    const venue = String(form.get("venue") ?? "").trim();
    const categoryId = String(form.get("category_id") ?? "");
    const registrationInput = String(form.get("registration_link") ?? "").trim();
    const contactDetails = String(form.get("contact_details") ?? "").trim();
    const poster = form.get("poster");

    if (!title) { setError("Enter an event title."); setSaving(false); return; }
    if (!eventDate) { setError("Choose an event date."); setSaving(false); return; }
    if (!event && eventDate < new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date())) {
      setError("New events must be scheduled for today or a future date."); setSaving(false); return;
    }

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

    const supabase = createClient();
    let posterUrl = event?.poster_url ?? null;
    let uploadedPath: string | null = null;
    try {
      if (poster instanceof File && poster.size > 0) {
        const extension = posterExtensions[poster.type];
        if (!extension) throw new Error("Choose a PNG, JPG, or WebP event poster.");
        if (poster.size > 10 * 1024 * 1024) throw new Error("The poster must be 10 MB or smaller.");
        uploadedPath = `${clubId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("posters").upload(uploadedPath, poster, { contentType: poster.type });
        if (uploadError) throw new Error(uploadError.message);
        posterUrl = supabase.storage.from("posters").getPublicUrl(uploadedPath).data.publicUrl;
      }

      const values = {
        club_id: clubId,
        title,
        description: description || null,
        poster_url: posterUrl,
        event_date: eventDate,
        event_time: eventTime || null,
        venue: venue || null,
        category_id: categoryId || null,
        registration_link: registrationLink,
        contact_details: contactDetails || null,
        status,
        rejection_reason: null,
      };
      const result = event
        ? await supabase.from("events").update(values).eq("id", event.id).eq("club_id", clubId).select("id").maybeSingle()
        : await fetch("/api/club/events", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify(values) }).then(async (response) => {
            const payload = await response.json() as { id?: string; error?: string };
            return { data: response.ok && payload.id ? { id: payload.id } : null, error: response.ok ? null : { message: payload.error ?? "Could not create this event." } };
          });

      if (result.error || !result.data) {
        if (uploadedPath) await supabase.storage.from("posters").remove([uploadedPath]);
        throw new Error(result.error?.message ?? "Could not save this event. Check that it still belongs to your club.");
      }

      toast(status === "pending" ? "Event submitted for approval." : "Event saved as a draft.");
      router.push("/club/events");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save this event.";
      setError(message); toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <label className="block text-sm font-medium">Event title<input required name="title" defaultValue={event?.title ?? ""} maxLength={180} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      <label className="block text-sm font-medium">Description<textarea name="description" rows={5} defaultValue={event?.description ?? ""} className="mt-1.5 w-full resize-y rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      <div>
        <label className="block text-sm font-medium">Event poster <span className="font-normal text-muted">(PNG, JPG or WebP; up to 10 MB)</span><input name="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={(change) => { const file = change.currentTarget.files?.[0]; if (!file) return; if (!posterExtensions[file.type] || file.size > 10 * 1024 * 1024) { setError(!posterExtensions[file.type] ? "Choose a PNG, JPG, or WebP event poster." : "The poster must be 10 MB or smaller."); change.currentTarget.value = ""; return; } setError(""); setPosterPreview(URL.createObjectURL(file)); }} className="mt-1.5 block w-full rounded-xl border border-border px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:font-semibold file:text-accent" /></label>
        {posterPreview && <div className="relative mt-3 h-44 w-full max-w-sm overflow-hidden rounded-xl bg-background"><Image src={posterPreview} alt="Event poster preview" fill sizes="(max-width: 640px) 100vw, 384px" unoptimized className="object-contain" /></div>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium">Date<input required name="event_date" type="date" defaultValue={event?.event_date ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
        <label className="block text-sm font-medium">Time<input name="event_time" type="time" defaultValue={event?.event_time?.slice(0, 5) ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      </div>
      <label className="block text-sm font-medium">Venue<input name="venue" defaultValue={event?.venue ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      <label className="block text-sm font-medium">Category<select name="category_id" defaultValue={event?.category_id ?? ""} className="mt-1.5 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none focus:border-accent"><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      <label className="block text-sm font-medium">Registration link<input name="registration_link" type="url" inputMode="url" placeholder="https://example.com/register" defaultValue={event?.registration_link ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /><span className="mt-1 block text-xs font-normal text-muted">Include the full http:// or https:// URL.</span></label>
      <label className="block text-sm font-medium">Contact details<textarea name="contact_details" rows={2} defaultValue={event?.contact_details ?? ""} className="mt-1.5 w-full resize-y rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse justify-end gap-3 border-t border-border pt-5 sm:flex-row">
        <button type="submit" name="status" value="draft" disabled={saving} className="rounded-xl border border-border px-5 py-3 text-sm font-semibold text-foreground hover:bg-background disabled:opacity-60">{saving ? "Saving…" : "Save as Draft"}</button>
        <button type="submit" name="status" value="pending" disabled={saving} className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{saving ? "Saving…" : "Submit for Approval"}</button>
      </div>
    </form>
  );
}

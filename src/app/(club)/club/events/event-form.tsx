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
const fieldClass = "mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white/85 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 hover:border-accent/25 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10";
const labelClass = "block text-sm font-semibold text-foreground";

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
    <form onSubmit={save} className="space-y-6">
      <label className={labelClass}>Event title<input required name="title" defaultValue={event?.title ?? ""} maxLength={180} placeholder="Give your event a memorable name" className={fieldClass} /></label>
      <label className={labelClass}>Description<textarea name="description" rows={5} defaultValue={event?.description ?? ""} placeholder="What should students know about this event?" className={fieldClass + " resize-y leading-6"} /></label>
      <div>
        <label className={labelClass}>Event poster <span className="font-normal text-muted">· PNG, JPG or WebP up to 10 MB</span><input name="poster" type="file" accept="image/png,image/jpeg,image/webp" onChange={(change) => { const file = change.currentTarget.files?.[0]; if (!file) return; if (!posterExtensions[file.type] || file.size > 10 * 1024 * 1024) { setError(!posterExtensions[file.type] ? "Choose a PNG, JPG, or WebP event poster." : "The poster must be 10 MB or smaller."); change.currentTarget.value = ""; return; } setError(""); setPosterPreview(URL.createObjectURL(file)); }} className="mt-2 block w-full rounded-2xl border border-dashed border-[#dcd8e7] bg-[#faf9fc] px-3 py-3 text-sm transition hover:border-accent/40 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-accent" /></label>
        {posterPreview && <div className="relative mt-4 h-52 w-full max-w-sm overflow-hidden rounded-[20px] border border-white bg-gradient-to-br from-violet-50 to-amber-50 p-2 shadow-subtle"><Image src={posterPreview} alt="Event poster preview" fill sizes="(max-width: 640px) 100vw, 384px" unoptimized className="rounded-[16px] object-contain" /></div>}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Date<input required name="event_date" type="date" defaultValue={event?.event_date ?? ""} className={fieldClass} /></label>
        <label className={labelClass}>Time<input name="event_time" type="time" defaultValue={event?.event_time?.slice(0, 5) ?? ""} className={fieldClass} /></label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>Venue<input name="venue" defaultValue={event?.venue ?? ""} placeholder="Where is it happening?" className={fieldClass} /></label>
        <label className={labelClass}>Category<select name="category_id" defaultValue={event?.category_id ?? ""} className={fieldClass}><option value="">Choose a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
      </div>
      <label className={labelClass}>Registration link<input name="registration_link" type="url" inputMode="url" placeholder="https://example.com/register" defaultValue={event?.registration_link ?? ""} className={fieldClass} /><span className="mt-2 block text-xs font-normal text-muted">Include the full http:// or https:// URL.</span></label>
      <label className={labelClass}>Contact details<textarea name="contact_details" rows={2} defaultValue={event?.contact_details ?? ""} placeholder="Email, phone, or social handle" className={fieldClass + " resize-y leading-6"} /></label>

      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-col-reverse gap-3 border-t border-[#eeecf2] pt-5 sm:flex-row sm:justify-end">
        <button type="submit" name="status" value="draft" disabled={saving} className="min-h-11 rounded-full border border-[#e9e7ef] bg-white px-5 text-sm font-semibold text-foreground transition hover:border-accent/25 hover:bg-[#faf9fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60">{saving ? "Saving…" : "Save as Draft"}</button>
        <button type="submit" name="status" value="pending" disabled={saving} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(109,92,232,0.2)] transition hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-60">{saving ? "Saving…" : "Submit for Approval"}</button>
      </div>
    </form>
  );
}

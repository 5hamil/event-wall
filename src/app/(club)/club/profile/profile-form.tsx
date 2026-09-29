"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useClubContext } from "../club-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";

type ClubProfile = { id: string; name: string; logo_url: string | null; description: string | null; contact_email: string | null; contact_phone: string | null };
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const fieldClass = "mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white/85 px-4 py-3 text-sm outline-none transition placeholder:text-muted/70 hover:border-accent/25 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10";
const labelClass = "block text-sm font-semibold text-foreground";

export function ProfileForm({ club }: { club: ClubProfile }) {
  const router = useRouter();
  const toast = useToast();
  const { clubId } = useClubContext();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const contactEmail = String(form.get("contact_email") ?? "").trim();
    const contactPhone = String(form.get("contact_phone") ?? "").trim();
    const file = form.get("logo");
    if (!name) { setError("Enter your club name."); setSaving(false); return; }
    if (contactEmail && !/^\S+@\S+\.\S+$/.test(contactEmail)) { setError("Enter a valid contact email address."); setSaving(false); return; }
    const supabase = createClient();
    let logoUrl = club.logo_url;
    let uploadedPath: string | null = null;

    try {
      if (file instanceof File && file.size > 0) {
        const extension = extensions[file.type];
        if (!extension) throw new Error("Choose a PNG, JPG, or WebP logo.");
        if (file.size > 5 * 1024 * 1024) throw new Error("The logo must be 5 MB or smaller.");
        uploadedPath = `${clubId}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from("logos").upload(uploadedPath, file, { contentType: file.type });
        if (uploadError) throw new Error(uploadError.message);
        logoUrl = supabase.storage.from("logos").getPublicUrl(uploadedPath).data.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("clubs")
        .update({ name, logo_url: logoUrl, description: description || null, contact_email: contactEmail || null, contact_phone: contactPhone || null })
        .eq("id", clubId);
      if (updateError) {
        if (uploadedPath) await supabase.storage.from("logos").remove([uploadedPath]);
        throw new Error(updateError.message);
      }

      setSaved(true);
      toast("Club profile updated.");
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save your profile.";
      setError(message); toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <label className={labelClass}>Club name<input required name="name" defaultValue={club.name} className={fieldClass} /></label>
      <label className={labelClass}>Club logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={(change) => { const file = change.currentTarget.files?.[0]; if (file && (!extensions[file.type] || file.size > 5 * 1024 * 1024)) { setError(!extensions[file.type] ? "Choose a PNG, JPG, or WebP logo." : "The logo must be 5 MB or smaller."); change.currentTarget.value = ""; } else setError(""); }} className="mt-2 block w-full rounded-2xl border border-dashed border-[#dcd8e7] bg-[#faf9fc] px-3 py-3 text-sm transition hover:border-accent/40 file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-accent" /><span className="mt-2 block text-xs font-normal text-muted">PNG, JPG or WebP, up to 5 MB.</span></label>
      <label className={labelClass}>Description<textarea name="description" rows={4} defaultValue={club.description ?? ""} placeholder="Tell students what your club is about…" className={fieldClass + " resize-y leading-6"} /></label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>Contact email<input name="contact_email" type="email" defaultValue={club.contact_email ?? ""} placeholder="hello@campus.edu" className={fieldClass} /></label>
        <label className={labelClass}>Contact phone<input name="contact_phone" type="tel" defaultValue={club.contact_phone ?? ""} placeholder="Optional" className={fieldClass} /></label>
      </div>
      {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Profile saved.</p>}
      <div className="border-t border-[#eeecf2] pt-5"><button disabled={saving} className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-accent px-6 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(109,92,232,0.2)] transition hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{saving ? "Saving…" : "Save profile"}</button></div>
    </form>
  );
}

"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useClubContext } from "../club-context";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/toast-provider";

type ClubProfile = { id: string; name: string; logo_url: string | null; description: string | null; contact_email: string | null; contact_phone: string | null };
const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

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
    <form onSubmit={save} className="space-y-5">
      <label className="block text-sm font-medium">Club name<input required name="name" defaultValue={club.name} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      <label className="block text-sm font-medium">Club logo<input name="logo" type="file" accept="image/png,image/jpeg,image/webp" onChange={(change) => { const file = change.currentTarget.files?.[0]; if (file && (!extensions[file.type] || file.size > 5 * 1024 * 1024)) { setError(!extensions[file.type] ? "Choose a PNG, JPG, or WebP logo." : "The logo must be 5 MB or smaller."); change.currentTarget.value = ""; } else setError(""); }} className="mt-1.5 block w-full rounded-xl border border-border px-3 py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:font-semibold file:text-accent" /><span className="mt-1 block text-xs font-normal text-muted">PNG, JPG or WebP, up to 5 MB.</span></label>
      <label className="block text-sm font-medium">Description<textarea name="description" rows={4} defaultValue={club.description ?? ""} className="mt-1.5 w-full resize-y rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      <label className="block text-sm font-medium">Contact email<input name="contact_email" type="email" defaultValue={club.contact_email ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      <label className="block text-sm font-medium">Contact phone<input name="contact_phone" type="tel" defaultValue={club.contact_phone ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-4 py-3 outline-none focus:border-accent" /></label>
      {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {saved && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Profile saved.</p>}
      <button disabled={saving} className="rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{saving ? "Saving…" : "Save profile"}</button>
    </form>
  );
}

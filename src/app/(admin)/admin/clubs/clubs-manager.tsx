"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export type Club = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  is_active: boolean;
  created_at: string;
};

type Credentials = { email: string; password: string };

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(date));
}

export function ClubsManager({ clubs, loadError }: { clubs: Club[]; loadError: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  function openAdd() {
    setEditingClub(null);
    setError("");
    setModalOpen(true);
  }

  function openEdit(club: Club) {
    setEditingClub(club);
    setError("");
    setModalOpen(true);
  }

  async function saveClub(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (editingClub) form.set("id", editingClub.id);

    try {
      const response = await fetch("/api/admin/clubs", {
        method: editingClub ? "PATCH" : "POST",
        body: form,
      });
      const result = await response.json() as { error?: string; credentials?: Credentials };
      if (!response.ok) throw new Error(result.error ?? "Could not save the club.");

      setModalOpen(false);
      if (result.credentials) { setCredentials(result.credentials); toast("Club created with login credentials."); }
      else { setNotice("Club details saved."); toast("Club details updated."); }
      router.refresh();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Could not save the club.";
      setError(message); toast(message, "error");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(club: Club) {
    setError("");
    setNotice("");
    try {
    const response = await fetch("/api/admin/clubs", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id: club.id, is_active: !club.is_active }),
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) { const message = result.error ?? "Could not update club status."; setError(message); toast(message, "error"); }
    else {
      setNotice(`${club.name} is now ${club.is_active ? "inactive" : "active"}.`);
      toast(`${club.name} is now ${club.is_active ? "inactive" : "active"}.`);
      router.refresh();
    }
    } catch { setError("Could not update club status."); toast("Could not update club status.", "error"); }
  }

  async function copyCredentials() {
    if (!credentials) return;
    try { await navigator.clipboard.writeText(`Email: ${credentials.email}\nTemporary password: ${credentials.password}`); setNotice("Credentials copied to clipboard."); toast("Credentials copied to clipboard."); }
    catch { toast("Could not copy credentials. Select and copy them manually.", "error"); }
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">ORGANIZATIONS</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Clubs</h1><p className="mt-2 text-sm text-muted">Manage campus clubs and their account access.</p></div>
        <button onClick={openAdd} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-subtle transition hover:bg-accent-dark">Add club <span aria-hidden="true">＋</span></button>
      </div>

      {loadError && <p role="alert" className="mt-7 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Could not load clubs: {loadError}</p>}
      {error && !modalOpen && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && !credentials && <p role="status" className="mt-5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      <div className="mt-7 overflow-x-auto rounded-card bg-white shadow-subtle">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead><tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-5 py-4">Club</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {clubs.map((club) => <tr key={club.id} className="text-sm">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-50 text-sm font-bold text-accent">{club.logo_url ? <Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="40px" className="object-cover" /> : club.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-foreground">{club.name}</p><p className="truncate text-xs text-muted">{club.contact_email || club.slug}</p></div></div></td>
              <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${club.is_active ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"}`}>{club.is_active ? "Active" : "Inactive"}</span></td>
              <td className="px-5 py-4 text-muted">{formatDate(club.created_at)}</td>
              <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(club)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-accent hover:bg-violet-50">Edit</button><button onClick={() => void toggleActive(club)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted hover:bg-background">{club.is_active ? "Deactivate" : "Activate"}</button></div></td>
            </tr>)}
            {clubs.length === 0 && <tr><td colSpan={4} className="px-5 py-14 text-center"><p className="font-heading text-lg font-bold">No clubs yet</p><p className="mt-1 text-sm text-muted">Add your first club to get Event Wall started.</p></td></tr>}
          </tbody>
        </table>
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-neutral-950/30 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="club-form-title" className="my-6 w-full max-w-xl rounded-[18px] bg-white p-6 shadow-lift sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-accent">CLUB PROFILE</p><h2 id="club-form-title" className="mt-2 font-heading text-2xl font-bold">{editingClub ? "Edit club" : "Add a club"}</h2></div><button onClick={() => setModalOpen(false)} aria-label="Close form" className="rounded-lg px-2 py-1 text-xl text-muted hover:bg-background">×</button></div>
          <form onSubmit={saveClub} className="mt-6 space-y-4">
            <label className="block text-sm font-medium">Club name<input name="name" required defaultValue={editingClub?.name ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 outline-none focus:border-accent" /></label>
            <label className="block text-sm font-medium">Contact and account email<input name="contact_email" type="email" required={!editingClub} defaultValue={editingClub?.contact_email ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 outline-none focus:border-accent" /><span className="mt-1 block text-xs font-normal text-muted">{editingClub ? "This changes the contact address; the existing login email stays the same." : "A login account and temporary password will be created for this address."}</span></label>
            <label className="block text-sm font-medium">Contact phone<input name="contact_phone" type="tel" defaultValue={editingClub?.contact_phone ?? ""} className="mt-1.5 w-full rounded-xl border border-border px-3.5 py-2.5 outline-none focus:border-accent" /></label>
            <label className="block text-sm font-medium">Description<textarea name="description" rows={3} defaultValue={editingClub?.description ?? ""} className="mt-1.5 w-full resize-y rounded-xl border border-border px-3.5 py-2.5 outline-none focus:border-accent" /></label>
            <label className="block text-sm font-medium">Club logo <span className="font-normal text-muted">(PNG, JPG or WebP, up to 5 MB)</span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="mt-1.5 block w-full rounded-xl border border-border px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-violet-50 file:px-3 file:py-1.5 file:font-semibold file:text-accent" /></label>
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-3 pt-2"><button type="button" onClick={() => setModalOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-background">Cancel</button><button disabled={saving} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{saving ? "Saving…" : editingClub ? "Save changes" : "Create club"}</button></div>
          </form>
        </section>
      </div>}

      {credentials && <div className="fixed inset-0 z-[60] grid place-items-center bg-neutral-950/30 p-4"><section role="dialog" aria-modal="true" aria-labelledby="credentials-title" className="w-full max-w-md rounded-[18px] bg-white p-7 shadow-lift"><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">CLUB CREATED</p><h2 id="credentials-title" className="mt-2 font-heading text-2xl font-bold">Send these login details</h2><p className="mt-2 text-sm leading-6 text-muted">The temporary password is shown only once. Copy and share it with the club securely.</p><div className="mt-5 space-y-3 rounded-xl bg-background p-4 text-sm"><div><p className="text-xs text-muted">EMAIL</p><p className="mt-1 break-all font-medium">{credentials.email}</p></div><div><p className="text-xs text-muted">TEMPORARY PASSWORD</p><p className="mt-1 break-all font-mono">{credentials.password}</p></div></div><div className="mt-5 flex justify-end gap-3"><button onClick={() => { setCredentials(null); setNotice(""); }} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-background">Close</button><button onClick={() => void copyCredentials()} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark">Copy credentials</button></div>{notice && <p role="status" className="mt-3 text-right text-xs text-emerald-700">{notice}</p>}</section></div>}
    </div>
  );
}

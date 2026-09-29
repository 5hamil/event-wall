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
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Organizations</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Clubs</h1><p className="mt-2 text-sm text-muted sm:text-base">Manage campus clubs and their account access.</p></div>
        <button onClick={openAdd} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_9px_24px_rgba(109,92,232,0.22)] transition hover:-translate-y-0.5 hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Add club <span aria-hidden="true" className="text-lg">＋</span></button>
      </div>

      {loadError && <p role="alert" className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load clubs: {loadError}</p>}
      {error && !modalOpen && <p role="alert" className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && !credentials && <p role="status" className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</p>}

      <div className="mt-7 grid grid-cols-2 gap-3 sm:max-w-xl">
        {[{ label: "Total clubs", value: clubs.length }, { label: "Active clubs", value: clubs.filter((club) => club.is_active).length }].map((stat) => <div key={stat.label} className="rounded-[18px] border border-white/90 bg-white/65 px-4 py-3.5 shadow-[0_8px_24px_rgba(28,24,52,0.035)] backdrop-blur-xl"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-muted">{stat.label}</p><p className="mt-1 font-heading text-2xl font-bold">{stat.value}</p></div>)}
      </div>

      <div className="mt-7 hidden overflow-x-auto rounded-[22px] border border-white/90 bg-white/70 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl md:block">
        <table className="w-full min-w-[700px] border-collapse text-left">
          <thead><tr className="border-b border-[#eeecf2] bg-white/60 text-[10px] font-bold uppercase tracking-[.14em] text-muted"><th className="px-5 py-4">Club</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Created</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {clubs.map((club) => <tr key={club.id} className="text-sm transition-colors hover:bg-violet-50/30">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-violet-50 text-sm font-bold text-accent">{club.logo_url ? <Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="40px" className="object-cover" /> : club.name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate font-semibold text-foreground">{club.name}</p><p className="truncate text-xs text-muted">{club.contact_email || club.slug}</p></div></div></td>
              <td className="px-5 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${club.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{club.is_active ? "Active" : "Inactive"}</span></td>
              <td className="px-5 py-4 text-muted">{formatDate(club.created_at)}</td>
              <td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => openEdit(club)} className="rounded-full border border-accent/15 bg-violet-50/70 px-3.5 py-2 text-xs font-semibold text-accent transition hover:bg-violet-100">Edit</button><button onClick={() => void toggleActive(club)} className="rounded-full border border-[#eceaf1] bg-white/80 px-3.5 py-2 text-xs font-semibold text-muted transition hover:text-foreground">{club.is_active ? "Deactivate" : "Activate"}</button></div></td>
            </tr>)}
            {clubs.length === 0 && <tr><td colSpan={4} className="px-5 py-14 text-center"><p className="font-heading text-lg font-bold">No clubs yet</p><p className="mt-1 text-sm text-muted">Add your first club to get Event Wall started.</p></td></tr>}
          </tbody>
        </table>
      </div>

      <div className="mt-5 space-y-3 md:hidden">
        {clubs.map((club) => <article key={club.id} className="rounded-[20px] border border-white/90 bg-white/70 p-4 shadow-[0_9px_28px_rgba(28,24,52,0.045)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-[15px] bg-violet-50 text-sm font-bold text-accent">{club.logo_url ? <Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="48px" className="object-cover"/> : club.name.slice(0, 1).toUpperCase()}</div>
            <div className="min-w-0 flex-1"><p className="truncate font-heading font-bold">{club.name}</p><p className="truncate text-xs text-muted">{club.contact_email || club.slug}</p></div>
            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${club.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>{club.is_active ? "Active" : "Inactive"}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-[#eeecf2] pt-3"><span className="text-xs text-muted">Joined {formatDate(club.created_at)}</span><div className="flex gap-2"><button onClick={() => openEdit(club)} className="rounded-full border border-accent/15 bg-violet-50/70 px-3 py-1.5 text-xs font-semibold text-accent">Edit</button><button onClick={() => void toggleActive(club)} className="rounded-full border border-[#eceaf1] bg-white px-3 py-1.5 text-xs font-semibold text-muted">{club.is_active ? "Deactivate" : "Activate"}</button></div></div>
        </article>)}
        {clubs.length === 0 && <div className="rounded-[20px] border border-white/90 bg-white/70 px-5 py-10 text-center shadow-subtle"><p className="font-heading font-bold">No clubs yet</p><p className="mt-1 text-sm text-muted">Add your first club to get Event Wall started.</p></div>}
      </div>

      {modalOpen && <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-[#17151f]/35 p-3 backdrop-blur-sm sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="club-form-title" className="my-4 w-full max-w-xl rounded-[26px] border border-white/90 bg-white/95 p-5 shadow-[0_28px_90px_rgba(20,16,40,0.24)] sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Club profile</p><h2 id="club-form-title" className="mt-2 font-heading text-2xl font-extrabold tracking-tight">{editingClub ? "Edit club" : "Add a club"}</h2></div><button onClick={() => setModalOpen(false)} aria-label="Close form" className="grid h-9 w-9 place-items-center rounded-full border border-[#eceaf1] text-xl text-muted transition hover:bg-[#f7f6fa]">×</button></div>
          <form onSubmit={saveClub} className="mt-6 space-y-4">
            <label className="block text-sm font-semibold">Club name<input name="name" required defaultValue={editingClub?.name ?? ""} className="mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
            <label className="block text-sm font-semibold">Contact and account email<input name="contact_email" type="email" required={!editingClub} defaultValue={editingClub?.contact_email ?? ""} className="mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" /><span className="mt-2 block text-xs font-normal leading-5 text-muted">{editingClub ? "This changes the contact address; the existing login email stays the same." : "A login account and temporary password will be created for this address."}</span></label>
            <label className="block text-sm font-semibold">Contact phone<input name="contact_phone" type="tel" defaultValue={editingClub?.contact_phone ?? ""} className="mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
            <label className="block text-sm font-semibold">Description<textarea name="description" rows={3} defaultValue={editingClub?.description ?? ""} className="mt-2 w-full resize-y rounded-2xl border border-[#e9e7ef] bg-white px-4 py-3 text-sm font-normal leading-6 outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" /></label>
            <label className="block text-sm font-semibold">Club logo <span className="font-normal text-muted">(PNG, JPG or WebP, up to 5 MB)</span><input name="logo" type="file" accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full rounded-2xl border border-dashed border-[#dcd8e7] bg-[#faf9fc] px-3 py-3 text-sm font-normal file:mr-3 file:rounded-full file:border-0 file:bg-violet-100 file:px-4 file:py-2 file:text-xs file:font-bold file:text-accent" /></label>
            {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <div className="flex flex-col-reverse gap-2 border-t border-[#eeecf2] pt-4 sm:flex-row sm:justify-end"><button type="button" onClick={() => setModalOpen(false)} className="min-h-11 rounded-full border border-[#e9e7ef] px-5 text-sm font-semibold text-muted transition hover:bg-[#f7f6fa]">Cancel</button><button disabled={saving} className="min-h-11 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(109,92,232,0.2)] transition hover:bg-accent-dark disabled:opacity-60">{saving ? "Saving…" : editingClub ? "Save changes" : "Create club"}</button></div>
          </form>
        </section>
      </div>}

      {credentials && <div className="fixed inset-0 z-[60] grid place-items-center bg-[#17151f]/35 p-4 backdrop-blur-sm"><section role="dialog" aria-modal="true" aria-labelledby="credentials-title" className="w-full max-w-md rounded-[26px] border border-white/90 bg-white/95 p-6 shadow-[0_28px_90px_rgba(20,16,40,0.24)] sm:p-8"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">Club created</p><h2 id="credentials-title" className="mt-2 font-heading text-2xl font-extrabold">Send these login details</h2><p className="mt-2 text-sm leading-6 text-muted">The temporary password is shown only once. Copy and share it with the club securely.</p><div className="mt-5 space-y-3 rounded-2xl border border-[#eeecf2] bg-[#faf9fc] p-4 text-sm"><div><p className="text-[10px] font-bold tracking-[.12em] text-muted">EMAIL</p><p className="mt-1 break-all font-medium">{credentials.email}</p></div><div><p className="text-[10px] font-bold tracking-[.12em] text-muted">TEMPORARY PASSWORD</p><p className="mt-1 break-all font-mono">{credentials.password}</p></div></div><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button onClick={() => { setCredentials(null); setNotice(""); }} className="min-h-10 rounded-full border border-[#e9e7ef] px-4 text-sm font-semibold text-muted hover:bg-[#f7f6fa]">Close</button><button onClick={() => void copyCredentials()} className="min-h-10 rounded-full bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark">Copy credentials</button></div>{notice && <p role="status" className="mt-3 text-right text-xs text-emerald-700">{notice}</p>}</section></div>}
    </div>
  );
}

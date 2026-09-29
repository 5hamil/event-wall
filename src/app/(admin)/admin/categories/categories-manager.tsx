"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/slugify";
import { useToast } from "@/components/toast-provider";

export type Category = { id: string; name: string; slug: string; created_at: string };

export function CategoriesManager({ categories, loadError }: { categories: Category[]; loadError: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const supabase = createClient();

  function beginEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setName("");
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    const slug = slugify(trimmed);
    if (!slug) { setError("Enter a name with at least one letter or number."); return; }

    setBusy(true);
    setError("");
    const result = editingId
      ? await supabase.from("categories").update({ name: trimmed, slug }).eq("id", editingId)
      : await supabase.from("categories").insert({ name: trimmed, slug });
    if (result.error) {
      const message = result.error.code === "23505" ? "That category name is already in use." : result.error.message;
      setError(message);
      toast(message, "error");
    } else {
      toast(editingId ? "Category updated." : "Category created.");
      cancelEdit();
      router.refresh();
    }
    setBusy(false);
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete the “${category.name}” category?`)) return;
    const { error: deleteError } = await supabase.from("categories").delete().eq("id", category.id);
    if (deleteError) { setError(deleteError.message); toast(deleteError.message, "error"); }
    else { toast("Category deleted."); router.refresh(); }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Event organization</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Categories</h1><p className="mt-2 text-sm text-muted sm:text-base">Keep event types easy to browse.</p></div>
      {(loadError || error) && <p role="alert" className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error || `Could not load categories: ${loadError}`}</p>}

      <section className="mt-7 rounded-[22px] border border-white/90 bg-white/70 p-5 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl sm:p-6">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-accent">Category setup</p><h2 className="mt-1 font-heading text-lg font-bold">{editingId ? "Edit category" : "Add a category"}</h2></div><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-violet-50 text-accent">✳</span></div>
        <form onSubmit={save} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="category-name">Category name</label>
          <input id="category-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Music & performance" className="min-h-12 min-w-0 flex-1 rounded-2xl border border-[#e9e7ef] bg-white/85 px-4 text-sm outline-none transition focus:border-accent focus:ring-4 focus:ring-accent/10" />
          <button disabled={busy} className="min-h-12 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(109,92,232,0.2)] transition hover:bg-accent-dark disabled:opacity-60">{busy ? "Saving…" : editingId ? "Save changes" : "Add category"}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="min-h-12 rounded-full border border-[#e9e7ef] px-4 text-sm font-semibold text-muted hover:bg-[#f7f6fa]">Cancel</button>}
        </form>
        <p className="mt-2 text-xs text-muted">The URL slug is generated automatically from the name.</p>
      </section>

      <div className="mt-7 hidden overflow-x-auto rounded-[22px] border border-white/90 bg-white/70 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl md:block">
        <table className="w-full min-w-[500px] border-collapse text-left">
          <thead><tr className="border-b border-[#eeecf2] bg-white/60 text-[10px] font-bold uppercase tracking-[.14em] text-muted"><th className="px-5 py-4">Name</th><th className="px-5 py-4">Slug</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => <tr key={category.id} className="text-sm transition-colors hover:bg-violet-50/30"><td className="px-5 py-4 font-semibold">{category.name}</td><td className="px-5 py-4 font-mono text-xs text-muted">{category.slug}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => beginEdit(category)} className="rounded-full border border-accent/15 bg-violet-50/70 px-3.5 py-2 text-xs font-semibold text-accent hover:bg-violet-100">Edit</button><button onClick={() => void remove(category)} className="rounded-full border border-rose-100 bg-rose-50/70 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">Delete</button></div></td></tr>)}
            {categories.length === 0 && <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-muted">No categories yet. Add one above.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="mt-5 space-y-3 md:hidden">
        {categories.map((category) => <article key={category.id} className="flex items-center gap-3 rounded-[20px] border border-white/90 bg-white/70 p-4 shadow-[0_9px_28px_rgba(28,24,52,0.045)] backdrop-blur-xl">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[14px] bg-violet-50 text-accent">✳</span><div className="min-w-0 flex-1"><p className="truncate font-heading font-bold">{category.name}</p><p className="truncate font-mono text-[11px] text-muted">{category.slug}</p></div><div className="flex shrink-0 gap-1"><button onClick={() => beginEdit(category)} className="rounded-full px-2.5 py-2 text-xs font-semibold text-accent hover:bg-violet-50">Edit</button><button onClick={() => void remove(category)} className="rounded-full px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50">Delete</button></div>
        </article>)}
        {categories.length === 0 && <div className="rounded-[20px] border border-white/90 bg-white/70 px-5 py-10 text-center text-sm text-muted shadow-subtle">No categories yet. Add one above.</div>}
      </div>
    </div>
  );
}

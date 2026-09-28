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
      <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">EVENT ORGANIZATION</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Categories</h1><p className="mt-2 text-sm text-muted">Keep event types easy to browse.</p></div>
      {(loadError || error) && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error || `Could not load categories: ${loadError}`}</p>}

      <section className="mt-7 rounded-card bg-white p-5 shadow-subtle sm:p-6">
        <h2 className="font-heading text-lg font-bold">{editingId ? "Edit category" : "Add a category"}</h2>
        <form onSubmit={save} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <label className="sr-only" htmlFor="category-name">Category name</label>
          <input id="category-name" required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Music & performance" className="min-w-0 flex-1 rounded-xl border border-border px-4 py-2.5 text-sm outline-none focus:border-accent" />
          <button disabled={busy} className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-accent-dark disabled:opacity-60">{busy ? "Saving…" : editingId ? "Save changes" : "Add category"}</button>
          {editingId && <button type="button" onClick={cancelEdit} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:bg-background">Cancel</button>}
        </form>
        <p className="mt-2 text-xs text-muted">The URL slug is generated automatically from the name.</p>
      </section>

      <div className="mt-6 overflow-x-auto rounded-card bg-white shadow-subtle">
        <table className="w-full min-w-[500px] border-collapse text-left">
          <thead><tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted"><th className="px-5 py-4">Name</th><th className="px-5 py-4">Slug</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-border">
            {categories.map((category) => <tr key={category.id} className="text-sm"><td className="px-5 py-4 font-semibold">{category.name}</td><td className="px-5 py-4 font-mono text-xs text-muted">{category.slug}</td><td className="px-5 py-4"><div className="flex justify-end gap-2"><button onClick={() => beginEdit(category)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-accent hover:bg-violet-50">Edit</button><button onClick={() => void remove(category)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">Delete</button></div></td></tr>)}
            {categories.length === 0 && <tr><td colSpan={3} className="px-5 py-12 text-center text-sm text-muted">No categories yet. Add one above.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

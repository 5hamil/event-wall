import { requireClubAccount } from "@/lib/club-auth";
import { EventForm } from "../event-form";

export default async function NewClubEventPage() {
  const { supabase } = await requireClubAccount();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">NEW LISTING</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Create Event</h1>
      <p className="mt-2 text-sm text-muted">Save a draft to finish later, or send it to the admin team for approval.</p>
      <div className="mt-7 rounded-card bg-white p-6 shadow-subtle sm:p-8"><EventForm categories={categories ?? []} /></div>
    </div>
  );
}

import { requireClubAccount } from "@/lib/club-auth";
import Link from "next/link";
import { EventForm } from "../event-form";

export default async function NewClubEventPage() {
  const { supabase } = await requireClubAccount();
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");
  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/club/events" className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/70 px-3.5 py-2 text-xs font-semibold text-muted shadow-sm backdrop-blur transition hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span aria-hidden="true">←</span> My events</Link>
      <p className="mt-7 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> New listing</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Create an event</h1>
      <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Save a draft to finish later, or publish it to make it visible on the campus event wall.</p>
      <div className="mt-7 rounded-[24px] border border-white/90 bg-white/75 p-5 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl sm:p-8"><EventForm categories={categories ?? []} /></div>
    </div>
  );
}

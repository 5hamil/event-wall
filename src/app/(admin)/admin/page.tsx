import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const [clubsResult, eventsResult, draftResult, pendingResult, approvedResult, rejectedResult, archivedResult, activityResult] = await Promise.all([
    supabase.from("clubs").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "archived"),
    supabase.from("events").select("club_id"),
  ]);

  const activity = (activityResult.data ?? []).reduce<Record<string, number>>((result, event) => {
    result[event.club_id] = (result[event.club_id] ?? 0) + 1;
    return result;
  }, {});
  const mostActiveClubId = Object.entries(activity).sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostActiveResult = mostActiveClubId
    ? await supabase.from("clubs").select("name").eq("id", mostActiveClubId).maybeSingle()
    : null;

  const cards = [
    { label: "Total clubs", value: clubsResult.count, href: "/admin/clubs", hint: "Manage campus organizations" },
    { label: "Total events", value: eventsResult.count ?? 0, href: "/admin/events", hint: "Across all event statuses" },
    { label: "Draft", value: draftResult.count ?? 0, href: "/admin/events?status=all", hint: "Not yet submitted" },
    { label: "Pending approval", value: pendingResult.count ?? 0, href: "/admin/events?status=pending", hint: "Waiting for moderation" },
    { label: "Approved", value: approvedResult.count ?? 0, href: "/admin/events?status=approved", hint: "Visible to students" },
    { label: "Rejected", value: rejectedResult.count ?? 0, href: "/admin/events?status=rejected", hint: "Returned to clubs for changes" },
    { label: "Archived", value: archivedResult.count ?? 0, href: "/admin/events?status=archived", hint: "Cancelled or withdrawn" },
    { label: "Most active club", value: mostActiveResult?.data?.name ?? "—", href: "/admin/events", hint: mostActiveClubId ? `${activity[mostActiveClubId]} event${activity[mostActiveClubId] === 1 ? "" : "s"} submitted` : "No events submitted yet" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Campus at a glance</p><h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Overview</h1><p className="mt-2 text-sm text-muted sm:text-base">A quick look at your Event Wall workspace.</p></div>
        <Link href="/admin/clubs" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_9px_24px_rgba(109,92,232,0.22)] transition hover:-translate-y-0.5 hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Add a club <span aria-hidden="true" className="text-lg">＋</span></Link>
      </div>

      {(clubsResult.error || eventsResult.error || draftResult.error || pendingResult.error || approvedResult.error || rejectedResult.error || archivedResult.error || activityResult.error || mostActiveResult?.error) && <p role="alert" className="mt-7 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load the latest counts. Check your Supabase connection and admin policies.</p>}

      <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card, index) => <Link key={card.label} href={card.href} className="group relative overflow-hidden rounded-[22px] border border-white/90 bg-white/70 p-5 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl transition duration-200 hover:-translate-y-0.5 hover:border-accent/15 hover:bg-white/90 hover:shadow-[0_16px_40px_rgba(28,24,52,0.075)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-6">
          <span aria-hidden="true" className={`absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${index === 3 ? "bg-amber-200/40" : index === 4 ? "bg-emerald-200/40" : "bg-violet-200/35"}`} />
          <div className="relative flex items-start justify-between gap-3"><p className="text-xs font-semibold text-muted">{card.label}</p><span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-xl bg-violet-50 text-xs font-bold text-accent transition group-hover:bg-accent group-hover:text-white">↗</span></div>
          <p className="relative mt-5 break-words font-heading text-3xl font-extrabold tracking-tight sm:text-4xl">{card.value ?? "—"}</p>
          <p className="relative mt-2 text-xs leading-5 text-muted">{card.hint}</p>
        </Link>)}
      </div>

      <section className="relative mt-8 overflow-hidden rounded-[24px] border border-white/90 bg-white/65 p-6 shadow-[0_12px_36px_rgba(28,24,52,0.045)] backdrop-blur-xl sm:p-8">
        <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-20 h-48 w-48 rounded-full bg-violet-200/40 blur-3xl" />
        <p className="relative text-[10px] font-bold uppercase tracking-[.2em] text-accent">Get started</p>
        <h2 className="relative mt-2 font-heading text-xl font-bold">Set up your campus wall</h2>
        <p className="relative mt-2 max-w-2xl text-sm leading-6 text-muted">Add your clubs and categories first. Club accounts can then submit events for review.</p>
        <div className="relative mt-5 flex flex-wrap gap-3"><Link href="/admin/clubs" className="inline-flex min-h-10 items-center rounded-full border border-[#e9e7ef] bg-white/85 px-4 text-sm font-semibold transition hover:border-accent/25 hover:text-accent">Manage clubs <span className="ml-2">→</span></Link><Link href="/admin/categories" className="inline-flex min-h-10 items-center rounded-full border border-[#e9e7ef] bg-white/85 px-4 text-sm font-semibold transition hover:border-accent/25 hover:text-accent">Manage categories <span className="ml-2">→</span></Link></div>
      </section>
    </div>
  );
}

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
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">CAMPUS AT A GLANCE</p><h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Overview</h1><p className="mt-2 text-sm text-muted">A quick look at your Event Wall workspace.</p></div>
        <Link href="/admin/clubs" className="rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-subtle transition hover:bg-accent-dark">Add a club <span aria-hidden="true">＋</span></Link>
      </div>

      {(clubsResult.error || eventsResult.error || draftResult.error || pendingResult.error || approvedResult.error || rejectedResult.error || archivedResult.error || activityResult.error || mostActiveResult?.error) && <p role="alert" className="mt-7 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Could not load the latest counts. Check your Supabase connection and admin policies.</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => <Link key={card.label} href={card.href} className="rounded-card bg-white p-6 shadow-subtle transition hover:shadow-lift">
          <p className="text-sm font-medium text-muted">{card.label}</p>
          <p className="mt-4 font-heading text-4xl font-bold tracking-tight">{card.value ?? "—"}</p>
          <p className="mt-3 text-xs text-muted">{card.hint}</p>
        </Link>)}
      </div>

      <section className="mt-8 rounded-card bg-white p-6 shadow-subtle sm:p-7">
        <p className="text-xs font-bold uppercase tracking-[.16em] text-accent">GET STARTED</p>
        <h2 className="mt-2 font-heading text-xl font-bold">Set up your campus wall</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Add your clubs and categories first. Club accounts can then submit events for review.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Link href="/admin/clubs" className="rounded-xl bg-background px-4 py-2.5 text-sm font-semibold hover:bg-violet-50">Manage clubs →</Link><Link href="/admin/categories" className="rounded-xl bg-background px-4 py-2.5 text-sm font-semibold hover:bg-violet-50">Manage categories →</Link></div>
      </section>
    </div>
  );
}

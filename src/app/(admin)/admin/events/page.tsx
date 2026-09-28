import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const filters = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "Draft", value: "draft" },
  { label: "Archived", value: "archived" },
] as const;

const statusStyles: Record<string, string> = {
  draft: "bg-neutral-100 text-neutral-700",
  pending: "bg-amber-50 text-amber-800",
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-700",
  archived: "bg-neutral-100 text-neutral-600",
};

function dateLabel(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(new Date(value));
}

export default async function AdminEventsPage({ searchParams }: { searchParams?: { status?: string } }) {
  const activeFilter = filters.some((filter) => filter.value === searchParams?.status)
    ? searchParams?.status ?? "all"
    : "all";
  const supabase = createClient();
  let query = supabase
    .from("events")
    .select("id, club_id, category_id, title, event_date, created_at, status")
    .order("created_at", { ascending: false });
  if (activeFilter !== "all") query = query.eq("status", activeFilter);

  const { data: events, error } = await query;
  const clubIds = Array.from(new Set((events ?? []).map((event) => event.club_id)));
  const categoryIds = Array.from(new Set((events ?? []).flatMap((event) => event.category_id ? [event.category_id] : [])));
  const [clubsResult, categoriesResult] = await Promise.all([
    clubIds.length ? supabase.from("clubs").select("id, name").in("id", clubIds) : Promise.resolve({ data: [], error: null }),
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const clubNames = new Map((clubsResult.data ?? []).map((club) => [club.id, club.name]));
  const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));

  return (
    <div className="mx-auto max-w-6xl">
      <div>
        <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">MODERATION</p>
        <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Events</h1>
        <p className="mt-2 text-sm text-muted">Review submissions, update event details, and archive cancelled listings.</p>
      </div>

      <nav aria-label="Filter events by status" className="mt-7 flex flex-wrap gap-2">
        {filters.map((filter) => {
          const selected = activeFilter === filter.value;
          return <Link key={filter.value} href={filter.value === "all" ? "/admin/events" : `/admin/events?status=${filter.value}`} aria-current={selected ? "page" : undefined} className={`rounded-full px-4 py-2 text-sm font-semibold transition ${selected ? "bg-accent text-white" : "bg-white text-muted shadow-subtle hover:text-foreground"}`}>
            {filter.label}
          </Link>;
        })}
      </nav>

      {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Could not load events: {error.message}</p>}

      <div className="mt-5 overflow-hidden rounded-card bg-white shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-5 py-3.5 font-semibold">Event</th><th className="px-5 py-3.5 font-semibold">Club</th><th className="px-5 py-3.5 font-semibold">Category</th><th className="px-5 py-3.5 font-semibold">Event date</th><th className="px-5 py-3.5 font-semibold">Created</th><th className="px-5 py-3.5 font-semibold">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(events ?? []).map((event) => <tr key={event.id} className="hover:bg-neutral-50/70">
                <td className="px-5 py-4"><Link href={`/admin/events/${event.id}`} className="font-semibold text-foreground hover:text-accent">{event.title}</Link></td>
                <td className="px-5 py-4 text-muted">{clubNames.get(event.club_id) ?? "Unknown club"}</td>
                <td className="px-5 py-4 text-muted">{event.category_id ? categoryNames.get(event.category_id) ?? "Unknown category" : "—"}</td>
                <td className="px-5 py-4 text-muted">{dateLabel(event.event_date, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="px-5 py-4 text-muted">{dateLabel(event.created_at, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[event.status] ?? statusStyles.draft}`}>{event.status}</span></td>
              </tr>)}
              {!error && (events ?? []).length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center"><p className="font-heading text-base font-bold text-foreground">{activeFilter === "pending" ? "No pending approvals" : "No events found"}</p><p className="mt-1 text-sm text-muted">{activeFilter === "pending" ? "You’re all caught up." : "Events matching this status will appear here."}</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

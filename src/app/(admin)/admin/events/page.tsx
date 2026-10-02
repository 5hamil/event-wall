import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const filters = [
  { label: "All", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Archived", value: "archived" },
] as const;

const statusStyles: Record<string, string> = {
  draft: "border border-slate-200 bg-slate-50 text-slate-600",
  published: "border border-emerald-200 bg-emerald-50 text-emerald-700",
  archived: "border border-slate-200 bg-slate-50 text-slate-500",
};

function dateLabel(value: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en", { ...options, timeZone: "UTC" }).format(new Date(value));
}

export default async function AdminEventsPage({ searchParams }: { searchParams?: { status?: string; club?: string } }) {
  const activeFilter = filters.some((filter) => filter.value === searchParams?.status)
    ? searchParams?.status ?? "all"
    : "all";
  const selectedClubId = searchParams?.club ?? "";
  const supabase = createClient();
  let query = supabase
    .from("events")
    .select("id, club_id, category_id, title, event_date, created_at, status")
    .order("created_at", { ascending: false });
  if (activeFilter !== "all") query = query.eq("status", activeFilter);
  if (selectedClubId) query = query.eq("club_id", selectedClubId);

  const { data: events, error } = await query;
  const clubIds = Array.from(new Set([...(events ?? []).map((event) => event.club_id), ...(selectedClubId ? [selectedClubId] : [])]));
  const categoryIds = Array.from(new Set((events ?? []).flatMap((event) => event.category_id ? [event.category_id] : [])));
  const [clubsResult, categoriesResult] = await Promise.all([
    clubIds.length ? supabase.from("clubs").select("id, name").in("id", clubIds) : Promise.resolve({ data: [], error: null }),
    categoryIds.length ? supabase.from("categories").select("id, name").in("id", categoryIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const clubNames = new Map((clubsResult.data ?? []).map((club) => [club.id, club.name]));
  const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));
  const selectedClubName = selectedClubId ? clubNames.get(selectedClubId) : undefined;
  const filterHref = (value: string) => {
    const params = new URLSearchParams();
    if (value !== "all") params.set("status", value);
    if (selectedClubId) params.set("club", selectedClubId);
    const queryString = params.toString();
    return queryString ? `/admin/events?${queryString}` : "/admin/events";
  };
  const clearClubHref = activeFilter === "all" ? "/admin/events" : `/admin/events?status=${activeFilter}`;

  return (
    <div>
      <div>
        <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Event management</p>
        <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Events</h1>
        <p className="mt-2 text-sm text-muted sm:text-base">Manage event details, publication, and archived listings.</p>
      </div>

      <nav aria-label="Filter events by status" className="mt-7 flex gap-2 overflow-x-auto pb-2">
        {filters.map((filter) => {
          const selected = activeFilter === filter.value;
          return <Link key={filter.value} href={filterHref(filter.value)} aria-current={selected ? "page" : undefined} className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-4 text-xs font-semibold transition ${selected ? "border-accent bg-accent text-white shadow-[0_6px_16px_rgba(109,92,232,0.18)]" : "border-white/90 bg-white/70 text-muted shadow-sm backdrop-blur hover:border-accent/20 hover:text-foreground"}`}>
            {filter.label}
          </Link>;
        })}
      </nav>

      {selectedClubId && <div className="mt-2 flex flex-wrap items-center gap-2 rounded-2xl border border-accent/10 bg-violet-50/65 px-4 py-3 text-sm"><span className="text-muted">Showing events for</span><span className="font-semibold text-foreground">{selectedClubName ?? "Unknown club"}</span><Link href={clearClubHref} className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-white">Clear club filter ×</Link></div>}

      {error && <p role="alert" className="mt-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">Could not load events: {error.message}</p>}

      <div className="mt-5 hidden overflow-hidden rounded-[22px] border border-white/90 bg-white/70 shadow-[0_10px_34px_rgba(28,24,52,0.045)] backdrop-blur-xl md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-[#eeecf2] bg-white/60 text-[10px] font-bold uppercase tracking-[.14em] text-muted">
              <tr><th className="px-5 py-3.5 font-semibold">Event</th><th className="px-5 py-3.5 font-semibold">Club</th><th className="px-5 py-3.5 font-semibold">Category</th><th className="px-5 py-3.5 font-semibold">Event date</th><th className="px-5 py-3.5 font-semibold">Created</th><th className="px-5 py-3.5 font-semibold">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {(events ?? []).map((event) => <tr key={event.id} className="transition-colors hover:bg-violet-50/30">
                <td className="px-5 py-4"><Link href={`/admin/events/${event.id}`} className="font-semibold text-foreground hover:text-accent">{event.title}</Link></td>
                <td className="px-5 py-4 text-muted">{clubNames.get(event.club_id) ?? "Unknown club"}</td>
                <td className="px-5 py-4 text-muted">{event.category_id ? categoryNames.get(event.category_id) ?? "Unknown category" : "—"}</td>
                <td className="px-5 py-4 text-muted">{dateLabel(event.event_date, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="px-5 py-4 text-muted">{dateLabel(event.created_at, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[event.status] ?? statusStyles.draft}`}>{event.status}</span></td>
              </tr>)}
              {!error && (events ?? []).length === 0 && <tr><td colSpan={6} className="px-5 py-12 text-center"><p className="font-heading text-base font-bold text-foreground">No events found</p><p className="mt-1 text-sm text-muted">Events matching this status will appear here.</p></td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-5 space-y-3 md:hidden">
        {(events ?? []).map((event) => <Link key={event.id} href={`/admin/events/${event.id}`} className="block rounded-[20px] border border-white/90 bg-white/70 p-4 shadow-[0_9px_28px_rgba(28,24,52,0.045)] backdrop-blur-xl transition hover:border-accent/20 hover:bg-white">
          <div className="flex items-start justify-between gap-3"><h2 className="min-w-0 break-words font-heading font-bold">{event.title}</h2><span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize ${statusStyles[event.status] ?? statusStyles.draft}`}>{event.status}</span></div>
          <p className="mt-2 text-xs font-medium text-accent">{clubNames.get(event.club_id) ?? "Unknown club"}{event.category_id ? ` · ${categoryNames.get(event.category_id) ?? "Unknown category"}` : ""}</p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#eeecf2] pt-3 text-[11px] text-muted"><span>Event: {dateLabel(event.event_date, { month: "short", day: "numeric", year: "numeric" })}</span><span>Added: {dateLabel(event.created_at, { month: "short", day: "numeric", year: "numeric" })}</span></div>
        </Link>)}
        {!error && (events ?? []).length === 0 && <div className="rounded-[20px] border border-white/90 bg-white/70 px-5 py-10 text-center shadow-subtle"><p className="font-heading font-bold">No events found</p><p className="mt-1 text-sm text-muted">Events matching this status will appear here.</p></div>}
      </div>
    </div>
  );
}

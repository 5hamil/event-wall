import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { EventFilters } from "./components/event-filters";
import { PublicEventCard, type PublicEvent } from "./components/public-event-card";
import { PublicFooter } from "./components/public-footer";
import { PublicHeader } from "./components/public-header";

type SearchParams = { q?: string; club?: string; category?: string; from?: string; to?: string; sort?: string };
const campusTimeZone = "Asia/Kolkata";

function todayAtCampus() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: campusTimeZone, year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  return parts;
}

function validDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : value;
}

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

export default async function PublicHomePage({ searchParams = {} }: { searchParams?: SearchParams }) {
  noStore();
  const supabase = createPublicClient();
  const [clubsResult, categoriesResult] = await Promise.all([
    supabase.from("clubs").select("id, name, slug").eq("is_active", true).order("name"),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  const clubs = clubsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const clubIds = clubs.map((club) => club.id);
  const today = todayAtCampus();
  const from = validDate(searchParams.from);
  const to = validDate(searchParams.to);
  const searchTerm = searchParams.q?.trim().slice(0, 100) ?? "";
  const selectedClubIsActive = !searchParams.club || clubIds.includes(searchParams.club);

  let events: PublicEvent[] = [];
  let eventsError: string | null = null;
  if (clubIds.length > 0 && selectedClubIsActive) {
    let query = supabase
      .from("events")
      .select("id, club_id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details, created_at")
      .eq("status", "approved")
      .in("club_id", clubIds)
      .gte("event_date", from && from > today ? from : today);
    if (searchParams.club) query = query.eq("club_id", searchParams.club);
    if (searchParams.category) query = query.eq("category_id", searchParams.category);
    if (to) query = query.lte("event_date", to);
    if (searchTerm) query = query.ilike("title", `%${escapeLike(searchTerm)}%`);
    if (searchParams.sort === "recent") query = query.order("created_at", { ascending: false });
    else query = query.order("event_date", { ascending: true }).order("event_time", { ascending: true });

    const result = await query;
    if (result.error) eventsError = result.error.message;
    else {
      const categoryNames = new Map(categories.map((category) => [category.id, category.name]));
      const clubNames = new Map(clubs.map((club) => [club.id, { name: club.name, slug: club.slug }]));
      events = (result.data ?? []).map((event) => ({
        ...event,
        club: clubNames.get(event.club_id) ?? null,
        category: event.category_id ? categoryNames.get(event.category_id) ?? null : null,
      }));
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />

      <section className="mx-auto max-w-7xl px-5 pb-8 pt-8 sm:px-8 sm:pb-12 sm:pt-14 lg:px-10 lg:pt-20">
        <div className="grid items-end gap-7 lg:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.17em] text-accent shadow-subtle"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Your campus, in motion</p>
            <h1 className="mt-5 max-w-3xl font-heading text-[2.65rem] font-extrabold leading-[1.04] tracking-[-.045em] sm:text-6xl lg:text-[4.25rem]">Make room for<br className="hidden sm:block" /> <span className="text-accent">something happening.</span></h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted sm:text-lg sm:leading-8">Discover the talks, workshops, performances and pop-ups bringing campus together.</p>
          </div>
          <Link href="/clubs" className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-foreground shadow-subtle transition hover:shadow-lift">Meet the clubs <span aria-hidden="true" className="text-accent">↗</span></Link>
        </div>
      </section>

      <section id="events" className="mx-auto max-w-7xl scroll-mt-6 px-5 pb-16 sm:px-8 lg:px-10">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-5 sm:pb-6">
          <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">THE CAMPUS CALENDAR</p><h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">Coming up</h2></div>
          <p className="text-sm text-muted">{events.length} {events.length === 1 ? "event" : "events"} to explore</p>
        </div>

        <EventFilters clubs={clubs} categories={categories} />
        {categoriesResult.error && <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Category filters need the public category-read migration. Apply `0004_public_category_read.sql` in Supabase.</p>}
        {eventsError && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Events could not be loaded: {eventsError}</p>}

        {events.length > 0 ? <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => <PublicEventCard key={event.id} event={event} />)}
        </div> : !eventsError && <div className="mt-6 rounded-[20px] bg-white px-6 py-14 text-center shadow-subtle sm:py-20">
          <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-2xl text-accent">✳</span>
          <h3 className="mt-4 font-heading text-lg font-bold">{searchTerm || searchParams.club || searchParams.category || from || to ? "No events match your search" : "Nothing on the calendar yet"}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{searchTerm || searchParams.club || searchParams.category || from || to ? "Try adjusting your filters or search terms." : "New campus events will show up here as soon as they’re approved."}</p>
          <Link href={searchTerm || searchParams.club || searchParams.category || from || to ? "/#events" : "/club/login"} className="mt-5 inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark">{searchTerm || searchParams.club || searchParams.category || from || to ? "Clear filters" : "You run a club? Submit an event"}</Link>
        </div>}
      </section>

      <PublicFooter />
    </main>
  );
}

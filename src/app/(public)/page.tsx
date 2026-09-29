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

      <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-12 pt-8 sm:px-8 sm:pb-16 sm:pt-12 lg:px-10 lg:pb-20 lg:pt-14">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 top-0 h-72 w-72 rounded-full bg-violet-200/50 blur-3xl sm:right-8 sm:h-96 sm:w-96" />
        <div className="relative grid min-h-[390px] items-center gap-7 overflow-hidden rounded-[30px] border border-white/80 bg-white/35 px-6 py-10 shadow-[0_18px_60px_rgba(56,44,110,0.06)] backdrop-blur-[2px] sm:px-10 sm:py-12 lg:min-h-[440px] lg:grid-cols-[1.1fr_.9fr] lg:gap-8 lg:px-16">
          <div className="relative z-10 max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/65 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.17em] text-accent shadow-[0_6px_24px_rgba(56,44,110,0.07)] backdrop-blur-xl"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Your campus, in motion</p>
            <h1 className="mt-6 max-w-2xl font-heading text-[2.8rem] font-extrabold leading-[1.02] tracking-[-.055em] sm:text-6xl lg:text-[4.5rem]">Make room for<br className="hidden sm:block" /> <span className="bg-gradient-to-r from-accent to-[#9b7bec] bg-clip-text text-transparent">something happening.</span></h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted sm:text-lg sm:leading-8">Discover the talks, workshops, performances and pop-ups bringing campus together.</p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/#events" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_22px_rgba(23,23,23,0.14)] transition hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Explore events <span aria-hidden="true">↗</span></Link>
              <Link href="/clubs" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/80 bg-white/55 px-5 py-3 text-sm font-semibold text-foreground backdrop-blur-xl transition hover:bg-white/85">Meet the clubs <span aria-hidden="true" className="text-accent">↗</span></Link>
            </div>
          </div>

          <div aria-hidden="true" className="relative mx-auto hidden aspect-square w-full max-w-[340px] items-center justify-center lg:flex">
            <div className="absolute inset-8 rounded-full bg-gradient-to-br from-violet-200/70 via-fuchsia-100/50 to-amber-100/70 blur-2xl" />
            <div className="absolute left-1 top-12 h-24 w-24 rounded-[28px] border border-white/80 bg-white/35 shadow-[0_18px_55px_rgba(66,49,120,0.10)] backdrop-blur-xl" />
            <div className="absolute bottom-7 right-0 h-28 w-28 rounded-full border border-white/80 bg-white/30 shadow-[0_18px_55px_rgba(66,49,120,0.10)] backdrop-blur-xl" />
            <div className="relative w-[82%] rotate-[-3deg] rounded-[28px] border border-white/80 bg-white/55 p-5 shadow-[0_24px_70px_rgba(66,49,120,0.14)] backdrop-blur-2xl">
              <div className="flex items-center justify-between"><span className="text-[10px] font-bold uppercase tracking-[.18em] text-muted">A LITTLE OF EVERYTHING</span><span className="grid h-8 w-8 place-items-center rounded-full border border-white/80 bg-white/70 text-sm text-accent">✳</span></div>
              <p className="mt-5 font-heading text-2xl font-bold leading-tight tracking-tight">Find your next<br />favorite thing.</p>
              <div className="mt-5 space-y-2.5">
                <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/60 px-3.5 py-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-violet-100 text-sm text-accent">✦</span><span className="text-xs font-semibold">Ideas worth sharing</span></div>
                <div className="ml-5 flex items-center gap-3 rounded-2xl border border-white/80 bg-white/45 px-3.5 py-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-100 text-sm text-amber-700">↗</span><span className="text-xs font-semibold">People worth meeting</span></div>
              </div>
              <div className="mt-5 flex gap-1.5"><span className="h-1.5 w-8 rounded-full bg-accent/80"/><span className="h-1.5 w-3 rounded-full bg-accent/20"/><span className="h-1.5 w-3 rounded-full bg-accent/20"/></div>
            </div>
          </div>
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

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { PublicEventCard, type PublicEvent } from "../../components/public-event-card";
import { PublicFooter } from "../../components/public-footer";
import { PublicHeader } from "../../components/public-header";

function todayAtCampus() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export default async function PublicClubPage({ params }: { params: { slug: string } }) {
  noStore();
  const supabase = createPublicClient();
  const { data: club } = await supabase.from("clubs").select("id, name, slug, logo_url, description").eq("slug", params.slug).eq("is_active", true).maybeSingle();
  if (!club) notFound();

  const [eventsResult, categoriesResult] = await Promise.all([
    supabase.from("events").select("id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details").eq("club_id", club.id).eq("status", "published").gte("event_date", todayAtCampus()).order("event_date", { ascending: true }),
    supabase.from("categories").select("id, name").order("name"),
  ]);
  const categoryNames = new Map((categoriesResult.data ?? []).map((category) => [category.id, category.name]));
  const events = (eventsResult.data ?? []).map((event): PublicEvent => ({
    ...event,
    club: { name: club.name, slug: club.slug },
    category: event.category_id ? categoryNames.get(event.category_id) ?? null : null,
  }));

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-20 pt-8 sm:px-8 sm:pb-24 sm:pt-12 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-12 h-96 w-96 rounded-full bg-violet-200/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-80 h-80 w-80 rounded-full bg-indigo-100/50 blur-3xl" />
        <div className="relative">
          <Link href="/clubs" className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/55 px-3.5 py-2 text-xs font-semibold text-muted shadow-[0_4px_16px_rgba(28,24,52,0.04)] backdrop-blur-xl transition hover:border-accent/20 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><span aria-hidden="true">←</span> All clubs</Link>

          <section aria-labelledby="club-title" className="relative mt-6 overflow-hidden rounded-[30px] border border-white/90 bg-white/55 p-6 shadow-[0_20px_65px_rgba(28,24,52,0.07)] backdrop-blur-2xl sm:mt-8 sm:p-10 lg:p-12">
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full bg-violet-200/45 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/3 h-40 w-64 rounded-full bg-amber-100/45 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="min-w-0">
                <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" /> Club portfolio</p>
                <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                  {club.logo_url ? <span className="relative h-20 w-20 shrink-0 overflow-hidden rounded-[26px] border border-white bg-white/75 p-1.5 shadow-[0_12px_34px_rgba(56,44,110,0.12)] sm:h-24 sm:w-24"><Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="96px" unoptimized className="rounded-[20px] object-cover" /></span> : <span aria-hidden="true" className="grid h-20 w-20 shrink-0 place-items-center rounded-[26px] border border-white/90 bg-gradient-to-br from-violet-100/90 to-indigo-100/80 font-heading text-3xl font-extrabold text-accent shadow-[0_12px_34px_rgba(56,44,110,0.10)] sm:h-24 sm:w-24">{club.name.slice(0, 1).toUpperCase()}</span>}
                  <div className="min-w-0">
                    <h1 id="club-title" className="break-words font-heading text-4xl font-extrabold tracking-[-.05em] sm:text-6xl">{club.name}</h1>
                    <p className="mt-2 text-sm font-medium text-muted">A campus community</p>
                  </div>
                </div>
                {club.description && <p className="mt-6 max-w-2xl text-base leading-7 text-muted sm:text-lg sm:leading-8">{club.description}</p>}
              </div>
              <a href="#upcoming" className="inline-flex min-h-12 w-fit items-center gap-3 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(23,23,23,0.13)] transition hover:-translate-y-0.5 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Explore upcoming events <span aria-hidden="true">↓</span></a>
            </div>
          </section>

          {eventsResult.error && <p role="alert" className="mt-8 rounded-2xl border border-red-100 bg-red-50/90 px-5 py-4 text-sm text-red-700">Club events could not be loaded: {eventsResult.error.message}</p>}
          <section id="upcoming" className="scroll-mt-8 pt-14 sm:pt-16" aria-labelledby="upcoming-title">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-accent">The club calendar</p><h2 id="upcoming-title" className="mt-2 font-heading text-3xl font-bold tracking-tight sm:text-4xl">Upcoming events</h2><p className="mt-2 text-sm text-muted">See what {club.name} is bringing to campus.</p></div>
              <span className="rounded-full border border-white/90 bg-white/65 px-4 py-2 text-sm text-muted shadow-[0_6px_24px_rgba(56,44,110,0.05)] backdrop-blur-xl"><span className="font-semibold text-foreground">{events.length}</span> {events.length === 1 ? "event" : "events"}</span>
            </div>
            {events.length ? <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{events.map((event) => <PublicEventCard key={event.id} event={event} />)}</div> : !eventsResult.error && <div className="mt-7 rounded-[26px] border border-white/90 bg-white/60 px-6 py-12 text-center shadow-[0_14px_42px_rgba(28,24,52,0.05)] backdrop-blur-xl sm:py-16">
              <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl text-accent">✳</span>
              <h3 className="mt-4 font-heading text-lg font-bold">Nothing on the calendar just yet</h3>
              <p className="mt-2 text-sm text-muted">Upcoming events from {club.name} will appear here.</p>
              <Link href="/#events" className="mt-5 inline-flex rounded-full border border-[#e9e7ef] bg-white/80 px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/30 hover:text-accent">Browse all campus events <span aria-hidden="true" className="ml-2">→</span></Link>
            </div>}
          </section>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

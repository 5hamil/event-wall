import Image from "next/image";
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
    supabase.from("events").select("id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details").eq("club_id", club.id).eq("status", "approved").gte("event_date", todayAtCampus()).order("event_date", { ascending: true }),
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
      <section className="mx-auto max-w-7xl px-5 pb-14 pt-8 sm:px-8 sm:pt-12 lg:px-10">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">CAMPUS CLUB</p>
        <div className="mt-4 flex items-center gap-4">
          {club.logo_url && <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white shadow-subtle"><Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="64px" unoptimized className="object-cover" /></span>}
          <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl">{club.name}</h1>
        </div>
        {club.description && <p className="mt-4 max-w-2xl text-base leading-7 text-muted">{club.description}</p>}
        {eventsResult.error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Club events could not be loaded: {eventsResult.error.message}</p>}
        <div className="mt-10 flex items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">WHAT’S ON</p><h2 className="mt-2 font-heading text-2xl font-bold">Upcoming events</h2></div><span className="text-sm text-muted">{events.length} listed</span></div>
        {events.length ? <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">{events.map((event) => <PublicEventCard key={event.id} event={event} />)}</div> : !eventsResult.error && <p className="mt-5 rounded-[18px] bg-white p-6 text-sm text-muted shadow-subtle">No upcoming approved events from this club yet.</p>}
      </section>
      <PublicFooter />
    </main>
  );
}

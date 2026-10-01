import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { formatEventDate } from "../../components/public-event-card";
import { PublicFooter } from "../../components/public-footer";
import { PublicHeader } from "../../components/public-header";
import type { Metadata } from "next";

type EventPageProps = { params: { id: string } };

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const supabase = createPublicClient();
  const { data: event } = await supabase.from("events").select("title, description, poster_url").eq("id", params.id).eq("status", "approved").maybeSingle();
  if (!event) return { title: "Event not found | Event Wall" };
  const description = event.description?.replace(/\s+/g, " ").trim().slice(0, 200) || `Discover ${event.title} on Event Wall.`;
  const images = event.poster_url ? [{ url: event.poster_url, alt: `${event.title} event poster` }] : undefined;
  return {
    title: `${event.title} | Event Wall`,
    description,
    openGraph: { title: event.title, description, type: "website", images },
    twitter: { card: images ? "summary_large_image" : "summary", title: event.title, description, images: event.poster_url ? [event.poster_url] : undefined },
  };
}

export default async function PublicEventDetailPage({ params }: EventPageProps) {
  noStore();
  const supabase = createPublicClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, club_id, category_id, title, description, poster_url, event_date, event_time, venue, registration_link, contact_details")
    .eq("id", params.id)
    .eq("status", "approved")
    .maybeSingle();
  if (!event) notFound();

  const [clubResult, categoryResult] = await Promise.all([
    supabase.from("clubs").select("name, slug, logo_url, description").eq("id", event.club_id).eq("is_active", true).maybeSingle(),
    event.category_id ? supabase.from("categories").select("name").eq("id", event.category_id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (!clubResult.data) notFound();

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <article className="mx-auto max-w-6xl px-5 pb-16 pt-4 sm:px-8 sm:pt-8 lg:px-10">
        <Link href="/" className="text-sm font-semibold text-muted transition hover:text-accent">← Back to events</Link>
        <div className="mt-5 grid items-start gap-7 lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,.75fr)] lg:gap-10">
          <div>
            <div className="relative mx-auto h-[58vh] min-h-[300px] max-h-[760px] overflow-hidden rounded-[22px] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50 shadow-subtle">
              {event.poster_url ? <Image src={event.poster_url} alt={`${event.title} event poster`} fill priority sizes="(max-width: 1023px) 100vw, 65vw" unoptimized className="object-contain" /> : <div className="absolute inset-0 grid place-items-center"><span aria-hidden="true" className="font-heading text-8xl font-extrabold tracking-tight text-accent/30">e.</span></div>}
            </div>
            <div className="mt-7">
              {categoryResult.data?.name && <p className="text-xs font-bold uppercase tracking-[.17em] text-accent">{categoryResult.data.name}</p>}
              <h1 className="mt-2 font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{event.title}</h1>
              <p className="mt-4 text-base leading-7 text-muted sm:text-lg">{formatEventDate(event.event_date, event.event_time, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              {event.venue && <p className="mt-1 text-sm text-muted">{event.venue}</p>}
            </div>
            <section className="mt-8 border-t border-border pt-6">
              <h2 className="font-heading text-lg font-bold">About this event</h2>
              {event.description ? <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">{event.description}</p> : <p className="mt-3 text-sm text-muted">More details coming soon.</p>}
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-6">
            <section className="rounded-[20px] bg-white p-5 shadow-subtle sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">WHEN & WHERE</p>
              <p className="mt-3 text-sm font-semibold">{formatEventDate(event.event_date, event.event_time, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
              {event.venue && <p className="mt-1 text-sm text-muted">{event.venue}</p>}
              {event.registration_link && <a href={event.registration_link} target="_blank" rel="noopener noreferrer" className="mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-white shadow-subtle transition hover:bg-accent-dark">Register <span aria-hidden="true">↗</span></a>}
            </section>

            <section className="rounded-[20px] bg-white p-5 shadow-subtle sm:p-6">
              <p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">ORGANIZED BY</p>
              <Link href={`/clubs/${clubResult.data.slug}`} className="mt-3 flex items-center gap-3 rounded-xl transition hover:text-accent">
                {clubResult.data.logo_url ? <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-background"><Image src={clubResult.data.logo_url} alt={`${clubResult.data.name} logo`} fill sizes="48px" unoptimized className="object-cover" /></span> : <span aria-hidden="true" className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-violet-50 font-heading text-lg font-bold text-accent">{clubResult.data.name.slice(0, 1).toUpperCase()}</span>}
                <span><span className="block font-heading font-bold">{clubResult.data.name}</span><span className="mt-0.5 block text-xs text-muted">View club events →</span></span>
              </Link>
              {clubResult.data.description && <p className="mt-4 text-sm leading-6 text-muted">{clubResult.data.description}</p>}
            </section>

            {event.contact_details && <section className="rounded-[20px] bg-white p-5 shadow-subtle sm:p-6"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">CONTACT</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6">{event.contact_details}</p></section>}
          </aside>
        </div>
      </article>
      <PublicFooter />
    </main>
  );
}

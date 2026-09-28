import Image from "next/image";
import Link from "next/link";

export type PublicEvent = {
  id: string;
  title: string;
  description?: string | null;
  poster_url: string | null;
  event_date: string;
  event_time: string | null;
  venue: string | null;
  registration_link?: string | null;
  contact_details?: string | null;
  club: { name: string; slug: string } | null;
  category: string | null;
};

export function formatEventDate(date: string, time?: string | null, options: Intl.DateTimeFormatOptions = {}) {
  const day = new Intl.DateTimeFormat("en", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC", ...options,
  }).format(new Date(`${date}T00:00:00Z`));
  return time ? `${day} · ${time.slice(0, 5)}` : day;
}

export function PublicEventCard({ event }: { event: PublicEvent }) {
  return (
    <article className="group min-w-0">
      <Link href={`/events/${event.id}`} className="block h-full rounded-[18px] bg-white p-2.5 shadow-subtle transition duration-200 hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[13px] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-amber-50">
          {event.poster_url ? <Image src={event.poster_url} alt={`${event.title} event poster`} fill sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 1023px) 50vw, 33vw" unoptimized className="object-cover transition duration-300 group-hover:scale-[1.025]" /> : <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.9),transparent_28%),linear-gradient(135deg,#eeeaff,#f9eef8_58%,#fff3e9)]"><span className="font-heading text-6xl font-extrabold tracking-tight text-accent/35" aria-hidden="true">e.</span></div>}
          <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3.5">
            {event.category && <span className="max-w-[70%] truncate rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-foreground shadow-subtle backdrop-blur">{event.category}</span>}
            <span className="ml-auto rounded-xl bg-white/95 px-2.5 py-1.5 text-center shadow-subtle backdrop-blur"><span className="block font-heading text-lg font-extrabold leading-none">{new Date(`${event.event_date}T00:00:00Z`).getUTCDate()}</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.12em] text-muted">{new Intl.DateTimeFormat("en", { month: "short", timeZone: "UTC" }).format(new Date(`${event.event_date}T00:00:00Z`))}</span></span>
          </div>
        </div>
        <div className="px-2.5 pb-3 pt-4">
          <p className="truncate text-xs font-semibold text-accent">{event.club?.name ?? "Campus club"}</p>
          <h2 className="mt-1.5 line-clamp-2 min-h-[3.5rem] font-heading text-xl font-bold leading-snug tracking-tight text-foreground">{event.title}</h2>
          <div className="mt-3 space-y-1.5 text-xs leading-5 text-muted">
            <p>{formatEventDate(event.event_date, event.event_time)}</p>
            <p className="truncate">{event.venue || "Venue to be announced"}</p>
          </div>
        </div>
      </Link>
    </article>
  );
}

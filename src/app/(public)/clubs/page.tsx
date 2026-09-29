import Image from "next/image";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { PublicFooter } from "../components/public-footer";
import { PublicHeader } from "../components/public-header";

export default async function PublicClubsPage() {
  noStore();
  const supabase = createPublicClient();
  const { data: clubs, error } = await supabase.from("clubs").select("id, name, slug, logo_url, description").eq("is_active", true).order("name");

  return (
    <main className="min-h-screen bg-background">
      <PublicHeader />
      <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-20 pt-10 sm:px-8 sm:pb-24 sm:pt-16 lg:px-10">
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 top-8 h-80 w-80 rounded-full bg-violet-200/35 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-72 h-72 w-72 rounded-full bg-indigo-100/45 blur-3xl" />
        <div className="relative">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/60 px-3.5 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-accent shadow-[0_6px_24px_rgba(56,44,110,0.06)] backdrop-blur-xl"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent" /> Find your community</p>
              <h1 className="mt-5 font-heading text-4xl font-extrabold tracking-[-.045em] sm:text-6xl">Campus clubs</h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted sm:text-lg">Meet the people behind the things happening around campus.</p>
            </div>
            {!error && (clubs ?? []).length > 0 && <p className="rounded-full border border-white/90 bg-white/65 px-4 py-2 text-sm text-muted shadow-[0_6px_24px_rgba(56,44,110,0.05)] backdrop-blur-xl"><span className="font-semibold text-foreground">{clubs!.length}</span> {clubs!.length === 1 ? "community" : "communities"}</p>}
          </div>
          {error && <p role="alert" className="mt-8 rounded-2xl border border-red-100 bg-red-50/90 px-5 py-4 text-sm text-red-700 shadow-subtle">Clubs could not be loaded: {error.message}</p>}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5">
            {(clubs ?? []).map((club) => <Link key={club.id} href={`/clubs/${club.slug}`} className="group relative isolate overflow-hidden rounded-[26px] border border-white/90 bg-white/65 p-5 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-accent/20 hover:bg-white/85 hover:shadow-[0_24px_60px_rgba(56,44,110,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-6">
              <span aria-hidden="true" className="pointer-events-none absolute -right-10 -top-12 -z-10 h-36 w-36 rounded-full bg-violet-200/35 blur-3xl transition duration-300 group-hover:bg-violet-300/50" />
              <div className="flex items-center gap-4">
                {club.logo_url ? <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[20px] border border-white bg-white/80 p-1 shadow-[0_8px_24px_rgba(28,24,52,0.08)]"><Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="64px" unoptimized className="rounded-[16px] object-cover" /></span> : <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-[20px] border border-white/90 bg-gradient-to-br from-violet-50 to-indigo-100/80 font-heading text-2xl font-bold text-accent shadow-[0_8px_24px_rgba(56,44,110,0.08)]">{club.name.slice(0, 1).toUpperCase()}</span>}
                <span className="min-w-0 flex-1"><span className="mb-1.5 block text-[9px] font-bold uppercase tracking-[.18em] text-accent/75">Campus community</span><span className="block truncate font-heading text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-accent">{club.name}</span></span>
                <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#e9e7ef] bg-white/70 text-muted transition duration-200 group-hover:border-accent/20 group-hover:bg-accent group-hover:text-white">↗</span>
              </div>
              {club.description && <p className="mt-5 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-muted">{club.description}</p>}
              <span className="mt-5 block border-t border-[#eeecf2]/80 pt-4 text-xs font-semibold text-muted transition-colors group-hover:text-accent">Discover this club <span aria-hidden="true">→</span></span>
            </Link>)}
            {!error && (clubs ?? []).length === 0 && <div className="rounded-[26px] border border-white/90 bg-white/65 px-6 py-12 text-center shadow-subtle backdrop-blur-xl sm:col-span-2 lg:col-span-3">
              <span aria-hidden="true" className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-xl text-accent">✳</span>
              <h2 className="mt-4 font-heading text-lg font-bold">Communities are on their way</h2>
              <p className="mt-2 text-sm text-muted">Active campus clubs will appear here soon.</p>
            </div>}
          </div>
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

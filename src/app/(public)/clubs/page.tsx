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
      <section className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 sm:pt-14 lg:px-10">
        <p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">FIND YOUR COMMUNITY</p>
        <h1 className="mt-3 font-heading text-4xl font-extrabold tracking-tight sm:text-5xl">Campus clubs</h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">Meet the people behind the things happening around campus.</p>
        {error && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Clubs could not be loaded: {error.message}</p>}
        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(clubs ?? []).map((club) => <Link key={club.id} href={`/clubs/${club.slug}`} className="group rounded-[18px] bg-white p-5 shadow-subtle transition hover:-translate-y-0.5 hover:shadow-lift">
            <div className="flex items-center gap-4">
              {club.logo_url ? <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-background"><Image src={club.logo_url} alt={`${club.name} logo`} fill sizes="56px" unoptimized className="object-cover" /></span> : <span aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-50 font-heading text-xl font-bold text-accent">{club.name.slice(0, 1).toUpperCase()}</span>}
              <span className="min-w-0"><span className="block truncate font-heading text-lg font-bold group-hover:text-accent">{club.name}</span><span className="mt-1 block text-xs font-semibold text-accent">View club page →</span></span>
            </div>
            {club.description && <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted">{club.description}</p>}
          </Link>)}
          {!error && (clubs ?? []).length === 0 && <p className="rounded-[18px] bg-white p-6 text-sm text-muted shadow-subtle">Active clubs will appear here soon.</p>}
        </div>
      </section>
      <PublicFooter />
    </main>
  );
}

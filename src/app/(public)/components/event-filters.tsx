"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { id: string; name: string };

export function EventFilters({ clubs, categories }: { clubs: Option[]; categories: Option[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const serialized = searchParams.toString();
  const currentQuery = searchParams.get("q") ?? "";
  const [query, setQuery] = useState(currentQuery);
  const activeFilterCount = ["q", "club", "category", "from", "to"].filter((key) => searchParams.has(key)).length;

  useEffect(() => setQuery(currentQuery), [currentQuery]);

  const updateParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(serialized);
    if (value) params.set(key, value);
    else params.delete(key);
    const next = params.toString();
    router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [pathname, router, serialized]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const params = new URLSearchParams(serialized);
      if (query.trim()) params.set("q", query.trim());
      else params.delete("q");
      const next = params.toString();
      const target = next ? `${pathname}?${next}` : pathname;
      const current = serialized ? `${pathname}?${serialized}` : pathname;
      if (target !== current) router.replace(target, { scroll: false });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, serialized]);

  const controlClass = "h-12 w-full rounded-2xl border border-[#e9e7ef] bg-white/80 px-4 text-sm font-medium text-foreground shadow-[0_2px_8px_rgba(28,24,52,0.025)] outline-none transition duration-200 hover:border-accent/30 hover:bg-white focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10";
  const labelClass = "mb-2 block text-[10px] font-bold uppercase tracking-[.16em] text-muted";
  const clearFilters = () => {
    setQuery("");
    router.replace(pathname, { scroll: false });
  };

  return (
    <section aria-label="Search and filter events" className="rounded-[26px] border border-white/80 bg-white/75 p-4 shadow-[0_18px_55px_rgba(28,24,52,0.055)] backdrop-blur-xl sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative min-w-0 flex-1">
        <label className="sr-only" htmlFor="event-search">Search event titles</label>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-accent"><circle cx="10.8" cy="10.8" r="6.8" stroke="currentColor" strokeWidth="1.7"/><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
        <input id="event-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, talks, workshops…" className="h-12 w-full rounded-2xl border border-[#e9e7ef] bg-[#faf9fc] pl-12 pr-4 text-sm outline-none transition duration-200 placeholder:text-muted/75 hover:border-accent/30 hover:bg-white focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10 sm:h-[52px]" />
      </div>
      <label className="sm:w-[190px]"><span className="sr-only">Sort by</span><select aria-label="Sort events" value={searchParams.get("sort") ?? "soonest"} onChange={(event) => updateParam("sort", event.target.value === "recent" ? "recent" : "")} className={controlClass}><option value="soonest">↗ &nbsp; Soonest first</option><option value="recent">✦ &nbsp; Recently added</option></select></label>
      </div>
      <div className="mt-5 border-t border-[#eeecf2] pt-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className={labelClass + " mb-0"}>Explore by</p>
          {activeFilterCount > 0 && <button type="button" onClick={clearFilters} className="rounded-full px-3 py-1.5 text-xs font-semibold text-accent transition hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Clear filters <span aria-hidden="true">×</span></button>}
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className={labelClass}>Club</span><select aria-label="Filter by club" value={searchParams.get("club") ?? ""} onChange={(event) => updateParam("club", event.target.value)} className={controlClass}><option value="">All clubs</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
          <label><span className={labelClass}>Category</span><select aria-label="Filter by category" value={searchParams.get("category") ?? ""} onChange={(event) => updateParam("category", event.target.value)} className={controlClass}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
          <label><span className={labelClass}>From</span><input aria-label="Start date" type="date" value={searchParams.get("from") ?? ""} onChange={(event) => updateParam("from", event.target.value)} className={controlClass} /></label>
          <label><span className={labelClass}>Through</span><input aria-label="End date" type="date" value={searchParams.get("to") ?? ""} onChange={(event) => updateParam("to", event.target.value)} className={controlClass} /></label>
        </div>
      </div>
    </section>
  );
}

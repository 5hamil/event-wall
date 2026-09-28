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

  const selectClass = "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10";
  const labelClass = "mb-1.5 block text-[10px] font-bold uppercase tracking-[.14em] text-muted";

  return (
    <section aria-label="Search and filter events" className="rounded-[20px] bg-white p-4 shadow-subtle sm:p-5">
      <div className="relative">
        <label className="sr-only" htmlFor="event-search">Search event titles</label>
        <span aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-muted">⌕</span>
        <input id="event-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search event titles" className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition placeholder:text-muted/80 focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10" />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label><span className={labelClass}>Club</span><select aria-label="Filter by club" value={searchParams.get("club") ?? ""} onChange={(event) => updateParam("club", event.target.value)} className={selectClass}><option value="">All clubs</option>{clubs.map((club) => <option key={club.id} value={club.id}>{club.name}</option>)}</select></label>
        <label><span className={labelClass}>Category</span><select aria-label="Filter by category" value={searchParams.get("category") ?? ""} onChange={(event) => updateParam("category", event.target.value)} className={selectClass}><option value="">All categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
        <label><span className={labelClass}>From</span><input aria-label="Start date" type="date" value={searchParams.get("from") ?? ""} onChange={(event) => updateParam("from", event.target.value)} className={selectClass} /></label>
        <label><span className={labelClass}>Through</span><input aria-label="End date" type="date" value={searchParams.get("to") ?? ""} onChange={(event) => updateParam("to", event.target.value)} className={selectClass} /></label>
        <label><span className={labelClass}>Sort by</span><select aria-label="Sort events" value={searchParams.get("sort") ?? "soonest"} onChange={(event) => updateParam("sort", event.target.value === "recent" ? "recent" : "")} className={selectClass}><option value="soonest">Soonest first</option><option value="recent">Recently added</option></select></label>
      </div>
    </section>
  );
}

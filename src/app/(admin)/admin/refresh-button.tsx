"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function AdminRefreshButton() {
  const router = useRouter();
  const [refreshing, startTransition] = useTransition();

  return <button type="button" onClick={() => startTransition(() => router.refresh())} disabled={refreshing} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#e9e7ef] bg-white/75 px-4 text-sm font-semibold text-muted shadow-sm backdrop-blur transition hover:border-accent/25 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-60">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.6 9A7 7 0 0 1 18 6.5L20 12M4 12l2 5.5A7 7 0 0 0 18.4 15"/></svg>
    {refreshing ? "Refreshing…" : "Refresh data"}
  </button>;
}

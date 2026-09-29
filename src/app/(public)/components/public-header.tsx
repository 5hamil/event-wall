import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-3 z-40 mx-auto mt-4 flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-3 rounded-full border border-white/80 bg-white/95 px-3 py-2 shadow-[0_8px_30px_rgba(25,22,43,0.10)] backdrop-blur-md sm:top-5 sm:mt-6 sm:gap-5 sm:px-4">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-sm font-extrabold tracking-tight" aria-label="Event Wall home">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs text-white">e</span>
        eventwall<span className="-ml-2 text-accent">.</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-1 text-[11px] font-semibold text-muted sm:gap-2 sm:text-xs">
        <Link href="/" className="rounded-full px-2.5 py-2 transition hover:bg-background hover:text-foreground sm:px-3">Home</Link>
        <Link href="/#events" className="rounded-full px-2.5 py-2 transition hover:bg-background hover:text-foreground sm:px-3">Events</Link>
        <Link href="/clubs" className="rounded-full px-2.5 py-2 transition hover:bg-background hover:text-foreground sm:px-3">Clubs</Link>
      </nav>
    </header>
  );
}

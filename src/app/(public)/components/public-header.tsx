import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="sticky top-2 z-40 mx-auto mt-3 flex w-fit max-w-[calc(100%-1rem)] items-center justify-between gap-2 rounded-full border border-white/80 bg-white/95 px-2.5 py-2 shadow-[0_8px_30px_rgba(25,22,43,0.10)] backdrop-blur-md sm:top-5 sm:mt-6 sm:w-fit sm:justify-start sm:gap-7 sm:px-6">
      <Link href="/" className="flex shrink-0 items-center gap-2 font-heading text-sm font-extrabold tracking-tight" aria-label="Event Wall home">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-xs text-white">e</span>
        eventwall<span className="-ml-2 text-accent">.</span>
      </Link>
      <nav aria-label="Main navigation" className="flex shrink-0 items-center gap-0.5 text-[10px] font-semibold text-muted sm:gap-3 sm:text-xs">
        <Link href="/" className="rounded-full px-2 py-2 transition hover:bg-background hover:text-foreground sm:px-4">Home</Link>
        <Link href="/#events" className="rounded-full px-2 py-2 transition hover:bg-background hover:text-foreground sm:px-4">Events</Link>
        <Link href="/clubs" className="rounded-full px-2 py-2 transition hover:bg-background hover:text-foreground sm:px-4">Clubs</Link>
      </nav>
    </header>
  );
}

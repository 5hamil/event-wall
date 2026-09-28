import Link from "next/link";

export function PublicHeader() {
  return (
    <header className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-5 sm:px-8 lg:px-10">
      <Link href="/" className="flex shrink-0 items-center gap-2.5 font-heading text-lg font-extrabold tracking-tight" aria-label="Event Wall home">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-base text-white shadow-subtle">e</span>
        eventwall<span className="-ml-2 text-accent">.</span>
      </Link>
      <nav aria-label="Main navigation" className="flex items-center gap-4 text-sm font-semibold text-muted sm:gap-7">
        <Link href="/clubs" className="transition hover:text-accent">Clubs</Link>
        <Link href="/club/login" className="rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-accent sm:px-5 sm:text-sm">Club portal <span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}

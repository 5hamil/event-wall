import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#17151f] text-white">
      <div className="mx-auto max-w-7xl px-5 pb-5 pt-10 sm:px-8 sm:pt-12 lg:px-10">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-heading text-base font-extrabold tracking-tight text-white" aria-label="Event Wall home">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-accent text-sm text-white shadow-[0_5px_14px_rgba(109,92,232,0.32)]">e</span>
              eventwall<span className="-ml-2 text-[#a99cff]">.</span>
            </Link>
            <p className="mt-2 text-sm text-white/60">Your campus, in motion.</p>
          </div>

          <nav aria-label="Footer navigation" className="flex items-center">
            <Link href="/club/login" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white shadow-[0_3px_12px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a99cff]">
              Club portal <span aria-hidden="true" className="text-[#a99cff]">↗</span>
            </Link>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} Event Wall. All campus events, one place.</span>
          <span>Built by <span className="font-semibold text-white/90">Mohammed Shamil P</span></span>
        </div>
      </div>
    </footer>
  );
}

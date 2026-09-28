import Link from "next/link";

export function PublicFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-7 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
        <span>© 2026 Event Wall <span className="mx-1">·</span> Your campus, in motion.</span>
        <Link href="/clubs" className="font-semibold transition hover:text-accent">Explore campus clubs →</Link>
      </div>
    </footer>
  );
}

import Link from "next/link";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center bg-background px-6"><section className="max-w-md text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">404 · NOT FOUND</p><h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">This page isn’t here</h1><p className="mt-3 text-sm leading-6 text-muted">The link may be outdated, or the event is no longer available.</p><Link href="/" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Back to the event wall</Link></section></main>;
}

"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="grid min-h-screen place-items-center bg-background px-6"><section className="max-w-md text-center"><p className="text-xs font-bold uppercase tracking-[.18em] text-accent">SOMETHING WENT WRONG</p><h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">We couldn’t load this page</h1><p className="mt-3 text-sm leading-6 text-muted">Please try again. Your work hasn’t been changed by this error.</p><button onClick={reset} className="mt-6 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">Try again</button></section></main>;
}

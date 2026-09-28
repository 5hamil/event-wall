export default function AdminLoading() {
  return <main aria-label="Loading admin workspace" className="mx-auto max-w-6xl animate-pulse"><div className="h-8 w-48 rounded bg-neutral-200"/><div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, i) => <div key={i} className="h-28 rounded-card bg-white shadow-subtle"/>)}</div><div className="mt-8 overflow-hidden rounded-card bg-white shadow-subtle"><div className="h-12 bg-neutral-100"/>{Array.from({ length: 5 }, (_, i) => <div key={i} className="h-14 border-t border-neutral-100"/>)}</div></main>;
}

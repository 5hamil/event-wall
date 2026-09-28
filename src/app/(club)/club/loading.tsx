export default function ClubLoading() {
  return <main aria-label="Loading club workspace" className="mx-auto max-w-6xl animate-pulse"><div className="h-8 w-48 rounded bg-neutral-200"/><div className="mt-3 h-4 w-72 max-w-full rounded bg-neutral-200"/><div className="mt-7 space-y-3">{Array.from({ length: 4 }, (_, i) => <div key={i} className="h-28 rounded-card bg-white shadow-subtle"/>)}</div></main>;
}

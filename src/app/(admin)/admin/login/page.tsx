"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const result = (await response.json()) as { error?: string };
        setError(result.error ?? "This account is not authorized as an admin.");
        setSubmitting(false);
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch {
      setError("We could not verify your admin access. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#f7f7fb] px-4 py-10 sm:px-6">
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-96 w-96 rounded-full bg-violet-200/55 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-24 h-96 w-96 rounded-full bg-indigo-100/70 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-white/90 bg-white/60 shadow-[0_24px_80px_rgba(28,24,52,0.10)] backdrop-blur-2xl lg:grid-cols-[.9fr_1.1fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#6d5ce8] via-[#725fe8] to-[#8e7ce8] p-10 text-white lg:flex">
          <div aria-hidden="true" className="absolute -bottom-20 -right-16 h-64 w-64 rounded-full border border-white/20 bg-white/10 blur-sm" />
          <Link href="/" className="relative inline-flex items-center gap-3 font-heading text-lg font-extrabold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-[14px] border border-white/25 bg-white/15 text-base backdrop-blur-xl">e</span>eventwall<span className="-ml-3 text-white/65">.</span></Link>
          <div className="relative py-14"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-white/75">Campus operations</p><h2 className="mt-5 max-w-sm font-heading text-4xl font-extrabold leading-tight tracking-[-.045em]">Keep campus in motion.</h2><p className="mt-4 max-w-sm text-sm leading-6 text-white/75">Review submissions, support student clubs, and keep the event wall up to date.</p></div>
          <p className="relative text-xs text-white/60">Admin workspace · Event Wall</p>
        </aside>
        <section className="p-6 sm:p-10 lg:p-12">
          <Link href="/" className="inline-flex items-center gap-2 font-heading text-base font-extrabold tracking-tight lg:hidden"><span className="grid h-9 w-9 place-items-center rounded-[13px] bg-accent text-sm text-white shadow-[0_6px_16px_rgba(109,92,232,0.24)]">e</span>eventwall<span className="-ml-2 text-accent">.</span></Link>
          <div className="mx-auto w-full max-w-md py-5 sm:py-8 lg:py-10">
            <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Admin access</p>
            <h1 className="mt-3 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Welcome back</h1>
            <p className="mt-2 text-sm leading-6 text-muted">Sign in with your administrator account to manage campus events.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <label className="block text-sm font-semibold text-foreground">Email
                <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white/80 px-4 py-3 text-sm font-normal outline-none transition hover:border-accent/25 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10" />
              </label>
              <label className="block text-sm font-semibold text-foreground">Password
                <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-[#e9e7ef] bg-white/80 px-4 py-3 text-sm font-normal outline-none transition hover:border-accent/25 focus:border-accent focus:bg-white focus:ring-4 focus:ring-accent/10" />
              </label>
              {error && <p role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
              <button disabled={submitting} className="min-h-12 w-full rounded-full bg-accent px-5 text-sm font-semibold text-white shadow-[0_9px_24px_rgba(109,92,232,0.22)] transition hover:-translate-y-0.5 hover:bg-accent-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60">
                {submitting ? "Verifying access…" : "Sign in to workspace"}
              </button>
            </form>
            <p className="mt-6 text-center text-xs text-muted">Administrator access only.</p>
          </div>
        </section>
      </div>
    </main>
  );
}

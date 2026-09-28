"use client";

import { FormEvent, useState } from "react";
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
    <main className="grid min-h-screen place-items-center bg-background px-5 py-12">
      <section className="w-full max-w-md rounded-card bg-white p-8 shadow-subtle sm:p-10">
        <a href="/" className="font-heading text-lg font-bold tracking-tight">eventwall<span className="text-accent">.</span></a>
        <p className="mt-10 text-xs font-bold uppercase tracking-[.18em] text-accent">ADMIN ACCESS</p>
        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-muted">Sign in with your administrator account to manage campus events.</p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-foreground">Email
            <input required type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
          <label className="block text-sm font-medium text-foreground">Password
            <input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-border bg-white px-4 py-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15" />
          </label>
          {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button disabled={submitting} className="w-full rounded-xl bg-accent px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-wait disabled:opacity-60">
            {submitting ? "Verifying access…" : "Sign in"}
          </button>
        </form>
      </section>
    </main>
  );
}

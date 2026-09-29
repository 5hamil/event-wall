"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function ClubSignOut() {
  const router = useRouter();
  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/club/login");
    router.refresh();
  }
  return <button onClick={signOut} className="w-full rounded-xl px-3 py-2 text-left text-xs font-semibold text-muted transition hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">Sign out</button>;
}

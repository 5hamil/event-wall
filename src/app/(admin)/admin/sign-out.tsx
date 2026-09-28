"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AdminSignOut() {
  const router = useRouter();

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return <button onClick={signOut} className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-muted hover:bg-background hover:text-foreground">Sign out</button>;
}

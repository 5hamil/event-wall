import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminNavLinks } from "./admin-nav-links";
import { AdminSignOut } from "./sign-out";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = headers().get("x-event-wall-path") ?? "/admin";

  // The login screen shares this route tree but must remain accessible without a session.
  if (pathname === "/admin/login") return children;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: admin } = await supabase
    .from("admins")
    .select("id, name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-[#f7f7fb] md:flex">
      <header className="border-b border-[#eeecf2] bg-white/85 px-4 pb-3 pt-4 backdrop-blur-xl md:hidden">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 font-heading text-base font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-[13px] bg-accent text-sm text-white shadow-[0_6px_16px_rgba(109,92,232,0.24)]">e</span>eventwall<span className="-ml-2 text-accent">.</span></Link>
          <span className="max-w-[45%] truncate rounded-full border border-[#eceaf1] bg-white px-3 py-1.5 text-xs font-semibold text-muted">Admin workspace</span>
        </div>
        <AdminNavLinks variant="mobile" />
      </header>
      <aside className="sticky top-0 hidden h-screen w-[276px] shrink-0 flex-col border-r border-[#eeecf2] bg-white/80 px-5 py-7 backdrop-blur-2xl md:flex">
        <Link href="/" className="flex items-center gap-3 px-2 font-heading text-lg font-extrabold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-accent text-base text-white shadow-[0_7px_18px_rgba(109,92,232,0.23)]">e</span>eventwall<span className="-ml-3 text-accent">.</span></Link>
        <div className="mt-10 rounded-[20px] border border-white bg-gradient-to-br from-violet-50/90 to-white px-4 py-4 shadow-[0_8px_25px_rgba(28,24,52,0.045)]">
          <p className="text-[9px] font-bold uppercase tracking-[.18em] text-accent">Admin workspace</p>
          <p className="mt-2 truncate font-heading text-base font-bold tracking-tight">{admin.name || "Administrator"}</p>
          <p className="mt-1 text-xs text-muted">Campus event operations</p>
        </div>
        <p className="mb-2 mt-9 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-muted/80">Manage</p>
        <AdminNavLinks variant="desktop" />
        <div className="mt-auto rounded-[18px] border border-[#eeecf2] bg-white/70 p-3.5">
          <p className="truncate px-1 text-xs font-semibold text-foreground">{admin.name || "Administrator"}</p>
          <p className="mt-1 truncate px-1 text-[11px] text-muted">{user.email}</p>
          <div className="mt-2"><AdminSignOut /></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-11"><div className="mx-auto w-full max-w-6xl">{children}</div></main>
    </div>
  );
}

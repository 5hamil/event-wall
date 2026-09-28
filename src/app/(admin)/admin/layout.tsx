import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminSignOut } from "./sign-out";

const navigation = [
  { label: "Overview", href: "/admin" },
  { label: "Clubs", href: "/admin/clubs" },
  { label: "Categories", href: "/admin/categories" },
  { label: "Events", href: "/admin/events" },
];

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
    <div className="min-h-screen bg-background md:flex">
      <aside className="flex w-full shrink-0 flex-col bg-white px-5 py-6 shadow-subtle md:min-h-screen md:w-64 md:px-4">
        <Link href="/" className="flex items-center gap-3 px-2 font-heading text-lg font-bold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">e</span>
          eventwall<span className="-ml-3 text-accent">.</span>
        </Link>
        <p className="mb-3 mt-10 px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted">Workspace</p>
        <nav aria-label="Admin navigation" className="flex gap-1 overflow-x-auto md:flex-col">
          {navigation.map((item) => {
            const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-violet-50 text-accent" : "text-muted hover:bg-background hover:text-foreground"}`}>
              {item.label}
            </Link>;
          })}
        </nav>
        <div className="mt-6 border-t border-border pt-5 md:mt-auto">
          <p className="truncate px-3 text-xs font-medium text-foreground">{admin.name || user.email}</p>
          <p className="mt-1 truncate px-3 text-xs text-muted">{user.email}</p>
          <div className="mt-3"><AdminSignOut /></div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
    </div>
  );
}

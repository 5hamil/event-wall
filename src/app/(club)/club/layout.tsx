import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireClubAccount } from "@/lib/club-auth";
import { ClubProvider } from "./club-context";
import { ClubSignOut } from "./sign-out";

const navigation = [
  { label: "My Events", href: "/club/events" },
  { label: "Create Event", href: "/club/events/new" },
  { label: "Club Profile", href: "/club/profile" },
];

export default async function ClubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = headers().get("x-event-wall-path") ?? "/club";
  if (pathname === "/club/login") return children;

  const { supabase, user, clubId } = await requireClubAccount();

  const { data: club } = await supabase.from("clubs").select("name").eq("id", clubId).maybeSingle();
  if (!club) redirect("/club/login");

  return (
    <ClubProvider value={{ clubId, clubName: club.name }}>
      <div className="min-h-screen bg-background md:flex">
        <aside className="flex w-full shrink-0 flex-col bg-white px-5 py-6 shadow-subtle md:min-h-screen md:w-64 md:px-4">
          <Link href="/" className="flex items-center gap-3 px-2 font-heading text-lg font-bold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-white">e</span>eventwall<span className="-ml-3 text-accent">.</span></Link>
          <div className="mb-4 mt-9 rounded-xl bg-background px-3 py-3"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-muted">Club workspace</p><p className="mt-1 truncate text-sm font-semibold">{club.name}</p></div>
          <nav aria-label="Club navigation" className="flex gap-1 overflow-x-auto md:flex-col">
            {navigation.map((item) => {
              const active = item.href === "/club/events" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={`rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-violet-50 text-accent" : "text-muted hover:bg-background hover:text-foreground"}`}>{item.label}</Link>;
            })}
          </nav>
          <div className="mt-6 border-t border-border pt-5 md:mt-auto"><p className="truncate px-3 text-xs text-muted">{user.email}</p><div className="mt-3"><ClubSignOut /></div></div>
        </aside>
        <main className="min-w-0 flex-1 px-5 py-8 sm:px-8 lg:px-10 lg:py-10">{children}</main>
      </div>
    </ClubProvider>
  );
}

import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireClubAccount } from "@/lib/club-auth";
import { ClubProvider } from "./club-context";
import { ClubNavLinks } from "./club-nav-links";
import { ClubSignOut } from "./sign-out";

export default async function ClubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = headers().get("x-event-wall-path") ?? "/club";
  if (pathname === "/club/login") return children;

  const { supabase, user, clubId } = await requireClubAccount();

  const { data: club } = await supabase.from("clubs").select("name").eq("id", clubId).maybeSingle();
  if (!club) redirect("/club/login");

  return (
    <ClubProvider value={{ clubId, clubName: club.name }}>
      <div className="min-h-screen bg-[#f7f7fb] md:flex">
        <header className="border-b border-[#eeecf2] bg-white/85 px-4 pb-3 pt-4 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2.5 font-heading text-base font-extrabold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-[13px] bg-accent text-sm text-white shadow-[0_6px_16px_rgba(109,92,232,0.24)]">e</span>eventwall<span className="-ml-2 text-accent">.</span></Link>
            <span className="max-w-[45%] truncate rounded-full border border-[#eceaf1] bg-white px-3 py-1.5 text-xs font-semibold text-muted">{club.name}</span>
          </div>
          <ClubNavLinks variant="mobile" />
        </header>

        <aside className="sticky top-0 hidden h-screen w-[276px] shrink-0 flex-col border-r border-[#eeecf2] bg-white/80 px-5 py-7 backdrop-blur-2xl md:flex">
          <Link href="/" className="flex items-center gap-3 px-2 font-heading text-lg font-extrabold tracking-tight"><span className="grid h-10 w-10 place-items-center rounded-[14px] bg-accent text-base text-white shadow-[0_7px_18px_rgba(109,92,232,0.23)]">e</span>eventwall<span className="-ml-3 text-accent">.</span></Link>
          <div className="mt-10 rounded-[20px] border border-white bg-gradient-to-br from-violet-50/90 to-white px-4 py-4 shadow-[0_8px_25px_rgba(28,24,52,0.045)]">
            <p className="text-[9px] font-bold uppercase tracking-[.18em] text-accent">Club workspace</p>
            <p className="mt-2 truncate font-heading text-base font-bold tracking-tight">{club.name}</p>
            <p className="mt-1 text-xs text-muted">Manage your campus presence</p>
          </div>
          <p className="mb-2 mt-9 px-3 text-[9px] font-bold uppercase tracking-[.18em] text-muted/80">Workspace</p>
          <ClubNavLinks variant="desktop" />
          <div className="mt-auto rounded-[18px] border border-[#eeecf2] bg-white/70 p-3.5">
            <p className="truncate px-1 text-xs font-medium text-muted">{user.email}</p>
            <div className="mt-2"><ClubSignOut /></div>
          </div>
        </aside>
        <main className="min-w-0 flex-1 px-4 py-7 sm:px-7 sm:py-9 lg:px-10 lg:py-11"><div className="mx-auto w-full max-w-6xl">{children}</div></main>
      </div>
    </ClubProvider>
  );
}

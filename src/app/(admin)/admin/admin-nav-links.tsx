"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Overview", href: "/admin", icon: "grid" },
  { label: "Clubs", href: "/admin/clubs", icon: "users" },
  { label: "Categories", href: "/admin/categories", icon: "tag" },
  { label: "Events", href: "/admin/events", icon: "calendar" },
];

function Icon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
    users: <><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20"/><circle cx="10" cy="7.5" r="3.5"/><path d="M17 11a3.5 3.5 0 0 0 0-6.8M17 15h.5a3.5 3.5 0 0 1 3.5 3.5V20"/></>,
    tag: <><path d="M20 13 13 20l-9-9V4h7l9 9Z"/><circle cx="8" cy="8" r="1"/></>,
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16h5"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">{paths[name]}</svg>;
}

export function AdminNavLinks({ variant }: { variant: "mobile" | "desktop" }) {
  const pathname = usePathname();
  const mobile = variant === "mobile";

  return <nav aria-label="Admin navigation" className={mobile ? "mt-4 flex gap-2 overflow-x-auto pb-1" : "flex flex-col gap-1.5"}>
    {links.map((item) => {
      const active = item.href === "/admin" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
      return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} className={mobile
        ? `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition ${active ? "bg-accent text-white shadow-[0_5px_14px_rgba(109,92,232,0.2)]" : "border border-[#eceaf1] bg-white/70 text-muted hover:bg-white hover:text-foreground"}`
        : `group relative flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 text-sm font-semibold transition duration-200 ${active ? "bg-violet-50 text-accent shadow-[inset_0_0_0_1px_rgba(109,92,232,0.08)]" : "text-muted hover:bg-[#f7f6fa] hover:text-foreground"}`}>
        {!mobile && active && <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-accent"/>}<Icon name={item.icon}/>{item.label}
      </Link>;
    })}
  </nav>;
}

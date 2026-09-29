"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { label: "My Events", href: "/club/events", icon: "calendar" },
  { label: "Create Event", href: "/club/events/new", icon: "plus" },
  { label: "Club Profile", href: "/club/profile", icon: "building" },
];

function NavigationIcon({ name }: { name: string }) {
  const paths: Record<string, React.ReactNode> = {
    calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M7.5 3.5v3M16.5 3.5v3M3.5 9.5h17M8 13h3M8 16h5"/></>,
    plus: <><circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/></>,
    building: <><path d="M4 20V6.5L12 3l8 3.5V20M2.5 20h19M8 9h1M15 9h1M8 12.5h1M15 12.5h1M10 20v-4h4v4"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0">{paths[name]}</svg>;
}

function isActive(pathname: string, href: string) {
  if (href === "/club/events") return pathname === href || pathname === "/club";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ClubNavLinks({ variant }: { variant: "mobile" | "desktop" }) {
  const pathname = usePathname();
  const mobile = variant === "mobile";

  return (
    <nav aria-label="Club navigation" className={mobile ? "mt-4 flex gap-2 overflow-x-auto pb-1" : "flex flex-col gap-1.5"}>
      {navigation.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={mobile
              ? `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-full px-3.5 text-xs font-semibold transition ${active ? "bg-accent text-white shadow-[0_5px_14px_rgba(109,92,232,0.2)]" : "border border-[#eceaf1] bg-white/70 text-muted hover:bg-white hover:text-foreground"}`
              : `group relative flex min-h-11 items-center gap-3 rounded-[14px] px-3.5 text-sm font-semibold transition duration-200 ${active ? "bg-violet-50 text-accent shadow-[inset_0_0_0_1px_rgba(109,92,232,0.08)]" : "text-muted hover:bg-[#f7f6fa] hover:text-foreground"}`}
          >
            {!mobile && active && <span aria-hidden="true" className="absolute bottom-2 left-0 top-2 w-[3px] rounded-full bg-accent" />}
            <NavigationIcon name={item.icon} />
            {item.label}
            {!mobile && item.href === "/club/events/new" && <span className={`ml-auto grid h-6 w-6 place-items-center rounded-full text-sm ${active ? "bg-white/80" : "bg-[#f3f1f7] text-accent"}`}>+</span>}
          </Link>
        );
      })}
    </nav>
  );
}

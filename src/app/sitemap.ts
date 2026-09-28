import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { getSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = getSiteUrl();
  const supabase = createPublicClient();
  const [clubsResult, eventsResult] = await Promise.all([
    supabase.from("clubs").select("id, slug").eq("is_active", true),
    supabase.from("events").select("id, club_id, updated_at").eq("status", "approved"),
  ]);
  const clubs = clubsResult.data ?? [];
  const activeClubIds = new Set(clubs.map((club) => club.id));
  const pages: MetadataRoute.Sitemap = [
    { url: origin, changeFrequency: "hourly", priority: 1 },
    { url: `${origin}/clubs`, changeFrequency: "daily", priority: 0.7 },
    ...clubs.map((club) => ({ url: `${origin}/clubs/${encodeURIComponent(club.slug)}`, changeFrequency: "daily" as const, priority: 0.6 })),
    ...(eventsResult.data ?? []).filter((event) => activeClubIds.has(event.club_id)).map((event) => ({
      url: `${origin}/events/${encodeURIComponent(event.id)}`,
      lastModified: event.updated_at ? new Date(event.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
  return pages;
}

import Image from "next/image";
import { requireClubAccount } from "@/lib/club-auth";
import { ProfileForm } from "./profile-form";

export default async function ClubProfilePage() {
  const { supabase, clubId } = await requireClubAccount();
  const { data: club, error } = await supabase
    .from("clubs")
    .select("id, name, logo_url, description, contact_email, contact_phone")
    .eq("id", clubId)
    .maybeSingle();

  if (!club || error) {
    return <div className="rounded-[22px] border border-red-100 bg-red-50/80 p-6 text-sm text-red-700 shadow-subtle">Could not load your club profile. {error?.message}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent"/> Your organization</p>
      <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-[-.04em] sm:text-4xl">Club Profile</h1>
      <p className="mt-2 text-sm leading-6 text-muted sm:text-base">Keep your public club details up to date.</p>
      <div className="mt-7 rounded-[24px] border border-white/90 bg-white/70 p-5 shadow-[0_14px_42px_rgba(28,24,52,0.055)] backdrop-blur-xl sm:p-8">
        {club.logo_url && <div className="relative mb-6 h-20 w-20 overflow-hidden rounded-2xl bg-background"><Image src={club.logo_url} alt="Current club logo" fill sizes="80px" className="object-cover" /></div>}
        <ProfileForm club={club} />
      </div>
    </div>
  );
}

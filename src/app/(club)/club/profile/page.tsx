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
    return <div className="rounded-card bg-white p-6 text-sm text-red-700 shadow-subtle">Could not load your club profile. {error?.message}</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-accent">YOUR ORGANIZATION</p>
      <h1 className="mt-2 font-heading text-3xl font-bold tracking-tight">Club Profile</h1>
      <p className="mt-2 text-sm text-muted">Keep your public club details up to date.</p>
      <div className="mt-7 rounded-card bg-white p-6 shadow-subtle sm:p-8">
        {club.logo_url && <div className="relative mb-6 h-20 w-20 overflow-hidden rounded-2xl bg-background"><Image src={club.logo_url} alt="Current club logo" fill sizes="80px" className="object-cover" /></div>}
        <ProfileForm club={club} />
      </div>
    </div>
  );
}

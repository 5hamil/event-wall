"use client";

import { createContext, useContext } from "react";

type ClubContextValue = { clubId: string; clubName: string };
const ClubContext = createContext<ClubContextValue | null>(null);

export function ClubProvider({ value, children }: { value: ClubContextValue; children: React.ReactNode }) {
  return <ClubContext.Provider value={value}>{children}</ClubContext.Provider>;
}

export function useClubContext() {
  const value = useContext(ClubContext);
  if (!value) throw new Error("useClubContext must be used inside ClubProvider.");
  return value;
}

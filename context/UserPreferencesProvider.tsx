"use client";

import { createContext, useContext, ReactNode } from "react";
import { useUserPreferences } from "@/hooks/useUserPreferences";

interface UserPreferencesContextType {
  preferences: any;
  loading: boolean;
  refetch: () => void;
}

const UserPreferencesContext = createContext<UserPreferencesContextType | null>(
  null
);

export function UserPreferencesProvider({ children }: { children: ReactNode }) {
  const { preferences, loading, refetch } = useUserPreferences();

  return (
    <UserPreferencesContext.Provider value={{ preferences, loading, refetch }}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function useUserPreferencesContext() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      "useUserPreferencesContext must be used within UserPreferencesProvider"
    );
  }
  return context;
}

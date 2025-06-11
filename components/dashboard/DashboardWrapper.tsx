"use client";

import { ReactNode, createContext, useContext } from "react";

interface User {
  id: string;
  email: string;
  user_metadata?: any;
  first_name?: string | null;
  onboarding_completed?: boolean;
}

const DashboardUserContext = createContext<User | null>(null);

export function useDashboardUser() {
  return useContext(DashboardUserContext);
}

interface DashboardWrapperProps {
  children: ReactNode;
  user: User | null;
}

export default function DashboardWrapper({
  children,
  user,
}: DashboardWrapperProps) {
  return (
    <DashboardUserContext.Provider value={user}>
      {children}
    </DashboardUserContext.Provider>
  );
}

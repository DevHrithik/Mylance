"use client";

import { ReactNode } from "react";
import { NetlifyAutoAuthProvider } from "@/components/providers/NetlifyAutoAuthProvider";

interface ClientAuthWrapperProps {
  children: ReactNode;
}

export function ClientAuthWrapper({ children }: ClientAuthWrapperProps) {
  return (
    <NetlifyAutoAuthProvider
      showLoadingScreen={false}
      enableAutoRedirect={false}
    >
      {children}
    </NetlifyAutoAuthProvider>
  );
}

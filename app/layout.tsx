import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import { NetlifyAutoAuthProvider } from "@/components/providers/NetlifyAutoAuthProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Mylance - AI-Powered LinkedIn Content Creation",
  description: "Create compelling LinkedIn content with AI assistance",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthErrorBoundary>
          <NetlifyAutoAuthProvider
            showLoadingScreen={true}
            enableAutoRedirect={true}
          >
            {children}
          </NetlifyAutoAuthProvider>
        </AuthErrorBoundary>
        <Toaster />
      </body>
    </html>
  );
}

import { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Authentication | Mylance",
  description: "Sign in or create your Mylance account",
};

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className={cn("min-h-screen bg-background", inter.className)}>
      <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        {/* Left side - Branding */}
        <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800" />
          <div className="relative z-20 flex items-center text-lg font-medium">
            <div className="mr-2 h-8 w-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-blue-600 font-bold text-lg">M</span>
            </div>
            Mylance
          </div>
          <div className="relative z-20 mt-auto">
            <blockquote className="space-y-2">
              <p className="text-lg">
                &ldquo;Mylance has transformed how I create LinkedIn content.
                The AI learns from my performance and helps me create posts that
                truly resonate with my audience.&rdquo;
              </p>
              <footer className="text-sm">
                Sofia Davis, Marketing Director
              </footer>
            </blockquote>
          </div>
        </div>

        {/* Right side - Auth form */}
        <div className="lg:p-8">
          <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center">
              <Link href="/" className="flex items-center text-lg font-medium">
                <div className="mr-2 h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">
                    M
                  </span>
                </div>
                Mylance
              </Link>
            </div>

            {children}

            {/* Footer links */}
            <div className="text-center text-sm text-muted-foreground">
              <p className="px-8">
                By continuing, you agree to our{" "}
                <Link
                  href="/terms"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="underline underline-offset-4 hover:text-primary"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

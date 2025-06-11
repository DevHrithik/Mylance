import { Metadata } from "next";
import { MagicLinkForm } from "@/components/auth/MagicLinkForm";

export const metadata: Metadata = {
  title: "Sign Up | Mylance",
  description:
    "Create your Mylance account and start generating AI-powered LinkedIn content",
};

export default function SignupPage() {
  return <MagicLinkForm mode="signup" />;
}

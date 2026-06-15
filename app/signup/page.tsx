import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Create your account — Grably",
};

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <AuthScreen mode="signup" next={searchParams.next} />;
}

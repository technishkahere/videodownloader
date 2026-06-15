import type { Metadata } from "next";
import { AuthScreen } from "@/components/auth-screen";

export const metadata: Metadata = {
  title: "Sign in — Grably",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return <AuthScreen mode="login" next={searchParams.next} />;
}

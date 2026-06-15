"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Download,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth, ApiError } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

interface AuthScreenProps {
  mode: "login" | "signup";
  next?: string;
}

export function AuthScreen({ mode, next }: AuthScreenProps) {
  const router = useRouter();
  const { user, ready, login, signup } = useAuth();
  const isSignup = mode === "signup";
  const dest = next && next.startsWith("/") ? next : "/app";

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPw, setShowPw] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  // Already authenticated → bounce to the destination.
  React.useEffect(() => {
    if (ready && user) router.replace(dest);
  }, [ready, user, dest, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (isSignup) {
        await signup({ name: name.trim() || undefined, email: email.trim(), password });
        toast.success("Welcome to Grably", { description: "Your account is ready." });
      } else {
        await login(email.trim(), password);
        toast.success("Welcome back");
      }
      router.replace(dest);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Something went wrong. Try again.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-12">
      {/* ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]" />

      <Link
        href="/"
        className="absolute left-5 top-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Home
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <Download className="h-5 w-5" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isSignup
              ? "Unlimited downloads, saved history, and your personal dashboard."
              : "Sign in to continue to your dashboard."}
          </p>
        </div>

        <div className="glass rounded-2xl border border-border/60 p-6 shadow-xl sm:p-7">
          <form onSubmit={onSubmit} className="space-y-4">
            {isSignup && (
              <Field label="Name" htmlFor="name">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  autoComplete="name"
                  className="h-11 pl-10"
                />
              </Field>
            )}

            <Field label="Email" htmlFor="email">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="h-11 pl-10"
              />
            </Field>

            <Field label="Password" htmlFor="password">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isSignup ? "At least 8 characters" : "Your password"}
                autoComplete={isSignup ? "new-password" : "current-password"}
                className="h-11 pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isSignup ? "Creating account…" : "Signing in…"}
                </>
              ) : isSignup ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          {isSignup ? "Already have an account?" : "New to Grably?"}{" "}
          <Link
            href={isSignup ? authHref("/login", next) : authHref("/signup", next)}
            className="font-medium text-primary hover:underline"
          >
            {isSignup ? "Sign in" : "Create one free"}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

function authHref(base: string, next?: string) {
  return next ? `${base}?next=${encodeURIComponent(next)}` : base;
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </label>
      <div className={cn("relative")}>{children}</div>
    </div>
  );
}

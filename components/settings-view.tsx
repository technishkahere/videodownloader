"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Sun, Moon, Monitor, Trash2, LogOut, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/auth-provider";
import { clearHistory } from "@/lib/api-client";
import { cn } from "@/lib/utils";

const THEMES = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { user, ready, logout } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const [clearing, setClearing] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  async function onClear() {
    setClearing(true);
    try {
      await clearHistory();
      toast.success("Download history cleared");
    } catch {
      toast.error("Couldn't clear history");
    } finally {
      setClearing(false);
    }
  }

  async function onSignOut() {
    setSigningOut(true);
    await logout();
    toast.success("Signed out");
  }

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Personalize Grably and manage your data.
        </p>
      </motion.header>

      {/* Appearance */}
      <Card className="p-6">
        <h2 className="text-base font-semibold">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose how Grably looks on this device.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
          {THEMES.map((t) => {
            const active = mounted && theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border p-4 text-sm transition-colors",
                  active
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <t.icon className="h-5 w-5" />
                {t.label}
                {active && <Check className="h-3.5 w-3.5 text-primary" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Data & privacy */}
      <Card className="p-6">
        <h2 className="text-base font-semibold">Data &amp; privacy</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {ready && user
            ? "Manage the download history saved to your account."
            : "Sign in to manage saved download history."}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            disabled={!ready || !user || clearing}
          >
            {clearing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Clear download history
          </Button>
        </div>
      </Card>

      {/* Session */}
      {ready && user && (
        <Card className="p-6">
          <h2 className="text-base font-semibold">Session</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as {user.email}.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onSignOut}
            disabled={signingOut}
          >
            {signingOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Sign out
          </Button>
        </Card>
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Loader2,
  Lock,
  Mail,
  Calendar,
  Zap,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuth, ApiError } from "@/components/auth-provider";
import { initialsFor } from "@/components/user-menu";
import { updateName, deleteAccount } from "@/lib/api-client";

export function AccountView() {
  const { user, ready, refresh } = useAuth();
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);

  React.useEffect(() => {
    if (user) setName(user.name ?? "");
  }, [user]);

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-xl border border-border bg-card/40" />;
  }

  if (!user) {
    return (
      <div className="space-y-8">
        <Header />
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Lock className="h-5 w-5" />
          </span>
          <p className="font-medium">Sign in to manage your account</p>
          <div className="mt-1 flex gap-2.5">
            <Button asChild size="sm">
              <Link href="/signup?next=/app/account">Create free account</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/login?next=/app/account">Log in</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const dirty = name.trim() !== (user.name ?? "") && name.trim().length > 0;
  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  async function saveName() {
    setSaving(true);
    try {
      await updateName(name.trim());
      await refresh();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't update profile");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    setDeleting(true);
    try {
      await deleteAccount();
      await refresh();
      toast.success("Account deleted");
      router.push("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Couldn't delete account");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      <Header />

      {/* Identity */}
      <Card className="p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-lg font-semibold text-primary-foreground shadow-md shadow-primary/30">
            {initialsFor(user)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">
              {user.name?.trim() || "Your account"}
            </p>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Stat icon={Zap} label="Downloads completed" value={String(user.downloadsUsed)} />
          <Stat icon={Calendar} label="Member since" value={memberSince} />
        </div>
      </Card>

      {/* Edit profile */}
      <Card className="p-6">
        <h2 className="text-base font-semibold">Profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Update how your name appears across Grably.
        </p>
        <div className="mt-4 space-y-1.5">
          <label htmlFor="display-name" className="text-sm font-medium">
            Display name
          </label>
          <div className="flex gap-2">
            <Input
              id="display-name"
              value={name}
              maxLength={80}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="h-11"
            />
            <Button onClick={saveName} disabled={!dirty || saving} className="h-11 shrink-0">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save
            </Button>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 p-6">
        <div className="flex items-start gap-2">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div className="flex-1">
            <h2 className="text-base font-semibold">Delete account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently remove your account, download history, and any stored
              files. This can&apos;t be undone.
            </p>

            {confirmDelete ? (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">Are you sure?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Yes, delete everything
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="mt-4 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                Delete account
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Account</h1>
      <p className="mt-1 text-muted-foreground">
        Manage your profile and account settings.
      </p>
    </motion.header>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4">
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

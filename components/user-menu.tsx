"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  LayoutDashboard,
  User as UserIcon,
  Settings,
  LogOut,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/auth-provider";

export function initialsFor(user: { name: string | null; email: string | null }) {
  const src = user.name?.trim() || user.email || "";
  if (!src) return "U";
  const parts = src.split(/[\s@.]+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || src[0] || "U").toUpperCase();
}

export function UserMenu() {
  const { user, ready, logout } = useAuth();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  // Avoid a logged-out flash before the first /api/auth/me resolves.
  if (!ready) {
    return <div className="h-9 w-9 animate-pulse rounded-full bg-muted" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm">
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild size="sm">
          <Link href="/signup">Sign up</Link>
        </Button>
      </div>
    );
  }

  const label = user.name?.trim() || user.email || "Account";

  async function onLogout() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm outline-none ring-offset-background transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label="Account menu"
        >
          {initialsFor(user)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="text-sm font-medium text-foreground">{label}</span>
          {user.email && (
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/app">
            <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/account">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            Account
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/app/settings">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault();
            onLogout();
          }}
          className="text-destructive focus:text-destructive"
        >
          {signingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

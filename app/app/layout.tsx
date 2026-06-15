"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  DownloadCloud,
  History,
  User as UserIcon,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { UsageCard } from "@/components/usage-card";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/app", label: "Downloader", icon: DownloadCloud, exact: true },
  { href: "/app/history", label: "History", icon: History },
  { href: "/app/account", label: "Account", icon: UserIcon },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawer, setDrawer] = React.useState(false);

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  const NavItems = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = isActive(item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const Brand = (
    <Link href="/" className="group flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
        <Download className="h-5 w-5" />
      </span>
      <span className="text-lg font-semibold tracking-tight">Grably</span>
    </Link>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-card/30 p-4 lg:flex">
        <div className="px-2 py-2">{Brand}</div>
        <div className="mt-6 flex-1">
          <NavItems />
        </div>
        <div className="space-y-3">
          <UsageCard />
          <div className="flex items-center justify-between rounded-xl border border-border bg-card/50 px-3 py-2">
            <UserMenu />
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border glass px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            onClick={() => setDrawer(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          {Brand}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawer && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-background/70 backdrop-blur-sm"
              onClick={() => setDrawer(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", duration: 0.35, bounce: 0 }}
              className="absolute left-0 top-0 flex h-full w-72 flex-col border-r border-border bg-card p-4"
            >
              <div className="flex items-center justify-between px-2 py-2">
                {Brand}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Close menu"
                  onClick={() => setDrawer(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="mt-6 flex-1">
                <NavItems onNavigate={() => setDrawer(false)} />
              </div>
              <UsageCard />
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <main className="min-w-0">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
          {children}
        </div>
      </main>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Download, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

const LINKS = [
  { label: "Features", href: "/#features" },
  { label: "How it works", href: "/#how" },
  { label: "FAQ", href: "/#faq" },
];

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { user, ready } = useAuth();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "border-b border-border/60 glass"
          : "border-b border-transparent"
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30 transition-transform group-hover:scale-105">
            <Download className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Grably
          </span>
          <span className="hidden rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground sm:inline">
            BETA
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden sm:block">
            <UserMenu />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Menu"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="border-t border-border glass md:hidden"
        >
          <div className="container flex flex-col gap-1 py-3">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
              {ready && user ? (
                <Button asChild>
                  <Link href="/app" onClick={() => setOpen(false)}>
                    Open dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline">
                    <Link href="/login" onClick={() => setOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup" onClick={() => setOpen(false)}>
                      Sign up
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}

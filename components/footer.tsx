import Link from "next/link";
import { Download, Github, Twitter } from "lucide-react";

const COLUMNS = [
  {
    title: "Product",
    links: ["Features", "How it works", "Pricing", "Changelog"],
  },
  {
    title: "Platforms",
    links: ["YouTube", "Instagram", "TikTok", "Twitter / X"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Cookies", "Licenses"],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Download className="h-5 w-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight">Grably</span>
            </Link>
            <p className="max-w-xs text-sm text-muted-foreground">
              The fastest, cleanest way to save video from anywhere. Built for
              creators, by people who care about the details.
            </p>
            <div className="flex gap-2">
              <Link
                href="#"
                aria-label="Twitter"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                aria-label="GitHub"
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="mb-3 text-sm font-semibold">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Grably Labs. All rights reserved.</p>
          <p className="text-xs">
            Demo UI · No videos are actually downloaded. Respect creators&apos;
            rights & platform terms.
          </p>
        </div>
      </div>
    </footer>
  );
}

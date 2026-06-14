import { Suspense } from "react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Dashboard } from "@/components/dashboard";

export default function AppPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Suspense fallback={<div className="container py-20 text-muted-foreground">Loading…</div>}>
          <Dashboard />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

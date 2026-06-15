import { Suspense } from "react";
import { DownloaderView } from "@/components/downloader-view";

export default function DownloaderPage() {
  return (
    <Suspense
      fallback={<div className="py-20 text-muted-foreground">Loading…</div>}
    >
      <DownloaderView />
    </Suspense>
  );
}

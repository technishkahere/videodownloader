"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  {
    q: "Is Grably free to use?",
    a: "You get 3 free downloads to try it out — no account needed. After that, create a free account and download without limits.",
  },
  {
    q: "Which platforms are supported?",
    a: "YouTube, Instagram, TikTok, and Twitter / X. Paste a link from any of them and the platform is detected automatically.",
  },
  {
    q: "What formats and qualities can I choose?",
    a: "Save MP4 video at 360p, 480p, 720p, or 1080p — capped to whatever the source actually offers — or extract the audio as a high-quality MP3.",
  },
  {
    q: "Does this really download videos?",
    a: "Yes. Grably runs yt-dlp on the server to fetch and process the exact video you paste, then hands you the finished file to save.",
  },
  {
    q: "Are my downloads private?",
    a: "Your history is tied to your account and never shared. Processed files are stored only temporarily and auto-deleted from the server shortly after they're ready.",
  },
  {
    q: "Do I need an account?",
    a: "Not to start — the free trial works anonymously. Sign up to unlock unlimited downloads and a saved, searchable history across your devices.",
  },
];

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {FAQS.map((f, i) => (
        <AccordionItem key={i} value={`item-${i}`}>
          <AccordionTrigger>{f.q}</AccordionTrigger>
          <AccordionContent>{f.a}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

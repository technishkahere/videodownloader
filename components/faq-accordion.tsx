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
    a: "This is a demo interface, so everything here is free and simulated. In a real product, a generous free tier would cover casual use, with a Pro plan for batch downloads and higher quality.",
  },
  {
    q: "Which platforms are supported?",
    a: "The interface showcases YouTube, Instagram, TikTok, and Twitter / X. Paste a link from any of them and the platform is detected automatically.",
  },
  {
    q: "What formats and qualities can I choose?",
    a: "You can pick MP4 video at 360p, 480p, 720p, or 1080p, or extract audio as MP3. The selector updates the estimated file size as you change options.",
  },
  {
    q: "Are my downloads private?",
    a: "Grably is privacy-first by design. In this prototype, your history is stored only in your browser's localStorage — nothing is sent to a server.",
  },
  {
    q: "Does this actually download videos?",
    a: "No. This is a frontend UI prototype. Every step — analysis, progress, and completion — is simulated with mock data so you can explore the full experience.",
  },
  {
    q: "Can I download a whole playlist at once?",
    a: "Batch and playlist downloads are on the roadmap. The current demo focuses on the single-link flow end to end.",
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

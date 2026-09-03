import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Screen, Card } from "@/components/kit";
import { ChevronDown } from "lucide-react";

export const Route = createFileRoute("/help/faq")({ component: FAQ });

const faqs = [
  { q: "How do I share my parking?", a: "Tap the emerald 'I'm Leaving' button on the map, choose Now / 2 min / 5 min, and confirm." },
  { q: "How long is a reservation?", a: "Every reservation locks the spot for 90 seconds — enough time to arrive without losing it." },
  { q: "How do I earn points?", a: "You earn +15 to +25 points for every successful handoff, plus a daily streak bonus." },
  { q: "Can I cancel a share?", a: "Yes, tap 'Cancel share' from the leaving screen. No penalty if no one has reserved yet." },
  { q: "Is my location private?", a: "We share only the parking coordinates you release. Your live location is never shown to others." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Screen title="FAQ" back="/help">
      <div className="space-y-2">
        {faqs.map((f, i) => (
          <Card key={i}>
            <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between text-start">
              <span className="text-sm font-semibold">{f.q}</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>}
          </Card>
        ))}
      </div>
    </Screen>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { markOnboardingComplete } from "@/lib/onboarding";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Welcome to AndiPark — Find. Share. Park." },
      { name: "description", content: "See how AndiPark helps drivers in Abu Dhabi find a parking spot before they arrive, and share theirs when they leave." },
      { property: "og:title", content: "Welcome to AndiPark" },
      { property: "og:description", content: "Find a spot before you arrive. Share yours when you leave." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Onboarding,
});

const copy = {
  en: {
    skip: "Skip",
    next: "Next",
    start: "Get started",
    slides: [
      { t: "Find a spot before you arrive", d: "See parking that is about to open up around you, live on the map." },
      { t: "Leaving your spot? Share it", d: "Tap I'm Leaving and pick Now, 2, 5 or 10 minutes. That's the whole thing." },
      { t: "Help another driver park", d: "A driver nearby asks, you accept, and they drive straight to you." },
      { t: "Find. Share. Park.", d: "AndiPark is a network of drivers handing spots to each other in Abu Dhabi." },
    ],
  },
  ar: {
    skip: "تخطٍ",
    next: "التالي",
    start: "لنبدأ",
    slides: [
      { t: "اعثر على موقف قبل وصولك", d: "شاهد المواقف التي ستصبح متاحة قربك مباشرة على الخريطة." },
      { t: "ستغادر موقفك؟ شاركه", d: "اضغط «سأغادر» واختر الآن أو ٢ أو ٥ أو ١٠ دقائق. هذا كل شيء." },
      { t: "ساعد سائقًا آخر على الركن", d: "سائق قريب يطلب موقفك، توافق، فيتوجه إليك مباشرة." },
      { t: "ابحث. شارك. اركن.", d: "أندي بارك شبكة من السائقين يسلّمون المواقف لبعضهم في أبوظبي." },
    ],
  },
} as const;

/* ------------------------------------------------------------------ scenes */

function SceneFind() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" role="img" aria-hidden>
      <rect x="0" y="0" width="240" height="200" rx="24" className="fill-muted" />
      <g className="stroke-border" strokeWidth="10" fill="none">
        <path d="M0 70h240M0 140h240M80 0v200M170 0v200" />
      </g>
      {[
        { x: 55, y: 48, d: "0s" },
        { x: 118, y: 104, d: ".5s" },
        { x: 196, y: 62, d: "1s" },
        { x: 148, y: 168, d: "1.5s" },
      ].map((p) => (
        <g key={p.x} style={{ transformOrigin: `${p.x}px ${p.y}px`, animation: `ap-pop 2.6s ${p.d} ease-in-out infinite` }}>
          <circle cx={p.x} cy={p.y} r="16" className="fill-[color:var(--emerald)]" opacity="0.18" />
          <circle cx={p.x} cy={p.y} r="9" className="fill-[color:var(--emerald)]" />
        </g>
      ))}
      <circle cx="120" cy="100" r="7" className="fill-primary" />
      <circle cx="120" cy="100" r="7" className="fill-primary" opacity="0.35" style={{ transformOrigin: "120px 100px", animation: "ap-ping 2.2s ease-out infinite" }} />
    </svg>
  );
}

function SceneShare() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" role="img" aria-hidden>
      <rect x="0" y="0" width="240" height="200" rx="24" className="fill-muted" />
      <rect x="34" y="58" width="172" height="84" rx="16" className="fill-background" />
      <rect x="34" y="58" width="172" height="84" rx="16" className="fill-[color:var(--emerald)]" opacity="0.12" style={{ animation: "ap-fade 3s ease-in-out infinite" }} />
      <g style={{ animation: "ap-drive 3s ease-in-out infinite" }}>
        <rect x="72" y="80" width="96" height="40" rx="12" className="fill-foreground" opacity="0.85" />
        <circle cx="94" cy="124" r="8" className="fill-foreground" />
        <circle cx="146" cy="124" r="8" className="fill-foreground" />
      </g>
      <text x="120" y="176" textAnchor="middle" className="fill-[color:var(--emerald)]" fontSize="20" fontWeight="700" style={{ animation: "ap-fade 3s ease-in-out infinite" }}>
        00:02
      </text>
    </svg>
  );
}

function SceneConnect() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" role="img" aria-hidden>
      <rect x="0" y="0" width="240" height="200" rx="24" className="fill-muted" />
      <circle cx="48" cy="100" r="24" className="fill-background" />
      <circle cx="192" cy="100" r="24" className="fill-background" />
      <circle cx="48" cy="100" r="10" className="fill-primary" />
      <circle cx="192" cy="100" r="10" className="fill-[color:var(--emerald)]" />
      <path d="M72 100h96" className="stroke-border" strokeWidth="4" strokeDasharray="8 8" fill="none" />
      <circle cx="72" cy="100" r="7" className="fill-[color:var(--emerald)]" style={{ animation: "ap-travel 2.4s ease-in-out infinite" }} />
      <rect x="96" y="34" width="48" height="30" rx="10" className="fill-background" />
      <path d="m110 49 8 8 14-16" className="stroke-[color:var(--emerald)]" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "ap-fade 2.4s ease-in-out infinite" }} />
    </svg>
  );
}

function ScenePark() {
  return (
    <svg viewBox="0 0 240 200" className="h-full w-full" role="img" aria-hidden>
      <rect x="0" y="0" width="240" height="200" rx="24" className="fill-muted" />
      <circle cx="120" cy="96" r="54" className="fill-[color:var(--emerald)]" opacity="0.15" style={{ transformOrigin: "120px 96px", animation: "ap-ping 2.6s ease-out infinite" }} />
      <circle cx="120" cy="96" r="40" className="fill-[color:var(--emerald)]" opacity="0.9" />
      <path d="m100 96 14 15 27-30" stroke="white" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <text x="120" y="172" textAnchor="middle" className="fill-foreground" fontSize="18" fontWeight="700">AndiPark</text>
    </svg>
  );
}

const SCENES = [SceneFind, SceneShare, SceneConnect, ScenePark];

function Onboarding() {
  const nav = useNavigate();
  const { lang } = useI18n();
  const c = copy[lang === "ar" ? "ar" : "en"];
  const [i, setI] = useState(0);
  const Scene = SCENES[i]!;
  const slide = c.slides[i]!;
  const last = i === c.slides.length - 1;

  const finish = () => {
    markOnboardingComplete();
    nav({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-background px-6 pb-8 pt-5">
      <style>{`
        @keyframes ap-pop {0%,100%{transform:scale(.7);opacity:.5}45%{transform:scale(1);opacity:1}}
        @keyframes ap-ping {0%{transform:scale(.7);opacity:.5}100%{transform:scale(1.6);opacity:0}}
        @keyframes ap-fade {0%,45%{opacity:0}60%,100%{opacity:1}}
        @keyframes ap-drive {0%,40%{transform:translateX(0)}75%,100%{transform:translateX(90px);opacity:0}}
        @keyframes ap-travel {0%{transform:translateX(0)}100%{transform:translateX(96px)}}
        @media (prefers-reduced-motion: reduce){
          svg *{animation:none !important}
        }
      `}</style>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-bold">
          <img src="/andipark-logo.png" alt="" className="h-7 w-7 object-contain" />
          AndiPark
        </span>
        <button type="button" onClick={finish} className="rounded-full px-3 py-1.5 text-sm font-semibold text-muted-foreground hover:bg-muted">
          {c.skip}
        </button>
      </div>

      <div key={i} className="animate-scale-in mt-6 aspect-[6/5] w-full overflow-hidden rounded-[28px]">
        <Scene />
      </div>

      <div key={`t-${i}`} className="animate-fade-up mt-7 flex-1">
        <h1 className="font-[var(--font-display)] text-[26px] font-bold leading-snug tracking-tight">{slide.t}</h1>
        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{slide.d}</p>
      </div>

      <div className="mt-6 flex items-center gap-1.5" role="tablist" aria-label="Onboarding progress">
        {c.slides.map((s, idx) => (
          <span
            key={s.t}
            role="tab"
            aria-selected={idx === i}
            className={`h-1.5 rounded-full transition-all ${idx === i ? "w-7 bg-[color:var(--emerald)]" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => (last ? finish() : setI((v) => v + 1))}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
      >
        {last ? c.start : c.next}
        {last ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4 rtl:rotate-180" />}
      </button>
    </div>
  );
}

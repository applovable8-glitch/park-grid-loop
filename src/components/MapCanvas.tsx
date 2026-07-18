import type { ParkingSpot } from "@/lib/parkout-store";
import { Navigation } from "lucide-react";

interface Props {
  spots: ParkingSpot[];
  onSpotClick?: (s: ParkingSpot) => void;
}

/**
 * Stylized map surface used until a real Google Maps key is wired.
 * Renders a Dubai-inspired abstract street grid with animated markers.
 */
export function MapCanvas({ spots, onSpotClick }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 80% at 30% 0%, #eaf3ef 0%, #e6ecf2 40%, #dfe6ee 100%)",
        }}
      />
      {/* subtle grid streets */}
      <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="streets" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M0 30 H60 M30 0 V60" stroke="#c7d2de" strokeWidth="1" fill="none" />
          </pattern>
          <pattern id="major" width="200" height="200" patternUnits="userSpaceOnUse">
            <path d="M0 100 H200 M100 0 V200" stroke="#a9b7c7" strokeWidth="3" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#streets)" />
        <rect width="100%" height="100%" fill="url(#major)" opacity="0.6" />
        {/* highway curve */}
        <path
          d="M -20 320 C 120 240, 240 260, 420 160"
          stroke="#ffb547"
          strokeWidth="10"
          fill="none"
          opacity="0.35"
        />
        <path
          d="M -20 320 C 120 240, 240 260, 420 160"
          stroke="#ffd699"
          strokeWidth="4"
          fill="none"
        />
        {/* park */}
        <rect x="200" y="380" width="140" height="90" rx="10" fill="#b6dfc1" opacity="0.7" />
        {/* water */}
        <path d="M 0 600 Q 200 540 420 600 L 420 720 L 0 720 Z" fill="#b8d6ec" opacity="0.6" />
      </svg>

      {/* markers */}
      {spots.map((s) => {
        const color =
          s.status === "available"
            ? "bg-[var(--emerald)]"
            : s.status === "leaving"
              ? "bg-[var(--warning)]"
              : "bg-[var(--danger)]";
        return (
          <button
            key={s.id}
            onClick={() => onSpotClick?.(s)}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${s.lng}%`, top: `${s.lat}%` }}
            aria-label={`${s.status} spot ${s.address}`}
          >
            <span className={`relative flex h-4 w-4 items-center justify-center rounded-full ${color} ring-4 ring-white ${s.status !== "reserved" ? "pulse-emerald" : ""}`}>
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </button>
        );
      })}

      {/* user location */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative flex h-5 w-5 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-500/40" />
          <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-4 ring-white shadow-lg">
            <Navigation className="h-3 w-3 fill-white text-white" />
          </span>
        </div>
      </div>
    </div>
  );
}
